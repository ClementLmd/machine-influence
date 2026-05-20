"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { useUnreadCount } from '@/contexts/UnreadCountContext';
import type { MessageWithSender } from '@machine-influence/shared/types';

type MessageListener = (message: MessageWithSender) => void;
type TypingListener = (data: {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}) => void;
type MessagesReadListener = (data: {
  conversationId: string;
  userId: string;
}) => void;

interface MessagesSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  subscribeToMessages: (listener: MessageListener) => () => void;
  subscribeToTyping: (listener: TypingListener) => () => void;
  subscribeToMessagesRead: (listener: MessagesReadListener) => () => void;
}

const MessagesSocketContext = createContext<MessagesSocketContextType | undefined>(
  undefined,
);

export function MessagesSocketProvider({ children }: { children: React.ReactNode }) {
  const { refreshUnreadCount } = useUnreadCount();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const currentUserIdRef = useRef<string | null>(null);
  const refreshUnreadCountRef = useRef(refreshUnreadCount);
  const messageListenersRef = useRef(new Set<MessageListener>());
  const typingListenersRef = useRef(new Set<TypingListener>());
  const messagesReadListenersRef = useRef(new Set<MessagesReadListener>());
  const joinedConversationIdsRef = useRef<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    refreshUnreadCountRef.current = refreshUnreadCount;
  }, [refreshUnreadCount]);

  const joinAllConversationRooms = useCallback(async (sock: Socket) => {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl || !sock.connected) return;

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${apiBaseUrl}/conversations`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      if (!res.ok) return;

      const conversations = (await res.json()) as { id: string }[];
      for (const { id } of conversations) {
        if (!joinedConversationIdsRef.current.has(id)) {
          sock.emit('join-conversation', { conversationId: id });
          joinedConversationIdsRef.current.add(id);
        }
      }
    } catch (error) {
      console.error('Error joining conversation rooms:', error);
    }
  }, []);

  useEffect(() => {
    let socketInstance: Socket | null = null;
    let cancelled = false;

    async function connectSocket() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          currentUserIdRef.current = null;
          return;
        }

        const apiUrl = getApiBaseUrl();
        if (!apiUrl) return;

        const meRes = await fetch(`${apiUrl}/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (meRes.ok) {
          const user = (await meRes.json()) as { id: string };
          if (!cancelled) currentUserIdRef.current = user.id;
        }

        const baseUrl = apiUrl.replace('/api', '');
        socketInstance = io(`${baseUrl}/messages`, {
          auth: { token: session.access_token },
          transports: ['websocket', 'polling'],
        });

        socketRef.current = socketInstance;

        socketInstance.on('connect', () => {
          setIsConnected(true);
          void joinAllConversationRooms(socketInstance!);
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
          joinedConversationIdsRef.current.clear();
        });

        socketInstance.on('message-sent', (message: MessageWithSender) => {
          const userId = currentUserIdRef.current;
          const isFromOther = userId !== null && message.senderId !== userId;

          if (isFromOther) {
            void refreshUnreadCountRef.current();
          }

          for (const listener of messageListenersRef.current) {
            listener(message);
          }
        });

        socketInstance.on(
          'user-typing',
          (data: { conversationId: string; userId: string; isTyping: boolean }) => {
            for (const listener of typingListenersRef.current) {
              listener(data);
            }
          },
        );

        socketInstance.on(
          'messages-read',
          (data: { conversationId: string; userId: string }) => {
            for (const listener of messagesReadListenersRef.current) {
              listener(data);
            }
          },
        );

        socketInstance.on('connect_error', (error: Error) => {
          console.error('WebSocket connection error:', error);
        });

        if (!cancelled) setSocket(socketInstance);
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    }

    void connectSocket();

    const { data: authListener } = createClient().auth.onAuthStateChange((_event, session) => {
      if (!session && socketInstance) {
        socketInstance.disconnect();
        socketRef.current = null;
        currentUserIdRef.current = null;
        setSocket(null);
        setIsConnected(false);
        joinedConversationIdsRef.current.clear();
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
      if (socketInstance) {
        socketInstance.disconnect();
      }
      socketRef.current = null;
    };
  }, [joinAllConversationRooms]);

  useEffect(() => {
    if (!isConnected || !socketRef.current) return;

    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        void joinAllConversationRooms(socketRef.current);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isConnected, joinAllConversationRooms]);

  const joinConversation = useCallback((conversationId: string) => {
    const sock = socketRef.current;
    if (!sock?.connected) return;
    if (joinedConversationIdsRef.current.has(conversationId)) return;
    sock.emit('join-conversation', { conversationId });
    joinedConversationIdsRef.current.add(conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('send-message', { conversationId, content });
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('leave-conversation', { conversationId });
    joinedConversationIdsRef.current.delete(conversationId);
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('mark-read', { conversationId });
  }, []);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('typing', { conversationId, isTyping });
  }, []);

  const subscribeToMessages = useCallback((listener: MessageListener) => {
    messageListenersRef.current.add(listener);
    return () => {
      messageListenersRef.current.delete(listener);
    };
  }, []);

  const subscribeToTyping = useCallback((listener: TypingListener) => {
    typingListenersRef.current.add(listener);
    return () => {
      typingListenersRef.current.delete(listener);
    };
  }, []);

  const subscribeToMessagesRead = useCallback((listener: MessagesReadListener) => {
    messagesReadListenersRef.current.add(listener);
    return () => {
      messagesReadListenersRef.current.delete(listener);
    };
  }, []);

  return (
    <MessagesSocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage,
        joinConversation,
        leaveConversation,
        markAsRead,
        setTyping,
        subscribeToMessages,
        subscribeToTyping,
        subscribeToMessagesRead,
      }}
    >
      {children}
    </MessagesSocketContext.Provider>
  );
}

export function useMessagesSocket() {
  const context = useContext(MessagesSocketContext);
  if (context === undefined) {
    throw new Error('useMessagesSocket must be used within a MessagesSocketProvider');
  }
  return context;
}
