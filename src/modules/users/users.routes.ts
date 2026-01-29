import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();
const usersController = new UsersController();

// All routes require authentication
router.use(authenticate);

// List users - Admin and Accountant can view
router.get(
  '/',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => usersController.listUsers(req, res)
);

// Get user by ID - Admin and Accountant can view
router.get(
  '/:id',
  authorize('ADMIN', 'ACCOUNTANT'),
  (req, res) => usersController.getUserById(req, res)
);

// Create user - Only Admin
router.post(
  '/',
  authorize('ADMIN'),
  (req, res) => usersController.createUser(req, res)
);

// Update user - Only Admin
router.put(
  '/:id',
  authorize('ADMIN'),
  (req, res) => usersController.updateUser(req, res)
);

// Delete user - Only Admin
router.delete(
  '/:id',
  authorize('ADMIN'),
  (req, res) => usersController.deleteUser(req, res)
);

// Update user status - Only Admin
router.patch(
  '/:id/status',
  authorize('ADMIN'),
  (req, res) => usersController.updateStatus(req, res)
);

// Change password - User themselves or Admin
router.patch(
  '/:id/password',
  (req, res) => usersController.changePassword(req, res)
);

// Get user activity - Admin only
router.get(
  '/:id/activity',
  authorize('ADMIN'),
  (req, res) => usersController.getUserActivity(req, res)
);

export default router;