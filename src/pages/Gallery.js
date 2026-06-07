import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import { FaUpload, FaTrash, FaImage, FaVideo, FaFileAlt } from 'react-icons/fa';
import { galleryService } from '../services/api';
import toast from 'react-hot-toast';

function Gallery() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    category: 'testimonial',
    description: '',
  });

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const response = await galleryService.getAll();
      setMedia(response.data.data || []);
      setError('');
    } catch (error) {
      console.error('Load media error:', error);
      setError('Failed to load gallery. Please make sure the backend is running.');
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      // Auto-fill title from filename if empty
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
        toast.success('Media uploaded successfully!');
        setShowModal(false);
        setSelectedFile(null);
        setFormData({ title: '', category: 'testimonial', description: '' });
        await loadMedia(); // Refresh the gallery
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Upload failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await galleryService.delete(id);
        toast.success('Deleted successfully');
        await loadMedia();
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Delete failed');
      }
    }
  };

  const getFileIcon = (type) => {
    if (type === 'image') return <FaImage className="text-primary" />;
    if (type === 'video') return <FaVideo className="text-danger" />;
    return <FaFileAlt className="text-secondary" />;
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

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error Loading Gallery</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={loadMedia}>
              Retry
            </Button>
          </div>
        </Alert>
      )}

      <Row>
        {media.length === 0 && !error ? (
          <Col xs={12}>
            <div className="text-center py-5">
              <FaImage className="fa-3x text-muted mb-3" />
              <h5 className="text-muted">No Media Yet</h5>
              <p className="text-muted">Click the upload button to add images or videos to your gallery.</p>
            </div>
          </Col>
        ) : (
          media.map((item) => (
            <Col md={4} lg={3} key={item._id} className="mb-4">
              <Card className="h-100 shadow-sm border-0 hover-shadow">
                <div className="position-relative">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      className="card-img-top"
                      alt={item.title}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                      }}
                    />
                  ) : item.type === 'video' ? (
                    <video
                      src={item.url}
                      className="card-img-top"
                      style={{ height: '200px', objectFit: 'cover' }}
                      controls
                    />
                  ) : (
                    <div className="d-flex align-items-center justify-content-center bg-light" style={{ height: '200px' }}>
                      {getFileIcon(item.type)}
                      <span className="ms-2">{item.type}</span>
                    </div>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    className="position-absolute top-0 end-0 m-2"
                    onClick={() => handleDelete(item._id, item.title)}
                  >
                    <FaTrash />
                  </Button>
                </div>
                <Card.Body>
                  <Card.Title className="fs-6">{item.title}</Card.Title>
                  <Card.Text className="small text-muted">
                    <span className="badge bg-secondary me-1">{item.category}</span>
                    {item.type}
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
                placeholder="Enter a title for this media"
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
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File * (Image or Video - Max 50MB)</Form.Label>
              <Form.Control
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                required
              />
              <Form.Text className="text-muted">
                Supported formats: JPG, PNG, GIF, MP4, MOV, AVI
              </Form.Text>
            </Form.Group>

            {selectedFile && (
              <Alert variant="info" className="mb-0">
                <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => {
              setShowModal(false);
              setError('');
              setSelectedFile(null);
              setFormData({ title: '', category: 'testimonial', description: '' });
            }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={uploading || !selectedFile}>
              {uploading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="me-2" />
                  Upload
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style jsx>{`
        .hover-shadow {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .hover-shadow:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default Gallery;
