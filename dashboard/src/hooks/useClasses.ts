import { useState, useEffect, useCallback } from 'react';
import { classService, type ClassItem } from '../services/classService';
import { useToast } from '../context/ToastContext';

export const useClasses = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await classService.getClasses();
      setClasses(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch classes');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const createClass = async (className: string) => {
    try {
      const newClass = await classService.createClass(className);
      setClasses((prev) => [...prev, newClass]);
      toast.success('Class created successfully');
      return newClass;
    } catch (error: any) {
      toast.error(error.message || 'Failed to create class');
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      await classService.deleteClass(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
      toast.success('Class deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class');
      throw error;
    }
  };

  return {
    classes,
    isLoading,
    fetchClasses,
    createClass,
    deleteClass,
  };
};
