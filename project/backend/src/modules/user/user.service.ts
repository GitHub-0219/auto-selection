import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UserService {
  // 内存缓存（生产环境建议使用Redis）
  private loginAttemptsCache: Map<string, { count: number; expiresAt: number }> = new Map()
  private lockoutCache: Map<string, number> = new Map()  // email -> unlockTime

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async create(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10)
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'free',
      },
    })
  }

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword)
  }

  async updateRole(userId: string, role: 'free' | 'basic' | 'pro' | 'enterprise') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    })
  }

  async getMembership(userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId },
    })

    if (!membership) {
      const user = await this.findById(userId)
      return {
        plan: user?.role || 'free',
        status: 'active',
        features: this.getPlanFeatures(user?.role || 'free'),
      }
    }

    return {
      ...membership,
      features: this.getPlanFeatures(membership.plan),
    }
  }

  // ==================== 账户锁定功能 ====================

  /**
   * 记录登录失败次数
   * @returns 当前失败次数
   */
  async recordLoginFailure(email: string): Promise<number> {
    const now = Date.now()
    const lockoutDuration = this.configService.get<number>('LOGIN_LOCKOUT_DURATION') || 15 * 60 * 1000
    const windowDuration = lockoutDuration // 失败记录窗口期

    const existing = this.loginAttemptsCache.get(email)
    
    if (existing && existing.expiresAt > now) {
      // 在有效期内，增加计数
      existing.count += 1
      this.loginAttemptsCache.set(email, existing)
      return existing.count
    }
    
    // 新窗口期，重置计数
    this.loginAttemptsCache.set(email, {
      count: 1,
      expiresAt: now + windowDuration,
    })
    return 1
  }

  /**
   * 清除登录失败记录
   */
  async clearLoginFailures(email: string): Promise<void> {
    this.loginAttemptsCache.delete(email)
  }

  /**
   * 检查账户是否被锁定
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const unlockTime = this.lockoutCache.get(email)
    if (!unlockTime) return false
    
    if (Date.now() >= unlockTime) {
      // 锁定已过期，清理缓存
      this.lockoutCache.delete(email)
      return false
    }
    return true
  }

  /**
   * 锁定账户
   * @param email 用户邮箱
   * @param duration 锁定时长（毫秒）
   */
  async lockAccount(email: string, duration: number): Promise<void> {
    const unlockTime = Date.now() + duration
    this.lockoutCache.set(email, unlockTime)
    
    // 清除失败记录
    this.loginAttemptsCache.delete(email)
    
    console.log(`[Security] Account locked: ${email}, unlock at: ${new Date(unlockTime).toISOString()}`)
  }

  /**
   * 获取锁定剩余时间
   */
  async getLockoutRemainingTime(email: string): Promise<number> {
    const unlockTime = this.lockoutCache.get(email)
    if (!unlockTime) return 0
    return Math.max(0, unlockTime - Date.now())
  }

  /**
   * 解锁账户（管理员操作）
   */
  async unlockAccount(email: string): Promise<void> {
    this.lockoutCache.delete(email)
    this.loginAttemptsCache.delete(email)
  }

  // ==================== [BUG-004 FIX] Token刷新功能 ====================

  /**
   * 生成访问令牌和刷新令牌
   */
  async generateTokens(userId: string, email: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const accessToken = this.jwtService.sign(
      { sub: userId, email, type: 'access' },
      { expiresIn: '2h' },
    )

    const refreshToken = this.jwtService.sign(
      { sub: userId, email, type: 'refresh' },
      { expiresIn: '7d' },
    )

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200, // 2小时
    }
  }

  /**
   * 通过刷新令牌获取新的访问令牌
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    expiresIn: number
  }> {
    try {
      // 验证刷新令牌
      const payload = this.jwtService.verify(refreshToken)

      if (payload.type !== 'refresh') {
        throw new Error('无效的刷新令牌类型')
      }

      const user = await this.findByEmail(payload.email)
      if (!user) {
        throw new Error('用户不存在')
      }

      // 生成新的访问令牌
      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: 'access' },
        { expiresIn: '2h' },
      )

      return { accessToken, expiresIn: 7200 }
    } catch (error) {
      throw new Error('刷新令牌已过期或无效，请重新登录')
    }
  }

  // ==================== 计划功能 ====================

  private getPlanFeatures(plan: string) {
    const features: Record<string, string[]> = {
      free: [
        '5次AI选品分析/月',
        '基础商品翻译',
        '1个平台同步',
        '社区支持',
      ],
      basic: [
        '50次AI选品分析/月',
        '无限商品翻译',
        '3个平台同步',
        '基础数据分析',
        '邮件支持',
      ],
      pro: [
        '无限AI选品分析',
        '无限商品翻译',
        '全平台同步',
        '高级数据分析',
        '智能定价建议',
        '优先客户支持',
        'API访问权限',
      ],
      enterprise: [
        '所有专业版功能',
        '多用户协作',
        '定制化报告',
        '专属客户经理',
        '优先技术支持',
        '私有化部署选项',
      ],
    }
    return features[plan] || features.free
  }
}
