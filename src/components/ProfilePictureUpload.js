import React, { useState, useRef } from 'react';
import { Button, Spinner, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaCamera, FaTrash, FaUpload, FaSpinner } from 'react-icons/fa';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

function ProfilePictureUpload({ currentPicture, onUpdate, userName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image (JPEG, PNG, GIF, or WebP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      const response = await authService.updateProfilePicture(formData);
      if (response.data.success) {
        toast.success('Profile picture updated successfully');
        if (onUpdate) onUpdate(response.data.data.profilePicture);
        setPreview(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload profile picture');
      toast.error('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) return;

    setLoading(true);
    try {
      const response = await authService.removeProfilePicture();
      if (response.data.success) {
        toast.success('Profile picture removed');
        if (onUpdate) onUpdate('');
        setPreview(null);
      }
    } catch (err) {
      toast.error('Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    if (!userName) return 'U';
    return userName.charAt(0).toUpperCase();
  };

  return (
    <div className="text-center">
      <div className="position-relative d-inline-block">
        <div 
          className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto overflow-hidden"
          style={{ width: '120px', height: '120px', fontSize: '48px', fontWeight: 'bold' }}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : currentPicture ? (
            <img 
              src={currentPicture} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.textContent = getInitials();
              }}
            />
          ) : (
            getInitials()
          )}
        </div>

        <OverlayTrigger
          placement="bottom"
          overlay={<Tooltip>Change profile picture</Tooltip>}
        >
          <button 
            className="btn btn-light rounded-circle position-absolute bottom-0 end-0 border shadow-sm"
            style={{ transform: 'translate(5px, 5px)', width: '36px', height: '36px' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? <FaSpinner className="spin" /> : <FaCamera size={14} />}
          </button>
        </OverlayTrigger>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {loading && (
        <div className="mt-2">
          <Spinner animation="border" size="sm" />
          <span className="ms-2 small text-muted">Uploading...</span>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mt-2 small">
          {error}
        </Alert>
      )}

      {currentPicture && !loading && (
        <div className="mt-2 d-flex justify-content-center gap-2">
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={handleRemove}
            disabled={loading}
          >
            <FaTrash className="me-1" /> Remove
          </Button>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            <FaUpload className="me-1" /> Change
          </Button>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default ProfilePictureUpload;
