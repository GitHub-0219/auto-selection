import { Module } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.module'
import { UserController } from './user.controller'
import { UserService } from './user.service'
import { JwtStrategy } from '../../common/strategies/jwt.strategy'

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule, // 确保 ConfigService 可用
  ],
  controllers: [UserController],
  providers: [UserService, PrismaService, JwtService, JwtStrategy, ConfigService],
  exports: [UserService],
})
export class UserModule {}
