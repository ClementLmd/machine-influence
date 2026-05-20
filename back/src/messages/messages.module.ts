import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { EncryptionService } from './encryption.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [MessagesService, MessagesGateway, EncryptionService],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
