import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
  user: { id: string; email: string; name: string | null; surname: string | null; accountType: string | null; language: string };
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        password: hashedPassword,
      },
    });
    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      accountType: user.accountType,
      language: user.language,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      accountType: user.accountType,
      language: user.language,
    });
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<{ user: AuthResponse['user'] }> {
    if (dto.email !== undefined && dto.email.trim()) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          id: { not: userId },
        },
      });
      if (existing) {
        throw new ConflictException('User with this email already exists');
      }
    }
    const updateData: Parameters<typeof this.prisma.user.update>[0]['data'] = {
      ...(dto.name !== undefined && { name: dto.name || null }),
      ...(dto.surname !== undefined && { surname: dto.surname || null }),
      ...(dto.accountType !== undefined && { accountType: dto.accountType || null }),
      ...(dto.email !== undefined && dto.email.trim() && { email: dto.email.trim().toLowerCase() }),
      ...(dto.language !== undefined && { language: dto.language }),
    };
    if (dto.password !== undefined && dto.password.trim()) {
      updateData.password = await bcrypt.hash(dto.password.trim(), this.saltRounds);
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accountType: user.accountType,
        language: user.language,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      accountType: user.accountType,
      language: user.language,
    };
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    accountType: string | null;
    language: string;
  }): AuthResponse {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);
    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accountType: user.accountType,
        language: user.language,
      },
    };
  }
}
