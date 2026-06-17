import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Badge, ProgressBar as BootstrapProgressBar } from 'react-bootstrap';
import { 
  FaPhone, FaCheckCircle, FaChartLine, FaUsers, FaBullseye, 
  FaClock, FaUserPlus, FaRocket, FaBell, FaExclamationTriangle,
  FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { dashboardService } from '../services/api';
import toast from 'react-hot-toast';

// Chart Components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data.data);
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    return {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Follow-ups Completed',
          data: [5, 8, 6, 12, 9, 3, 4],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3b82f6',
        },
        {
          label: 'Conversions',
          data: [1, 2, 1, 3, 2, 0, 1],
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
        }
      ]
    };
  };

  const getConversionData = () => {
    return {
      labels: ['Leads', 'Qualified', 'Presented', 'Enrolled'],
      datasets: [{
        data: [100, 65, 40, 25],
        backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'],
        borderWidth: 0,
      }]
    };
  };

  const statsCards = [
    {
      title: 'Total Follow-ups',
      value: stats?.summary?.total || 0,
      icon: <FaUsers className="text-primary" />,
      color: 'primary',
      change: '+12%',
      changeType: 'up'
    },
    {
      title: 'Completed Today',
      value: stats?.today?.followedCompleted || 0,
      icon: <FaCheckCircle className="text-success" />,
      color: 'success',
      change: '+8%',
      changeType: 'up'
    },
    {
      title: 'Pending Follow-ups',
      value: stats?.summary?.pending || 0,
      icon: <FaClock className="text-warning" />,
      color: 'warning',
      change: '-3%',
      changeType: 'down'
    },
    {
      title: 'Conversion Rate',
      value: stats?.summary?.converted ? Math.round((stats.summary.converted / stats.summary.total) * 100) : 0,
      icon: <FaRocket className="text-info" />,
      color: 'info',
      suffix: '%',
      change: '+5%',
      changeType: 'up'
    }
  ];

  const quickActions = [
    { icon: <FaUserPlus />, label: 'Add Prospect', color: 'primary', link: '/prospects' },
    { icon: <FaPhone />, label: 'New Follow-up', color: 'success', link: '/followups' },
    { icon: <FaChartLine />, label: 'View Analytics', color: 'info', link: '/analytics' },
    { icon: <FaBullseye />, label: 'Set Goal', color: 'warning', link: '/goals' },
  ];

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-75">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`fade-in ${animating ? 'animate' : ''}`}>
      {/* Welcome Section */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="display-6 fw-bold mb-1">Welcome Back! </h1>
          <p className="text-muted mb-0">Here's what's happening with your business today</p>
        </div>
        <div className="d-flex gap-2">
          <div className="bg-primary bg-opacity-10 rounded-3 px-3 py-2">
            <small className="text-muted">Today</small>
            <div className="fw-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          </div>
          <button className="btn btn-outline-primary" onClick={loadDashboard} disabled={loading}>
            <FaChartLine className="me-1" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <Row className="g-3 mb-4">
        {statsCards.map((card, idx) => (
          <Col md={6} lg={3} key={idx}>
            <Card className={`border-0 shadow-sm h-100 stat-card stat-card-${card.color}`}>
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className={`stat-icon bg-${card.color} bg-opacity-10 rounded-3 p-3`}>{card.icon}</div>
                  <div className={`badge bg-${card.changeType === 'up' ? 'success' : 'danger'} bg-opacity-10 text-${card.changeType === 'up' ? 'success' : 'danger'} d-flex align-items-center gap-1 px-2 py-1`}>
                    {card.changeType === 'up' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                    {card.change}
                  </div>
                </div>
                <div>
                  <div className="text-muted small text-uppercase">{card.title}</div>
                  <div className="d-flex align-items-baseline gap-1">
                    <span className="fs-2 fw-bold">{card.value}{card.suffix || ''}</span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Charts Row */}
      <Row className="g-3 mb-4">
        <Col lg={8}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <div>
                <h6 className="mb-0 fw-bold"><FaChartLine className="me-2 text-primary" />Activity Overview</h6>
                <small className="text-muted">Weekly performance</small>
              </div>
              <div className="d-flex gap-2">
                {['week', 'month', 'year'].map(t => (
                  <button key={t} className={`btn btn-sm ${timeframe === t ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setTimeframe(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </Card.Header>
            <Card.Body>
              <Line data={getChartData()} options={{
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
              }} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0">
              <h6 className="mb-0 fw-bold"><FaRocket className="me-2 text-primary" />Conversion Funnel</h6>
            </Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <Doughnut data={getConversionData()} options={{
                responsive: true,
                cutout: '70%',
                plugins: { legend: { position: 'bottom' } }
              }} />
              <div className="text-center mt-3">
                <small className="text-muted">Enrollment Rate</small>
                <div className="fw-bold fs-4 text-success">25%</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Goals & Overdue Section */}
      <Row className="g-3">
        <Col lg={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center py-3">
              <h6 className="mb-0 fw-bold"><FaBullseye className="me-2 text-primary" />Active Goals</h6>
              <button className="btn btn-sm btn-primary">View All</button>
            </Card.Header>
            <Card.Body>
              {stats?.goals && stats.goals.length > 0 ? (
                stats.goals.map((goal) => (
                  <div key={goal.id} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <div>
                        <span className="fw-medium">{goal.title}</span>
                        <Badge bg={goal.isBehind ? 'warning' : 'info'} className="ms-2">
                          {goal.isBehind ? 'Behind' : 'On Track'}
                        </Badge>
                      </div>
                      <span className="fw-bold">{goal.current}/{goal.target}</span>
                    </div>
                    <BootstrapProgressBar now={goal.progress} variant={goal.isBehind ? 'warning' : 'success'} className="rounded-pill" style={{ height: '8px' }} />
                    <div className="d-flex justify-content-between mt-1">
                      <small className="text-muted">{goal.daysRemaining} days remaining</small>
                      <small className="text-muted">{Math.round(goal.progress)}% complete</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted">
                  <FaBullseye size={40} className="opacity-25 mb-2" />
                  <p>No active goals. Set your first goal now!</p>
                  <button className="btn btn-primary btn-sm">Set a Goal</button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white border-0 py-3">
              <h6 className="mb-0 fw-bold"><FaBell className="me-2 text-warning" />Quick Actions</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                {quickActions.map((action, idx) => (
                  <button key={idx} className={`btn btn-outline-${action.color} text-start d-flex align-items-center gap-3 p-3`} onClick={() => window.location.href = action.link}>
                    <span className={`text-${action.color} fs-5`}>{action.icon}</span>
                    <div>
                      <div className="fw-medium">{action.label}</div>
                      <small className="text-muted">Click to get started</small>
                    </div>
                    <span className="ms-auto text-muted">→</span>
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Overdue Alert */}
      {stats?.overdueFollowups?.length > 0 && (
        <Row className="mt-4">
          <Col xs={12}>
            <Alert variant="danger" className="border-0 shadow-sm">
              <div className="d-flex align-items-start gap-3">
                <div className="bg-danger bg-opacity-10 p-3 rounded-3">
                  <FaExclamationTriangle size={24} className="text-danger" />
                </div>
                <div className="flex-grow-1">
                  <Alert.Heading className="mb-1">
                    ⚠️ {stats.overdueFollowups.length} Overdue Follow-up{stats.overdueFollowups.length > 1 ? 's' : ''}
                  </Alert.Heading>
                  <p className="mb-2">These follow-ups are past their due date. Take action now!</p>
                  <div className="d-flex flex-wrap gap-2">
                    {stats.overdueFollowups.slice(0, 3).map((item) => (
                      <Badge key={item.id} bg="danger" className="p-2">
                        {item.name} - {item.missedDays} day(s) overdue
                      </Badge>
                    ))}
                    {stats.overdueFollowups.length > 3 && (
                      <Badge bg="secondary">+{stats.overdueFollowups.length - 3} more</Badge>
                    )}
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => window.location.href = '/followups'}>
                  View All
                </button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Recent Activity Feed */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <Row className="mt-4">
          <Col xs={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-0 py-3">
                <h6 className="mb-0 fw-bold"><FaClock className="me-2 text-primary" />Recent Activity</h6>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="list-group list-group-flush">
                  {stats.recentActivity.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className="list-group-item d-flex align-items-center gap-3 border-0 py-3 px-4">
                      <div className={`bg-${activity.status === 'converted' ? 'success' : 'primary'} bg-opacity-10 rounded-circle p-2`}>
                        {activity.status === 'converted' ? <FaCheckCircle className="text-success" /> : <FaPhone className="text-primary" />}
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-medium">{activity.name}</div>
                        <small className="text-muted">{activity.lastAction}</small>
                      </div>
                      <small className="text-muted">{new Date(activity.updatedAt).toLocaleTimeString()}</small>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <style>{`
        .stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important; }
        .stat-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
        .stat-card-primary .stat-icon { color: #3b82f6; }
        .stat-card-success .stat-icon { color: #10b981; }
        .stat-card-warning .stat-icon { color: #f59e0b; }
        .stat-card-info .stat-icon { color: #06b6d4; }
        .fade-in { animation: fadeIn 0.5s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate { animation: pulse 0.3s ease; }
        @keyframes pulse { 0% { opacity: 0.7; } 50% { opacity: 1; } 100% { opacity: 0.7; } }
      `}</style>
    </div>
  );
}

export default Dashboard;
