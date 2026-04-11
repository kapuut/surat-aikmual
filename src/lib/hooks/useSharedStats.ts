'use client';

import { useState, useEffect } from 'react';
import type { DashboardStats } from './types';

/**
 * Hook untuk mendapatkan dashboard statistics
 * Fetches stats dari API dan maintains state
 * Auto-refresh setiap 30 detik untuk real-time sync
 */
export function useSharedStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null);
        const response = await fetch('/api/stats', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Auto-refresh stats setiap 30 detik
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      setError(null);
      const response = await fetch('/api/stats', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Stats refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, error, refresh };
}
