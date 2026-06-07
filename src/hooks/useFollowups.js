import { useState, useEffect, useCallback } from 'react';
import { followupService } from '../services/api';
import toast from 'react-hot-toast';

export const useFollowups = () => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ page: 1, limit: 20 });

  const loadFollowups = useCallback(async () => {
    setLoading(true);
    try {
      const response = await followupService.getAll(filters);
      setFollowups(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadFollowups();
  }, [loadFollowups]);

  const createFollowup = async (data) => {
    try {
      const response = await followupService.create(data);
      toast.success('Follow-up created');
      loadFollowups();
      return response.data;
    } catch (error) {
      toast.error('Failed to create follow-up');
      throw error;
    }
  };

  const updateFollowup = async (id, data) => {
    try {
      const response = await followupService.update(id, data);
      toast.success('Follow-up updated');
      loadFollowups();
      return response.data;
    } catch (error) {
      toast.error('Failed to update follow-up');
      throw error;
    }
  };

  const deleteFollowup = async (id) => {
    try {
      await followupService.delete(id);
      toast.success('Follow-up deleted');
      loadFollowups();
    } catch (error) {
      toast.error('Failed to delete follow-up');
      throw error;
    }
  };

  const whatsappClick = async (id) => {
    try {
      const response = await followupService.whatsappClick(id);
      window.open(response.data.whatsappLink, '_blank');
      return response.data;
    } catch (error) {
      toast.error('Failed to open WhatsApp');
      throw error;
    }
  };

  const markFollowed = async (id, notes) => {
    try {
      const response = await followupService.markFollowed(id, notes);
      toast.success('Marked as followed');
      loadFollowups();
      return response.data;
    } catch (error) {
      toast.error('Failed to mark as followed');
      throw error;
    }
  };

  const convert = async (id, data) => {
    try {
      const response = await followupService.convert(id, data);
      toast.success('Lead converted!');
      loadFollowups();
      return response.data;
    } catch (error) {
      toast.error('Failed to convert lead');
      throw error;
    }
  };

  return {
    followups,
    loading,
    total,
    filters,
    setFilters,
    createFollowup,
    updateFollowup,
    deleteFollowup,
    whatsappClick,
    markFollowed,
    convert,
    reload: loadFollowups,
  };
};
