import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/axios';

export function useProjects(params = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/projects', { params: paramsRef.current });
      setProjects(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-run when params change by comparing serialised value
  const paramsKey = JSON.stringify(params);
  useEffect(() => { fetch(); }, [fetch, paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { projects, loading, error, refetch: fetch };
}

export function useProject(id) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { project, loading, error, refetch: fetch };
}
