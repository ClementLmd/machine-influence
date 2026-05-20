import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import { createClient } from '@supabase/supabase-js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface TypingData {
  conversationId: string;
  isTyping: boolean;
}

interface SendMessageData {
  conversationId: string;
  content: string;
}

interface JoinConversationData {
  conversationId: string;
}

@WebSocketGateway({
  namespace: 'messages',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );

  constructor(
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token as string;
      if (!token) {
        client.disconnect();
        return;
      }

      // Vérifier le token avec Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        client.disconnect();
        return;
      }

      // Récupérer l'utilisateur dans notre base
      const dbUser = await this.prisma.user.findUnique({
        where: { supabaseId: user.id },
        select: { id: true },
      });

      if (!dbUser) {
        client.disconnect();
        return;
      }

      client.userId = dbUser.id;
      console.log(`Client connected: ${client.id} (userId: ${client.userId})`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinConversationData,
  ) {
    if (!client.userId) {
      return;
    }

    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: data.conversationId,
        userId: client.userId,
      },
    });

    if (!participation) {
      return;
    }

    // Joindre la room de la conversation
    await client.join(`conversation-${data.conversationId}`);
    console.log(
      `User ${client.userId} joined conversation ${data.conversationId}`,
    );
  }

  @SubscribeMessage('leave-conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinConversationData,
  ) {
    await client.leave(`conversation-${data.conversationId}`);
    console.log(
      `User ${client.userId} left conversation ${data.conversationId}`,
    );
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageData,
  ) {
    if (!client.userId) {
      return;
    }

    try {
      const message = await this.messagesService.sendMessage(
        data.conversationId,
        client.userId,
        data.content,
      );

      // Broadcast le message à tous les participants de la conversation
      this.server
        .to(`conversation-${data.conversationId}`)
        .emit('message-sent', message);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingData,
  ) {
    if (!client.userId) {
      return;
    }

    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId: data.conversationId,
        userId: client.userId,
      },
    });

    if (!participation) {
      return;
    }

    // Broadcast l'indicateur de typing aux autres participants
    client.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: client.userId,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinConversationData,
  ) {
    if (!client.userId) {
      return;
    }

    try {
      await this.messagesService.markAsRead(data.conversationId, client.userId);

      // Notifier les autres participants que les messages ont été lus
      client.to(`conversation-${data.conversationId}`).emit('messages-read', {
        conversationId: data.conversationId,
        userId: client.userId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}
