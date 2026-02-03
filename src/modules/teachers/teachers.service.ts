import prisma from '../../config/database';
import { hashPassword } from '../../utils/bcrypt.util';

interface CreateTeacherInput {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  employeeId: string;
  specialization?: string;
  qualification?: string;
  hireDate: string;
  salary?: number;
}

interface UpdateTeacherInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  specialization?: string;
  qualification?: string;
  salary?: number;
}

interface AssignSubjectInput {
  classId: string;
  subjectId: string;
  semesterId: string;
}

interface ListTeachersQuery {
  page?: number;
  limit?: number;
  search?: string;
  specialization?: string;
}

export class TeachersService {
  async listTeachers(query: ListTeachersQuery) {
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
        { employeeId: { contains: query.search, mode: 'insensitive' } },
        { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.specialization) {
      where.specialization = { contains: query.specialization, mode: 'insensitive' };
    }

    // Get teachers and total count
    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacher.count({ where }),
    ]);

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTeacherById(teacherId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
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
        subjects: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            subject: true,
            semester: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return teacher;
  }

  async createTeacher(input: CreateTeacherInput, createdById: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.email }, { username: input.username }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Check if employee ID already exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { employeeId: input.employeeId },
    });

    if (existingTeacher) {
      throw new Error('Employee ID already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(input.password);

    // Create user and teacher in a transaction
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
          role: 'TEACHER',
        },
      });

      // Create teacher
      const teacher = await tx.teacher.create({
        data: {
          userId: user.id,
          employeeId: input.employeeId,
          specialization: input.specialization,
          qualification: input.qualification,
          hireDate: new Date(input.hireDate),
          salary: input.salary,
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
          entityType: 'Teacher',
          entityId: teacher.id,
          details: { employeeId: teacher.employeeId },
        },
      });

      return teacher;
    });

    return result;
  }

  async updateTeacher(teacherId: string, input: UpdateTeacherInput, updatedById: string) {
    // Check if teacher exists
    const existingTeacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!existingTeacher) {
      throw new Error('Teacher not found');
    }

    // Check email uniqueness if updating
    if (input.email && input.email !== existingTeacher.user.email) {
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
          where: { id: existingTeacher.userId },
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            phoneNumber: input.phoneNumber,
          },
        });
      }

      // Update teacher
      const teacher = await tx.teacher.update({
        where: { id: teacherId },
        data: {
          specialization: input.specialization,
          qualification: input.qualification,
          salary: input.salary,
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
          entityType: 'Teacher',
          entityId: teacherId,
          details: JSON.parse(JSON.stringify({ updates: input })),
        },
      });

      return teacher;
    });

    return result;
  }

  async deleteTeacher(teacherId: string, deletedById: string) {
    // Check if teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Soft delete by setting user status to INACTIVE
    await prisma.user.update({
      where: { id: teacher.userId },
      data: { status: 'INACTIVE' },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Teacher',
        entityId: teacherId,
      },
    });

    return { message: 'Teacher deleted successfully' };
  }

  async assignSubject(teacherId: string, input: AssignSubjectInput, assignedById: string) {
    // Verify teacher exists
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Verify class exists
    const classExists = await prisma.class.findUnique({
      where: { id: input.classId },
    });

    if (!classExists) {
      throw new Error('Class not found');
    }

    // Verify subject exists
    const subjectExists = await prisma.subject.findUnique({
      where: { id: input.subjectId },
    });

    if (!subjectExists) {
      throw new Error('Subject not found');
    }

    // Verify semester exists
    const semesterExists = await prisma.semester.findUnique({
      where: { id: input.semesterId },
    });

    if (!semesterExists) {
      throw new Error('Semester not found');
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.classSubject.findFirst({
      where: {
        classId: input.classId,
        subjectId: input.subjectId,
        semesterId: input.semesterId,
      },
    });

    if (existingAssignment) {
      throw new Error('This subject is already assigned to this class for this semester');
    }

    // Create assignment
    const assignment = await prisma.classSubject.create({
      data: {
        classId: input.classId,
        subjectId: input.subjectId,
        teacherId: teacherId,
        semesterId: input.semesterId,
      },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        subject: true,
        semester: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: assignedById,
        action: 'CREATE',
        entityType: 'ClassSubject',
        entityId: assignment.id,
        details: {
          teacherId,
          classId: input.classId,
          subjectId: input.subjectId,
        },
      },
    });

    return assignment;
  }

  async getTeacherSubjects(teacherId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const subjects = await prisma.classSubject.findMany({
      where: { teacherId },
      include: {
        class: {
          include: {
            grade: true,
          },
        },
        subject: true,
        semester: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subjects;
  }

  async removeSubjectAssignment(assignmentId: string, removedById: string) {
    const assignment = await prisma.classSubject.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new Error('Assignment not found');
    }

    await prisma.classSubject.delete({
      where: { id: assignmentId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: removedById,
        action: 'DELETE',
        entityType: 'ClassSubject',
        entityId: assignmentId,
      },
    });

    return { message: 'Subject assignment removed successfully' };
  }
}