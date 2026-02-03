import prisma from '../../config/database';
import { hashPassword } from '../../utils/bcrypt.util';

interface CreateStudentInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  studentId: string;
  dateOfBirth: string;
  gender: string;
  address?: string;
  enrollmentDate?: string;
}

interface UpdateStudentInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

interface EnrollStudentInput {
  classId: string;
  academicYearId: string;
  enrollmentDate?: string;
}

interface ListStudentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  classId?: string;
  gradeId?: string;
  status?: string;
}

export class StudentsService {
  async listStudents(query: ListStudentsQuery) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user: {
        status: { not: 'INACTIVE' },
      },
    };

    if (query.search) {
      where.OR = [
        { studentId: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    // Filter by class
    if (query.classId) {
      where.enrollments = {
        some: {
          classId: query.classId,
          status: 'ACTIVE',
        },
      };
    }

    // Filter by grade
    if (query.gradeId) {
      where.enrollments = {
        some: {
          class: {
            gradeId: query.gradeId,
          },
          status: 'ACTIVE',
        },
      };
    }

    // Get students and total count
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              status: true,
            },
          },
          enrollments: {
            where: { status: 'ACTIVE' },
            include: {
              class: {
                include: {
                  grade: true,
                },
              },
              academicYear: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStudentById(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profileImage: true,
            status: true,
            createdAt: true,
            lastLogin: true,
          },
        },
        enrollments: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            academicYear: true,
          },
          orderBy: { enrollmentDate: 'desc' },
        },
        parents: {
          include: {
            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phoneNumber: true,
                  },
                },
              },
            },
          },
        },
        scores: {
          include: {
            subject: true,
            classSubject: {
              include: {
                class: true,
                semester: true,
              },
            },
          },
          orderBy: { dateRecorded: 'desc' },
          take: 10,
        },
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  async createStudent(input: CreateStudentInput, createdById: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Check if student ID already exists
    const existingStudent = await prisma.student.findUnique({
      where: { studentId: input.studentId },
    });

    if (existingStudent) {
      throw new Error('Student ID already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user and student in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: input.email,
          username: input.username,
          password: hashedPassword,
          firstName: input.firstName,
          lastName: input.lastName,
          phoneNumber: input.phoneNumber,
          role: 'STUDENT',
        },
      });

      // Create student
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: input.studentId,
          dateOfBirth: new Date(input.dateOfBirth),
          gender: input.gender,
          address: input.address,
          enrollmentDate: input.enrollmentDate
            ? new Date(input.enrollmentDate)
            : new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              role: true,
              status: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: createdById,
          action: 'CREATE',
          entityType: 'Student',
          entityId: student.id,
          details: { studentId: student.studentId },
        },
      });

      return student;
    });

    return result;
  }

  async updateStudent(studentId: string, input: UpdateStudentInput, updatedById: string) {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true },
    });

    if (!existingStudent) {
      throw new Error('Student not found');
    }

    // Check email uniqueness if updating
    if (input.email && input.email !== existingStudent.user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (emailExists) {
        throw new Error('Email already in use');
      }
    }

    // Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user if there are user fields
      if (input.email || input.firstName || input.lastName || input.phoneNumber) {
        await tx.user.update({
          where: { id: existingStudent.userId },
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
          },
        });
      }

      // Update student
      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          gender: input.gender,
          address: input.address,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              status: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: updatedById,
          action: 'UPDATE',
          entityType: 'Student',
          entityId: studentId,
          details: JSON.parse(JSON.stringify({ updates: input })),
        },
      });

      return student;
    });

    return result;
  }

  async deleteStudent(studentId: string, deletedById: string) {
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Soft delete by setting user status to INACTIVE
    await prisma.user.update({
      where: { id: student.userId },
      data: { status: 'INACTIVE' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Student',
        entityId: studentId,
      },
    });

    return { message: 'Student deleted successfully' };
  }

  async enrollStudent(studentId: string, input: EnrollStudentInput, enrolledById: string) {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: input.classId },
    });

    if (!classExists) {
      throw new Error('Class not found');
    }

    // Verify academic year exists
    const academicYearExists = await prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });

    if (!academicYearExists) {
      throw new Error('Academic year not found');
    }

    // Check if already enrolled in this class for this academic year
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        classId: input.classId,
        academicYearId: input.academicYearId,
      },
    });

    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this class for this academic year');
    }

    // Check class capacity
    const enrollmentCount = await prisma.enrollment.count({
      where: {
        classId: input.classId,
        academicYearId: input.academicYearId,
        status: 'ACTIVE',
      },
    });

    if (enrollmentCount >= classExists.capacity) {
      throw new Error('Class is at full capacity');
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        classId: input.classId,
        academicYearId: input.academicYearId,
        enrollmentDate: input.enrollmentDate ? new Date(input.enrollmentDate) : new Date(),
        status: 'ACTIVE',
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        academicYear: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: enrolledById,
        action: 'CREATE',
        entityType: 'Enrollment',
        entityId: enrollment.id,
        details: {
          studentId,
          classId: input.classId,
          academicYearId: input.academicYearId,
        },
      },
    });

    return enrollment;
  }

  async getStudentEnrollments(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        academicYear: true,
      },
      orderBy: { enrollmentDate: 'desc' },
    });

    return enrollments;
  }

  async updateEnrollmentStatus(
    enrollmentId: string,
    status: string,
    updatedById: string
  ) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: {
        class: {
          include: {
            grade: true,
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
        entityType: 'Enrollment',
        entityId: enrollmentId,
        details: { statusChanged: status },
      },
    });

    return updatedEnrollment;
  }

  async getStudentScores(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const scores = await prisma.score.findMany({
      where: { studentId },
      include: {
        subject: true,
        classSubject: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            semester: true,
          },
        },
      },
      orderBy: { dateRecorded: 'desc' },
    });

    return scores;
  }

  async getStudentTransactions(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    const transactions = await prisma.transaction.findMany({
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
    });

    return transactions;
  }
}