import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/axios';

export function useSubmissions(projectId, params = {}) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/projects/${projectId}/submissions`, { params: paramsRef.current });
      setSubmissions(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const paramsKey = JSON.stringify(params);
  useEffect(() => { fetch(); }, [fetch, paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { submissions, setSubmissions, loading, error, refetch: fetch };
}

export function useSubmission(id) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/submissions/${id}`);
      setSubmission(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submission');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { submission, setSubmission, loading, error, refetch: fetch };
}
