"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/messages/ConversationList';
import { ConversationHeader } from '@/components/messages/ConversationHeader';
import { MessageThread } from '@/components/messages/MessageThread';
import { MessageInput } from '@/components/messages/MessageInput';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useUnreadCount } from '@/contexts/UnreadCountContext';
import { getApiBaseUrl } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import type {
  ConversationWithLastMessage,
  MessageWithSender,
} from '@machine-influence/shared/types';

function MessagesPageContent() {
  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('conversation');
  const { setUnreadCount } = useUnreadCount();
  const [conversations, setConversations] = useState<ConversationWithLastMessage[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedConversationIdRef = useRef<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const markAsReadSocketRef = useRef<(conversationId: string) => void>(() => {});
  const urlConversationAppliedRef = useRef(false);

  selectedConversationIdRef.current = selectedConversationId;
  currentUserIdRef.current = currentUserId;

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      markAsReadSocketRef.current(conversationId);

      if (!apiBaseUrl) return;

      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;

        await fetch(`${apiBaseUrl}/conversations/${conversationId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
      } catch (e) {
        console.error('Error marking conversation as read:', e);
      }
    },
    [apiBaseUrl],
  );

  const conversationIdsKey = useMemo(
    () =>
      conversations
        .map((c) => c.id)
        .sort()
        .join(','),
    [conversations],
  );

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const { isConnected, sendMessage, joinConversation, markAsRead, setTyping } =
    useWebSocket({
      onMessageSent: (message) => {
        const activeConversationId = selectedConversationIdRef.current;
        const userId = currentUserIdRef.current;
        const isActiveConversation = message.conversationId === activeConversationId;
        const isFromOther = userId !== null && message.senderId !== userId;

        if (isActiveConversation) {
          setMessages((prev) => [...prev, message]);
        }

        if (isActiveConversation && isFromOther) {
          void markConversationAsRead(message.conversationId);
        }

        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.id === message.conversationId) {
              return {
                ...conv,
                lastMessage: message,
                updatedAt: message.createdAt,
                unreadCount:
                  message.senderId === userId
                    ? conv.unreadCount
                    : isActiveConversation
                      ? 0
                      : conv.unreadCount + 1,
              };
            }
            return conv;
          });

          return updated.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );
        });
      },
      onUserTyping: (data) => {
        if (data.conversationId !== selectedConversationIdRef.current) return;

        if (data.isTyping) {
          setTypingUserId(data.userId);
        } else {
          setTypingUserId(null);
        }
      },
      onMessagesRead: (data) => {
        if (data.conversationId === selectedConversationIdRef.current) {
          console.log('Messages read by:', data.userId);
        }
      },
    });

  markAsReadSocketRef.current = markAsRead;

  // Charger l'utilisateur courant
  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      try {
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL manquant');
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Vous devez être connecté');
        }

        const res = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Impossible de charger le profil');

        const user = await res.json();
        if (cancelled) return;

        setCurrentUserId(user.id);
      } catch (e) {
        console.error('Error loading user:', e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors du chargement du profil');
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  // Charger les conversations
  useEffect(() => {
    if (!currentUserId) return;

    let cancelled = false;

    async function loadConversations() {
      try {
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL manquant');
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Vous devez être connecté');
        }

        const res = await fetch(`${apiBaseUrl}/conversations`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Impossible de charger les conversations');

        const data = (await res.json()) as ConversationWithLastMessage[];
        if (cancelled) return;

        // Trier les conversations par date de dernier message (le plus récent en premier)
        const sortedConversations = data.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        
        setConversations(sortedConversations);

        // Synchroniser le compteur global avec la somme des compteurs locaux
        const totalUnread = data.reduce((sum, conv) => sum + conv.unreadCount, 0);
        setUnreadCount(totalUnread);
      } catch (e) {
        console.error('Error loading conversations:', e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors du chargement des conversations');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadConversations();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, currentUserId, setUnreadCount]);

  // Synchroniser le compteur global avec la somme des compteurs locaux des conversations
  useEffect(() => {
    if (conversations.length > 0) {
      const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
      setUnreadCount(totalUnread);
    }
  }, [conversations, setUnreadCount]);

  // Appliquer le paramètre URL une seule fois au chargement initial
  useEffect(() => {
    if (urlConversationAppliedRef.current) return;
    if (!conversationIdFromUrl || conversations.length === 0) return;

    const conversationExists = conversations.some((c) => c.id === conversationIdFromUrl);
    if (conversationExists) {
      setSelectedConversationId(conversationIdFromUrl);
      urlConversationAppliedRef.current = true;
    }
  }, [conversationIdFromUrl, conversations]);

  // S'assurer que les nouvelles conversations sont rejointes (le provider global gère le reste)
  useEffect(() => {
    if (!isConnected || !conversationIdsKey) return;
    for (const id of conversationIdsKey.split(',')) {
      joinConversation(id);
    }
  }, [conversationIdsKey, isConnected, joinConversation]);

  // Charger les messages d'une conversation
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      setMessagesLoading(true);
      try {
        if (!apiBaseUrl) {
          throw new Error('NEXT_PUBLIC_API_URL manquant');
        }

        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Vous devez être connecté');
        }

        const res = await fetch(`${apiBaseUrl}/conversations/${selectedConversationId}/messages`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });

        if (!res.ok) throw new Error('Impossible de charger les messages');

        const data = (await res.json()) as MessageWithSender[];
        if (cancelled) return;

        setMessages(data);

        if (selectedConversationId) {
          await markConversationAsRead(selectedConversationId);
        }

        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );
      } catch (e) {
        console.error('Error loading messages:', e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erreur lors du chargement des messages');
        }
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    }

    void loadMessages();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, selectedConversationId, markConversationAsRead]);

  const handleSendMessage = (content: string) => {
    if (!selectedConversationId || !isConnected) return;

    // Envoyer via WebSocket
    sendMessage(selectedConversationId, content);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!selectedConversationId) return;
    setTyping(selectedConversationId, isTyping);
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    router.replace(`/messages?conversation=${id}`, { scroll: false });
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
    router.replace('/messages', { scroll: false });
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Chargement des conversations...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!currentUserId) {
    return null;
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-neutral-50 dark:bg-neutral-900">
      {/* Liste des conversations - cachée sur mobile si une conversation est sélectionnée */}
      <div
        className={[
          'w-full border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 md:w-80',
          selectedConversationId ? 'hidden md:block' : 'block',
        ].join(' ')}
      >
        <ConversationList
          conversations={conversations}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          currentUserId={currentUserId}
        />
      </div>

      {/* Thread de messages - affiché uniquement si une conversation est sélectionnée */}
      <div
        className={[
          'flex flex-1 flex-col bg-white dark:bg-neutral-950',
          selectedConversationId ? 'flex' : 'hidden md:flex',
        ].join(' ')}
      >
        {selectedConversation ? (
          <>
            <ConversationHeader
              otherParticipant={selectedConversation.otherParticipant}
              onBack={handleBackToList}
            />
            {messagesLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Chargement des messages...
                </p>
              </div>
            ) : (
              <MessageThread 
                messages={messages} 
                currentUserId={currentUserId}
                typingUserId={typingUserId}
                otherParticipant={selectedConversation.otherParticipant}
              />
            )}
            <MessageInput
              key={selectedConversationId}
              onSend={handleSendMessage}
              onTyping={handleTyping}
              disabled={!isConnected}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <p className="text-neutral-600 dark:text-neutral-400">
            Chargement...
          </p>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}

