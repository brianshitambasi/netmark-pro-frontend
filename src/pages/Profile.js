import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { 
  FaUser, FaEnvelope, FaPhone, FaKey, FaSave, FaLock, 
  FaCheckCircle, FaTimesCircle, FaShieldAlt,
  FaBell, FaMoon, FaSun
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import toast from 'react-hot-toast';

function Profile() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || '');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    whatsappNumber: user?.whatsappNumber || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await authService.updateProfile(formData);
      toast.success('Profile updated successfully');
      const response = await authService.getMe();
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'danger', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'danger', text: 'Password must be at least 6 characters' });
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error) {
      setMessage({ type: 'danger', text: error.response?.data?.message || 'Password change failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpdate = (newPicture) => {
    setProfilePicture(newPicture);
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    userData.profilePicture = newPicture;
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`Dark mode ${newMode ? 'enabled' : 'disabled'}`);
  };

  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  }) : 'N/A';

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Profile Settings</h2>
          <p className="text-muted mb-0">Manage your account settings and preferences</p>
        </div>
        <Badge bg="success" className="p-2">
          <FaCheckCircle className="me-1" /> Active
        </Badge>
      </div>

      {message && <Alert variant={message.type} className="mb-4">{message.text}</Alert>}

      <Row>
        {/* Left Column - User Info Card */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <ProfilePictureUpload 
                currentPicture={profilePicture}
                onUpdate={handleProfilePictureUpdate}
                userName={user?.name}
              />
              <h4 className="text-center mb-1 mt-3">{user?.name || 'User'}</h4>
              <p className="text-center text-muted mb-3">{user?.email || 'No email'}</p>
              
              <div className="d-flex justify-content-center gap-3 mb-3">
                <div className="text-center">
                  <div className="fw-bold">{user?.whatsappNumber || 'Not set'}</div>
                  <small className="text-muted">WhatsApp</small>
                </div>
              </div>

              <hr />
              <div className="text-start small">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Member Since</span>
                  <span className="fw-medium">{memberSince}</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Account Status</span>
                  <span className="text-success fw-medium">Active</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column - Settings */}
        <Col lg={8}>
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <Button 
              variant={activeTab === 'profile' ? 'primary' : 'outline-secondary'}
              onClick={() => setActiveTab('profile')}
              className="d-flex align-items-center gap-2"
            >
              <FaUser /> Profile
            </Button>
            <Button 
              variant={activeTab === 'security' ? 'primary' : 'outline-secondary'}
              onClick={() => setActiveTab('security')}
              className="d-flex align-items-center gap-2"
            >
              <FaShieldAlt /> Security
            </Button>
            <Button 
              variant={activeTab === 'preferences' ? 'primary' : 'outline-secondary'}
              onClick={() => setActiveTab('preferences')}
              className="d-flex align-items-center gap-2"
            >
              <FaBell /> Preferences
            </Button>
            <Button 
              variant="danger" 
              onClick={() => {
                if (window.confirm('Are you sure you want to logout?')) {
                  logout();
                }
              }}
              className="ms-auto d-flex align-items-center gap-2"
            >
              <FaTimesCircle /> Logout
            </Button>
          </div>

          {activeTab === 'profile' && (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0"><FaUser className="me-2 text-primary" />Personal Information</h5>
                <small className="text-muted">Update your personal details</small>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleProfileUpdate}>
                  <Form.Group className="mb-3">
                    <Form.Label><FaUser className="me-2" />Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><FaEnvelope className="me-2" />Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      value={user?.email || ''}
                      disabled
                      readOnly
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">Email cannot be changed</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><FaPhone className="me-2" />WhatsApp Number</Form.Label>
                    <Form.Control
                      type="tel"
                      placeholder="254712345678"
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    />
                    <Form.Text className="text-muted">Include country code (e.g., 254 for Kenya)</Form.Text>
                  </Form.Group>

                  <Button variant="primary" type="submit" disabled={loading} className="d-flex align-items-center gap-2">
                    <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0"><FaShieldAlt className="me-2 text-primary" />Security Settings</h5>
                <small className="text-muted">Change your password</small>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handlePasswordChange}>
                  <Form.Group className="mb-3">
                    <Form.Label><FaKey className="me-2" />Current Password</Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      placeholder="Enter current password"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><FaLock className="me-2" />New Password</Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <Form.Text className="text-muted">Minimum 6 characters</Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label><FaCheckCircle className="me-2" />Confirm New Password</Form.Label>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      placeholder="Confirm new password"
                    />
                  </Form.Group>

                  <Form.Check 
                    type="checkbox"
                    label="Show passwords"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="mb-3"
                  />

                  <Button variant="primary" type="submit" disabled={loading} className="d-flex align-items-center gap-2">
                    <FaLock /> {loading ? 'Changing...' : 'Change Password'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-0 py-3">
                <h5 className="mb-0"><FaBell className="me-2 text-primary" />Preferences</h5>
                <small className="text-muted">Customize your experience</small>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-3">
                  <div>
                    <h6 className="mb-1 d-flex align-items-center gap-2">
                      {darkMode ? <FaMoon /> : <FaSun />}
                      {darkMode ? 'Dark Mode' : 'Light Mode'}
                    </h6>
                    <small className="text-muted">Toggle dark/light theme</small>
                  </div>
                  <Button 
                    variant={darkMode ? 'light' : 'dark'} 
                    onClick={toggleDarkMode}
                    className="rounded-circle p-2"
                    style={{ width: '44px', height: '44px' }}
                  >
                    {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
                  </Button>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-3">
                  <div>
                    <h6 className="mb-1 d-flex align-items-center gap-2">
                      <FaBell /> Notifications
                    </h6>
                    <small className="text-muted">Receive desktop notifications</small>
                  </div>
                  <Button variant="outline-primary" size="sm">
                    Configure
                  </Button>
                </div>

                <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3">
                  <div>
                    <h6 className="mb-1 d-flex align-items-center gap-2">
                      <FaUser /> Profile Visibility
                    </h6>
                    <small className="text-muted">Manage your profile settings</small>
                  </div>
                  <Button variant="outline-secondary" size="sm">
                    Manage
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default Profile;
