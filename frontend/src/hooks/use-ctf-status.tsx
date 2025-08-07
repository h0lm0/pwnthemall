import { useState, useEffect } from 'react';
import axios from '@/lib/axios';

export interface CTFStatus {
  status: 'not_started' | 'active' | 'ended' | 'no_timing';
  is_active: boolean;
  is_started: boolean;
}

export function useCTFStatus() {
  const [ctfStatus, setCTFStatus] = useState<CTFStatus>({
    status: 'no_timing',
    is_active: true,
    is_started: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCTFStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<CTFStatus>('/api/ctf-status');
      setCTFStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch CTF status');
      // Default to allowing access if we can't determine status
      setCTFStatus({
        status: 'no_timing',
        is_active: true,
        is_started: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCTFStatus();
    
    // Refresh status every 30 seconds
    const interval = setInterval(fetchCTFStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    ctfStatus,
    loading,
    error,
    refreshStatus: fetchCTFStatus,
  };
}
