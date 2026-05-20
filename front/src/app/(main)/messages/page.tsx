"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const { isConnected, sendMessage, joinConversation, leaveConversation, markAsRead, setTyping } =
    useWebSocket({
      onMessageSent: (message) => {
        // Ajouter le message à la liste si c'est pour la conversation active
        if (message.conversationId === selectedConversationId) {
          setMessages((prev) => [...prev, message]);
        }

        // Mettre à jour la liste des conversations et trier par date de dernier message
        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.id === message.conversationId) {
              return {
                ...conv,
                lastMessage: message,
                updatedAt: message.createdAt,
                unreadCount:
                  message.senderId === currentUserId
                    ? conv.unreadCount
                    : conv.id === selectedConversationId
                      ? 0 // L'utilisateur regarde actuellement cette conversation
                      : conv.unreadCount + 1,
              };
            }
            return conv;
          });
          
          // Trier par date de dernier message (le plus récent en premier)
          return updated.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        });
      },
      onUserTyping: (data) => {
        // Ne mettre à jour l'indicateur que si c'est pour la conversation active
        if (data.conversationId !== selectedConversationId) return;
        
        if (data.isTyping) {
          setTypingUserId(data.userId);
        } else {
          setTypingUserId(null);
        }
      },
      onMessagesRead: (data) => {
        if (data.conversationId === selectedConversationId) {
          // L'autre utilisateur a lu les messages
          console.log('Messages read by:', data.userId);
        }
      },
    });

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

  // Sélectionner automatiquement une conversation depuis l'URL
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const conversationExists = conversations.some((c) => c.id === conversationIdFromUrl);
      if (conversationExists) {
        setSelectedConversationId(conversationIdFromUrl);
      }
    }
  }, [conversationIdFromUrl, conversations]);

  // Rejoindre toutes les conversations pour recevoir les notifications en temps réel
  useEffect(() => {
    if (!isConnected || conversations.length === 0) return;

    // Rejoindre toutes les conversations
    conversations.forEach((conversation) => {
      joinConversation(conversation.id);
    });

    // Cleanup: quitter toutes les conversations
    return () => {
      conversations.forEach((conversation) => {
        leaveConversation(conversation.id);
      });
    };
  }, [conversations, isConnected, joinConversation, leaveConversation]);

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

        // Marquer les messages comme lus
        if (selectedConversationId) {
          markAsRead(selectedConversationId);
        }

        // Mettre à jour le compteur de non-lus localement (le compteur global sera automatiquement recalculé)
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === selectedConversationId ? { ...conv, unreadCount: 0 } : conv,
          ),
        );

        // Marquer comme lu via l'API
        await fetch(`${apiBaseUrl}/conversations/${selectedConversationId}/read`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
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
  }, [apiBaseUrl, selectedConversationId, markAsRead]);

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
  };

  const handleBackToList = () => {
    setSelectedConversationId(null);
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

