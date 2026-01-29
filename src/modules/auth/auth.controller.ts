import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import { registerSchema, loginSchema } from './auth.validation';
import prisma from '../../config/database';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Register user
      const result = await authService.register(validatedData);

      successResponse(res, result, 'User registered successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'REGISTER_ERROR', error.message, 400);
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Login user
      const result = await authService.login(validatedData);

      successResponse(res, result, 'Login successful');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'LOGIN_ERROR', error.message, 401);
      }
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const user = await authService.getProfile(req.user.userId);

      successResponse(res, user, 'Profile retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'PROFILE_ERROR', error.message, 400);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: 'LOGOUT',
            entityType: 'User',
            entityId: req.user.userId,
          },
        });
      }

      successResponse(res, null, 'Logout successful');
    } catch (error: any) {
      errorResponse(res, 'LOGOUT_ERROR', error.message, 400);
    }
  }
}