import { Module } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AIController } from './ai.controller'
import { AIService } from './ai.service'

@Module({
  controllers: [AIController],
  providers: [AIService, PrismaService],
  exports: [AIService],
})
export class AIModule {}
