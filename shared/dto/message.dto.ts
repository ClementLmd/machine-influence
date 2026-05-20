export interface CreateMessageDto {
  content: string;
}

export interface UpdateReadStatusDto {
  messageId: string;
}

export interface StartConversationDto {
  recipientId: string;
}
