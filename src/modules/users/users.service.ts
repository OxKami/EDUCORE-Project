import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/bcrypt.util';
import { UserRole, UserStatus } from '@prisma/client';

interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
}

interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export class UsersService {
  async listUsers(query: ListUsersQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          phoneNumber: true,
          profileImage: true,
          createdAt: true,
          lastLogin: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneNumber: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        teacher: {
          select: {
            id: true,
            employeeId: true,
            specialization: true,
            qualification: true,
            hireDate: true,
          },
        },
        student: {
          select: {
            id: true,
            studentId: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            enrollmentDate: true,
          },
        },
        parent: {
          select: {
            id: true,
            occupation: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async createUser(input: CreateUserInput, createdById: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        phoneNumber: input.phoneNumber,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        details: { createdUser: user },
      },
    });

    return user;
  }

  async updateUser(userId: string, input: UpdateUserInput, updatedById: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Check email uniqueness if updating email
    if (input.email && input.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phoneNumber: input.phoneNumber,
        profileImage: input.profileImage,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        phoneNumber: true,
        profileImage: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        details: JSON.parse(JSON.stringify({ updates: input })),
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string, deletedById: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Don't allow deleting yourself
    if (userId === deletedById) {
      throw new Error('Cannot delete your own account');
    }

    // Soft delete by setting status to INACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'User',
        entityId: userId,
      },
    });

    return { message: 'User deleted successfully' };
  }

  async updateStatus(userId: string, status: UserStatus, updatedById: string) {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        details: { statusChanged: status },
      },
    });

    return updatedUser;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(
      input.currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await hashPassword(input.newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        details: { action: 'password_changed' },
      },
    });

    return { message: 'Password changed successfully' };
  }

  async getUserActivity(userId: string, limit: number = 20) {
    const activities = await prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        details: true,
        timestamp: true,
      },
    });

    return activities;
  }
}