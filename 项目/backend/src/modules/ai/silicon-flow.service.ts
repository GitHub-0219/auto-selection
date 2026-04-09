import { Injectable, HttpException, HttpStatus } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'
import axios, { AxiosInstance } from 'axios'

/**
 * 硅基流动API服务
 * 兼容OpenAI格式，支持选品报告、多语言翻译、视频脚本生成
 */
@Injectable()
export class SiliconFlowService {
  private client: AxiosInstance
  private readonly provider: string
  private readonly model: string
  private readonly baseUrl = 'https://api.siliconflow.cn/v1'

  // 支持的语言列表
  readonly supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  ]

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('SILICONFLOW_API_KEY')
    this.provider = this.configService.get<string>('AI_PROVIDER') || 'siliconflow'
    
    // 根据provider选择模型
    if (this.provider === 'siliconflow') {
      this.model = this.configService.get<string>('SILICONFLOW_MODEL') || 'Qwen/Qwen2.5-7B-Instruct'
      this.client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60秒超时
      })
    } else {
      // Mock模式
      this.client = axios.create()
      this.model = 'mock'
    }
  }

  /**
   * 通用聊天请求
   */
  async chat(messages: any[], userId?: string): Promise<any> {
    if (this.provider === 'mock') {
      return this.mockChat(messages)
    }

    try {
      const startTime = Date.now()
      const response = await this.client.post('/chat/completions', {
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      })

      const result = response.data.choices[0].message.content
      const tokens = response.data.usage?.total_tokens || 0
      
      // 记录使用
      if (userId) {
        await this.recordUsage(userId, 'chat', JSON.stringify(messages), result, tokens)
      }

      return {
        success: true,
        data: {
          reply: result,
          tokens,
          model: this.model,
          latency: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('SiliconFlow API Error:', error.response?.data || error.message)
      throw new HttpException(
        error.response?.data?.error?.message || 'AI服务调用失败',
        HttpStatus.SERVICE_UNAVAILABLE,
      )
    }
  }

  /**
   * 选品报告生成
   * 基于关键词分析市场趋势、竞争度、利润空间
   */
  async generateSelectionReport(params: {
    keywords: string[]
    targetMarket: string
    budget: number
    userId: string
  }): Promise<any> {
    const { keywords, targetMarket, budget, userId } = params

    if (this.provider === 'mock') {
      return this.mockSelectionReport(keywords, targetMarket, budget)
    }

    const systemPrompt = `你是一位资深的跨境电商选品专家，精通Amazon、eBay、TikTok Shop等平台的运营。
请根据用户提供的关键词生成专业的选品分析报告，输出JSON格式。`

    const userPrompt = `
请分析以下选品信息：
- 目标关键词: ${keywords.join(', ')}
- 目标市场: ${targetMarket}
- 预算范围: ¥${budget}

请生成包含以下内容的JSON报告（不要包含markdown代码块）:
{
  "summary": "整体市场概述（100字内）",
  "products": [
    {
      "name": "产品名称",
      "nicheScore": 0-100评分,
      "trend": "上升/稳定/下降",
      "competition": "高/中/低",
      "avgPrice": 平均价格,
      "profitMargin": 利润率百分比,
      "monthlyDemand": 月需求量估算,
      "topPlatforms": ["平台1", "平台2"],
      "pros": ["优势1", "优势2"],
      "cons": ["劣势1", "劣势2"],
      "recommendation": "推荐理由"
    }
  ],
  "marketInsights": ["洞察1", "洞察2", "洞察3"],
  "riskAssessment": "风险评估",
  "actionPlan": ["行动建议1", "行动建议2"]
}`

    try {
      const startTime = Date.now()
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], userId)

      let report
      try {
        report = JSON.parse(response.data.reply)
      } catch {
        // 如果不是有效JSON，尝试提取JSON部分
        const jsonMatch = response.data.reply.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          report = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析AI返回的报告格式')
        }
      }

      return {
        success: true,
        data: {
          ...report,
          meta: {
            keywords,
            targetMarket,
            budget,
            generatedAt: new Date().toISOString(),
            latency: Date.now() - startTime,
            model: this.model,
          },
        },
      }
    } catch (error) {
      console.error('Selection Report Error:', error)
      throw new HttpException(
        error.message || '选品报告生成失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * 多语言翻译
   * 支持15种语言
   */
  async translate(params: {
    content: string
    targetLang: string
    sourceLang?: string
    userId: string
  }): Promise<any> {
    const { content, targetLang, sourceLang = 'auto', userId } = params

    // 验证语言
    const langInfo = this.supportedLanguages.find(l => l.code === targetLang)
    if (!langInfo) {
      throw new HttpException(
        `不支持的目标语言: ${targetLang}，支持的语种: ${this.supportedLanguages.map(l => l.code).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      )
    }

    if (content.length > 10000) {
      throw new HttpException('单次翻译内容不能超过10000字符', HttpStatus.BAD_REQUEST)
    }

    if (this.provider === 'mock') {
      return this.mockTranslate(content, targetLang)
    }

    const systemPrompt = `你是一位专业的跨境电商翻译专家。
- 翻译要自然、地道，符合目标市场的表达习惯
- 对于产品描述，要突出卖点，使用有吸引力的词汇
- 保持原文的格式和结构
- 如果检测到营销用语，进行适当的本地化优化`

    const userPrompt = sourceLang === 'auto'
      ? `将以下内容翻译成${langInfo.name}：\n\n${content}`
      : `将以下内容从${this.supportedLanguages.find(l => l.code === sourceLang)?.name}翻译成${langInfo.name}：\n\n${content}`

    try {
      const startTime = Date.now()
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], userId)

      return {
        success: true,
        data: {
          original: content,
          translated: response.data.reply,
          sourceLang: sourceLang === 'auto' ? 'detected' : sourceLang,
          targetLang,
          targetLangName: langInfo.name,
          targetLangFlag: langInfo.flag,
          charCount: content.length,
          latency: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('Translate Error:', error)
      throw new HttpException(
        error.message || '翻译服务调用失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * 批量翻译
   */
  async batchTranslate(params: {
    items: Array<{ text: string; type: 'title' | 'description' | 'tags' }>
    targetLang: string
    userId: string
  }): Promise<any> {
    const { items, targetLang, userId } = params

    const langInfo = this.supportedLanguages.find(l => l.code === targetLang)
    if (!langInfo) {
      throw new HttpException(`不支持的目标语言: ${targetLang}`, HttpStatus.BAD_REQUEST)
    }

    if (this.provider === 'mock') {
      return {
        success: true,
        data: {
          items: items.map(item => ({
            type: item.type,
            original: item.text,
            translated: `[${langInfo.name}] ${item.text}`,
          })),
        },
      }
    }

    // 构建批量翻译prompt
    const typeInstructions = {
      title: '产品标题：简洁有力，突出卖点，控制在50字符内',
      description: '产品描述：详细专业，包含规格参数和使用场景',
      tags: '关键词标签：用逗号分隔，选择高搜索量的长尾词',
    }

    const userPrompt = `批量翻译以下电商内容到${langInfo.name}：

${items.map((item, i) => `${i + 1}. [${item.type}] ${item.text}`).join('\n')}

请按以下格式输出JSON数组（不要包含markdown代码块）：
${items.map((item, i) => `[{"index": ${i}, "type": "${item.type}", "original": "...", "translated": "..."}]`).join('\n')}` + '\n\n输出JSON数组：'

    try {
      const startTime = Date.now()
      const response = await this.chat([
        {
          role: 'system',
          content: `你是跨境电商翻译专家，${typeInstructions.title}，${typeInstructions.description}，${typeInstructions.tags}`,
        },
        { role: 'user', content: userPrompt },
      ], userId)

      let results
      try {
        results = JSON.parse(response.data.reply)
      } catch {
        const jsonMatch = response.data.reply.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析翻译结果')
        }
      }

      return {
        success: true,
        data: {
          targetLang,
          targetLangName: langInfo.name,
          totalItems: items.length,
          items: results,
          latency: Date.now() - startTime,
        },
      }
    } catch (error) {
      console.error('Batch Translate Error:', error)
      throw new HttpException(
        error.message || '批量翻译失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * 视频脚本生成
   * 为TikTok/短视频平台生成带货脚本
   */
  async generateVideoScript(params: {
    productName: string
    productDescription?: string
    targetPlatform: 'tiktok' | 'youtube' | 'instagram'
    targetAudience: string
    duration: number // 秒数
    userId: string
  }): Promise<any> {
    const { productName, productDescription, targetPlatform, targetAudience, duration, userId } = params

    const platformSpecs = {
      tiktok: {
        name: 'TikTok',
        format: '竖屏 9:16',
        features: ['快节奏', '强节奏感', '前3秒定律', '钩子+价值+CTA'],
        duration: [15, 30, 60],
      },
      youtube: {
        name: 'YouTube Shorts',
        format: '竖屏 9:16',
        features: ['简洁明了', '信息密度高', '可添加字幕'],
        duration: [15, 30, 60],
      },
      instagram: {
        name: 'Instagram Reels',
        format: '竖屏 9:16 或 方屏 1:1',
        features: ['视觉美感', '品牌调性', '音乐配合'],
        duration: [15, 30, 60, 90],
      },
    }

    const platform = platformSpecs[targetPlatform]

    if (this.provider === 'mock') {
      return this.mockVideoScript(productName, platform.name, duration)
    }

    const systemPrompt = `你是顶级短视频带货脚本专家，精通TikTok、YouTube Shorts、Instagram Reels的爆款内容创作。
你的脚本曾创造多条百万播放、十万转发的爆款视频。`

    const userPrompt = `
请为以下产品生成短视频带货脚本：

**产品信息：**
- 产品名称: ${productName}
- 产品描述: ${productDescription || '暂无'}

**目标平台:** ${platform.name}
**内容格式:** ${platform.format}
**目标受众:** ${targetAudience}
**视频时长:** ${duration}秒

请生成完整的视频脚本JSON（不要包含markdown代码块）：
{
  "title": "视频标题（吸引眼球）",
  "hook": {
    "text": "开场钩子（前3秒台词）",
    "visual": "开场画面建议"
  },
  "script": [
    {
      "timestamp": "0-3秒",
      "content": "具体台词/动作",
      "visual": "画面描述",
      "audio": "背景音乐/音效建议"
    }
  ],
  "cta": {
    "text": "结尾号召购买语",
    "style": "号召方式"
  },
  "hashtags": ["标签1", "标签2", "标签3", "标签4", "标签5"],
  "tips": ["拍摄技巧1", "拍摄技巧2"]
}`

    try {
      const startTime = Date.now()
      const response = await this.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], userId)

      let script
      try {
        script = JSON.parse(response.data.reply)
      } catch {
        const jsonMatch = response.data.reply.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          script = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析脚本格式')
        }
      }

      return {
        success: true,
        data: {
          ...script,
          meta: {
            productName,
            platform: platform.name,
            format: platform.format,
            targetAudience,
            duration,
            generatedAt: new Date().toISOString(),
            latency: Date.now() - startTime,
            model: this.model,
          },
        },
      }
    } catch (error) {
      console.error('Video Script Error:', error)
      throw new HttpException(
        error.message || '视频脚本生成失败',
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  /**
   * 记录AI使用
   */
  private async recordUsage(
    userId: string,
    type: string,
    input: string,
    output: string,
    tokens: number,
  ): Promise<void> {
    try {
      const cost = tokens * 0.0001 // 估算成本
      await this.prisma.aIUsage.create({
        data: {
          userId,
          type,
          input: input.substring(0, 5000),
          output: output?.substring(0, 5000),
          tokens,
          cost,
          model: this.model,
        },
      })
    } catch (error) {
      console.error('Failed to record AI usage:', error)
    }
  }

  // ==================== Mock方法 ====================

  private mockChat(messages: any[]): any {
    const lastMessage = messages[messages.length - 1]?.content || ''
    return {
      success: true,
      data: {
        reply: `【Mock模式】收到您的消息: "${lastMessage.substring(0, 50)}..."\n\n这是模拟回复，实际调用需要配置SILICONFLOW_API_KEY环境变量。`,
        tokens: 100,
        model: 'mock',
        latency: 50,
      },
    }
  }

  private mockSelectionReport(keywords: string[], market: string, budget: number): any {
    return {
      success: true,
      data: {
        summary: `${keywords[0]}市场在${market}地区呈现稳步增长趋势，预计2024年市场规模达¥${(budget * 10).toLocaleString()}。竞争主要集中在头部卖家，中小卖家仍有突围机会。`,
        products: [
          {
            name: `${keywords[0] || '无线蓝牙耳机'} 旗舰版`,
            nicheScore: 85,
            trend: '上升',
            competition: '中',
            avgPrice: Math.round(budget * 0.3 * 100) / 100,
            profitMargin: 35,
            monthlyDemand: 5000,
            topPlatforms: ['Amazon', 'TikTok Shop'],
            pros: ['需求稳定', '复购率高', '体积小物流成本低'],
            cons: ['竞争激烈', '需要认证'],
            recommendation: '中等预算可入场，选择差异化细分品类',
          },
          {
            name: `${keywords[0] || '智能手表'} 运动版`,
            nicheScore: 78,
            trend: '稳定',
            competition: '高',
            avgPrice: Math.round(budget * 0.5 * 100) / 100,
            profitMargin: 28,
            monthlyDemand: 3500,
            topPlatforms: ['Amazon', 'eBay'],
            pros: ['客单价高', '品牌溢价空间大'],
            cons: ['资金压力大', '退货率高'],
            recommendation: '建议有一定资金实力的卖家考虑',
          },
        ],
        marketInsights: [
          `${keywords[0]}在${market}市场搜索量同比增长45%`,
          '环保材质产品越来越受欢迎',
          '个性化定制需求上升',
        ],
        riskAssessment: '主要风险：市场竞争加剧、汇率波动、物流成本上涨。建议分散供应链风险。',
        actionPlan: [
          '完成市场调研和竞品分析',
          '寻找差异化切入点和供应商',
          '准备Listing和营销素材',
        ],
        meta: {
          keywords,
          targetMarket: market,
          budget,
          generatedAt: new Date().toISOString(),
          latency: 1500,
          model: 'mock',
        },
      },
    }
  }

  private mockTranslate(content: string, targetLang: string): any {
    const langInfo = this.supportedLanguages.find(l => l.code === targetLang)
    return {
      success: true,
      data: {
        original: content,
        translated: `【Mock ${langInfo?.name || targetLang}】${content}`,
        sourceLang: 'detected',
        targetLang,
        targetLangName: langInfo?.name,
        targetLangFlag: langInfo?.flag,
        charCount: content.length,
        latency: 100,
      },
    }
  }

  private mockVideoScript(product: string, platform: string, duration: number): any {
    return {
      success: true,
      data: {
        title: `${product} - 你绝对没见过的好物分享！`,
        hook: {
          text: '等等！我敢打赌你绝对不知道这个...',
          visual: '特写镜头，神秘感',
        },
        script: [
          { timestamp: '0-3秒', content: '等等！我敢打赌你绝对不知道这个...', visual: '特写镜头', audio: '悬念音效' },
          { timestamp: '3-8秒', content: `今天给你们安利一款超级好用的${product}`, visual: '产品展示', audio: '欢快背景音乐' },
          { timestamp: '8-15秒', content: '它的特点是XXX，用起来特别方便', visual: '功能演示', audio: '轻快节奏' },
          { timestamp: '15-20秒', content: '而且价格超级实惠，性价比超高！', visual: '价格对比', audio: '强调音效' },
        ],
        cta: {
          text: '点击下方链接，现在下单还有优惠！快冲！',
          style: '紧迫感+优惠引导',
        },
        hashtags: [`${product}`, '好物推荐', '种草', '带货', '必买'],
        tips: ['光线要充足', '产品要清晰', '语速要适中'],
        meta: {
          productName: product,
          platform,
          duration,
          generatedAt: new Date().toISOString(),
          latency: 800,
          model: 'mock',
        },
      },
    }
  }
}
