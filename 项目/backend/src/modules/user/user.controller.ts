import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Throttle, SkipThrottle } from '@nestjs/throttler'
import { UserService } from './user.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { LoginThrottlerGuard } from '../../common/guards/login-throttler.guard'
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'
import { ConfigService } from '@nestjs/config'

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @IsOptional()
  captchaToken?: string  // 验证码Token
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string
}

@Controller('auth')
export class UserController {
  private readonly maxLoginAttempts: number
  private readonly lockoutDuration: number  // 毫秒

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.maxLoginAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5
    this.lockoutDuration = this.configService.get<number>('LOGIN_LOCKOUT_DURATION') || 15 * 60 * 1000 // 15分钟
  }

  @Post('register')
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 15分钟内最多5次注册
  async register(@Body() dto: RegisterDto) {
    // 验证验证码（如果配置了）
    const captchaEnabled = this.configService.get<boolean>('ENABLE_CAPTCHA')
    if (captchaEnabled && !dto.captchaToken) {
      throw new HttpException('请完成验证码验证', 400)
    }
    
    // 检查用户是否已存在
    const existingUser = await this.userService.findByEmail(dto.email)
    if (existingUser) {
      return {
        success: false,
        message: '该邮箱已被注册',
      }
    }

    const user = await this.userService.create(dto)
    
    // [BUG-004 FIX] 生成双Token
    const tokens = await this.userService.generateTokens(user.id, user.email)

    return {
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LoginThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 15分钟内最多5次登录尝试
  async login(@Body() dto: LoginDto) {
    // 检查是否被锁定
    const isLocked = await this.userService.isAccountLocked(dto.email)
    if (isLocked) {
      const lockoutRemaining = await this.userService.getLockoutRemainingTime(dto.email)
      throw new HttpException(
        `账户已被锁定，请在 ${Math.ceil(lockoutRemaining / 60000)} 分钟后重试`,
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    const user = await this.userService.findByEmail(dto.email)
    if (!user) {
      return {
        success: false,
        message: '用户不存在或密码错误',
      }
    }

    const isValid = await this.userService.validatePassword(dto.password, user.password)
    if (!isValid) {
      // 记录登录失败
      const attempts = await this.userService.recordLoginFailure(dto.email)
      
      if (attempts >= this.maxLoginAttempts) {
        await this.userService.lockAccount(dto.email, this.lockoutDuration)
        throw new HttpException(
          `登录失败次数过多，账户已被锁定15分钟`,
          HttpStatus.TOO_MANY_REQUESTS,
        )
      }
      
      const remainingAttempts = this.maxLoginAttempts - attempts
      return {
        success: false,
        message: `用户不存在或密码错误，剩余${remainingAttempts}次尝试机会`,
      }
    }

    // 登录成功，清除失败记录
    await this.userService.clearLoginFailures(dto.email)

    // [BUG-004 FIX] 生成双Token
    const tokens = await this.userService.generateTokens(user.id, user.email)

    return {
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    }
  }

  // [BUG-004 FIX] 添加Token刷新接口
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    try {
      const result = await this.userService.refreshAccessToken(dto.refreshToken)
      return {
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      }
    } catch (error) {
      throw new HttpException(
        error.message || '刷新令牌已过期，请重新登录',
        HttpStatus.UNAUTHORIZED,
      )
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.userService.findById(req.user.id)
    return {
      success: true,
      data: user,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('membership')
  async getMembership(@Request() req) {
    const membership = await this.userService.getMembership(req.user.id)
    return {
      success: true,
      data: membership,
    }
  }
}
