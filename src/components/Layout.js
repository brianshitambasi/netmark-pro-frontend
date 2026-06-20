
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBullseye, 
  FaImages, 
  FaCalendarAlt, 
  FaUser, 
  FaSignOutAlt,
  FaChartLine,
  FaHome,
  FaMoon,
  FaSun,
  FaBars
} from 'react-icons/fa';
import { dashboardService } from '../services/api';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  // Fetch stats for badge
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await dashboardService.getStats();
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to load stats');
      }
    };
    loadStats();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setExpanded(false);
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const toggleNavbar = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  const closeNavbar = useCallback(() => {
    setExpanded(false);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: <FaTachometerAlt />, label: 'Dashboard', badge: null },
    { path: '/followups', icon: <FaUsers />, label: 'Follow-ups', badge: stats?.today?.followupsDueCount },
    { path: '/prospects', icon: <FaChartLine />, label: 'Prospects', badge: stats?.summary?.total },
    { path: '/goals', icon: <FaBullseye />, label: 'Goals', badge: stats?.goals?.length },
    { path: '/gallery', icon: <FaImages />, label: 'Gallery', badge: null },
    { path: '/calendar', icon: <FaCalendarAlt />, label: 'Calendar', badge: null },
  ];

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <Navbar 
        bg={darkMode ? 'dark' : 'light'} 
        variant={darkMode ? 'dark' : 'light'} 
        expand="lg" 
        expanded={expanded}
        onToggle={toggleNavbar}
        className={`shadow-sm border-bottom ${darkMode ? 'border-secondary' : 'border-light'}`}
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1050,
          backdropFilter: 'blur(10px)',
          backgroundColor: darkMode ? 'rgba(33,37,41,0.95)' : 'rgba(255,255,255,0.95)'
        }}
      >
        <Container fluid>
          <Navbar.Brand href="/" className="d-flex align-items-center">
            <img 
              src="/favicon.svg" 
              alt="NetMark Pro" 
              width="32" 
              height="32" 
              className="me-2"
              style={{ filter: darkMode ? 'brightness(1.5)' : 'none' }}
            />
            <strong className={`fs-4 ${darkMode ? 'text-white' : 'text-primary'}`}>
              NetMark Pro
            </strong>
            <Badge bg="info" className="ms-2 d-none d-sm-inline-block" style={{ fontSize: '0.6rem' }}>
              v2.0
            </Badge>
          </Navbar.Brand>

          <div className="d-flex align-items-center gap-2 d-lg-none">
            <span className={`small ${darkMode ? 'text-light' : 'text-muted'}`}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Navbar.Toggle 
              aria-controls="main-navbar" 
              onClick={toggleNavbar}
            >
              <FaBars />
            </Navbar.Toggle>
          </div>

          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto" onClick={closeNavbar}>
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-link btn-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 transition-all ${
                      isActive ? 'active-nav' : ''
                    }`
                  }
                >
                  <span className="fs-6">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <Badge 
                      pill 
                      bg="danger" 
                      className="ms-1"
                      style={{ fontSize: '0.6rem' }}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </Nav>

            <div className="d-flex align-items-center gap-2">
              <div className={`d-none d-lg-block small px-2 py-1 rounded-3 ${darkMode ? 'text-light' : 'text-muted'}`}>
                {currentTime.toLocaleDateString([], { month: 'short', day: 'numeric' })} 
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>

              <button
                onClick={toggleDarkMode}
                className={`btn btn-sm rounded-circle p-2 ${darkMode ? 'btn-light' : 'btn-dark'}`}
                style={{ width: '36px', height: '36px' }}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? <FaSun className="text-warning" /> : <FaMoon />}
              </button>

              <NotificationBell />

              <NavDropdown
                title={
                  <div className="d-flex align-items-center gap-2">
                    <div 
                      className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className={`d-none d-md-block ${darkMode ? 'text-white' : 'text-dark'}`}>
                      {user?.name || 'User'}
                    </span>
                  </div>
                }
                align="end"
                id="user-dropdown"
              >
                <NavDropdown.Item as={NavLink} to="/profile" className="d-flex align-items-center gap-2">
                  <FaUser /> Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/dashboard" className="d-flex align-items-center gap-2">
                  <FaHome /> Dashboard
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout} className="text-danger d-flex align-items-center gap-2">
                  <FaSignOutAlt /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="py-4" style={{ minHeight: 'calc(100vh - 72px)' }}>
        <Container fluid className="px-4">
          <Outlet />
        </Container>
      </main>

      <footer className={`py-3 mt-4 border-top ${darkMode ? 'border-secondary bg-dark' : 'border-light bg-white'}`}>
        <Container fluid className="px-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className={`small ${darkMode ? 'text-light' : 'text-muted'}`}>
              © {new Date().getFullYear()} NetMark Pro. All rights reserved.
            </div>
            <div className="d-flex gap-3">
              <span className={`small ${darkMode ? 'text-light' : 'text-muted'}`}>
                <FaChartLine className="me-1" /> 
                {stats?.summary?.total || 0} Prospects
              </span>
              <span className={`small ${darkMode ? 'text-light' : 'text-muted'}`}>
                <FaUsers className="me-1" /> 
                {stats?.summary?.enrolled || 0} Enrolled
              </span>
              <span className={`small ${darkMode ? 'text-light' : 'text-muted'}`}>
                <FaBullseye className="me-1" /> 
                {stats?.goals?.length || 0} Goals
              </span>
            </div>
          </div>
        </Container>
      </footer>

      <style>{`
        .nav-link.btn-link {
          text-decoration: none;
          color: ${darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.65)'};
          transition: all 0.2s ease;
        }
        .nav-link.btn-link:hover {
          color: ${darkMode ? '#fff' : '#000'};
          background: ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        }
        .active-nav {
          color: ${darkMode ? '#fff' : '#000'} !important;
          background: ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'} !important;
          font-weight: 600;
        }
        .transition-all {
          transition: all 0.2s ease;
        }
        .dark {
          background-color: #1a1a2e;
          color: #e0e0e0;
        }
        .dark .bg-white {
          background-color: #1a1a2e !important;
        }
        .dark .bg-light {
          background-color: #2d2d44 !important;
        }
        .dark .text-muted {
          color: #a0a0b8 !important;
        }
        .dark .border-light {
          border-color: #2d2d44 !important;
        }
        .dark .table {
          color: #e0e0e0;
        }
        .dark .card {
          background-color: #2d2d44;
          border-color: #3d3d5c;
        }
        .dark .card-header {
          background-color: #2d2d44;
          border-color: #3d3d5c;
        }
        .dark .modal-content {
          background-color: #2d2d44;
          border-color: #3d3d5c;
        }
        .dark .modal-header {
          border-color: #3d3d5c;
        }
        .dark .modal-footer {
          border-color: #3d3d5c;
        }
        .dark .form-control {
          background-color: #1a1a2e;
          border-color: #3d3d5c;
          color: #e0e0e0;
        }
        .dark .form-select {
          background-color: #1a1a2e;
          border-color: #3d3d5c;
          color: #e0e0e0;
        }
        .dark .list-group-item {
          background-color: #2d2d44;
          border-color: #3d3d5c;
          color: #e0e0e0;
        }
        .dark .dropdown-menu {
          background-color: #2d2d44;
          border-color: #3d3d5c;
        }
        .dark .dropdown-item {
          color: #e0e0e0;
        }
        .dark .dropdown-item:hover {
          background-color: #3d3d5c;
          color: #fff;
        }
        .dark .alert {
          background-color: #2d2d44;
          border-color: #3d3d5c;
        }
        .dark .table-hover tbody tr:hover {
          background-color: #3d3d5c;
        }
        .dark .btn-outline-secondary {
          border-color: #3d3d5c;
          color: #a0a0b8;
        }
        .dark .btn-outline-secondary:hover {
          background-color: #3d3d5c;
          color: #fff;
        }
        .dark .input-group-text {
          background-color: #1a1a2e;
          border-color: #3d3d5c;
          color: #a0a0b8;
        }
        .dark .border {
          border-color: #3d3d5c !important;
        }
        .dark .bg-primary {
          background-color: #3b82f6 !important;
        }
        .dark .text-primary {
          color: #60a5fa !important;
        }
        .dark .bg-success {
          background-color: #10b981 !important;
        }
        .dark .bg-danger {
          background-color: #ef4444 !important;
        }
        .dark .bg-warning {
          background-color: #f59e0b !important;
        }
        .dark .bg-info {
          background-color: #06b6d4 !important;
        }
        .dark .nav-link.btn-link {
          color: rgba(255,255,255,0.7);
        }
        .dark .nav-link.btn-link:hover {
          color: #fff;
        }
        .dark .nav-link.active-nav {
          color: #fff !important;
        }
        .dark .bg-white {
          background-color: #1a1a2e !important;
        }
        .dark .shadow-sm {
          box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
        }
      `}</style>
    </div>
  );
}

export default Layout;
