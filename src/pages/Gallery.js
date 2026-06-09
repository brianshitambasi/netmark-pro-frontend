import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { FaUpload, FaTrash, FaImage, FaVideo, FaSpinner, FaClock } from 'react-icons/fa';
import { galleryService } from '../services/api';
import toast from 'react-hot-toast';

function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processingItems, setProcessingItems] = useState([]);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'testimonial',
    description: '',
  });

  const loadMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await galleryService.getAll();
      setMedia(response.data.data || []);
      
      // Check for processing items
      const processing = response.data.data.filter(item => item.status === 'processing');
      setProcessingItems(processing);
      setError('');
    } catch (error) {
      console.error('Load media error:', error);
      setError('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  }, []);

  const checkProcessingStatus = useCallback(async () => {
    for (const item of processingItems) {
      try {
        const response = await galleryService.getStatus(item._id);
        if (!response.data.processing) {
          // Item is done, reload gallery
          loadMedia();
          toast.success(`Video "${item.title}" is ready!`);
        }
      } catch (error) {
        console.error('Status check failed:', error);
      }
    }
  }, [processingItems, loadMedia]);

  useEffect(() => {
    loadMedia();
    // Poll for processing status every 10 seconds
    const interval = setInterval(() => {
      if (processingItems.length > 0) {
        checkProcessingStatus();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadMedia, checkProcessingStatus, processingItems.length]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast.error('File size must be less than 500MB');
        return;
      }
      
      // Check file type
      const videoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv'];
      const isVideo = videoTypes.includes(file.type);
      
      if (isVideo && file.size > 100 * 1024 * 1024) {
        toast.info('Large video detected. Upload will be processed asynchronously.');
      }
      
      setSelectedFile(file);
      if (!formData.title) {
        const fileName = file.name.split('.').slice(0, -1).join('.');
        setFormData(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const handleUpload = async (e) => {
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
        if (response.data.processing) {
          toast.success('Video upload started! Processing in background. You will be notified when ready.');
        } else {
          toast.success('Media uploaded successfully!');
        }
        setShowModal(false);
        setSelectedFile(null);
        setFormData({ title: '', category: 'testimonial', description: '' });
        await loadMedia();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Upload failed');
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
      try {
        await galleryService.delete(id);
        toast.success('Deleted successfully');
        loadMedia();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Delete failed');
      }
    }
  };

  const getStatusBadge = (item) => {
    if (item.status === 'processing') {
      return <span className="badge bg-warning"><FaSpinner className="me-1 spin" /> Processing</span>;
    }
    if (item.type === 'video') {
      const duration = item.duration || 0;
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      const durationText = duration ? `${minutes}:${seconds.toString().padStart(2, '0')}` : 'Video';
      return <span className="badge bg-danger"><FaVideo className="me-1" /> {durationText}</span>;
    }
    return <span className="badge bg-primary"><FaImage className="me-1" /> Image</span>;
  };

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><FaImage className="me-2" />Media Gallery</h2>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <FaUpload className="me-2" /> Upload Media
        </Button>
      </div>

      {processingItems.length > 0 && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>
            <FaClock className="me-2" /> Processing Videos
          </Alert.Heading>
          <p>{processingItems.length} video(s) are being processed in the background. They will appear here once ready.</p>
          <ProgressBar 
            animated 
            now={100} 
            label="Processing..." 
            className="mt-2"
          />
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="outline-danger" size="sm" className="ms-3" onClick={loadMedia}>
            Retry
          </Button>
        </Alert>
      )}

      <Row>
        {media.length === 0 && !error ? (
          <Col xs={12}>
            <div className="text-center py-5">
              <FaImage className="fa-3x text-muted mb-3" />
              <h5 className="text-muted">No Media Yet</h5>
              <p className="text-muted">Click the upload button to add images or videos to your gallery.</p>
              <p className="text-muted small">Supports videos up to 500MB (30+ minutes)</p>
            </div>
          </Col>
        ) : (
          media.map((item) => (
            <Col md={4} lg={3} key={item._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <div className="position-relative">
                  {item.status === 'processing' ? (
                    <div className="d-flex align-items-center justify-content-center bg-dark" style={{ height: '200px' }}>
                      <div className="text-center text-white">
                        <FaSpinner size={40} className="spin mb-2" />
                        <p className="mb-0 small">Processing...</p>
                      </div>
                    </div>
                  ) : item.type === 'image' ? (
                    <img
                      src={item.url}
                      className="card-img-top"
                      alt={item.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Loading+Error';
                      }}
                    />
                  ) : (
                    <video
                      src={item.url}
                      className="card-img-top"
                      style={{ height: '200px', objectFit: 'cover' }}
                      controls
                      poster={item.thumbnail}
                    />
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2"
                    onClick={() => handleDelete(item._id, item.title)}
                    disabled={item.status === 'processing'}
                  >
                    <FaTrash />
                  </Button>
                </div>
                <Card.Body>
                  <Card.Title className="fs-6">{item.title}</Card.Title>
                  <Card.Text className="small text-muted">
                    <span className="badge bg-secondary me-1">{item.category}</span>
                    {getStatusBadge(item)}
                    {item.status === 'processing' && (
                      <span className="ms-2 text-warning">
                        <FaSpinner className="spin" /> Processing
                      </span>
                    )}
                  </Card.Text>
                  {item.description && (
                    <Card.Text className="small text-muted">
                      {item.description.substring(0, 60)}...
                    </Card.Text>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Upload Modal */}
      <Modal show={showModal} onHide={() => {
        setShowModal(false);
        setError('');
        setSelectedFile(null);
        setFormData({ title: '', category: 'testimonial', description: '' });
      }} size="lg">
        <Modal.Header closeButton>
          <Modal.Title><FaUpload className="me-2" />Upload Media</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpload}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                required
                placeholder="Enter a title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Category *</Form.Label>
              <Form.Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="testimonial">Ì≥ù Testimonial</option>
                <option value="event">Ìæâ Event</option>
                <option value="training">Ì≥ö Training</option>
                <option value="product_demo">Ì≥¶ Product Demo</option>
                <option value="team_photo">Ì±• Team Photo</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File (Image or Video)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Supported formats: JPG, PNG, GIF, MP4, MOV, AVI, MKV, WebM<br />
                Max size: 500MB (videos up to 30+ minutes supported)
              </Form.Text>
            </Form.Group>

            {selectedFile && (
              <Alert variant="info" className="mb-0">
                <strong>Selected:</strong> {selectedFile.name}<br />
                <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                {selectedFile.size > 100 * 1024 * 1024 && (
                  <div className="mt-2 text-warning">
                    <FaClock className="me-1" />
                    Large video detected. Upload will be processed in background.
                  </div>
                )}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading || !selectedFile}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default Gallery;
