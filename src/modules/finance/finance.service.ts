import prisma from '../../config/database';
import { TransactionType, PaymentCategory, PaymentStatus, PaymentMethod } from '@prisma/client';

interface CreateTransactionInput {
  type: TransactionType;
  category: PaymentCategory;
  amount: number;
  currency: string;
  description: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  referenceNumber?: string;
  receiptNumber?: string;
  studentId?: string;
  academicYearId?: string;
  transactionDate?: string;
  dueDate?: string;
  paidDate?: string;
}

interface UpdateTransactionInput {
  type?: TransactionType;
  category?: PaymentCategory;
  amount?: number;
  description?: string;
  paymentMethod?: PaymentMethod;
  status?: PaymentStatus;
  referenceNumber?: string;
  dueDate?: string;
  paidDate?: string;
}

interface GenerateInvoicesInput {
  academicYearId: string;
  category: PaymentCategory;
  amount: number;
  description: string;
  dueDate: string;
  studentIds?: string[];
  classId?: string;
  gradeId?: string;
}

interface ListTransactionsQuery {
  type?: TransactionType;
  category?: PaymentCategory;
  status?: PaymentStatus;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class FinanceService {
  async listTransactions(query: ListTransactionsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.startDate || query.endDate) {
      where.transactionDate = {};
      if (query.startDate) {
        where.transactionDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.transactionDate.lte = new Date(query.endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          academicYear: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTransactionById(transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        academicYear: true,
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        attachments: true,
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async createTransaction(input: CreateTransactionInput, createdById: string) {
    // Verify student if provided
    if (input.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: input.studentId },
      });

      if (!student) {
        throw new Error('Student not found');
      }
    }

    // Verify academic year if provided
    if (input.academicYearId) {
      const academicYear = await prisma.academicYear.findUnique({
        where: { id: input.academicYearId },
      });

      if (!academicYear) {
        throw new Error('Academic year not found');
      }
    }

    // Generate receipt number if completed
    let receiptNumber = input.receiptNumber;
    if (input.status === 'COMPLETED' && !receiptNumber) {
      const count = await prisma.transaction.count({
        where: {
          status: 'COMPLETED',
          transactionDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
          },
        },
      });
      receiptNumber = `REC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
    }

    const transaction = await prisma.transaction.create({
      data: {
        type: input.type,
        category: input.category,
        amount: input.amount,
        currency: input.currency,
        description: input.description,
        paymentMethod: input.paymentMethod,
        status: input.status,
        referenceNumber: input.referenceNumber,
        receiptNumber,
        studentId: input.studentId,
        academicYearId: input.academicYearId,
        transactionDate: input.transactionDate ? new Date(input.transactionDate) : new Date(),
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        paidDate: input.paidDate ? new Date(input.paidDate) : input.status === 'COMPLETED' ? new Date() : undefined,
        createdById,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        academicYear: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Transaction',
        entityId: transaction.id,
        details: {
          type: input.type,
          category: input.category,
          amount: input.amount,
        },
      },
    });

    return transaction;
  }

  async updateTransaction(transactionId: string, input: UpdateTransactionInput, updatedById: string) {
    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    // Update paid date if status changed to COMPLETED
    let paidDate = input.paidDate ? new Date(input.paidDate) : undefined;
    if (input.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      paidDate = new Date();
    }

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        type: input.type,
        category: input.category,
        amount: input.amount,
        description: input.description,
        paymentMethod: input.paymentMethod,
        status: input.status,
        referenceNumber: input.referenceNumber,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        paidDate,
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        academicYear: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Transaction',
        entityId: transactionId,
        details: JSON.parse(JSON.stringify({ updates: input })),
      },
    });

    return transaction;
  }

  async deleteTransaction(transactionId: string, deletedById: string) {
    const existing = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Transaction',
        entityId: transactionId,
      },
    });

    return { message: 'Transaction deleted successfully' };
  }

  async generateInvoices(input: GenerateInvoicesInput, createdById: string) {
    // Verify academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    let studentIds: string[] = [];

    // Get students based on filters
    if (input.studentIds && input.studentIds.length > 0) {
      studentIds = input.studentIds;
    } else if (input.classId) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          classId: input.classId,
          academicYearId: input.academicYearId,
          status: 'ACTIVE',
        },
        select: { studentId: true },
      });
      studentIds = enrollments.map(e => e.studentId);
    } else if (input.gradeId) {
      const enrollments = await prisma.enrollment.findMany({
        where: {
          class: {
            gradeId: input.gradeId,
          },
          academicYearId: input.academicYearId,
          status: 'ACTIVE',
        },
        select: { studentId: true },
      });
      studentIds = enrollments.map(e => e.studentId);
    } else {
      // Get all active students
      const enrollments = await prisma.enrollment.findMany({
        where: {
          academicYearId: input.academicYearId,
          status: 'ACTIVE',
        },
        select: { studentId: true },
      });
      studentIds = [...new Set(enrollments.map(e => e.studentId))];
    }

    if (studentIds.length === 0) {
      throw new Error('No students found for invoice generation');
    }

    // Create transactions for all students
    const invoices = await Promise.all(
      studentIds.map(studentId =>
        prisma.transaction.create({
          data: {
            type: 'INCOME',
            category: input.category,
            amount: input.amount,
            currency: 'LAK',
            description: input.description,
            status: 'PENDING',
            studentId,
            academicYearId: input.academicYearId,
            transactionDate: new Date(),
            dueDate: new Date(input.dueDate),
            createdById,
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        })
      )
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Transaction',
        details: {
          bulkInvoiceGeneration: true,
          category: input.category,
          count: invoices.length,
        },
      },
    });

    return {
      invoices,
      count: invoices.length,
    };
  }

  async getFinancialSummary(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const [
      totalIncome,
      totalExpense,
      incomeByCategory,
      expenseByCategory,
      pendingPayments,
      recentTransactions,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME', status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE', status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { ...where, type: 'INCOME', status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.groupBy({
        by: ['category'],
        where: { ...where, type: 'EXPENSE', status: 'COMPLETED' },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.findMany({
        where: {
          ...where,
          type: 'INCOME',
          status: 'PENDING',
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        take: 10,
        orderBy: { dueDate: 'asc' },
      }),
      prisma.transaction.findMany({
        where,
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        take: 10,
        orderBy: { transactionDate: 'desc' },
      }),
    ]);

    const totalIncomeAmount = Number(totalIncome._sum.amount || 0);
    const totalExpenseAmount = Number(totalExpense._sum.amount || 0);

    return {
      summary: {
        totalIncome: totalIncomeAmount,
        totalExpense: totalExpenseAmount,
        netIncome: totalIncomeAmount - totalExpenseAmount,
        incomeTransactionCount: totalIncome._count,
        expenseTransactionCount: totalExpense._count,
      },
      incomeByCategory,
      expenseByCategory,
      pendingPayments,
      recentTransactions,
    };
  }

  async getStudentPaymentHistory(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const [transactions, summary] = await Promise.all([
      prisma.transaction.findMany({
        where: { studentId },
        include: {
          academicYear: true,
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        where: { studentId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      transactions,
      summary,
    };
  }

  async getOutstandingFees(academicYearId?: string) {
    const where: any = {
      type: 'INCOME',
      status: 'PENDING',
    };

    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const outstandingFees = await prisma.transaction.findMany({
      where,
      include: {
        student: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
        academicYear: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    const totalOutstanding = await prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      outstandingFees,
      total: totalOutstanding._sum.amount || 0,
      count: totalOutstanding._count,
    };
  }
}