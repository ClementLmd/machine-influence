import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import type {
  ConversationWithLastMessage,
  MessageWithSender,
} from '@machine-influence/shared/types';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  async getConversationsForUser(
    userId: string,
  ): Promise<ConversationWithLastMessage[]> {
    // Récupérer toutes les conversations de l'utilisateur
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePicture: true,
                    role: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    profilePicture: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    return Promise.all(
      participations.map(async (participation) => {
        const { conversation } = participation;
        const lastMessageRaw = conversation.messages[0];
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== userId,
        )?.user;

        if (!otherParticipant) {
          throw new Error('Other participant not found');
        }

        let lastMessage: MessageWithSender | null = null;
        if (lastMessageRaw) {
          try {
            const decryptedContent = this.encryption.decrypt(
              lastMessageRaw.encryptedContent,
              lastMessageRaw.iv,
              lastMessageRaw.authTag,
            );
            lastMessage = {
              id: lastMessageRaw.id,
              conversationId: lastMessageRaw.conversationId,
              senderId: lastMessageRaw.senderId,
              content: decryptedContent,
              createdAt: lastMessageRaw.createdAt.toISOString(),
              sender: lastMessageRaw.sender,
            };
          } catch (error) {
            console.error('Failed to decrypt message:', error);
          }
        }

        // Compter les messages non lus
        const userParticipation = conversation.participants.find(
          (p) => p.userId === userId,
        );
        const lastReadAt = userParticipation?.lastReadAt;

        // Compter les messages non lus avec une requête séparée
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: userId },
            createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
          },
        });

        return {
          id: conversation.id,
          createdAt: conversation.createdAt.toISOString(),
          updatedAt: conversation.updatedAt.toISOString(),
          participants: conversation.participants.map((p) => ({
            id: p.id,
            conversationId: p.conversationId,
            userId: p.userId,
            lastReadAt: p.lastReadAt?.toISOString() || null,
            createdAt: p.createdAt.toISOString(),
            user: p.user,
          })),
          lastMessage,
          unreadCount,
          otherParticipant,
        };
      }),
    );
  }

  async getOrCreateConversation(
    userId: string,
    recipientId: string,
  ): Promise<{ id: string; isNew: boolean }> {
    if (userId === recipientId) {
      throw new BadRequestException('Cannot start conversation with yourself');
    }

    // Vérifier que les deux utilisateurs existent
    const [user, recipient] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.user.findUnique({ where: { id: recipientId } }),
    ]);

    if (!user || !recipient) {
      throw new NotFoundException('User not found');
    }

    // Vérifier si une conversation existe déjà entre ces deux utilisateurs
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { userId },
            },
          },
          {
            participants: {
              some: { userId: recipientId },
            },
          },
        ],
      },
      select: { id: true },
    });

    if (existingConversation) {
      return { id: existingConversation.id, isNew: false };
    }

    // Créer une nouvelle conversation
    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      select: { id: true },
    });

    return { id: conversation.id, isNew: true };
  }

  async getMessagesForConversation(
    conversationId: string,
    userId: string,
  ): Promise<MessageWithSender[]> {
    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participation) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    // Récupérer tous les messages
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Déchiffrer les messages
    return messages.map((message) => {
      try {
        const decryptedContent = this.encryption.decrypt(
          message.encryptedContent,
          message.iv,
          message.authTag,
        );
        return {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: decryptedContent,
          createdAt: message.createdAt.toISOString(),
          sender: message.sender,
        };
      } catch (error) {
        console.error('Failed to decrypt message:', error);
        return {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: '[Message could not be decrypted]',
          createdAt: message.createdAt.toISOString(),
          sender: message.sender,
        };
      }
    });
  }

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
  ): Promise<MessageWithSender> {
    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: senderId,
      },
    });

    if (!participation) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    // Chiffrer le message
    const { encryptedContent, iv, authTag } = this.encryption.encrypt(content);

    // Créer le message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        encryptedContent,
        iv,
        authTag,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePicture: true,
            role: true,
          },
        },
      },
    });

    // Mettre à jour le timestamp de la conversation
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content,
      createdAt: message.createdAt.toISOString(),
      sender: message.sender,
    };
  }

  async markAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Vérifier que l'utilisateur est participant de la conversation
    const participation = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
    });

    if (!participation) {
      throw new ForbiddenException(
        'You are not a participant of this conversation',
      );
    }

    // Mettre à jour le lastReadAt
    await this.prisma.conversationParticipant.update({
      where: { id: participation.id },
      data: { lastReadAt: new Date() },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              where: {
                senderId: { not: userId },
              },
              select: {
                createdAt: true,
              },
            },
          },
        },
      },
    });

    let totalUnread = 0;
    for (const participation of participations) {
      const lastReadAt = participation.lastReadAt;
      const unreadInConv = participation.conversation.messages.filter(
        (m) => !lastReadAt || m.createdAt > lastReadAt,
      ).length;
      totalUnread += unreadInConv;
    }

    return totalUnread;
  }
}
