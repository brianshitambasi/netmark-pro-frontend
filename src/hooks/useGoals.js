import { useState, useEffect, useCallback } from 'react';
import { goalService } from '../services/api';
import toast from 'react-hot-toast';

export const useGoals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    try {
      const response = await goalService.getAll();
      setGoals(response.data.data || []);
    } catch (error) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const createGoal = async (data) => {
    try {
      const response = await goalService.create(data);
      toast.success('Goal created');
      loadGoals();
      return response.data;
    } catch (error) {
      toast.error('Failed to create goal');
      throw error;
    }
  };

  const updateGoal = async (id, data) => {
    try {
      const response = await goalService.update(id, data);
      toast.success('Goal updated');
      loadGoals();
      return response.data;
    } catch (error) {
      toast.error('Failed to update goal');
      throw error;
    }
  };

  const deleteGoal = async (id) => {
    try {
      await goalService.delete(id);
      toast.success('Goal deleted');
      loadGoals();
    } catch (error) {
      toast.error('Failed to delete goal');
      throw error;
    }
  };

  const updateProgress = async (id, current) => {
    try {
      const response = await goalService.updateProgress(id, current);
      toast.success('Progress updated');
      loadGoals();
      return response.data;
    } catch (error) {
      toast.error('Failed to update progress');
      throw error;
    }
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    reload: loadGoals,
  };
};
