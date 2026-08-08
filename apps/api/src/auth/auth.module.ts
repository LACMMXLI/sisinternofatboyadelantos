import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, TokensService],
  // Reexporta JwtModule: JwtAuthGuard es un APP_GUARD global declarado en
  // AppModule, así que su JwtService debe poder resolverse a través de los
  // módulos que AppModule importa (no basta con declararlo aquí dentro).
  exports: [TokensService, JwtModule],
})
export class AuthModule {}
