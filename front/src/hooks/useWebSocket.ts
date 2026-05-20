import { useEffect, useRef } from 'react';
import { useMessagesSocket } from '@/contexts/MessagesSocketContext';
import type { MessageWithSender } from '@machine-influence/shared/types';

interface UseWebSocketCallbacks {
  onMessageSent?: (message: MessageWithSender) => void;
  onUserTyping?: (data: { conversationId: string; userId: string; isTyping: boolean }) => void;
  onMessagesRead?: (data: { conversationId: string; userId: string }) => void;
}

export function useWebSocket(callbacks?: UseWebSocketCallbacks) {
  const {
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
  } = useMessagesSocket();

  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    return subscribeToMessages((message) => {
      callbacksRef.current?.onMessageSent?.(message);
    });
  }, [subscribeToMessages]);

  useEffect(() => {
    return subscribeToTyping((data) => {
      callbacksRef.current?.onUserTyping?.(data);
    });
  }, [subscribeToTyping]);

  useEffect(() => {
    return subscribeToMessagesRead((data) => {
      callbacksRef.current?.onMessagesRead?.(data);
    });
  }, [subscribeToMessagesRead]);

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
