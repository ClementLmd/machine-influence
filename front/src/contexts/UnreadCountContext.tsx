"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

interface UnreadCountContextType {
  unreadCount: number;
  loading: boolean;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: (amount: number) => void;
  incrementUnreadCount: (amount: number) => void;
  setUnreadCount: (count: number) => void;
}

const UnreadCountContext = createContext<UnreadCountContextType | undefined>(undefined);

export function UnreadCountProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      if (!apiBaseUrl) return;

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setUnreadCount(0);
        return;
      }

      const res = await fetch(`${apiBaseUrl}/conversations/unread-count`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        setUnreadCount(0);
        return;
      }

      const data = (await res.json()) as { count: number };
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const decrementUnreadCount = useCallback((amount: number) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  const incrementUnreadCount = useCallback((amount: number) => {
    setUnreadCount((prev) => prev + amount);
  }, []);

  const setUnreadCountDirectly = useCallback((count: number) => {
    setUnreadCount(count);
  }, []);

  useEffect(() => {
    void fetchUnreadCount();

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(() => {
      void fetchUnreadCount();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  return (
    <UnreadCountContext.Provider
      value={{
        unreadCount,
        loading,
        refreshUnreadCount: fetchUnreadCount,
        decrementUnreadCount,
        incrementUnreadCount,
        setUnreadCount: setUnreadCountDirectly,
      }}
    >
      {children}
    </UnreadCountContext.Provider>
  );
}

export function useUnreadCount() {
  const context = useContext(UnreadCountContext);
  if (context === undefined) {
    throw new Error('useUnreadCount must be used within an UnreadCountProvider');
  }
  return context;
}
