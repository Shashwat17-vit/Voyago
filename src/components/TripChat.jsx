import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import { StreamChat } from 'stream-chat';
import { API_BASE } from '../config';
import { useTheme } from '../context/ThemeContext';

const AVATAR_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
}

function colorFor(id) {
  const n = String(id || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function formatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function TripChat({ tripId, tripTitle, members = [] }) {
  const navigate = useNavigate();
  const { user } = useTheme();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typingLabel, setTypingLabel] = useState('');
  const [selfId, setSelfId] = useState('');
  const channelRef = useRef(null);
  const clientRef = useRef(null);
  const bottomRef = useRef(null);

  const waitingForUser = user == null;
  const isGuest = Boolean(user?.isGuest);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingLabel]);

  useEffect(() => {
    if (waitingForUser || isGuest || !tripId) {
      setStatus(isGuest ? 'guest' : 'loading');
      return undefined;
    }

    let cancelled = false;
    const typers = new Map();

    async function connect() {
      setStatus('loading');
      setError('');
      try {
        const res = await fetch(`${API_BASE}/api/trips/${tripId}/chat/token`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error || 'Could not open chat');
        }

        const client = StreamChat.getInstance(data.apiKey);
        if (client.userID && client.userID !== data.userId) {
          await client.disconnectUser();
        }
        if (!client.userID) {
          await client.connectUser(
            { id: data.userId, name: data.userName || user?.name || 'You' },
            data.token,
          );
        }

        const channel = client.channel(data.channelType || 'messaging', data.channelId);
        const state = await channel.watch();
        if (cancelled) return;

        channelRef.current = channel;
        clientRef.current = client;
        setSelfId(data.userId);
        setMessages(Array.isArray(state.messages) ? state.messages : []);
        setStatus('ready');

        const onNew = (event) => {
          if (!event.message) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === event.message.id)) return prev;
            return [...prev, event.message];
          });
        };
        const refreshTyping = () => {
          const names = [...typers.values()].filter(Boolean);
          setTypingLabel(names.length ? `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} typing…` : '');
        };
        const onTypingStart = (event) => {
          const id = event.user?.id;
          if (!id || id === data.userId) return;
          typers.set(id, event.user?.name || 'Someone');
          refreshTyping();
        };
        const onTypingStop = (event) => {
          typers.delete(event.user?.id);
          refreshTyping();
        };

        channel.on('message.new', onNew);
        channel.on('typing.start', onTypingStart);
        channel.on('typing.stop', onTypingStop);

        return () => {
          channel.off('message.new', onNew);
          channel.off('typing.start', onTypingStart);
          channel.off('typing.stop', onTypingStop);
        };
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not open chat');
          setStatus('error');
        }
        return undefined;
      }
    }

    let detach;
    connect().then((fn) => { detach = fn; });

    return () => {
      cancelled = true;
      detach?.();
      const channel = channelRef.current;
      channelRef.current = null;
      if (channel) {
        channel.stopWatching().catch(() => {});
      }
      const client = clientRef.current;
      clientRef.current = null;
      client?.disconnectUser().catch(() => {});
    };
  }, [tripId, waitingForUser, isGuest, user?.name]);

  const send = async (event) => {
    event.preventDefault();
    const text = input.trim();
    const channel = channelRef.current;
    if (!text || !channel || sending) return;
    setSending(true);
    setInput('');
    try {
      await channel.sendMessage({ text });
    } catch {
      setInput(text);
      setError('Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const onChange = (event) => {
    setInput(event.target.value);
    channelRef.current?.keystroke().catch(() => {});
  };

  if (isGuest || status === 'guest') {
    return (
      <div className="trip-chat-wrapper">
        <div className="td-placeholder">
          <MessageCircle size={36} />
          <h3>Sign in to chat</h3>
          <p>Trip chat is for members. Create an account to talk with your group.</p>
          <button className="td-chat-signin" type="button" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="trip-chat-wrapper">
        <div className="td-placeholder">
          <div className="loading-spinner" />
          <p>Opening chat…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="trip-chat-wrapper">
        <div className="td-placeholder">
          <MessageCircle size={36} />
          <h3>Chat unavailable</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trip-chat-wrapper">
      <div className="trip-chat-header">
        <div>
          <h3 className="trip-chat-title">
            <MessageCircle size={18} /> Group chat
          </h3>
          <p className="trip-chat-place">
            {tripTitle}
            {members.length ? ` · ${members.length} ${members.length === 1 ? 'member' : 'members'}` : ''}
          </p>
        </div>
      </div>

      <div className="trip-chat-messages">
        {messages.length === 0 && (
          <p className="trip-chat-empty">No messages yet. Say hello to your group.</p>
        )}
        {messages.map((msg) => {
          const mine = String(msg.user?.id) === String(selfId);
          const system = msg.type === 'system';
          if (system) {
            return (
              <div key={msg.id} className="trip-chat-system">
                {msg.text}
              </div>
            );
          }
          const name = msg.user?.name || 'Traveler';
          return (
            <div key={msg.id} className={`trip-chat-row ${mine ? 'mine' : 'theirs'}`}>
              {!mine && (
                <span className="trip-chat-avatar" style={{ background: colorFor(msg.user?.id) }}>
                  {initials(name)}
                </span>
              )}
              <div className="trip-chat-bubble-wrap">
                {!mine && <span className="trip-chat-name">{name}</span>}
                <div className={`trip-chat-bubble ${mine ? 'trip-chat-bubble-mine' : 'trip-chat-bubble-theirs'}`}>
                  <p>{msg.text}</p>
                </div>
                <span className="trip-chat-time">{formatTime(msg.created_at)}</span>
              </div>
            </div>
          );
        })}
        {typingLabel && <p className="trip-chat-typing">{typingLabel}</p>}
        <div ref={bottomRef} />
      </div>

      <form className="trip-chat-input-bar" onSubmit={send}>
        <input
          className="trip-chat-input"
          value={input}
          onChange={onChange}
          placeholder="Message the group…"
          maxLength={2000}
        />
        <button className="trip-chat-send" type="submit" disabled={!input.trim() || sending} aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

export default TripChat;
