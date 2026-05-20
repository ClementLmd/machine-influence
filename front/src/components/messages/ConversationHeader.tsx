import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft } from 'lucide-react';
import type { UserBasic } from '@machine-influence/shared/types';

interface ConversationHeaderProps {
  otherParticipant: UserBasic;
  onBack?: () => void;
  typingUserId?: string | null;
}

export function ConversationHeader({
  otherParticipant,
  onBack,
  typingUserId,
}: ConversationHeaderProps) {
  const displayName =
    otherParticipant.firstName && otherParticipant.lastName
      ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
      : otherParticipant.email;

  const isTyping = typingUserId === otherParticipant.id;

  return (
    <div className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white md:hidden"
          aria-label="Retour à la liste"
        >
          <ArrowLeft className="size-5" />
        </button>
      )}
      <Avatar
        src={otherParticipant.profilePicture}
        alt={displayName}
        name={displayName}
        className="size-10"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-neutral-900 dark:text-white">
          {displayName}
        </p>
        {isTyping && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            En train d'écrire...
          </p>
        )}
      </div>
    </div>
  );
}
