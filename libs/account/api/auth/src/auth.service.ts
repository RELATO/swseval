import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'api/users';
import * as crypto from 'crypto';
import { AuthMailerService } from './services/auth-mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailerService: AuthMailerService,
    private readonly jwtService: JwtService
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne({ where: { email } });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
  async login(credentials: any) {
    return await this.usersService.validateUser(credentials).then(user => {
      const payload = { email: user.email, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload)
      };
    });
  }
  async getUser(id: number) {
    return await this.usersService.findOne(id, {
      relations: ['company']
    })
  }
  async forgotPassword(dto) {
    try {
      const { resetPassword, ...data } = await this.usersService.forgotPassword(dto)
      if (resetPassword) {
        await this.mailerService.forgotPassword(
          resetPassword.token, dto.email
        )
        return {
          ...data, resetPassword
        }
      }
    } catch (err) {
      throw new BadRequestException(err.message)
    }
  }
  async resetPassword(dto) {
    try {
      return await this.usersService.resetPassword(dto)
    } catch (err) {
      // return err
      throw new BadRequestException(err.message)
    }
  }
}
