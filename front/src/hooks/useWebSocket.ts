import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type { MessageWithSender } from '@machine-influence/shared/types';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendMessage: (conversationId: string, content: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  markAsRead: (conversationId: string) => void;
  setTyping: (conversationId: string, isTyping: boolean) => void;
}

interface UseWebSocketCallbacks {
  onMessageSent?: (message: MessageWithSender) => void;
  onUserTyping?: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  onMessagesRead?: (data: { conversationId: string; userId: string }) => void;
}

export function useWebSocket(callbacks?: UseWebSocketCallbacks): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef(callbacks);

  // Garder les callbacks à jour
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    async function connectSocket() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          console.warn('No session, cannot connect to WebSocket');
          return;
        }

        const apiUrl = getApiBaseUrl();
        if (!apiUrl) {
          console.error('API URL not configured');
          return;
        }

        // Extraire l'URL de base sans le /api
        const baseUrl = apiUrl.replace('/api', '');

        socketInstance = io(`${baseUrl}/messages`, {
          auth: {
            token: session.access_token,
          },
          transports: ['websocket', 'polling'],
        });

        socketInstance.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        });

        socketInstance.on('message-sent', (message: MessageWithSender) => {
          callbacksRef.current?.onMessageSent?.(message);
        });

        socketInstance.on('user-typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
          callbacksRef.current?.onUserTyping?.(data);
        });

        socketInstance.on('messages-read', (data: { conversationId: string; userId: string }) => {
          callbacksRef.current?.onMessagesRead?.(data);
        });

        socketInstance.on('connect_error', (error: Error) => {
          console.error('WebSocket connection error:', error);
        });

        setSocket(socketInstance);
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    }

    void connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    if (!socket) return;
    socket.emit('send-message', { conversationId, content });
  }, [socket]);

  const joinConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('join-conversation', { conversationId });
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('leave-conversation', { conversationId });
  }, [socket]);

  const markAsRead = useCallback((conversationId: string) => {
    if (!socket) return;
    socket.emit('mark-read', { conversationId });
  }, [socket]);

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!socket) return;
    socket.emit('typing', { conversationId, isTyping });
  }, [socket]);

  return {
    socket,
    isConnected,
    sendMessage,
    joinConversation,
    leaveConversation,
    markAsRead,
    setTyping,
  };
}
