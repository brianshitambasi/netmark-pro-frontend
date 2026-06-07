// API Configuration
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me')
};

// Followup API
const followupAPI = {
    getAll: () => api.get('/followups'),
    create: (data) => api.post('/followups', data),
    update: (id, data) => api.put(`/followups/${id}`, data),
    delete: (id) => api.delete(`/followups/${id}`),
    whatsappClick: (id) => api.put(`/followups/${id}/whatsapp-click`),
    markFollowed: (id) => api.put(`/followups/${id}/mark-followed`, { notes: 'Followed up' }),
    convert: (id) => api.put(`/followups/${id}/convert`, { conversionType: 'customer' })
};

// Goal API
const goalAPI = {
    getAll: () => api.get('/goals'),
    create: (data) => api.post('/goals', data),
    delete: (id) => api.delete(`/goals/${id}`)
};

// Dashboard API
const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats')
};

// Toast notification
function showToast(message, type = 'success') {
    const toastDiv = document.createElement('div');
    toastDiv.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`;
    toastDiv.setAttribute('role', 'alert');
    toastDiv.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.querySelector('.toast-container').appendChild(toastDiv);
    const toast = new bootstrap.Toast(toastDiv);
    toast.show();
    setTimeout(() => toastDiv.remove(), 3000);
}

// Login Component
function Login() {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authAPI.login({ email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                showToast('Login successful!');
                window.location.href = '/';
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="row w-100 justify-content-center">
                <div className="col-md-5 col-lg-4">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">NetMark Pro</h2>
                                <p className="text-muted">Network Marketing System</p>
                            </div>
                            <h4 className="text-center mb-4">
                                <i className="fas fa-sign-in-alt me-2"></i> Login
                            </h4>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </button>
                                <div className="text-center">
                                    <a href="/register">Don't have an account? Register here</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Register Component
function Register() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [whatsappNumber, setWhatsappNumber] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await authAPI.register({ name, email, password, whatsappNumber });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                showToast('Registration successful!');
                window.location.href = '/';
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Registration failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
            <div className="row w-100 justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-5">
                            <div className="text-center mb-4">
                                <h2 className="fw-bold text-primary">NetMark Pro</h2>
                                <p className="text-muted">Create your account</p>
                            </div>
                            <h4 className="text-center mb-4">
                                <i className="fas fa-user-plus me-2"></i> Register
                            </h4>
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">WhatsApp Number</label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        placeholder="254712345678"
                                        value={whatsappNumber}
                                        onChange={(e) => setWhatsappNumber(e.target.value)}
                                    />
                                    <small className="text-muted">Include country code (e.g., 254 for Kenya)</small>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Register'}
                                </button>
                                <div className="text-center">
                                    <a href="/login">Already have an account? Login here</a>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Dashboard Component
function Dashboard() {
    const [stats, setStats] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    React.useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await dashboardAPI.getStats();
            setStats(response.data.data);
        } catch (err) {
            showToast('Failed to load dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-5"><div className="spinner-border text-primary"></div><p className="mt-3">Loading...</p></div>;
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Welcome back, {user.name}!</h2>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-2">Today's Follow-ups</h6>
                                    <h2 className="mb-0">{stats?.today?.followupsDueCount || 0}</h2>
                                </div>
                                <i className="fas fa-phone fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-2">Completed Today</h6>
                                    <h2 className="mb-0">{stats?.today?.followedCompleted || 0}</h2>
                                </div>
                                <i className="fas fa-check-circle fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-2">Weekly Activity</h6>
                                    <h2 className="mb-0">{stats?.weekly?.followupsCompleted || 0}</h2>
                                </div>
                                <i className="fas fa-chart-line fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-white">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-2">Monthly Conversions</h6>
                                    <h2 className="mb-0">{stats?.monthly?.conversions || 0}</h2>
                                </div>
                                <i className="fas fa-users fa-2x opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Goals Section */}
            {stats?.goals && stats.goals.length > 0 && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header bg-white">
                                <h5 className="mb-0"><i className="fas fa-bullseye me-2"></i>Active Goals</h5>
                            </div>
                            <div className="card-body">
                                {stats.goals.map((goal) => (
                                    <div key={goal.id} className="mb-3">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>{goal.title}</span>
                                            <span className="fw-bold">{goal.current}/{goal.target}</span>
                                        </div>
                                        <div className="progress" style={{ height: '10px' }}>
                                            <div 
                                                className={`progress-bar bg-${goal.isBehind ? 'warning' : 'success'}`}
                                                style={{ width: `${goal.progress}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted">{goal.daysRemaining} days remaining</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overdue Follow-ups Alert */}
            {stats?.overdueFollowups?.length > 0 && (
                <div className="row">
                    <div className="col-12">
                        <div className="alert alert-danger border-0">
                            <h5><i className="fas fa-exclamation-triangle me-2"></i>Overdue Follow-ups ({stats.overdueFollowups.length})</h5>
                            <p>You have {stats.overdueFollowups.length} follow-up(s) that are past due date. Take action now!</p>
                            <hr />
                            {stats.overdueFollowups.slice(0, 3).map((item) => (
                                <div key={item.id} className="d-flex justify-content-between align-items-center mb-2">
                                    <span><strong>{item.name}</strong> - Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                                    <span className="badge bg-danger">Missed by {item.missedDays} day(s)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Followups Component
function Followups() {
    const [followups, setFollowups] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [formData, setFormData] = React.useState({ name: '', phone: '', category: 'warm', nextCallDate: '', notes: '' });

    React.useEffect(() => {
        loadFollowups();
    }, []);

    const loadFollowups = async () => {
        try {
            const response = await followupAPI.getAll();
            setFollowups(response.data.data || []);
        } catch (err) {
            showToast('Failed to load follow-ups', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await followupAPI.create(formData);
            showToast('Follow-up created successfully');
            setShowModal(false);
            setFormData({ name: '', phone: '', category: 'warm', nextCallDate: '', notes: '' });
            loadFollowups();
        } catch (err) {
            showToast('Failed to create follow-up', 'error');
        }
    };

    const handleWhatsApp = async (id, phone) => {
        try {
            const response = await followupAPI.whatsappClick(id);
            window.open(response.data.whatsappLink, '_blank');
            showToast('Opening WhatsApp...');
        } catch (err) {
            showToast('Failed to open WhatsApp', 'error');
        }
    };

    const handleDelete = async (id, name) => {
        if (confirm(`Delete follow-up for ${name}?`)) {
            try {
                await followupAPI.delete(id);
                showToast('Deleted successfully');
                loadFollowups();
            } catch (err) {
                showToast('Delete failed', 'error');
            }
        }
    };

    const getCategoryBadge = (category) => {
        const variants = { hot: 'danger', warm: 'warning', cold: 'secondary', converted: 'success' };
        return <span className={`badge bg-${variants[category] || 'secondary'}`}>{category}</span>;
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Follow-up Management</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus me-2"></i>Add Follow-up
                </button>
            </div>

            <div className="card">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Category</th>
                                    <th>Next Call Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {followups.map((followup) => (
                                    <tr key={followup._id}>
                                        <td><strong>{followup.name}</strong></td>
                                        <td>{followup.phone}</td>
                                        <td>{getCategoryBadge(followup.category)}</td>
                                        <td>{new Date(followup.nextCallDate).toLocaleDateString()}</td>
                                        <td><span className={`badge bg-${followup.status === 'pending' ? 'warning' : followup.status === 'followed' ? 'info' : 'success'}`}>{followup.status}</span></td>
                                        <td>
                                            <button className="btn btn-sm btn-success me-2" onClick={() => handleWhatsApp(followup._id, followup.phone)}>
                                                <i className="fab fa-whatsapp"></i>
                                            </button>
                                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(followup._id, followup.name)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Add Follow-up</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Name *</label>
                                        <input type="text" className="form-control" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Phone *</label>
                                        <input type="tel" className="form-control" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Category</label>
                                        <select className="form-select" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                                            <option value="hot">Hot</option>
                                            <option value="warm">Warm</option>
                                            <option value="cold">Cold</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Next Call Date *</label>
                                        <input type="date" className="form-control" required value={formData.nextCallDate} onChange={(e) => setFormData({...formData, nextCallDate: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Notes</label>
                                        <textarea className="form-control" rows="3" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})}></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Goals Component
function Goals() {
    const [goals, setGoals] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showModal, setShowModal] = React.useState(false);
    const [formData, setFormData] = React.useState({ title: '', type: 'recruitment', target: '', period: 'monthly', startDate: '', endDate: '' });

    React.useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        try {
            const response = await goalAPI.getAll();
            setGoals(response.data.data || []);
        } catch (err) {
            showToast('Failed to load goals', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await goalAPI.create(formData);
            showToast('Goal created successfully');
            setShowModal(false);
            setFormData({ title: '', type: 'recruitment', target: '', period: 'monthly', startDate: '', endDate: '' });
            loadGoals();
        } catch (err) {
            showToast('Failed to create goal', 'error');
        }
    };

    const handleDelete = async (id, title) => {
        if (confirm(`Delete goal "${title}"?`)) {
            try {
                await goalAPI.delete(id);
                showToast('Goal deleted');
                loadGoals();
            } catch (err) {
                showToast('Delete failed', 'error');
            }
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><i className="fas fa-bullseye me-2"></i>Goals & Targets</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <i className="fas fa-plus me-2"></i>Set New Goal
                </button>
            </div>

            <div className="row">
                {goals.map((goal) => (
                    <div className="col-md-6 mb-4" key={goal.id}>
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h5 className="card-title mb-0">{goal.title}</h5>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(goal.id, goal.title)}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span>Progress</span>
                                        <span className="fw-bold">{goal.current}/{goal.target}</span>
                                    </div>
                                    <div className="progress" style={{ height: '10px' }}>
                                        <div className="progress-bar bg-success" style={{ width: `${goal.progress}%` }}></div>
                                    </div>
                                </div>
                                <div className="text-muted small">
                                    <div>Type: {goal.type}</div>
                                    <div>Period: {goal.period}</div>
                                    <div>Days remaining: {goal.daysRemaining}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Goal</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Goal Title</label>
                                        <input type="text" className="form-control" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Type</label>
                                        <select className="form-select" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                                            <option value="recruitment">Recruitment</option>
                                            <option value="sales">Sales</option>
                                            <option value="commission">Commission</option>
                                            <option value="activity">Activity</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Target</label>
                                        <input type="number" className="form-control" required value={formData.target} onChange={(e) => setFormData({...formData, target: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Period</label>
                                        <select className="form-select" value={formData.period} onChange={(e) => setFormData({...formData, period: e.target.value})}>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="quarterly">Quarterly</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Start Date</label>
                                        <input type="date" className="form-control" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">End Date</label>
                                        <input type="date" className="form-control" required value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Create Goal</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Gallery Component
function Gallery() {
    const [media, setMedia] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadMedia();
    }, []);

    const loadMedia = async () => {
        try {
            const response = await api.get('/gallery');
            setMedia(response.data.data || []);
        } catch (err) {
            showToast('Failed to load gallery', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2><i className="fas fa-images me-2"></i>Media Gallery</h2>
                <button className="btn btn-primary" onClick={() => alert('Upload feature coming soon! Use Postman to test upload endpoint.')}>
                    <i className="fas fa-upload me-2"></i>Upload Media
                </button>
            </div>

            <div className="row">
                {media.length === 0 ? (
                    <div className="col-12 text-center py-5">
                        <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                        <p className="text-muted">No media uploaded yet. Click the upload button to add images/videos.</p>
                    </div>
                ) : (
                    media.map((item) => (
                        <div className="col-md-3 mb-4" key={item._id}>
                            <div className="card h-100">
                                {item.type === 'image' ? (
                                    <img src={item.url} className="card-img-top" alt={item.title} style={{ height: '200px', objectFit: 'cover' }} />
                                ) : (
                                    <video src={item.url} className="card-img-top" style={{ height: '200px', objectFit: 'cover' }} controls />
                                )}
                                <div className="card-body">
                                    <h6 className="card-title">{item.title}</h6>
                                    <p className="card-text small text-muted">{item.category}</p>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// Layout Component
function Layout({ children }) {
    const [activeTab, setActiveTab] = React.useState(window.location.pathname || '/');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast('Logged out successfully');
        window.location.href = '/login';
    };

    const navigate = (path) => {
        setActiveTab(path);
        window.history.pushState({}, '', path);
        renderApp();
    };

    return (
        <div>
            <nav className="navbar navbar-dark bg-dark navbar-expand-lg">
                <div className="container-fluid">
                    <a className="navbar-brand" href="#" onClick={() => navigate('/')}>
                        <strong>NetMark Pro</strong>
                    </a>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item">
                                <a className={`nav-link ${activeTab === '/' ? 'active' : ''}`} href="#" onClick={() => navigate('/')}>
                                    <i className="fas fa-tachometer-alt me-1"></i> Dashboard
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${activeTab === '/followups' ? 'active' : ''}`} href="#" onClick={() => navigate('/followups')}>
                                    <i className="fas fa-users me-1"></i> Follow-ups
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${activeTab === '/goals' ? 'active' : ''}`} href="#" onClick={() => navigate('/goals')}>
                                    <i className="fas fa-bullseye me-1"></i> Goals
                                </a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${activeTab === '/gallery' ? 'active' : ''}`} href="#" onClick={() => navigate('/gallery')}>
                                    <i className="fas fa-images me-1"></i> Gallery
                                </a>
                            </li>
                        </ul>
                        <ul className="navbar-nav">
                            <li className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown">
                                    <i className="fas fa-user me-1"></i> {user.name || 'User'}
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><a className="dropdown-item" href="#" onClick={handleLogout}>
                                        <i className="fas fa-sign-out-alt me-2"></i> Logout
                                    </a></li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="container-fluid px-4 py-4">
                {children}
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
    const token = localStorage.getItem('token');

    React.useEffect(() => {
        const handlePopState = () => {
            setCurrentPath(window.location.pathname);
            renderApp();
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const renderView = () => {
        if (!token && currentPath !== '/register') {
            return <Login />;
        }

        switch (currentPath) {
            case '/register':
                return <Register />;
            case '/followups':
                return <Layout><Followups /></Layout>;
            case '/goals':
                return <Layout><Goals /></Layout>;
            case '/gallery':
                return <Layout><Gallery /></Layout>;
            default:
                return <Layout><Dashboard /></Layout>;
        }
    };

    return renderView();
}

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
function renderApp() {
    root.render(<App />);
}
renderApp();

// Toast container
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);
