import React, { useState, useEffect, useRef } from 'react';
import { 
  Row, Col, Card, Button, Modal, Form, Spinner, Alert, 
  Badge, Dropdown, InputGroup, Table
} from 'react-bootstrap';
import { 
  FaUpload, FaTrash, FaImage, FaVideo, FaMicrophone, 
  FaStop, FaPlay, FaPause, FaSearch, 
  FaFilter, FaTh, FaList, FaFileAudio, FaFolder, FaTimes
} from 'react-icons/fa';
import { galleryService } from '../services/api';
import toast from 'react-hot-toast';

function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'testimonial',
    description: '',
  });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const cleanupAudio = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };

  useEffect(() => {
    loadMedia();
    return () => {
      cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await galleryService.getAll();
      setMedia(response.data.data || []);
      setError('');
    } catch (error) {
      console.error('Load media error:', error);
      setError('Failed to load gallery');
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlobData = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrlData = URL.createObjectURL(audioBlobData);
        setAudioBlob(audioBlobData);
        setAudioUrl(audioUrlData);
        
        stream.getTracks().forEach(track => track.stop());
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setRecordingTime(0);
      };

      mediaRecorderRef.current.start(100);
      setRecording(true);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started...');
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Please allow microphone access to record voice notes');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      const mins = Math.floor(recordingTime / 60);
      const secs = recordingTime % 60;
      toast.success(`Recording stopped (${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')})`);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play();
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const uploadVoiceNote = async () => {
    if (!audioBlob) {
      toast.error('No recording to upload');
      return;
    }

    if (!formData.title) {
      toast.error('Please enter a title');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', audioBlob, `${formData.title}.webm`);
    uploadData.append('title', formData.title);
    uploadData.append('category', formData.category);
    uploadData.append('description', formData.description);
    uploadData.append('type', 'audio');

    try {
      const response = await galleryService.upload(uploadData);
      if (response.data.success) {
        toast.success('Voice note uploaded successfully!');
        setShowVoiceModal(false);
        resetVoiceForm();
        loadMedia();
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetVoiceForm = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setFormData({ title: '', category: 'testimonial', description: '' });
    setRecording(false);
    setRecordingTime(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    
    const uploadData = new FormData();
    uploadData.append('file', selectedFile);
    uploadData.append('title', formData.title);
    uploadData.append('category', formData.category);
    uploadData.append('description', formData.description);

    try {
      const response = await galleryService.upload(uploadData);
      if (response.data.success) {
        toast.success('Media uploaded successfully!');
        setShowModal(false);
        resetForm();
        loadMedia();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || error.message || 'Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await galleryService.delete(selectedItem._id);
      toast.success('Deleted successfully');
      setShowDeleteModal(false);
      setSelectedItem(null);
      loadMedia();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFormData({ title: '', category: 'testimonial', description: '' });
    setError('');
  };

  const getCategoryIcon = (category) => {
    const icons = {
      testimonial: '���',
      event: '���',
      training: '���',
      product_demo: '���',
      team_photo: '���'
    };
    return icons[category] || '���';
  };

  const getMediaIcon = (type) => {
    if (type === 'image') return <FaImage className="text-primary" />;
    if (type === 'video') return <FaVideo className="text-danger" />;
    if (type === 'audio') return <FaFileAudio className="text-success" />;
    return <FaImage />;
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All', icon: '' },
    { value: 'testimonial', label: 'Testimonials', icon: '' },
    { value: 'event', label: 'Events', icon: '' },
    { value: 'training', label: 'Trainings', icon: '' },
    { value: 'product_demo', label: 'Product Demos', icon: '' },
    { value: 'team_photo', label: 'Team Photos', icon: '' },
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2><FaImage className="me-2 text-primary" />Media Gallery</h2>
          <p className="text-muted mb-0">Manage photos, videos, and voice notes</p>
        </div>
        <div className="d-flex gap-2">
          <Dropdown>
            <Dropdown.Toggle variant="primary">
              <FaUpload className="me-2" /> Upload
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setShowModal(true)}>
                <FaImage className="me-2" /> Upload Photo/Video
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setShowVoiceModal(true)}>
                <FaMicrophone className="me-2" /> Record Voice Note
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      <Row className="g-3 mb-4">
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm"><Card.Body className="text-center"><FaImage size={24} className="text-primary mb-2" /><h4 className="mb-0">{media.filter(m => m.type === 'image').length}</h4><small className="text-muted">Photos</small></Card.Body></Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm"><Card.Body className="text-center"><FaVideo size={24} className="text-danger mb-2" /><h4 className="mb-0">{media.filter(m => m.type === 'video').length}</h4><small className="text-muted">Videos</small></Card.Body></Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm"><Card.Body className="text-center"><FaFileAudio size={24} className="text-success mb-2" /><h4 className="mb-0">{media.filter(m => m.type === 'audio').length}</h4><small className="text-muted">Voice Notes</small></Card.Body></Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="border-0 shadow-sm"><Card.Body className="text-center"><FaFolder size={24} className="text-warning mb-2" /><h4 className="mb-0">{categories.length - 1}</h4><small className="text-muted">Categories</small></Card.Body></Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={5}><InputGroup><InputGroup.Text><FaSearch /></InputGroup.Text><Form.Control placeholder="Search by title..." value={search} onChange={(e) => setSearch(e.target.value)} /></InputGroup></Col>
            <Col md={4}><InputGroup><InputGroup.Text><FaFilter /></InputGroup.Text><Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>{categories.map(cat => (<option key={cat.value} value={cat.value}>{cat.icon} {cat.label}</option>))}</Form.Select></InputGroup></Col>
            <Col md={3}><div className="d-flex gap-2"><Button variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('grid')}><FaTh /></Button><Button variant={viewMode === 'list' ? 'primary' : 'outline-secondary'} onClick={() => setViewMode('list')}><FaList /></Button><Button variant="outline-secondary" onClick={loadMedia}>Refresh</Button></div></Col>
          </Row>
        </Card.Body>
      </Card>

      {viewMode === 'grid' ? (
        <Row>
          {filteredMedia.length === 0 ? (
            <Col xs={12}><div className="text-center py-5"><FaImage className="fa-3x text-muted mb-3" /><h5 className="text-muted">No Media Found</h5><p className="text-muted">Upload photos, videos, or record voice notes</p></div></Col>
          ) : (
            filteredMedia.map((item) => (
              <Col md={4} lg={3} key={item._id} className="mb-4">
                <Card className="h-100 shadow-sm border-0">
                  <div className="position-relative">
                    {item.type === 'image' ? (
                      <img src={item.url} className="card-img-top" alt={item.title} style={{ height: '200px', objectFit: 'cover' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Image+Error'; }} />
                    ) : item.type === 'video' ? (
                      <video src={item.url} className="card-img-top" style={{ height: '200px', objectFit: 'cover' }} controls />
                    ) : (
                      <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '200px' }}>
                        <div className="text-center">
                          <FaFileAudio size={48} className="text-success mb-2" />
                          <p className="mb-0">Voice Note</p>
                          <audio src={item.url} controls className="mt-2" style={{ width: '90%' }} />
                        </div>
                      </div>
                    )}
                    <Button variant="danger" size="sm" className="position-absolute top-0 end-0 m-2" onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }}><FaTrash /></Button>
                    <div className="position-absolute bottom-0 start-0 m-2"><Badge bg="dark" className="opacity-75">{getCategoryIcon(item.category)} {item.category}</Badge></div>
                  </div>
                  <Card.Body>
                    <Card.Title className="fs-6">{item.title}</Card.Title>
                    <Card.Text className="small text-muted">{getMediaIcon(item.type)} {item.type}{item.duration && ` • ${Math.floor(item.duration / 60)}:${(item.duration % 60).toString().padStart(2, '0')}`}</Card.Text>
                    {item.description && <Card.Text className="small text-muted">{item.description.substring(0, 50)}...</Card.Text>}
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      ) : (
        <Card className="border-0 shadow-sm">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead className="bg-light"><tr><th>Media</th><th>Title</th><th>Category</th><th>Type</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredMedia.map((item) => (
                  <tr key={item._id}>
                    <td className="align-middle">{item.type === 'image' ? <img src={item.url} alt={item.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} /> : item.type === 'video' ? <FaVideo size={40} className="text-danger" /> : <FaFileAudio size={40} className="text-success" />}</td>
                    <td className="align-middle"><strong>{item.title}</strong>{item.description && <><br /><small className="text-muted">{item.description.substring(0, 50)}</small></>}</td>
                    <td className="align-middle"><Badge bg="secondary">{item.category}</Badge></td>
                    <td className="align-middle">{getMediaIcon(item.type)} {item.type}</td>
                    <td className="align-middle">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="align-middle"><Button variant="danger" size="sm" onClick={() => { setSelectedItem(item); setShowDeleteModal(true); }}><FaTrash /></Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      <Modal show={showModal} onHide={() => { setShowModal(false); resetForm(); }} size="lg">
        <Modal.Header closeButton><Modal.Title><FaUpload className="me-2" />Upload Photo/Video</Modal.Title></Modal.Header>
        <Form onSubmit={handleFileUpload}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3"><Form.Label>Title *</Form.Label><Form.Control type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}><option value="testimonial"> Testimonial</option><option value="event"> Event</option><option value="training"> Training</option><option value="product_demo"> Product Demo</option><option value="team_photo"> Team Photo</option></Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>File (Image or Video)</Form.Label><Form.Control type="file" accept="image/*,video/*" onChange={(e) => setSelectedFile(e.target.files[0])} required /><Form.Text className="text-muted">Supported: JPG, PNG, GIF, MP4, MOV, AVI (Max 500MB)</Form.Text></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button><Button variant="primary" type="submit" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button></Modal.Footer>
        </Form>
      </Modal>

      {/* Voice Note Modal */}
      <Modal show={showVoiceModal} onHide={() => { setShowVoiceModal(false); resetVoiceForm(); }} size="lg">
        <Modal.Header closeButton><Modal.Title><FaMicrophone className="me-2" />Record Voice Note</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="text-center py-4">
            {!audioBlob ? (
              <div>
                {!recording ? <Button variant="danger" size="lg" onClick={startRecording} className="rounded-circle p-4"><FaMicrophone size={40} /></Button> : <div><Button variant="secondary" size="lg" onClick={stopRecording} className="rounded-circle p-4"><FaStop size={40} /></Button><p className="mt-3 text-danger"><span className="badge bg-danger p-2">Recording... {formatTime(recordingTime)}</span></p></div>}
                <p className="mt-3 text-muted">{!recording ? 'Click to start recording' : 'Click stop when done'}</p>
              </div>
            ) : (
              <div>
                <div className="mb-4"><audio ref={audioRef} src={audioUrl} controls className="w-100" /><div className="mt-2"><Button variant="primary" size="sm" onClick={playAudio}><FaPlay className="me-1" /> Play</Button><Button variant="secondary" size="sm" onClick={pauseAudio} className="ms-2"><FaPause className="me-1" /> Pause</Button></div></div>
                <Button variant="danger" size="sm" onClick={() => { resetVoiceForm(); }}><FaTimes className="me-1" /> Re-record</Button>
              </div>
            )}
          </div>
          <hr />
          <Form.Group className="mb-3"><Form.Label>Title *</Form.Label><Form.Control type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Enter title for voice note" disabled={!audioBlob} /></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Category</Form.Label><Form.Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={!audioBlob}><option value="testimonial"> Testimonial</option><option value="event"> Event</option><option value="training"> Training</option><option value="product_demo"> Product Demo</option><option value="team_photo"> Team Photo</option></Form.Select></Form.Group>
          <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional description..." disabled={!audioBlob} /></Form.Group>
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => { setShowVoiceModal(false); resetVoiceForm(); }}>Cancel</Button><Button variant="success" onClick={uploadVoiceNote} disabled={!audioBlob || uploading}>{uploading ? 'Uploading...' : 'Save Voice Note'}</Button></Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>Delete Media</Modal.Title></Modal.Header>
        <Modal.Body>Are you sure you want to delete "{selectedItem?.title}"? This action cannot be undone.</Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

export default Gallery;
