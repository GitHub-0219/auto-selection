import { Injectable, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        include: { items: true },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { userId } }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  async findOne(id: string, userId: string) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: true },
    })
  }

  async create(userId: string, data: any) {
    return this.prisma.order.create({
      data: {
        orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        status: 'pending',
        totalAmount: data.totalAmount,
        currency: data.currency || 'USD',
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    })
  }

  /**
   * 更新订单状态 - 修复P0：必须验证用户身份
   * @param id 订单ID
   * @param userId 当前用户ID（必须验证）
   * @param status 新状态
   */
  async updateStatus(id: string, userId: string, status: string) {
    // 先验证订单是否属于当前用户
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
    })

    if (!order) {
      throw new ForbiddenException('无权操作此订单')
    }

    return this.prisma.order.update({
      where: { id },
      data: { status },
    })
  }
}
