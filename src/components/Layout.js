import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { 
  FaTachometerAlt, 
  FaUsers, 
  FaBullseye, 
  FaImages, 
  FaCalendarAlt, 
  FaUser, 
  FaSignOutAlt,
  FaChartLine
} from 'react-icons/fa';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand href="/">
            <i className="fas fa-chart-line me-2"></i>
            <strong>NetMark Pro</strong>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <NavLink to="/dashboard" className="nav-link btn-link">
                <FaTachometerAlt className="me-1" /> Dashboard
              </NavLink>
              <NavLink to="/followups" className="nav-link btn-link">
                <FaUsers className="me-1" /> Follow-ups
              </NavLink>
              <NavLink to="/prospects" className="nav-link btn-link">
                <FaChartLine className="me-1" /> Prospects
              </NavLink>
              <NavLink to="/goals" className="nav-link btn-link">
                <FaBullseye className="me-1" /> Goals
              </NavLink>
              <NavLink to="/gallery" className="nav-link btn-link">
                <FaImages className="me-1" /> Gallery
              </NavLink>
              <NavLink to="/calendar" className="nav-link btn-link">
                <FaCalendarAlt className="me-1" /> Calendar
              </NavLink>
            </Nav>
            <Nav>
              <NavDropdown title={<><FaUser className="me-1" /> {user?.name || 'User'}</>} align="end">
                <NavDropdown.Item href="/profile">
                  <FaUser className="me-2" /> Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="py-4">
        <Container fluid className="px-4">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}

export default Layout;
