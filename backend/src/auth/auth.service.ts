import {
  BadRequestException,
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

export interface AuthResponseUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  accountType: string | null;
  language: string;
  defaultMessage: string | null;
  skills: { id: string; name: string }[];
  /** False when user signed up with Google only and has not set a password yet. */
  hasPassword: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: AuthResponseUser;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    if (!dto.termsAccepted) {
      throw new BadRequestException('Terms and privacy policy must be accepted');
    }
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
    const withRelations = await this.prisma.user.findUnique({
      where: { id: user.id },
      // Skills relation is defined in Prisma schema; cast to any to avoid
      // type mismatch before regenerating Prisma client.
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!withRelations) {
      return this.buildAuthResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: [],
        hasPassword: !!user.password,
      });
    }
    const skillsFromUser = (withRelations as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
    return this.buildAuthResponse({
      id: withRelations.id,
      email: withRelations.email,
      name: withRelations.name,
      surname: withRelations.surname,
      accountType: withRelations.accountType,
      language: withRelations.language,
      defaultMessage: withRelations.defaultMessage,
      skills: skillsFromUser.map((relation) => ({
        id: relation.skill.id,
        name: relation.skill.name,
      })),
      hasPassword: !!withRelations.password,
    });
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      // See comment in register(): we cast include to any until Prisma client is regenerated.
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const skillsFromUser = (user as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
    return this.buildAuthResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      accountType: user.accountType,
      language: user.language,
      defaultMessage: user.defaultMessage,
      skills: skillsFromUser.map((relation) => ({
        id: relation.skill.id,
        name: relation.skill.name,
      })),
      hasPassword: true,
    });
  }

  /** Find or create user from Google OAuth profile; returns JWT + user. */
  async loginOrCreateFromGoogle(profile: {
    id: string;
    emails?: { value: string; verified?: boolean }[];
    displayName?: string;
    name?: { givenName?: string; familyName?: string };
  }): Promise<AuthResponse> {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new BadRequestException('Google profile has no email');
    }
    const googleId = profile.id;
    const name = profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? null;
    const surname = profile.name?.familyName ?? (profile.displayName?.split(' ').slice(1).join(' ') || null);

    let user = await this.prisma.user.findUnique({
      where: { googleId },
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (user) {
      const skillsFromUser = (user as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
      return this.buildAuthResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: skillsFromUser.map((r) => ({ id: r.skill.id, name: r.skill.name })),
        hasPassword: !!user.password,
      });
    }

    user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (user) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId },
      });
      const skillsFromUser = (user as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
      return this.buildAuthResponse({
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: skillsFromUser.map((r) => ({ id: r.skill.id, name: r.skill.name })),
        hasPassword: !!user.password,
      });
    }

    const newUser = await this.prisma.user.create({
      data: {
        email,
        googleId,
        name,
        surname,
      },
    });
    const withRelations = await this.prisma.user.findUnique({
      where: { id: newUser.id },
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!withRelations) {
      return this.buildAuthResponse({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        surname: newUser.surname,
        accountType: newUser.accountType,
        language: newUser.language,
        defaultMessage: newUser.defaultMessage,
        skills: [],
        hasPassword: false,
      });
    }
    const skillsFromUser = (withRelations as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
    return this.buildAuthResponse({
      id: withRelations.id,
      email: withRelations.email,
      name: withRelations.name,
      surname: withRelations.surname,
      accountType: withRelations.accountType,
      language: withRelations.language,
      defaultMessage: withRelations.defaultMessage,
      skills: skillsFromUser.map((r) => ({ id: r.skill.id, name: r.skill.name })),
      hasPassword: !!withRelations.password,
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
      ...(dto.defaultMessage !== undefined && { defaultMessage: dto.defaultMessage || null }),
    };
    if (dto.password !== undefined && dto.password.trim()) {
      const existingUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!existingUser) {
        throw new UnauthorizedException('Invalid user');
      }
      if (existingUser.password) {
        if (!dto.oldPassword || !dto.oldPassword.trim()) {
          throw new UnauthorizedException('Current password is required');
        }
        const isOldPasswordValid = await bcrypt.compare(
          dto.oldPassword.trim(),
          existingUser.password,
        );
        if (!isOldPasswordValid) {
          throw new UnauthorizedException('Current password is incorrect');
        }
      }
      updateData.password = await bcrypt.hash(dto.password.trim(), this.saltRounds);
    }
    if (Array.isArray(dto.skillIds)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any).skills = {
        deleteMany: {},
        create: dto.skillIds.map((skillId) => ({ skillId })),
      };
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      // See comment in register(): cast include to any until Prisma client is regenerated.
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    const skillsFromUser = (user as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accountType: user.accountType,
        language: user.language,
        defaultMessage: user.defaultMessage,
        skills: skillsFromUser.map((relation) => ({
          id: relation.skill.id,
          name: relation.skill.name,
        })),
        hasPassword: !!user.password,
      },
    };
  }

  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      // See comment in register(): cast include to any until Prisma client is regenerated.
      include: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...({ skills: { include: { skill: true } } } as any),
      },
    });
    if (!user) return null;
    const skillsFromUser = (user as unknown as { skills?: { skill: { id: string; name: string } }[] }).skills ?? [];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      accountType: user.accountType,
      language: user.language,
      defaultMessage: user.defaultMessage,
      skills: skillsFromUser.map((relation) => ({
        id: relation.skill.id,
        name: relation.skill.name,
      })),
      hasPassword: !!user.password,
    };
  }

  private buildAuthResponse(user: AuthResponseUser): AuthResponse {
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
        defaultMessage: user.defaultMessage,
        skills: user.skills,
        hasPassword: user.hasPassword,
      },
    };
  }
}
