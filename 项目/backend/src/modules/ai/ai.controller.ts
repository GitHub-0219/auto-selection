import { Controller, Post, Get, Body, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common'
import { AIService } from './ai.service'
import { SiliconFlowService } from './silicon-flow.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/security.decorators'
import { IsString, IsArray, IsNumber, Min, Max, IsOptional, ValidateNested, IsIn } from 'class-validator'
import { Type } from 'class-transformer'

// ==================== DTOs ====================

export class SelectionReportDto {
  @IsArray()
  @IsString({ each: true })
  keywords: string[]

  @IsString()
  targetMarket: string

  @IsNumber()
  @Min(100)
  @Max(1000000)
  budget: number
}

export class TranslateDto {
  @IsString()
  content: string

  @IsString()
  @IsIn(['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ar', 'hi', 'th', 'vi', 'id'])
  targetLang: string

  @IsOptional()
  @IsString()
  sourceLang?: string
}

export class BatchTranslateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchTranslateItemDto)
  items: BatchTranslateItemDtoDto[]

  @IsString()
  @IsIn(['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'it', 'ru', 'ar', 'hi', 'th', 'vi', 'id'])
  targetLang: string
}

export class BatchTranslateItemDto {
  @IsString()
  text: string

  @IsString()
  @IsIn(['title', 'description', 'tags'])
  type: 'title' | 'description' | 'tags'
}

// 修复类型名称冲突
class BatchTranslateItemDtoDto {
  @IsString()
  text: string

  @IsString()
  @IsIn(['title', 'description', 'tags'])
  type: 'title' | 'description' | 'tags'
}

export class VideoScriptDto {
  @IsString()
  productName: string

  @IsOptional()
  @IsString()
  productDescription?: string

  @IsString()
  @IsIn(['tiktok', 'youtube', 'instagram'])
  targetPlatform: 'tiktok' | 'youtube' | 'instagram'

  @IsString()
  targetAudience: string

  @IsNumber()
  @Min(15)
  @Max(180)
  duration: number
}

export class ChatDto {
  @IsString()
  message: string
}

// ==================== Controller ====================

@Controller('ai')
export class AIController {
  constructor(
    private aiService: AIService,
    private siliconFlowService: SiliconFlowService,
  ) {}

  /**
   * 获取AI服务能力列表
   */
  @Get('capabilities')
  async getCapabilities() {
    return {
      success: true,
      data: {
        features: [
          { id: 'selection-report', name: '智能选品报告', endpoint: '/ai/selection-report', description: '基于AI分析市场趋势、竞争度、利润空间' },
          { id: 'translate', name: '多语言翻译', endpoint: '/ai/translate', description: '支持15种语言的专业翻译' },
          { id: 'batch-translate', name: '批量翻译', endpoint: '/ai/batch-translate', description: '批量翻译商品信息' },
          { id: 'video-script', name: '视频脚本生成', endpoint: '/ai/video-script', description: '为短视频平台生成带货脚本' },
          { id: 'analyze-products', name: '商品分析', endpoint: '/ai/analyze-products', description: '分析商品关键词热度' },
          { id: 'optimize-description', name: '描述优化', endpoint: '/ai/optimize-description', description: '优化商品描述文案' },
          { id: 'suggest-price', name: '定价建议', endpoint: '/ai/suggest-price', description: '智能定价建议' },
          { id: 'chat', name: 'AI助手', endpoint: '/ai/chat', description: '跨境电商问题解答' },
        ],
        supportedLanguages: this.siliconFlowService.supportedLanguages,
        platforms: [
          { id: 'tiktok', name: 'TikTok', format: '9:16' },
          { id: 'youtube', name: 'YouTube Shorts', format: '9:16' },
          { id: 'instagram', name: 'Instagram Reels', format: '9:16 / 1:1' },
        ],
      },
    }
  }

  /**
   * 获取支持的语言列表
   */
  @Get('languages')
  async getLanguages() {
    return {
      success: true,
      data: {
        languages: this.siliconFlowService.supportedLanguages,
      },
    }
  }

  // ==================== 选品报告 ====================

  /**
   * 生成选品报告
   * POST /ai/selection-report
   */
  @UseGuards(JwtAuthGuard)
  @Post('selection-report')
  @Roles('free', 'basic', 'pro', 'enterprise')
  async generateSelectionReport(@Body() dto: SelectionReportDto, @Request() req) {
    // 检查用户权限和配额
    await this.checkUsageLimit(req.user.id, 'selection-report')

    const result = await this.siliconFlowService.generateSelectionReport({
      keywords: dto.keywords,
      targetMarket: dto.targetMarket,
      budget: dto.budget,
      userId: req.user.id,
    })

    return result
  }

  // ==================== 翻译 ====================

  /**
   * 单条翻译
   * POST /ai/translate
   */
  @UseGuards(JwtAuthGuard)
  @Post('translate')
  @Roles('free', 'basic', 'pro', 'enterprise')
  async translate(@Body() dto: TranslateDto, @Request() req) {
    await this.checkUsageLimit(req.user.id, 'translate')

    return this.siliconFlowService.translate({
      content: dto.content,
      targetLang: dto.targetLang,
      sourceLang: dto.sourceLang,
      userId: req.user.id,
    })
  }

  /**
   * 批量翻译
   * POST /ai/batch-translate
   */
  @UseGuards(JwtAuthGuard)
  @Post('batch-translate')
  @Roles('basic', 'pro', 'enterprise')  // 基础会员及以上可用
  async batchTranslate(@Body() dto: BatchTranslateDto, @Request() req) {
    await this.checkUsageLimit(req.user.id, 'batch-translate')

    if (dto.items.length > 50) {
      throw new HttpException('单次批量翻译最多支持50条', HttpStatus.BAD_REQUEST)
    }

    return this.siliconFlowService.batchTranslate({
      items: dto.items,
      targetLang: dto.targetLang,
      userId: req.user.id,
    })
  }

  // ==================== 视频脚本 ====================

  /**
   * 生成视频脚本
   * POST /ai/video-script
   */
  @UseGuards(JwtAuthGuard)
  @Post('video-script')
  @Roles('basic', 'pro', 'enterprise')  // 基础会员及以上可用
  async generateVideoScript(@Body() dto: VideoScriptDto, @Request() req) {
    await this.checkUsageLimit(req.user.id, 'video-script')

    return this.siliconFlowService.generateVideoScript({
      productName: dto.productName,
      productDescription: dto.productDescription,
      targetPlatform: dto.targetPlatform,
      targetAudience: dto.targetAudience,
      duration: dto.duration,
      userId: req.user.id,
    })
  }

  // ==================== 原有功能 ====================

  /**
   * 商品分析
   */
  @UseGuards(JwtAuthGuard)
  @Post('analyze-products')
  async analyzeProducts(@Body() dto: { keywords: string[] }) {
    return this.aiService.analyzeProducts(dto.keywords)
  }

  /**
   * 描述优化
   */
  @UseGuards(JwtAuthGuard)
  @Post('optimize-description')
  async optimizeDescription(@Body() dto: { productName: string; description: string }) {
    return this.aiService.optimizeDescription(dto.productName, dto.description)
  }

  /**
   * 定价建议
   */
  @UseGuards(JwtAuthGuard)
  @Post('suggest-price')
  async suggestPrice(@Body() dto: { cost: number; targetMarket: string }) {
    return this.aiService.suggestPrice(dto.cost, dto.targetMarket)
  }

  /**
   * AI对话
   */
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Body() dto: ChatDto, @Request() req) {
    return this.siliconFlowService.chat([
      { role: 'system', content: '你是一位专业的跨境电商AI助手，可以回答关于选品、物流、营销等问题。' },
      { role: 'user', content: dto.message },
    ], req.user.id)
  }

  // ==================== 私有方法 ====================

  /**
   * 检查用户使用限制
   */
  private async checkUsageLimit(userId: string, type: string): Promise<void> {
    // TODO: 实现配额检查逻辑
    // 1. 查询用户会员等级
    // 2. 根据等级检查配额限制
    // 3. 超出配额返回错误或提示升级
  }
}
