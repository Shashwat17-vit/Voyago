import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap';
import {
  Calendar, ChevronLeft, ChevronRight, Map, MapPin, MessageCircle,
  Pause, Play, Settings, Sparkles, UserPlus, Users,
} from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import './Home.css';
import './About.css';

const SCENE_MS = 8000;

const CHAPTERS = [
  {
    id: 'start',
    label: 'Start a trip',
    title: 'Search a destination and start planning',
    copy: 'Home is where a trip begins. Type a place, pick a start date, and open the planner. You can keep going as a guest and sign in later, or use an account from the start.',
    steps: [
      'On Home, search a destination and choose a start date.',
      'Click Start Planning to open the new-trip form.',
      'Sign in with email, Google, or GitHub, or continue as a guest. A guest draft is saved until you create an account.',
    ],
  },
  {
    id: 'details',
    label: 'Trip details',
    title: 'Name the trip and invite your group',
    copy: 'The first step stores the basics: a title, where you are going, the dates, and how many people are traveling. Groups can invite people by name or email.',
    steps: [
      'Enter a trip name, destination, dates, and number of travelers.',
      'Choose Individual or Group. For a group, add people or email addresses.',
      'Continue to preferences. Invites are sent after the trip is created.',
    ],
  },
  {
    id: 'generate',
    label: 'Generate',
    title: 'Set preferences and generate the itinerary',
    copy: 'Preferences tell the planner how you like to travel. Pick at least three interests, then generate a day-by-day itinerary from those choices.',
    steps: [
      'Add where you are leaving from, the trip type, stay, and how you will get there.',
      'Select at least three interests, such as food, museums, or hiking.',
      'Add any notes, then generate the itinerary.',
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    title: 'Review and edit the calendar',
    copy: 'Open the trip to see each day. Switch between Day and Week, add an event, or change the time, place, and notes on one that is already there.',
    steps: [
      'From Your Trips or Your Adventures, open the trip.',
      'Use the Calendar tab to move between days.',
      'Add an event, or open one to edit it. The trip assistant can suggest restaurants, sights, and activities.',
    ],
  },
  {
    id: 'together',
    label: 'Plan together',
    title: 'Use the map, chat, and trip settings',
    copy: 'The same trip has a map of your stops, a group chat, and settings for the plan itself. Invite more people from the trip sidebar.',
    steps: [
      'Map shows the places on the itinerary.',
      'Chat is the thread for the people on the trip.',
      'Trip Settings saves changes and can regenerate the plan. Invite Guests adds members, and confirming the trip locks editing.',
    ],
  },
  {
    id: 'account',
    label: 'Your account',
    title: 'Adjust appearance and account settings',
    copy: 'The account menu in the top bar opens Settings. Profile, appearance, travel preferences, and account actions live there, separate from a single trip.',
    steps: [
      'Open your avatar and choose Settings.',
      'Update your profile, or switch between light and blue appearance.',
      'Set default travel preferences, or sign out from the same menu.',
    ],
  },
];

const FEATURES = [
  {
    icon: MapPin,
    title: 'Plan from Home',
    body: 'Search a destination and date, then start a trip without leaving the home page.',
  },
  {
    icon: Sparkles,
    title: 'Generated itinerary',
    body: 'Preferences and at least three interests produce a day-by-day plan you can edit.',
  },
  {
    icon: Calendar,
    title: 'Calendar',
    body: 'Review the trip by day or week, add events, and change time, place, and notes.',
  },
  {
    icon: Map,
    title: 'Map',
    body: 'See the stops on the itinerary placed on a map for that trip.',
  },
  {
    icon: MessageCircle,
    title: 'Group chat',
    body: 'Talk with the people on the trip from the Chat tab.',
  },
  {
    icon: UserPlus,
    title: 'Invites',
    body: 'Invite travelers while creating a trip, or later from Invite Guests. Pending invites show on Home.',
  },
  {
    icon: Users,
    title: 'Guest drafts',
    body: 'Start planning before you have an account. Sign up to keep the draft as a real trip.',
  },
  {
    icon: Settings,
    title: 'Settings',
    body: 'Change profile, appearance, and account preferences from the avatar menu.',
  },
];

function formatTime(ms) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function About() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setInterval(() => {
      setElapsed((current) => {
        if (current + 200 >= SCENE_MS) {
          setIndex((i) => (i + 1) % CHAPTERS.length);
          return 0;
        }
        return current + 200;
      });
    }, 200);
    return () => clearInterval(timer);
  }, [playing, index]);

  const chapter = CHAPTERS[index];
  const progress = ((index * SCENE_MS + elapsed) / (CHAPTERS.length * SCENE_MS)) * 100;

  const goTo = (next) => {
    const wrapped = (next + CHAPTERS.length) % CHAPTERS.length;
    setIndex(wrapped);
    setElapsed(0);
  };

  return (
    <div className="home-v2">
      <TopNavbar />
      <Container className="about-page">
        <div className="text-center">
          <p className="about-kicker">How to use Voyago</p>
          <h1 className="about-title">About Voyago</h1>
          <p className="about-lead">
            Voyago takes the stress out of trip planning so you can focus on the people you are traveling with. Play the walkthrough, or read what each part of the product does.
          </p>
        </div>

        <section className="about-player" aria-label="Product walkthrough">
          <div className="about-stage">
            <div className="about-stage-top">
              <span className="about-chapter-index">Chapter {index + 1} of {CHAPTERS.length}</span>
              <span className="about-time">
                {formatTime(index * SCENE_MS + elapsed)} / {formatTime(CHAPTERS.length * SCENE_MS)}
              </span>
            </div>
            <h2 className="about-scene-title">{chapter.title}</h2>
            <p className="about-scene-copy">{chapter.copy}</p>
            <ol className="about-steps">
              {chapter.steps.map((step, stepIndex) => (
                <li key={step} className="about-step">
                  <span className="about-step-num">{stepIndex + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="about-controls">
            <button type="button" className="about-icon-btn" onClick={() => goTo(index - 1)} aria-label="Previous chapter">
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="about-play-btn" onClick={() => setPlaying((on) => !on)}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="about-icon-btn" onClick={() => goTo(index + 1)} aria-label="Next chapter">
              <ChevronRight size={18} />
            </button>
            <div
              className="about-scrub"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="Walkthrough progress"
            >
              <div className="about-scrub-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="about-chapters">
            {CHAPTERS.map((item, chapterIndex) => (
              <button
                key={item.id}
                type="button"
                className={`about-chapter-btn ${chapterIndex === index ? 'active' : ''}`}
                onClick={() => goTo(chapterIndex)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="about-docs">
          <h2>What you can do</h2>
          <p>Each part of a trip stays on that trip. Account settings are separate and open from your avatar.</p>
          <div className="about-grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article key={title} className="about-card">
                <h3><Icon size={18} />{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}

export default About;
