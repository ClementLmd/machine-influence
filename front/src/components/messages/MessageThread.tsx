import { useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import type { MessageWithSender, UserBasic } from '@machine-influence/shared/types';

interface MessageThreadProps {
  messages: MessageWithSender[];
  currentUserId: string;
  typingUserId?: string | null;
  otherParticipant?: UserBasic;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  }

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

function shouldShowDateSeparator(
  currentMessage: MessageWithSender,
  previousMessage: MessageWithSender | null,
): boolean {
  if (!previousMessage) return true;

  const currentDate = new Date(currentMessage.createdAt).toDateString();
  const previousDate = new Date(previousMessage.createdAt).toDateString();

  return currentDate !== previousDate;
}

export function MessageThread({ messages, currentUserId, typingUserId, otherParticipant }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesLengthRef = useRef(messages.length);
  const isInitialLoadRef = useRef(true);
  
  const isTyping = typingUserId && otherParticipant && typingUserId === otherParticipant.id;
  const typingDisplayName = otherParticipant?.firstName && otherParticipant?.lastName
    ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
    : otherParticipant?.email || '';

  useEffect(() => {
    // Réinitialiser le flag si les messages sont vidés (changement de conversation)
    if (messages.length === 0) {
      isInitialLoadRef.current = true;
      previousMessagesLengthRef.current = 0;
      return;
    }

    // Scroll au premier chargement des messages
    if (isInitialLoadRef.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      isInitialLoadRef.current = false;
      previousMessagesLengthRef.current = messages.length;
      return;
    }

    // Scroller seulement si un nouveau message a été ajouté par l'utilisateur courant
    if (messages.length > previousMessagesLengthRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.senderId === currentUserId) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
    previousMessagesLengthRef.current = messages.length;
  }, [messages, currentUserId]);

  // Scroller quand l'indicateur de typing apparaît
  useEffect(() => {
    if (isTyping) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isTyping]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Aucun message pour le moment.
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
          Envoyez un message pour commencer la conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-4">
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId;
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
        const isLastMessage = index === messages.length - 1;

        const displayName =
          message.sender.firstName && message.sender.lastName
            ? `${message.sender.firstName} ${message.sender.lastName}`
            : message.sender.email;

        return (
          <div key={message.id} ref={isLastMessage ? messagesEndRef : null}>
            {showDateSeparator && (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {formatDate(message.createdAt)}
                </span>
              </div>
            )}
            <div
              className={[
                'mb-2 flex gap-2',
                isOwn ? 'justify-end' : 'justify-start',
              ].join(' ')}
            >
              {!isOwn && (
                <Avatar
                  src={message.sender.profilePicture}
                  alt={displayName}
                  name={displayName}
                  className="size-8 shrink-0"
                />
              )}
              <div
                className={[
                  'flex max-w-[70%] flex-col',
                  isOwn ? 'items-end' : 'items-start',
                ].join(' ')}
              >
                <div
                  className={[
                    'rounded-2xl px-4 py-2',
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white',
                  ].join(' ')}
                >
                  <p className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                  </p>
                </div>
                <span className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              {isOwn && (
                <Avatar
                  src={message.sender.profilePicture}
                  alt="Vous"
                  name={displayName}
                  className="size-8 shrink-0"
                />
              )}
            </div>
          </div>
        );
      })}
      {isTyping && (
        <div className="mb-2 px-2">
          <p className="text-sm italic text-neutral-500 dark:text-neutral-400">
            {typingDisplayName} est en train d&apos;écrire...
          </p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
