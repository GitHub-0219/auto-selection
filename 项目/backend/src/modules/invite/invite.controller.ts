import { Controller, Post, Get, Body, Query, Param, UseGuards, Request } from '@nestjs/common'
import { InviteService } from './invite.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { IsString } from 'class-validator'

// ==================== DTOs ====================

export class UseInviteCodeDto {
  @IsString()
  code: string
}

// ==================== Controller ====================

@Controller('invite')
export class InviteController {
  constructor(private inviteService: InviteService) {}

  /**
   * 获取我的邀请码
   * GET /invite/code
   */
  @UseGuards(JwtAuthGuard)
  @Get('code')
  async getMyInviteCode(@Request() req) {
    return this.inviteService.getMyInviteCode(req.user.id)
  }

  /**
   * 生成新的邀请码
   * POST /invite/code
   */
  @UseGuards(JwtAuthGuard)
  @Post('code')
  async generateInviteCode(@Request() req) {
    return this.inviteService.generateInviteCode(req.user.id)
  }

  /**
   * 使用邀请码
   * POST /invite/use
   */
  @UseGuards(JwtAuthGuard)
  @Post('use')
  async useInviteCode(@Body() dto: UseInviteCodeDto, @Request() req) {
    return this.inviteService.useInviteCode(req.user.id, dto.code)
  }

  /**
   * 验证邀请码
   * GET /invite/validate/:code
   */
  @Get('validate/:code')
  async validateCode(@Param('code') code: string) {
    return this.inviteService.validateCode(code)
  }

  /**
   * 获取邀请记录
   * GET /invite/records
   */
  @UseGuards(JwtAuthGuard)
  @Get('records')
  async getInviteRecords(
    @Request() req,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.inviteService.getInviteRecords(req.user.id, Number(page), Number(pageSize))
  }
}
