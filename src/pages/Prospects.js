import React, { useState, useEffect } from 'react';
import { Table, Form, Pagination } from 'react-bootstrap';
import {
  FaPlus, FaWhatsapp, FaChartLine, FaSearch,
  FaFilter, FaEdit, FaTrash, FaEye, FaUserCheck,
  FaPhoneAlt, FaMapMarkerAlt, FaBriefcase,
  FaStar, FaEnvelope, FaCalendarAlt, FaMoneyBill, FaRocket,
  FaTrophy
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import ProspectForm from '../components/ProspectForm';
import ProspectDetailsModal from '../components/ProspectDetailsModal';
import EditProspectModal from '../components/EditProspectModal';
import StageManager from '../components/StageManager';
import ConfirmationModal from '../components/ConfirmationModal';

const API_URL = process.env.REACT_APP_API_URL || 'https://netmark-pro-backend.onrender.com/api';

const getSourceDisplay = (source) => {
  const sourceMap = {
    'referral': 'referral from a friend',
    'social_media': 'social media (Facebook/Instagram)',
    'event': 'the event we met at',
    'cold_call': 'a previous call',
    'website': 'our website',
    'other': 'other platform'
  };
  return sourceMap[source] || 'a mutual connection';
};

const STAGES = [
  { key: 'lead', label: 'Lead', icon: <FaStar />, color: '#6B7280' },
  { key: 'qualified', label: 'Qualified', icon: <FaUserCheck />, color: '#4453D8' },
  { key: 'invited', label: 'Invited', icon: <FaEnvelope />, color: '#E08E1D' },
  { key: 'presented', label: 'Presented', icon: <FaCalendarAlt />, color: '#7A5FE0' },
  { key: 'negotiation', label: 'Negotiation', icon: <FaMoneyBill />, color: '#C2629A' },
  { key: 'enrolled', label: 'Enrolled', icon: <FaRocket />, color: '#17A589' },
];
const STAGE_MAP = STAGES.reduce((acc, s) => ({ ...acc, [s.key]: s }), {});

const getScoreColor = (score) => {
  if (score >= 70) return '#17A589';
  if (score >= 40) return '#E08E1D';
  return '#6B7280';
};

function Prospects() {
  const [prospects, setProspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [summary, setSummary] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/prospects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProspects(response.data.data || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      toast.error('Failed to load prospects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProspect) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/prospects/${selectedProspect._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Prospect ${selectedProspect.name} deleted`);
      setShowDeleteModal(false);
      setSelectedProspect(null);
      loadProspects();
    } catch (error) {
      toast.error('Failed to delete prospect');
    }
  };

  const handleSendWhatsApp = (prospect) => {
    const name = prospect.name || 'there';
    const source = getSourceDisplay(prospect.source);
    const message = `Hello ${name}! This is from Mr Brian. I hope you remember me - we connected via ${source}. Let me know when you're available for a quick chat.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${prospect.phone}?text=${encoded}`, '_blank');
    toast.success(`Opening WhatsApp for ${name}`);
  };

  const filteredProspects = prospects.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search) ||
    p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProspects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProspects.length / itemsPerPage);

  const stageCounts = STAGES.reduce((acc, s) => ({
    ...acc,
    [s.key]: prospects.filter(p => p.pipelineStage === s.key).length
  }), {});

  if (loading) {
    return (
      <div className="fdash-loading">
        <div className="fdash-spinner" />
        <p>Loading prospects…</p>
        <ProspectsStyles />
      </div>
    );
  }

  return (
    <div className="fdash">
      {/* Header */}
      <div className="fdash-header">
        <div>
          <span className="fdash-eyebrow">Pipeline</span>
          <h1 className="fdash-title">Prospect management</h1>
          <p className="fdash-subtitle">Track prospects as they move through your sales pipeline</p>
        </div>
        <button className="fdash-btn fdash-btn-solid" onClick={() => setShowForm(true)}>
          <FaPlus /> Add prospect
        </button>
      </div>

      {/* Pipeline stage track */}
      <div className="fdash-panel fdash-stage-track">
        {STAGES.map((stage, idx) => (
          <React.Fragment key={stage.key}>
            <div className="fdash-stage-node">
              <div className="fdash-stage-icon" style={{ color: stage.color, background: `${stage.color}1A` }}>{stage.icon}</div>
              <div className="fdash-stage-count">{stageCounts[stage.key]}</div>
              <div className="fdash-stage-label">{stage.label}</div>
            </div>
            {idx < STAGES.length - 1 && <div className="fdash-stage-connector" />}
          </React.Fragment>
        ))}
      </div>

      {/* Stats */}
      <div className="fdash-stat-strip">
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#4453D8' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaChartLine /></div></div>
          <div className="fdash-stat-value">{summary.total || 0}</div>
          <div className="fdash-stat-label">Total prospects</div>
        </div>
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#4453D8' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaUserCheck /></div></div>
          <div className="fdash-stat-value">{summary.qualified || 0}</div>
          <div className="fdash-stat-label">Qualified</div>
        </div>
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#17A589' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaRocket /></div></div>
          <div className="fdash-stat-value">{summary.enrolled || 0}</div>
          <div className="fdash-stat-label">Enrolled</div>
        </div>
        <div className="fdash-stat-tile" style={{ '--tile-accent': '#17A589' }}>
          <div className="fdash-stat-top"><div className="fdash-stat-icon"><FaTrophy /></div></div>
          <div className="fdash-stat-value">{summary.total > 0 ? Math.round((stageCounts.enrolled / summary.total) * 100) : 0}%</div>
          <div className="fdash-stat-label">Conversion rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="fdash-panel fdash-filters">
        <div className="fdash-search fdash-search-flex">
          <FaSearch className="fdash-search-icon" />
          <input
            className="fdash-search-input"
            placeholder="Search by name, phone or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="fdash-filter-select">
          <FaFilter className="fdash-search-icon" />
          <Form.Select className="fdash-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="invited">Invited</option>
            <option value="enrolled">Enrolled</option>
          </Form.Select>
        </div>
        <button className="fdash-btn fdash-btn-outline" onClick={loadProspects}>Refresh</button>
      </div>

      {/* Table */}
      <div className="fdash-panel fdash-table-panel">
        <div className="table-responsive">
          <Table hover className="fdash-table mb-0">
            <thead>
              <tr>
                <th>Prospect</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Pipeline stage</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="fdash-empty">
                      <p>No prospects found</p>
                      <button className="fdash-btn fdash-btn-solid" onClick={() => setShowForm(true)}><FaPlus /> Add prospect</button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((prospect) => {
                  const stage = STAGE_MAP[prospect.pipelineStage] || STAGES[0];
                  const score = prospect.score || 0;
                  const scoreColor = getScoreColor(score);
                  return (
                    <tr key={prospect._id}>
                      <td>
                        <strong>{prospect.name}</strong>
                        <div className="fdash-table-meta"><FaBriefcase size={11} /> {prospect.occupation || 'No occupation'}</div>
                        <div className="fdash-table-meta"><FaMapMarkerAlt size={11} /> {prospect.location?.city || 'Location not set'}</div>
                      </td>
                      <td>
                        <div className="fdash-table-meta fdash-contact-row"><FaPhoneAlt size={11} style={{ color: '#17A589' }} /> <span className="fdash-mono">{prospect.phone}</span></div>
                        {prospect.email && <div className="fdash-table-meta fdash-contact-row"><FaEnvelope size={11} style={{ color: '#4453D8' }} /> {prospect.email}</div>}
                      </td>
                      <td>{prospect.location?.city || 'N/A'}</td>
                      <td>
                        <span className="fdash-tag" style={{ color: stage.color, background: `${stage.color}1A` }}>
                          {stage.icon} {stage.label}
                        </span>
                      </td>
                      <td style={{ minWidth: 90 }}>
                        <div className="fdash-score-value fdash-mono" style={{ color: scoreColor }}>{score}%</div>
                        <div className="fdash-track-bar-bg">
                          <div className="fdash-track-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
                        </div>
                      </td>
                      <td>
                        <div className="fdash-icon-actions">
                          <button className="fdash-icon-btn fdash-icon-btn-wa" title="Send WhatsApp" onClick={() => handleSendWhatsApp(prospect)}><FaWhatsapp /></button>
                          <button className="fdash-icon-btn fdash-icon-btn-indigo" title="Update pipeline stage" onClick={() => { setSelectedProspect(prospect); setShowStageModal(true); }}><FaRocket /></button>
                          <button className="fdash-icon-btn fdash-icon-btn-slate" title="View details" onClick={() => { setSelectedProspect(prospect); setShowDetailsModal(true); }}><FaEye /></button>
                          <button className="fdash-icon-btn fdash-icon-btn-amber" title="Edit prospect" onClick={() => { setSelectedProspect(prospect); setShowEditModal(true); }}><FaEdit /></button>
                          <button className="fdash-icon-btn fdash-icon-btn-coral" title="Delete prospect" onClick={() => { setSelectedProspect(prospect); setShowDeleteModal(true); }}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="fdash-table-footer">
            <small className="fdash-pagination-info">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProspects.length)} of {filteredProspects.length} prospects
            </small>
            <Pagination size="sm" className="fdash-pagination mb-0">
              <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
              <Pagination.Prev onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
              <Pagination.Next onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
              <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
            </Pagination>
          </div>
        )}
      </div>

      {/* Modals */}
      <ProspectForm show={showForm} onHide={() => setShowForm(false)} onProspectAdded={loadProspects} />
      <ProspectDetailsModal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} prospect={selectedProspect} onEdit={(p) => { setSelectedProspect(p); setShowEditModal(true); }} onDelete={(p) => { setSelectedProspect(p); setShowDeleteModal(true); }} onWhatsApp={handleSendWhatsApp} />
      <EditProspectModal show={showEditModal} onHide={() => setShowEditModal(false)} prospect={selectedProspect} onProspectUpdated={loadProspects} />
      <StageManager show={showStageModal} onHide={() => setShowStageModal(false)} prospect={selectedProspect} onUpdate={loadProspects} />
      <ConfirmationModal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} onConfirm={handleDelete} title="Delete prospect" message={`Delete ${selectedProspect?.name}?`} confirmText="Delete" variant="danger" />

      <ProspectsStyles />
    </div>
  );
}

function ProspectsStyles() {
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
      .fdash-loading { text-align: center; padding: 80px 0; color: #6B7280; font-family: 'Inter', sans-serif; }
      .fdash-spinner { width: 32px; height: 32px; margin: 0 auto; border: 3px solid #E2E5EE; border-top-color: #4453D8; border-radius: 50%; animation: fdash-spin 0.8s linear infinite; }
      @keyframes fdash-spin { to { transform: rotate(360deg); } }

      .fdash-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px; margin-bottom: 22px; }
      .fdash-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--indigo); }
      .fdash-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 28px; margin: 4px 0 2px; }
      .fdash-subtitle { font-size: 13px; color: var(--muted); margin: 0; }
      .fdash-mono { font-family: 'IBM Plex Mono', monospace; }

      .fdash-btn { font-family: 'Inter', sans-serif; font-weight: 500; font-size: 13px; border-radius: 9px; padding: 9px 16px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; transition: all 0.15s ease; border: none; white-space: nowrap; }
      .fdash-btn-outline { background: var(--surface); border: 1px solid var(--line); color: var(--ink); }
      .fdash-btn-outline:hover { border-color: var(--indigo); color: var(--indigo); }
      .fdash-btn-solid { background: var(--indigo); color: #fff; }
      .fdash-btn-solid:hover { opacity: 0.9; }

      .fdash-panel { background: var(--surface); border-radius: 14px; box-shadow: 0 1px 2px rgba(18,24,43,0.04); }

      /* Pipeline stage track */
      .fdash-stage-track { display: flex; align-items: center; padding: 18px 20px; margin-bottom: 16px; overflow-x: auto; }
      .fdash-stage-node { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 84px; }
      .fdash-stage-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
      .fdash-stage-count { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 20px; }
      .fdash-stage-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .fdash-stage-connector { flex: 1; height: 2px; background: var(--line); min-width: 16px; margin: 0 4px; margin-bottom: 22px; }

      .fdash-stat-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
      @media (max-width: 900px) { .fdash-stat-strip { grid-template-columns: repeat(2, 1fr); } }
      .fdash-stat-tile { background: var(--surface); border-radius: 14px; padding: 16px 18px; border-left: 4px solid var(--tile-accent); box-shadow: 0 1px 2px rgba(18,24,43,0.04); }
      .fdash-stat-top { display: flex; justify-content: flex-end; margin-bottom: 10px; }
      .fdash-stat-icon { color: var(--tile-accent); font-size: 16px; opacity: 0.7; }
      .fdash-stat-value { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 26px; line-height: 1; }
      .fdash-stat-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 6px; }

      .fdash-filters { display: flex; gap: 12px; padding: 16px 18px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
      .fdash-search { display: flex; align-items: center; gap: 10px; background: var(--canvas); border: 1px solid var(--line); border-radius: 10px; padding: 10px 14px; }
      .fdash-search-flex { flex: 1; min-width: 220px; }
      .fdash-search-icon { color: var(--muted); font-size: 13px; flex-shrink: 0; }
      .fdash-search-input { border: none; outline: none; font-family: 'Inter', sans-serif; font-size: 13px; flex: 1; background: transparent; color: var(--ink); }
      .fdash-filter-select { display: flex; align-items: center; gap: 8px; background: var(--canvas); border: 1px solid var(--line); border-radius: 10px; padding: 4px 12px; min-width: 170px; }
      .fdash-select { border: none !important; background: transparent !important; box-shadow: none !important; font-size: 13px; padding: 6px 4px !important; }

      .fdash-table-panel { overflow: hidden; padding: 0; }
      .fdash-table { font-family: 'Inter', sans-serif; font-size: 13px; }
      .fdash-table thead th { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); border-bottom: 1px solid var(--line); padding: 14px 16px; background: var(--canvas); }
      .fdash-table tbody td { padding: 14px 16px; vertical-align: middle; border-bottom: 1px solid var(--line); }
      .fdash-table tbody tr:last-child td { border-bottom: none; }
      .fdash-table-meta { font-size: 11.5px; color: var(--muted); display: flex; align-items: center; gap: 5px; margin-top: 2px; }
      .fdash-contact-row { color: var(--ink); font-size: 12.5px; }

      .fdash-tag { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; padding: 4px 9px; border-radius: 20px; display: inline-flex; align-items: center; gap: 5px; }

      .fdash-score-value { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
      .fdash-track-bar-bg { background: var(--canvas); border-radius: 6px; height: 4px; overflow: hidden; }
      .fdash-track-bar-fill { height: 100%; border-radius: 6px; }

      .fdash-icon-actions { display: flex; gap: 6px; flex-wrap: wrap; }
      .fdash-icon-btn { width: 30px; height: 30px; border-radius: 8px; border: none; display: flex; align-items: center; justify-content: center; font-size: 13px; cursor: pointer; color: #fff; transition: opacity 0.15s ease; }
      .fdash-icon-btn:hover { opacity: 0.85; }
      .fdash-icon-btn-wa { background: #25D366; }
      .fdash-icon-btn-indigo { background: var(--indigo); }
      .fdash-icon-btn-slate { background: #5B6478; }
      .fdash-icon-btn-amber { background: var(--amber); }
      .fdash-icon-btn-coral { background: var(--coral); }

      .fdash-empty { text-align: center; padding: 48px 0; color: var(--muted); }
      .fdash-empty p { margin-bottom: 12px; font-size: 13px; }

      .fdash-table-footer { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; border-top: 1px solid var(--line); flex-wrap: wrap; gap: 10px; }
      .fdash-pagination-info { color: var(--muted); font-size: 12px; }
      .fdash-pagination .page-link { border: 1px solid var(--line); color: var(--ink); }
      .fdash-pagination .page-item.active .page-link { background: var(--indigo); border-color: var(--indigo); }
      .fdash-pagination .page-link:hover { color: var(--indigo); }
    `}</style>
  );
}

export default Prospects;