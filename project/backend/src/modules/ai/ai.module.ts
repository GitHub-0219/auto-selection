import { Module } from '@nestjs/common'
import { AIController } from './ai.controller'
import { AIService } from './ai.service'
import { SiliconFlowService } from './silicon-flow.service'

@Module({
  controllers: [AIController],
  providers: [AIService, SiliconFlowService],
  exports: [AIService, SiliconFlowService],
})
export class AIModule {}
