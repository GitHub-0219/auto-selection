import { Controller, Get, Post, Body, Res, HttpException } from '@nestjs/common'
import { CaptchaService } from './captcha.service'
import { Response } from 'express'

@Controller('captcha')
export class CaptchaController {
  constructor(private captchaService: CaptchaService) {}

  /**
   * 获取验证码图片
   */
  @Get('image')
  async getCaptcha(@Res() res: Response) {
    const { token, svg } = this.captchaService.generate()
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('X-Captcha-Token', token) // 返回token到header
    
    res.type('image/svg+xml').send(svg)
  }

  /**
   * 验证验证码（可选API）
   */
  @Post('verify')
  async verifyCaptcha(
    @Body() body: { token: string; code: string },
  ) {
    const isValid = this.captchaService.verify(body.token, body.code)
    
    if (!isValid) {
      throw new HttpException('验证码错误或已过期', 400)
    }

    return {
      success: true,
      message: '验证成功',
    }
  }
}
