import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPhone, FaCheckCircle, FaChartLine, FaUsers, FaBullseye, FaWhatsapp } from 'react-icons/fa';
import { dashboardService } from '../services/api';
import StatsCard from '../components/StatsCard';
import ProgressBar from '../components/ProgressBar';
import toast from 'react-hot-toast';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardService.getStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 className="mb-4">Dashboard Overview</h2>

      <Row className="g-4 mb-4">
        <Col md={6} lg={3}>
          <StatsCard
            title="Today's Follow-ups"
            value={stats?.today?.followupsDueCount || 0}
            icon={<FaPhone />}
            color="primary"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatsCard
            title="Completed Today"
            value={stats?.today?.followedCompleted || 0}
            icon={<FaCheckCircle />}
            color="success"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatsCard
            title="Weekly Activity"
            value={stats?.weekly?.followupsCompleted || 0}
            icon={<FaChartLine />}
            color="info"
          />
        </Col>
        <Col md={6} lg={3}>
          <StatsCard
            title="Monthly Conversions"
            value={stats?.monthly?.conversions || 0}
            icon={<FaUsers />}
            color="warning"
          />
        </Col>
      </Row>

      {stats?.goals && stats.goals.length > 0 && (
        <Row className="mb-4">
          <Col xs={12}>
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white">
                <h5 className="mb-0"><FaBullseye className="me-2" />Active Goals</h5>
              </Card.Header>
              <Card.Body>
                {stats.goals.map((goal) => (
                  <div key={goal.id} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>{goal.title}</span>
                      <span className="fw-bold">{goal.current}/{goal.target}</span>
                    </div>
                    <ProgressBar now={goal.progress} variant={goal.isBehind ? 'warning' : 'success'} />
                    <small className="text-muted">
                      {goal.daysRemaining} days remaining
                      {goal.isBehind && <Badge bg="warning" className="ms-2">Behind Target</Badge>}
                    </small>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {stats?.overdueFollowups?.length > 0 && (
        <Row>
          <Col xs={12}>
            <Alert variant="danger" className="border-0">
              <Alert.Heading>
                <FaWhatsapp className="me-2" /> ⚠️ Overdue Follow-ups ({stats.overdueFollowups.length})
              </Alert.Heading>
              <p>You have {stats.overdueFollowups.length} follow-up(s) that are past due date. Take action now!</p>
              <hr />
              <div className="mb-0">
                {stats.overdueFollowups.slice(0, 3).map((item) => (
                  <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                    <span><strong>{item.name}</strong> - Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                    <Badge bg="danger">Missed by {item.missedDays} day(s)</Badge>
                  </div>
                ))}
                {stats.overdueFollowups.length > 3 && (
                  <div className="text-center mt-2">
                    <small>And {stats.overdueFollowups.length - 3} more...</small>
                  </div>
                )}
              </div>
            </Alert>
          </Col>
        </Row>
      )}
    </div>
  );
}

export default Dashboard;
