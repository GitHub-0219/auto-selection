import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @Get('api')
  @Get('api/health')
  async healthCheck() {
    const dbStatus = await this.checkDatabase()
    
    return {
      success: true,
      message: 'AI跨境新手加速器 API 服务运行正常',
      data: {
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus ? 'connected' : 'disconnected',
          api: 'operational',
        },
      },
    }
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return true
    } catch {
      return false
    }
  }
}
