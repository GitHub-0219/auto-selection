import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common'
import { OrderService } from './order.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Throttle, SkipThrottle } from '@nestjs/throttler'

class OrderItemDto {
  @IsString()
  productId: string

  @IsString()
  productName: string

  @IsNumber()
  quantity: number

  @IsNumber()
  price: number
}

export class CreateOrderDto {
  @IsNumber()
  totalAmount: number

  @IsString()
  @IsOptional()
  currency?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  @SkipThrottle() // 列表查询跳过限流
  async findAll(
    @Request() req,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.orderService.findAll(
      req.user.id,
      parseInt(page),
      parseInt(pageSize),
    )
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const order = await this.orderService.findOne(id, req.user.id)
    if (!order) {
      throw new ForbiddenException('无权访问此订单')
    }
    return {
      success: true,
      data: order,
    }
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 每分钟最多创建10个订单
  async create(@Body() dto: CreateOrderDto, @Request() req) {
    const order = await this.orderService.create(req.user.id, dto)
    return {
      success: true,
      message: '订单创建成功',
      data: order,
    }
  }

  /**
   * 更新订单状态 - 修复：必须验证订单所属用户
   * 只有订单所有者或管理员可以更新订单状态
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req,
  ) {
    // 修复P0问题：添加用户身份验证
    const order = await this.orderService.findOne(id, req.user.id)
    
    if (!order) {
      throw new ForbiddenException('无权操作此订单')
    }

    // 验证状态值
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: `无效的订单状态，可选值: ${validStatuses.join(', ')}`,
      }
    }

    const updatedOrder = await this.orderService.updateStatus(id, req.user.id, status)
    return {
      success: true,
      message: '订单状态已更新',
      data: updatedOrder,
    }
  }

  /**
   * 取消订单 - 新增安全端点
   */
  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req) {
    const order = await this.orderService.findOne(id, req.user.id)
    
    if (!order) {
      throw new ForbiddenException('无权操作此订单')
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return {
        success: false,
        message: '已发货或已完成的订单无法取消',
      }
    }

    const cancelledOrder = await this.orderService.updateStatus(id, req.user.id, 'cancelled')
    return {
      success: true,
      message: '订单已取消',
      data: cancelledOrder,
    }
  }
}
