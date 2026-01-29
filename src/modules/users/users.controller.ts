import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  updateStatusSchema,
} from './users.validation';

const usersService = new UsersService();

export class UsersController {
  async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, role, status } = req.query;

      const result = await usersService.listUsers({
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        role: role as any,
        status: status as any,
      });

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'LIST_USERS_ERROR', error.message, 400);
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await usersService.getUserById(id);

      successResponse(res, user, 'User retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_USER_ERROR', error.message, 404);
    }
  }

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      // Validate input
      const validatedData = createUserSchema.parse(req.body);

      // Create user
      const user = await usersService.createUser(validatedData, req.user.userId);

      successResponse(res, user, 'User created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_USER_ERROR', error.message, 400);
      }
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Validate input
      const validatedData = updateUserSchema.parse(req.body);

      // Update user
      const user = await usersService.updateUser(id, validatedData, req.user.userId);

      successResponse(res, user, 'User updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_USER_ERROR', error.message, 400);
      }
    }
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const result = await usersService.deleteUser(id, req.user.userId);

      successResponse(res, result, 'User deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_USER_ERROR', error.message, 400);
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Validate input
      const validatedData = updateStatusSchema.parse(req.body);

      // Update status
      const user = await usersService.updateStatus(
        id,
        validatedData.status,
        req.user.userId
      );

      successResponse(res, user, 'User status updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_STATUS_ERROR', error.message, 400);
      }
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      // Only allow users to change their own password or admin to change any
      if (id !== req.user.userId && req.user.role !== 'ADMIN') {
        errorResponse(
          res,
          'FORBIDDEN',
          'You can only change your own password',
          403
        );
        return;
      }

      // Validate input
      const validatedData = changePasswordSchema.parse(req.body);

      // Change password
      const result = await usersService.changePassword(id, validatedData);

      successResponse(res, result, 'Password changed successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CHANGE_PASSWORD_ERROR', error.message, 400);
      }
    }
  }

  async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { limit } = req.query;

      const activities = await usersService.getUserActivity(
        id,
        limit ? parseInt(limit as string) : undefined
      );

      successResponse(res, activities, 'User activity retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_ACTIVITY_ERROR', error.message, 400);
    }
  }
}