import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/apiClient';

export const useApi = (endpoint, options = {}) => {
  const {
    method = 'GET',
    immediate = true,
    onSuccess = null,
    onError = null,
    requireAuth = false,
    ...requestOptions
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);

  const execute = useCallback(async (customData = null, customEndpoint = null) => {
    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const url = customEndpoint || endpoint;
      const response = await apiClient.request(url, {
        method,
        data: customData || requestOptions.data,
        requireAuth,
        ...requestOptions,
      });

      setData(response);
      setStatus(200);
      
      if (onSuccess) {
        onSuccess(response);
      }

      return response;
    } catch (err) {
      setError(err);
      setStatus(err.status || 500);
      
      if (onError) {
        onError(err);
      }

    } finally {
      setLoading(false);
    }
  }, [endpoint, method, requestOptions, requireAuth, onSuccess, onError]);

  useEffect(() => {
    if (immediate && method === 'GET') {
      execute();
    }
  }, [immediate, method, execute]);

  return {
    data,
    loading,
    error,
    status,
    execute,
    setData,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
      setStatus(null);
    },
  };
};

export const useMutation = (endpoint, options = {}) => {
  const {
    method = 'POST',
    onSuccess = null,
    onError = null,
    requireAuth = false,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const mutate = useCallback(async (data = null, customEndpoint = null) => {
    setLoading(true);
    setError(null);

    try {
      const url = customEndpoint || endpoint;
      const response = await apiClient.request(url, {
        method,
        data,
        requireAuth,
      });

      setData(response);
      
      if (onSuccess) {
        onSuccess(response);
      }

      return response;
    } catch (err) {
      setError(err);
      
      if (onError) {
        onError(err);
      }

    } finally {
      setLoading(false);
    }
  }, [endpoint, method, requireAuth, onSuccess, onError]);

  return {
    mutate,
    loading,
    error,
    data,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
};