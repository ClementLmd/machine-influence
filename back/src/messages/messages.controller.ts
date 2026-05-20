import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
import type {
  CreateMessageDto,
  StartConversationDto,
} from '@machine-influence/shared/dto';

@Controller('conversations')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async getConversations(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: req.user.supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.messagesService.getConversationsForUser(user.id);
  }

  @Post('start')
  async startConversation(
    @Req() req: Request,
    @Body() body: StartConversationDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: req.user.supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.messagesService.getOrCreateConversation(
      user.id,
      body.recipientId,
    );
  }

  @Get(':id/messages')
  async getMessages(@Req() req: Request, @Param('id') conversationId: string) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: req.user.supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.messagesService.getMessagesForConversation(
      conversationId,
      user.id,
    );
  }

  @Post(':id/messages')
  async sendMessage(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body() body: CreateMessageDto,
  ) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: req.user.supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return this.messagesService.sendMessage(
      conversationId,
      user.id,
      body.content,
    );
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: Request, @Param('id') conversationId: string) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: req.user.supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    await this.messagesService.markAsRead(conversationId, user.id);
    return { success: true };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({
      where: { supabaseId: req.user.supabaseId },
      select: { id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const count = await this.messagesService.getUnreadCount(user.id);
    return { count };
  }
}
