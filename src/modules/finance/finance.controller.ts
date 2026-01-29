import { Request, Response } from 'express';
import { FinanceService } from './finance.service';
import { successResponse, errorResponse } from '../../utils/response.util';
import {
  createTransactionSchema,
  updateTransactionSchema,
  generateInvoicesSchema,
} from './finance.validation';

const financeService = new FinanceService();

export class FinanceController {
  async listTransactions(req: Request, res: Response): Promise<void> {
    try {
      const { type, category, status, studentId, startDate, endDate, page, limit } = req.query;

      const result = await financeService.listTransactions({
        type: type as any,
        category: category as any,
        status: status as any,
        studentId: studentId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result.transactions,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      errorResponse(res, 'LIST_TRANSACTIONS_ERROR', error.message, 400);
    }
  }

  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const transaction = await financeService.getTransactionById(id);

      successResponse(res, transaction, 'Transaction retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_TRANSACTION_ERROR', error.message, 404);
    }
  }

  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = createTransactionSchema.parse(req.body);

      const transaction = await financeService.createTransaction(
        validatedData,
        req.user.userId
      );

      successResponse(res, transaction, 'Transaction created successfully', 201);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'CREATE_TRANSACTION_ERROR', error.message, 400);
      }
    }
  }

  async updateTransaction(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const validatedData = updateTransactionSchema.parse(req.body);

      const transaction = await financeService.updateTransaction(
        id,
        validatedData,
        req.user.userId
      );

      successResponse(res, transaction, 'Transaction updated successfully');
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'UPDATE_TRANSACTION_ERROR', error.message, 400);
      }
    }
  }

  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const { id } = req.params;

      const result = await financeService.deleteTransaction(id, req.user.userId);

      successResponse(res, result, 'Transaction deleted successfully');
    } catch (error: any) {
      errorResponse(res, 'DELETE_TRANSACTION_ERROR', error.message, 400);
    }
  }

  async generateInvoices(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        errorResponse(res, 'AUTH_ERROR', 'User not authenticated', 401);
        return;
      }

      const validatedData = generateInvoicesSchema.parse(req.body);

      const result = await financeService.generateInvoices(validatedData, req.user.userId);

      successResponse(
        res,
        result,
        `${result.count} invoices generated successfully`,
        201
      );
    } catch (error: any) {
      if (error.name === 'ZodError') {
        errorResponse(res, 'VALIDATION_ERROR', 'Invalid input', 422, error.errors);
      } else {
        errorResponse(res, 'GENERATE_INVOICES_ERROR', error.message, 400);
      }
    }
  }

  async getFinancialSummary(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate } = req.query;

      const summary = await financeService.getFinancialSummary(
        startDate as string,
        endDate as string
      );

      successResponse(res, summary, 'Financial summary retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_SUMMARY_ERROR', error.message, 400);
    }
  }

  async getStudentPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;

      const result = await financeService.getStudentPaymentHistory(studentId);

      successResponse(res, result, 'Payment history retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_PAYMENT_HISTORY_ERROR', error.message, 400);
    }
  }

  async getOutstandingFees(req: Request, res: Response): Promise<void> {
    try {
      const { academicYearId } = req.query;

      const result = await financeService.getOutstandingFees(academicYearId as string);

      successResponse(res, result, 'Outstanding fees retrieved successfully');
    } catch (error: any) {
      errorResponse(res, 'GET_OUTSTANDING_FEES_ERROR', error.message, 400);
    }
  }
}