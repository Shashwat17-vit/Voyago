import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Nav, Stack } from 'react-bootstrap';
import {
  User, Palette, Bell, Shield, Globe, CreditCard,
  ChevronRight, Check, X, Eye,
  Trash2, Lock, Mail, Phone, Smartphone,
  ArrowLeft,
} from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { useTheme } from '../context/ThemeContext';
import './Settings.css';

const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'preferences', label: 'Preferences', icon: Globe },
  { id: 'account', label: 'Account', icon: CreditCard },
];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      className={`settings-toggle ${checked ? 'settings-toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="settings-toggle-thumb" />
    </button>
  );
}

function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme, user, updateUser, settings, updateSettings } = useTheme();
  const [activeSection, setActiveSection] = useState('profile');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileDraft, setProfileDraft] = useState({ ...user });
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProMessage, setShowProMessage] = useState(false);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleProfileSave = () => {
    updateUser(profileDraft);
    setEditingProfile(false);
    showSaved();
  };

  const handleProfileCancel = () => {
    setProfileDraft({ ...user });
    setEditingProfile(false);
  };

  const renderProfile = () => (
    <div className="settings-section-content">
      <div className="settings-card">
        <div className="settings-profile-header">
          <div className="settings-avatar-wrapper">
            <span className="settings-avatar">{user.initials}</span>
          </div>
          <div className="settings-profile-info">
            <h3 className="settings-profile-name">{user.name}</h3>
            <p className="settings-profile-email">{user.email}</p>
          </div>
          {!editingProfile && (
            <button className="settings-edit-btn" onClick={() => setEditingProfile(true)}>
              Edit Profile
            </button>
          )}
        </div>

        {editingProfile ? (
          <div className="settings-form">
            <Row className="g-3">
              <Col md={6}>
                <div className="settings-field">
                  <label className="settings-label">Full Name</label>
                  <div className="settings-input-wrap">
                    <User size={16} className="settings-input-icon" />
                    <input
                      className="settings-input"
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })}
                    />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="settings-field">
                  <label className="settings-label">Email</label>
                  <div className="settings-input-wrap">
                    <Mail size={16} className="settings-input-icon" />
                    <input
                      className="settings-input"
                      type="email"
                      value={profileDraft.email}
                      onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })}
                    />
                  </div>
                </div>
              </Col>
            </Row>
            <Row className="g-3 mt-1">
              <Col md={6}>
                <div className="settings-field">
                  <label className="settings-label">Phone</label>
                  <div className="settings-input-wrap">
                    <Phone size={16} className="settings-input-icon" />
                    <input
                      className="settings-input"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={profileDraft.phone}
                      onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                    />
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="settings-field">
                  <label className="settings-label">Bio</label>
                  <div className="settings-input-wrap">
                    <textarea
                      className="settings-textarea"
                      rows={3}
                      placeholder="Tell us about yourself..."
                      value={profileDraft.bio}
                      onChange={(e) => setProfileDraft({ ...profileDraft, bio: e.target.value })}
                    />
                  </div>
                </div>
              </Col>
            </Row>
            <div className="settings-form-actions">
              <button className="settings-btn-primary" onClick={handleProfileSave}>
                <Check size={16} /> Save Changes
              </button>
              <button className="settings-btn-secondary" onClick={handleProfileCancel}>
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="settings-profile-details">
            <div className="settings-detail-row">
              <Mail size={16} className="settings-detail-icon" />
              <span className="settings-detail-label">Email</span>
              <span className="settings-detail-value">{user.email}</span>
            </div>
            <div className="settings-detail-row">
              <Phone size={16} className="settings-detail-icon" />
              <span className="settings-detail-label">Phone</span>
              <span className="settings-detail-value">{user.phone || 'Not set'}</span>
            </div>
            <div className="settings-detail-row">
              <User size={16} className="settings-detail-icon" />
              <span className="settings-detail-label">Bio</span>
              <span className="settings-detail-value">{user.bio || 'No bio yet'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderAppearance = () => (
    <div className="settings-section-content">
      <div className="settings-card">
        <h4 className="settings-card-title">Theme</h4>
        <p className="settings-card-desc">Choose your preferred color scheme for the interface.</p>
        <Row className="g-3">
          <Col sm={6}>
            <button
              className={`settings-theme-option ${theme === 'light' ? 'settings-theme-active' : ''}`}
              onClick={() => setTheme('light')}
            >
              <div className="settings-theme-preview settings-theme-preview-light">
                <div className="stp-navbar" />
                <div className="stp-content">
                  <div className="stp-card" />
                  <div className="stp-card" />
                </div>
              </div>
              <span className="settings-theme-label">Light</span>
              {theme === 'light' && <Check size={16} className="settings-theme-check" />}
            </button>
          </Col>
          <Col sm={6}>
            <button
              className={`settings-theme-option ${theme === 'blue' ? 'settings-theme-active' : ''}`}
              onClick={() => setTheme('blue')}
            >
              <div className="settings-theme-preview settings-theme-preview-blue">
                <div className="stp-navbar" />
                <div className="stp-content">
                  <div className="stp-card" />
                  <div className="stp-card" />
                </div>
              </div>
              <span className="settings-theme-label">Blue (Dark)</span>
              {theme === 'blue' && <Check size={16} className="settings-theme-check" />}
            </button>
          </Col>
        </Row>
      </div>
    </div>
  );
  const renderPreferences = () => (
    <div className="settings-section-content">
      <div className="settings-card">
        <h4 className="settings-card-title">Regional Settings</h4>
        <p className="settings-card-desc">Customize your locale preferences for a personalized experience.</p>
        <div className="settings-form">
          <Row className="g-3">
            <Col md={6}>
              <div className="settings-field">
                <label className="settings-label">Language</label>
                <select
                  className="settings-select"
                  value={settings.language}
                  onChange={(e) => { updateSettings({ language: e.target.value }); showSaved(); }}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="hi">Hindi</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </Col>
            <Col md={6}>
              <div className="settings-field">
                <label className="settings-label">Currency</label>
                <select
                  className="settings-select"
                  value={settings.currency}
                  onChange={(e) => { updateSettings({ currency: e.target.value }); showSaved(); }}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </Col>
          </Row>
          <Row className="g-3 mt-1">
            <Col md={6}>
              <div className="settings-field">
                <label className="settings-label">Date Format</label>
                <select
                  className="settings-select"
                  value={settings.dateFormat}
                  onChange={(e) => { updateSettings({ dateFormat: e.target.value }); showSaved(); }}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </Col>
            <Col md={6}>
              <div className="settings-field">
                <label className="settings-label">Timezone</label>
                <select
                  className="settings-select"
                  value={settings.timezone}
                  onChange={(e) => { updateSettings({ timezone: e.target.value }); showSaved(); }}
                >
                  {['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
                    'Europe/London', 'Europe/Paris', 'Europe/Berlin',
                    'Asia/Kolkata', 'Asia/Tokyo', 'Asia/Shanghai',
                    'Australia/Sydney', 'Pacific/Auckland',
                  ].map((tz) => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="settings-section-content">
      <div className="settings-card">
        <h4 className="settings-card-title">Plan</h4>
        <p className="settings-card-desc">Your current subscription details.</p>
        <div className="settings-plan-badge">
          <span className="settings-plan-name">Voyago Free</span>
          <span className="settings-plan-tag">Current Plan</span>
        </div>
        <button className="settings-btn-accent" style={{ marginTop: '1rem' }} onClick={() => setShowProMessage(true)}>
          Upgrade to Pro
        </button>
        {showProMessage && (
          <p className="settings-coming-soon">Coming soon! Pro features are currently under development.</p>
        )}
      </div>

      <div className="settings-card settings-card-danger">
        <h4 className="settings-card-title settings-danger-title">Danger Zone</h4>
        <p className="settings-card-desc">Irreversible actions. Proceed with caution.</p>
        {showDeleteConfirm ? (
          <div className="settings-delete-confirm">
            <p className="settings-delete-warning">
              Are you sure? This will permanently delete your account and all associated data.
            </p>
            <div className="settings-form-actions">
              <button className="settings-btn-danger" onClick={() => { navigate('/login'); }}>
                <Trash2 size={16} /> Yes, Delete My Account
              </button>
              <button className="settings-btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="settings-btn-danger-outline" onClick={() => setShowDeleteConfirm(true)}>
            <Trash2 size={16} /> Delete Account
          </button>
        )}
      </div>
    </div>
  );

  const sectionRenderers = {
    profile: renderProfile,
    appearance: renderAppearance,
    preferences: renderPreferences,
    account: renderAccount,
  };

  const activeConfig = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="home-v2">
      <TopNavbar />
      <Container className="settings-page">
        <Stack direction="horizontal" gap={3} className="settings-header">
          <button className="settings-back-btn" onClick={() => navigate('/home')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="settings-page-title">Settings</h1>
            <p className="settings-page-subtitle">Manage your account preferences and configuration</p>
          </div>
        </Stack>

        <Row className="g-4">
          <Col md={3}>
            <Nav className="settings-sidebar flex-md-column flex-row" as="nav">
              {SECTIONS.map((sec) => {
                const Icon = sec.icon;
                return (
                  <Nav.Item key={sec.id} className="w-md-100">
                    <button
                      className={`settings-nav-item ${activeSection === sec.id ? 'settings-nav-active' : ''}`}
                      onClick={() => setActiveSection(sec.id)}
                    >
                      <Icon size={18} />
                      <span>{sec.label}</span>
                      <ChevronRight size={14} className="settings-nav-arrow d-none d-md-inline" />
                    </button>
                  </Nav.Item>
                );
              })}
            </Nav>
          </Col>

          <Col md={9}>
            <div className="settings-section-header">
              {activeConfig && <activeConfig.icon size={22} className="settings-section-icon" />}
              <h2 className="settings-section-title">{activeConfig?.label}</h2>
            </div>
            {sectionRenderers[activeSection]?.()}
          </Col>
        </Row>
      </Container>

      <div className={`settings-toast ${saved ? 'settings-toast-show' : ''}`}>
        <Check size={16} /> Changes saved
      </div>
    </div>
  );
}

export default Settings;
