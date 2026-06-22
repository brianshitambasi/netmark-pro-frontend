import React, { useState, useEffect } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import {
  FaPhone, FaCheckCircle, FaChartLine, FaUsers, FaBullseye,
  FaClock, FaUserPlus, FaRocket, FaExclamationTriangle,
  FaArrowUp, FaArrowDown
} from 'react-icons/fa';
import { dashboardService } from '../services/api';
import toast from 'react-hot-toast';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// --- Pipeline stage palette: intensity fades as prospects move down the funnel ---
const STAGE_COLORS = ['#4453D8', '#7A5FE0', '#C2629A', '#17A589'];

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Follow-ups completed',
        data: [5, 8, 6, 12, 9, 3, 4],
        borderColor: '#4453D8',
        backgroundColor: 'rgba(68, 83, 216, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#4453D8',
        pointRadius: 3,
        borderWidth: 2,
      },
      {
        label: 'Conversions',
        data: [1, 2, 1, 3, 2, 0, 1],
        borderColor: '#17A589',
        backgroundColor: 'rgba(23, 165, 137, 0.08)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#17A589',
        pointRadius: 3,
        borderWidth: 2,
      }
    ]
  });

  const pipelineStages = [
    { label: 'Leads', value: stats?.pipeline?.leads ?? 100 },
    { label: 'Qualified', value: stats?.pipeline?.qualified ?? 65 },
    { label: 'Presented', value: stats?.pipeline?.presented ?? 40 },
    { label: 'Enrolled', value: stats?.pipeline?.enrolled ?? 25 },
  ];
  const pipelineMax = pipelineStages[0].value || 1;

  const statsCards = [
    { title: 'Total follow-ups', value: stats?.summary?.total || 0, icon: <FaUsers />, accent: '#4453D8', change: '+12%', changeType: 'up' },
    { title: 'Completed today', value: stats?.today?.followedCompleted || 0, icon: <FaCheckCircle />, accent: '#17A589', change: '+8%', changeType: 'up' },
    { title: 'Pending follow-ups', value: stats?.summary?.pending || 0, icon: <FaClock />, accent: '#E08E1D', change: '-3%', changeType: 'down' },
    { title: 'Conversion rate', value: stats?.summary?.converted ? Math.round((stats.summary.converted / stats.summary.total) * 100) : 0, icon: <FaRocket />, accent: '#C2629A', suffix: '%', change: '+5%', changeType: 'up' }
  ];

  const quickActions = [
    { icon: <FaUserPlus />, label: 'Add prospect', link: '/prospects' },
    { icon: <FaPhone />, label: 'New follow-up', link: '/followups' },
    { icon: <FaChartLine />, label: 'View analytics', link: '/analytics' },
    { icon: <FaBullseye />, label: 'Set goal', link: '/goals' },
  ];

  if (loading) {
    return (
      <div className="fdash-loading">
        <Spinner animation="border" />
        <p>Loading dashboard…</p>
        <DashboardStyles />
      </div>
    );
  }

  return (
    <div className="fdash">
      {/* Header */}
      <div className="fdash-header">
        <div>
          <span className="fdash-eyebrow">Command center</span>
          <h1 className="fdash-title">Welcome back</h1>
        </div>
        <div className="fdash-header-right">
          <div className="fdash-date-chip">
            <span className="fdash-date-label">Today</span>
            <span className="fdash-date-value">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>
          <button className="fdash-btn fdash-btn-outline" onClick={loadDashboard} disabled={loading}>
            <FaChartLine /> Refresh
          </button>
        </div>
      </div>

      {/* Stat strip */}
      <div className="fdash-stat-strip">
        {statsCards.map((card, idx) => (
          <div className="fdash-stat-tile" key={idx} style={{ '--tile-accent': card.accent }}>
            <div className="fdash-stat-top">
              <div className="fdash-stat-icon">{card.icon}</div>
              <div className={`fdash-trend fdash-trend-${card.changeType}`}>
                {card.changeType === 'up' ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
                {card.change}
              </div>
            </div>
            <div className="fdash-stat-value">{card.value}{card.suffix || ''}</div>
            <div className="fdash-stat-label">{card.title}</div>
          </div>
        ))}
      </div>

      {/* Activity + Pipeline */}
      <Row className="g-3 fdash-row">
        <Col lg={8}>
          <div className="fdash-panel fdash-panel-h">
            <div className="fdash-panel-header">
              <div>
                <h6 className="fdash-panel-title">Activity overview</h6>
                <span className="fdash-panel-sub">Weekly performance</span>
              </div>
              <div className="fdash-segmented">
                {['week', 'month', 'year'].map(t => (
                  <button key={t} className={`fdash-segment ${timeframe === t ? 'is-active' : ''}`} onClick={() => setTimeframe(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <Line data={getChartData()} options={{
              responsive: true,
              plugins: { legend: { position: 'top', labels: { font: { family: "'Inter', sans-serif" }, boxWidth: 8, usePointStyle: true } } },
              scales: {
                y: { beginAtZero: true, grid: { color: '#E2E5EE' }, ticks: { font: { family: "'IBM Plex Mono', monospace" }, color: '#6B7280' } },
                x: { grid: { display: false }, ticks: { font: { family: "'IBM Plex Mono', monospace" }, color: '#6B7280' } }
              }
            }} />
          </div>
        </Col>

        <Col lg={4}>
          {/* Signature element: the Pipeline Track */}
          <div className="fdash-panel fdash-panel-h fdash-pipeline">
            <div className="fdash-panel-header">
              <div>
                <h6 className="fdash-panel-title">Pipeline track</h6>
                <span className="fdash-panel-sub">Where prospects stand</span>
              </div>
            </div>
            <div className="fdash-track">
              {pipelineStages.map((stage, idx) => (
                <div className="fdash-track-row" key={stage.label}>
                  <div className="fdash-track-node" style={{ '--node-color': STAGE_COLORS[idx] }} />
                  {idx < pipelineStages.length - 1 && <div className="fdash-track-line" />}
                  <div className="fdash-track-body">
                    <div className="fdash-track-meta">
                      <span className="fdash-track-label">{stage.label}</span>
                      <span className="fdash-track-value">{stage.value}</span>
                    </div>
                    <div className="fdash-track-bar-bg">
                      <div
                        className="fdash-track-bar-fill"
                        style={{ width: `${(stage.value / pipelineMax) * 100}%`, background: STAGE_COLORS[idx] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fdash-pipeline-footer">
              <span>Enrollment rate</span>
              <span className="fdash-pipeline-rate">25%</span>
            </div>
          </div>
        </Col>
      </Row>

      {/* Goals + Quick actions */}
      <Row className="g-3 fdash-row">
        <Col lg={8}>
          <div className="fdash-panel">
            <div className="fdash-panel-header">
              <h6 className="fdash-panel-title"><FaBullseye /> Active goals</h6>
              <button className="fdash-btn fdash-btn-text">View all</button>
            </div>
            {stats?.goals && stats.goals.length > 0 ? (
              stats.goals.map((goal) => (
                <div className="fdash-goal" key={goal.id}>
                  <div className="fdash-goal-top">
                    <span className="fdash-goal-title">
                      {goal.title}
                      <span className={`fdash-tag ${goal.isBehind ? 'fdash-tag-warn' : 'fdash-tag-ok'}`}>
                        {goal.isBehind ? 'Behind' : 'On track'}
                      </span>
                    </span>
                    <span className="fdash-goal-fraction">{goal.current}/{goal.target}</span>
                  </div>
                  <div className="fdash-goal-bar-bg">
                    <div className="fdash-goal-bar-fill" style={{ width: `${goal.progress}%`, background: goal.isBehind ? '#E08E1D' : '#17A589' }} />
                  </div>
                  <div className="fdash-goal-meta">
                    <span>{goal.daysRemaining} days remaining</span>
                    <span>{Math.round(goal.progress)}% complete</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="fdash-empty">
                <FaBullseye size={32} />
                <p>No active goals yet. Set your first one.</p>
                <button className="fdash-btn fdash-btn-solid">Set a goal</button>
              </div>
            )}
          </div>
        </Col>

        <Col lg={4}>
          <div className="fdash-panel fdash-panel-h">
            <div className="fdash-panel-header">
              <h6 className="fdash-panel-title">Quick actions</h6>
            </div>
            <div className="fdash-actions">
              {quickActions.map((action, idx) => (
                <button key={idx} className="fdash-action" onClick={() => window.location.href = action.link}>
                  <span className="fdash-action-icon">{action.icon}</span>
                  <span className="fdash-action-label">{action.label}</span>
                  <span className="fdash-action-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </Col>
      </Row>

      {/* Overdue banner */}
      {stats?.overdueFollowups?.length > 0 && (
        <div className="fdash-banner">
          <div className="fdash-banner-icon"><FaExclamationTriangle /></div>
          <div className="fdash-banner-body">
            <strong>{stats.overdueFollowups.length} overdue follow-up{stats.overdueFollowups.length > 1 ? 's' : ''}</strong>
            <p>These are past their due date. Take action now.</p>
            <div className="fdash-banner-tags">
              {stats.overdueFollowups.slice(0, 3).map((item) => (
                <span className="fdash-tag fdash-tag-overdue" key={item.id}>{item.name} · {item.missedDays}d</span>
              ))}
              {stats.overdueFollowups.length > 3 && (
                <span className="fdash-tag">+{stats.overdueFollowups.length - 3} more</span>
              )}
            </div>
          </div>
          <button className="fdash-btn fdash-btn-solid fdash-btn-danger" onClick={() => window.location.href = '/followups'}>View all</button>
        </div>
      )}

      {/* Recent activity timeline */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div className="fdash-panel fdash-row">
          <div className="fdash-panel-header">
            <h6 className="fdash-panel-title"><FaClock /> Recent activity</h6>
          </div>
          <div className="fdash-timeline">
            {stats.recentActivity.slice(0, 5).map((activity, idx) => (
              <div className="fdash-timeline-item" key={idx}>
                <div className={`fdash-timeline-dot ${activity.status === 'converted' ? 'is-converted' : ''}`}>
                  {activity.status === 'converted' ? <FaCheckCircle /> : <FaPhone />}
                </div>
                <div className="fdash-timeline-body">
                  <span className="fdash-timeline-name">{activity.name}</span>
                  <span className="fdash-timeline-action">{activity.lastAction}</span>
                </div>
                <span className="fdash-timeline-time">{new Date(activity.updatedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DashboardStyles />
    </div>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

      .fdash {
        --ink: #12182B;
        --muted: #6B7280;
        --canvas: #F1F3F8;
        --surface: #FFFFFF;
        --line: #E2E5EE;
        --indigo: #4453D8;
        --teal: #17A589;
        --amber: #E08E1D;
        --coral: #E14B3D;
        font-family: 'Inter', sans-serif;
        color: var(--ink);
        background: var(--canvas);
        padding: 28px;
        border-radius: 16px;
      }
      .fdash-loading { text-align: center; padding: 80px 0; color: var(--muted, #6B7280); font-family: 'Inter', sans-serif; }
      .fdash-loading p { margin-top: 12px; }

      .fdash-header { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; margin-bottom: 28px; }
      .fdash-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--indigo); }
      .fdash-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 32px; margin: 4px 0 0; }
      .fdash-header-right { display: flex; align-items: center; gap: 12px; }
      .fdash-date-chip { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 8px 14px; display: flex; flex-direction: column; line-height: 1.2; }
      .fdash-date-label { font-size: 11px; color: var(--muted); }
      .fdash-date-value { font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; }

      .fdash-btn { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 13px; border-radius: 9px; padding: 9px 16px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.15s ease; }
      .fdash-btn-outline { background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
      .fdash-btn-outline:hover { border-color: var(--indigo); color: var(--indigo); }
      .fdash-btn-text { background: transparent; border: none; color: var(--indigo); padding: 4px 0; }
      .fdash-btn-solid { background: var(--indigo); border: none; color: #fff; }
      .fdash-btn-solid:hover { opacity: 0.9; }
      .fdash-btn-danger { background: var(--coral); }

      .fdash-stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
      @media (max-width: 900px) { .fdash-stat-strip { grid-template-columns: repeat(2, 1fr); } }
      .fdash-stat-tile { background: var(--surface); border-radius: 14px; padding: 18px; border-left: 4px solid var(--tile-accent); box-shadow: 0 1px 2px rgba(18,24,43,0.04); }
      .fdash-stat-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .fdash-stat-icon { color: var(--tile-accent); font-size: 17px; }
      .fdash-trend { font-family: 'IBM Plex Mono', monospace; font-size: 11px; display: flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 20px; }
      .fdash-trend-up { background: rgba(23,165,137,0.1); color: var(--teal); }
      .fdash-trend-down { background: rgba(225,75,61,0.1); color: var(--coral); }
      .fdash-stat-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 30px; line-height: 1; }
      .fdash-stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 6px; }

      .fdash-row { margin-top: 16px !important; }
      .fdash-panel { background: var(--surface); border-radius: 14px; padding: 20px 22px; box-shadow: 0 1px 2px rgba(18,24,43,0.04); }
      .fdash-panel-h { height: 100%; }
      .fdash-panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
      .fdash-panel-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 15px; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--ink); }
      .fdash-panel-sub { font-size: 12px; color: var(--muted); }

      .fdash-segmented { display: flex; background: var(--canvas); border-radius: 8px; padding: 3px; gap: 2px; }
      .fdash-segment { font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; border: none; background: transparent; color: var(--muted); padding: 5px 11px; border-radius: 6px; cursor: pointer; }
      .fdash-segment.is-active { background: var(--surface); color: var(--indigo); box-shadow: 0 1px 2px rgba(18,24,43,0.08); }

      /* Pipeline track */
      .fdash-track { display: flex; flex-direction: column; }
      .fdash-track-row { display: grid; grid-template-columns: 14px 1fr; column-gap: 14px; position: relative; padding-bottom: 22px; }
      .fdash-track-row:last-child { padding-bottom: 0; }
      .fdash-track-node { width: 14px; height: 14px; border-radius: 50%; background: var(--node-color); margin-top: 3px; z-index: 1; }
      .fdash-track-line { position: absolute; left: 6px; top: 17px; bottom: 0; width: 2px; background: var(--line); }
      .fdash-track-body { display: flex; flex-direction: column; gap: 6px; }
      .fdash-track-meta { display: flex; justify-content: space-between; font-size: 13px; }
      .fdash-track-label { font-weight: 500; }
      .fdash-track-value { font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
      .fdash-track-bar-bg { background: var(--canvas); border-radius: 6px; height: 6px; overflow: hidden; }
      .fdash-track-bar-fill { height: 100%; border-radius: 6px; transition: width 0.4s ease; }
      .fdash-pipeline-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 13px; color: var(--muted); }
      .fdash-pipeline-rate { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; color: var(--teal); }

      /* Goals */
      .fdash-goal { padding: 14px 0; border-bottom: 1px solid var(--line); }
      .fdash-goal:last-child { border-bottom: none; }
      .fdash-goal-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 14px; }
      .fdash-goal-title { font-weight: 500; display: flex; align-items: center; gap: 8px; }
      .fdash-goal-fraction { font-family: 'IBM Plex Mono', monospace; font-weight: 600; }
      .fdash-goal-bar-bg { background: var(--canvas); border-radius: 6px; height: 7px; overflow: hidden; }
      .fdash-goal-bar-fill { height: 100%; border-radius: 6px; }
      .fdash-goal-meta { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); margin-top: 6px; }

      .fdash-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; padding: 2px 8px; border-radius: 20px; background: rgba(68,83,216,0.08); color: var(--indigo); }
      .fdash-tag-warn { background: rgba(224,142,29,0.12); color: var(--amber); }
      .fdash-tag-ok { background: rgba(23,165,137,0.1); color: var(--teal); }
      .fdash-tag-overdue { background: rgba(225,75,61,0.1); color: var(--coral); }

      .fdash-empty { text-align: center; padding: 32px 0; color: var(--muted); }
      .fdash-empty svg { opacity: 0.3; margin-bottom: 10px; }
      .fdash-empty p { margin-bottom: 14px; font-size: 13px; }

      /* Quick actions */
      .fdash-actions { display: flex; flex-direction: column; gap: 8px; }
      .fdash-action { display: flex; align-items: center; gap: 12px; background: var(--canvas); border: none; border-radius: 10px; padding: 12px 14px; font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: var(--ink); cursor: pointer; transition: background 0.15s ease; }
      .fdash-action:hover { background: #E7EAF4; }
      .fdash-action-icon { color: var(--indigo); font-size: 14px; }
      .fdash-action-arrow { margin-left: auto; color: var(--muted); }

      /* Overdue banner */
      .fdash-banner { display: flex; gap: 16px; align-items: flex-start; background: #FFF4F2; border: 1px solid rgba(225,75,61,0.25); border-radius: 14px; padding: 18px 20px; margin-top: 20px; }
      .fdash-banner-icon { color: var(--coral); font-size: 20px; margin-top: 2px; }
      .fdash-banner-body { flex: 1; }
      .fdash-banner-body strong { font-family: 'Space Grotesk', sans-serif; font-size: 15px; }
      .fdash-banner-body p { font-size: 13px; color: var(--muted); margin: 4px 0 10px; }
      .fdash-banner-tags { display: flex; flex-wrap: wrap; gap: 6px; }

      /* Timeline */
      .fdash-timeline { display: flex; flex-direction: column; }
      .fdash-timeline-item { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--line); }
      .fdash-timeline-item:last-child { border-bottom: none; }
      .fdash-timeline-dot { width: 32px; height: 32px; border-radius: 50%; background: rgba(68,83,216,0.1); color: var(--indigo); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
      .fdash-timeline-dot.is-converted { background: rgba(23,165,137,0.1); color: var(--teal); }
      .fdash-timeline-body { display: flex; flex-direction: column; flex: 1; }
      .fdash-timeline-name { font-weight: 500; font-size: 13px; }
      .fdash-timeline-action { font-size: 12px; color: var(--muted); }
      .fdash-timeline-time { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--muted); }
    `}</style>
  );
}

export default Dashboard;