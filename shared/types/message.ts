import type { UserBasic } from './user';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface MessageWithSender extends Message {
  sender: UserBasic;
}
