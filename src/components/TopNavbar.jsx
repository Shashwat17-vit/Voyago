import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Nav } from 'react-bootstrap';
import { ChevronDown, Settings, Sun, Moon, LogOut, Home, Map, Info } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import InviteInbox from './InviteInbox';
import { API_BASE } from '../config';

const NAV_ITEMS = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/trips', label: 'Trips', icon: Map },
  { path: '/about', label: 'About Us', icon: Info },
];

function TopNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, user } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="top-navbar">
      <Container fluid className="d-flex align-items-center justify-content-between px-0">
        <div className="navbar-left" onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
          <span className="navbar-logo-box">VOYAGO</span>
        </div>

        <Nav className="navbar-center flex-row">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <Nav.Item key={path}>
              <button
                className={`navbar-tab ${location.pathname === path || (path === '/home' && location.pathname.startsWith('/home')) || (path === '/trips' && location.pathname.startsWith('/trips')) ? 'navbar-tab-active' : ''}`}
                onClick={() => navigate(path)}
              >
                <Icon size={16} />
                <span className="d-none d-sm-inline">{label}</span>
              </button>
            </Nav.Item>
          ))}
        </Nav>

        <div className="navbar-right">
          <InviteInbox />
          <div className="navbar-user" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <span className="navbar-avatar">{user ? user.initials : '…'}</span>
            <ChevronDown size={14} />
          </div>

          {dropdownOpen && (
            <>
              <div className="navbar-dropdown-overlay" onClick={() => setDropdownOpen(false)} />
              <div className="navbar-dropdown">
                <div className="navbar-dropdown-header">
                  <span className="navbar-dropdown-name">{user?.name || ''}</span>
                  <span className="navbar-dropdown-email">{user?.email || ''}</span>
                </div>
                <button className="navbar-dropdown-item" onClick={() => { toggleTheme(); setDropdownOpen(false); }}>
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                  {theme === 'light' ? 'Switch Theme (Blue)' : 'Switch Theme (Light)'}
                </button>
                <button className="navbar-dropdown-item" onClick={() => { navigate('/settings'); setDropdownOpen(false); }}>
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  className="navbar-dropdown-item navbar-dropdown-logout"
                  onClick={async () => {
                    setDropdownOpen(false);
                    await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
                    navigate('/login');
                  }}
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </Container>
    </nav>
  );
}

export default TopNavbar;