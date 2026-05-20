import type { UserBasic } from './user';
import type { Message } from './message';

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt: string | null;
  createdAt: string;
}

export interface ConversationWithParticipants extends Conversation {
  participants: (ConversationParticipant & { user: UserBasic })[];
}

export interface ConversationWithLastMessage extends ConversationWithParticipants {
  lastMessage: Message | null;
  unreadCount: number;
  otherParticipant: UserBasic;
}
