import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/badge';
import type { ConversationWithLastMessage } from '@machine-influence/shared/types';

interface ConversationListProps {
  conversations: ConversationWithLastMessage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  currentUserId: string;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'À l\'instant';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `Il y a ${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `Il y a ${diffInDays}j`;
  }

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Aucune conversation pour le moment.
        </p>
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500">
          Commencez une conversation depuis le profil d'un candidat ou une annonce.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Messages
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const { otherParticipant, lastMessage, unreadCount } = conversation;
          const isSelected = conversation.id === selectedId;

          const displayName =
            otherParticipant.firstName && otherParticipant.lastName
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : otherParticipant.email;

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={[
                'w-full border-b border-neutral-200 px-4 py-3 text-left transition-colors dark:border-neutral-800',
                isSelected
                  ? 'bg-neutral-100 dark:bg-neutral-900'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/40',
              ].join(' ')}
            >
              <div className="flex items-start gap-3">
                <Avatar
                  src={otherParticipant.profilePicture}
                  alt={displayName}
                  name={displayName}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium text-neutral-900 dark:text-white">
                      {displayName}
                    </p>
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-neutral-500 dark:text-neutral-400">
                        {formatRelativeTime(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p
                      className={[
                        'truncate text-sm',
                        unreadCount > 0
                          ? 'font-medium text-neutral-900 dark:text-white'
                          : 'text-neutral-600 dark:text-neutral-400',
                      ].join(' ')}
                    >
                      {lastMessage
                        ? lastMessage.senderId === currentUserId
                          ? `Vous: ${lastMessage.content}`
                          : lastMessage.content
                        : 'Aucun message'}
                    </p>
                    {unreadCount > 0 && (
                      <Badge className="shrink-0 bg-blue-600 text-white">
                        {unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
