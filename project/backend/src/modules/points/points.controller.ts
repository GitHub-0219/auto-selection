import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common'
import { PointsService } from './points.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { IsNumber, Min } from 'class-validator'

// ==================== DTOs ====================

export class ConsumePointsDto {
  @IsNumber()
  @Min(1)
  amount: number

  description?: string
}

// ==================== Controller ====================

@Controller('points')
export class PointsController {
  constructor(private pointsService: PointsService) {}

  /**
   * 获取积分余额
   * GET /points/balance
   */
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Request() req) {
    const balance = await this.pointsService.getBalance(req.user.id)
    return {
      success: true,
      data: balance,
    }
  }

  /**
   * 获取积分明细
   * GET /points/transactions
   */
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getTransactions(
    @Request() req,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.pointsService.getTransactions(req.user.id, Number(page), Number(pageSize))
  }

  /**
   * 积分抵现计算
   * GET /points/calculate/:points
   */
  @Get('calculate/:points')
  async calculateRedemption(@Param('points') points: string) {
    const result = this.pointsService.calculateRedemption(Number(points))
    return {
      success: true,
      data: result,
    }
  }

  /**
   * 获取积分规则
   * GET /points/rules
   */
  @Get('rules')
  getRules() {
    return this.pointsService.getRules()
  }

  /**
   * 消费积分 (示例接口，实际业务中可能需要特殊权限)
   * POST /points/consume
   */
  @UseGuards(JwtAuthGuard)
  @Post('consume')
  async consumePoints(@Body() dto: ConsumePointsDto, @Request() req) {
    return this.pointsService.consumePoints({
      userId: req.user.id,
      amount: dto.amount,
      source: 'manual_redeem',
      description: dto.description || '积分兑换',
    })
  }
}
