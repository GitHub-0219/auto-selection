import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common'
import { AIService } from './ai.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { IsString, IsArray, IsNumber, Min } from 'class-validator'

export class AnalyzeProductsDto {
  @IsArray()
  @IsString({ each: true })
  keywords: string[]
}

export class OptimizeDescriptionDto {
  @IsString()
  productName: string

  @IsString()
  description: string
}

export class TranslateDto {
  @IsString()
  content: string

  @IsString()
  targetLang: string
}

export class SuggestPriceDto {
  @IsNumber()
  @Min(0.01)
  cost: number

  @IsString()
  targetMarket: string
}

export class ChatDto {
  @IsString()
  message: string
}

@Controller('ai')
export class AIController {
  constructor(private aiService: AIService) {}

  @UseGuards(JwtAuthGuard)
  @Post('analyze-products')
  async analyzeProducts(@Body() dto: AnalyzeProductsDto) {
    return this.aiService.analyzeProducts(dto.keywords)
  }

  @UseGuards(JwtAuthGuard)
  @Post('optimize-description')
  async optimizeDescription(@Body() dto: OptimizeDescriptionDto) {
    return this.aiService.optimizeDescription(dto.productName, dto.description)
  }

  @UseGuards(JwtAuthGuard)
  @Post('translate')
  async translate(@Body() dto: TranslateDto) {
    return this.aiService.translate(dto.content, dto.targetLang)
  }

  @UseGuards(JwtAuthGuard)
  @Post('suggest-price')
  async suggestPrice(@Body() dto: SuggestPriceDto) {
    return this.aiService.suggestPrice(dto.cost, dto.targetMarket)
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Body() dto: ChatDto, @Request() req) {
    return this.aiService.chat(dto.message, req.user.id)
  }

  @Get('capabilities')
  async getCapabilities() {
    return {
      success: true,
      data: {
        features: [
          { name: '智能选品分析', endpoint: '/ai/analyze-products' },
          { name: '商品描述优化', endpoint: '/ai/optimize-description' },
          { name: '多语言翻译', endpoint: '/ai/translate' },
          { name: '智能定价', endpoint: '/ai/suggest-price' },
          { name: 'AI对话助手', endpoint: '/ai/chat' },
        ],
      },
    }
  }
}
