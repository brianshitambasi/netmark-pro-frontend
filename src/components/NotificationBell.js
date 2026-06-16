import React, { useState, useEffect } from 'react';
import { Button, Badge, Dropdown, ListGroup, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaBell, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import notificationService from '../services/notificationService';
import { useNavigate } from 'react-router-dom';

function NotificationBell() {
  const [urgentCount, setUrgentCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const soundState = notificationService.getSoundState();
    setSoundEnabled(soundState);
    notificationService.preloadSound();
    notificationService.requestPermission();

    const handler = (data) => {
      setUrgentCount(data.urgentCount || 0);
      const combined = [
        ...(data.overdue || []).map(n => ({ ...n, type: 'overdue' })),
        ...(data.dueToday || []).map(n => ({ ...n, type: 'due-today' })),
        ...(data.upcoming || []).map(n => ({ ...n, type: 'upcoming' }))
      ];
      combined.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
      setNotifications(combined.slice(0, 15));
    };
    notificationService.onNotification(handler);
    notificationService.startPolling(30);

    return () => {
      notificationService.stopPolling();
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await notificationService.refresh();
    setLoading(false);
  };

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    notificationService.toggleSound(newState);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'overdue': return '';
      case 'due-today': return '';
      default: return '';
    }
  };

  const getNotificationLabel = (type) => {
    switch (type) {
      case 'overdue': return 'Overdue';
      case 'due-today': return 'Due Today';
      default: return 'Upcoming';
    }
  };

  const getNotificationVariant = (type) => {
    switch (type) {
      case 'overdue': return 'danger';
      case 'due-today': return 'warning';
      default: return 'info';
    }
  };

  const handleNotificationClick = () => {
    setShowDropdown(false);
    navigate('/followups');
  };

  return (
    <Dropdown
      show={showDropdown}
      onToggle={(next) => setShowDropdown(next)}
      align="end"
      className="me-2"
    >
      <div className="d-flex align-items-center">
        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>{soundEnabled ? 'Sound ON' : 'Sound OFF'}</Tooltip>}
        >
          <Button
            variant="link"
            className="text-white text-decoration-none me-1 p-1"
            onClick={toggleSound}
          >
            {soundEnabled ? <FaVolumeUp size={16} /> : <FaVolumeMute size={16} />}
          </Button>
        </OverlayTrigger>

        <Dropdown.Toggle as={Button} variant="light" className="position-relative">
          <FaBell size={20} />
          {urgentCount > 0 && (
            <Badge
              pill
              bg="danger"
              className="position-absolute top-0 start-100 translate-middle"
              style={{ fontSize: '0.6rem' }}
            >
              {urgentCount > 9 ? '9+' : urgentCount}
            </Badge>
          )}
        </Dropdown.Toggle>
      </div>

      <Dropdown.Menu style={{ minWidth: '380px', maxHeight: '450px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <strong><FaBell className="me-2" />Notifications</strong>
          <div>
            <Button size="sm" variant="outline-primary" onClick={handleRefresh} disabled={loading} className="me-1">
              {loading ? <Spinner animation="border" size="sm" /> : ''}
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={() => setShowDropdown(false)}>
              ✕
            </Button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center text-muted py-4">
            <FaBell size={35} className="mb-2 opacity-25" />
            <p className="mb-0 fw-bold">All clear! ✅</p>
            <small>No pending reminders</small>
          </div>
        ) : (
          <ListGroup variant="flush">
            {notifications.map((n, idx) => (
              <ListGroup.Item
                key={idx}
                action
                onClick={handleNotificationClick}
                className={`d-flex align-items-start gap-2 border-bottom ${n.type === 'overdue' ? 'bg-danger bg-opacity-10' : n.type === 'due-today' ? 'bg-warning bg-opacity-10' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div className="mt-1 fs-4">{getNotificationIcon(n.type)}</div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center">
                    <strong>{n.name}</strong>
                    <Badge bg={getNotificationVariant(n.type)}>
                      {getNotificationLabel(n.type)}
                    </Badge>
                  </div>
                  <div className="small text-muted">
                     {new Date(n.dueDate).toLocaleDateString()}
                    {n.daysOverdue && <span className="text-danger ms-2">⚠️ {n.daysOverdue} days overdue</span>}
                    {n.daysUntil && <span className="text-info ms-2">⏳ {n.daysUntil} days left</span>}
                  </div>
                  <div className="small text-muted"> {n.phone || 'N/A'}</div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        <Dropdown.Item
          href="/followups"
          className="text-center text-primary border-top py-2"
        >
           View all follow-ups
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default NotificationBell;
