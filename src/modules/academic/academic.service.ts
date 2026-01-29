import prisma from '../../config/database';

// ============================================
// ACADEMIC YEARS
// ============================================

interface CreateAcademicYearInput {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

interface UpdateAcademicYearInput {
  name?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
}

// ============================================
// SEMESTERS
// ============================================

interface CreateSemesterInput {
  name: string;
  academicYearId: string;
  startDate: string;
  endDate: string;
}

interface UpdateSemesterInput {
  name?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================
// GRADES
// ============================================

interface CreateGradeInput {
  name: string;
  level: number;
  description?: string;
}

interface UpdateGradeInput {
  name?: string;
  level?: number;
  description?: string;
}

// ============================================
// CLASSES
// ============================================

interface CreateClassInput {
  name: string;
  gradeId: string;
  capacity?: number;
  room?: string;
}

interface UpdateClassInput {
  name?: string;
  capacity?: number;
  room?: string;
}

// ============================================
// SUBJECTS
// ============================================

interface CreateSubjectInput {
  name: string;
  code: string;
  description?: string;
  credits?: number;
}

interface UpdateSubjectInput {
  name?: string;
  description?: string;
  credits?: number;
}

export class AcademicService {
  // ============================================
  // ACADEMIC YEARS
  // ============================================

  async listAcademicYears() {
    return prisma.academicYear.findMany({
      include: {
        semesters: true,
        _count: {
          select: {
            enrollments: true,
            transactions: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getAcademicYearById(id: string) {
    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        semesters: true,
        enrollments: {
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
            class: {
              include: {
                grade: true,
              },
            },
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    return academicYear;
  }

  async createAcademicYear(input: CreateAcademicYearInput, createdById: string) {
    // If setting as current, unset other current years
    if (input.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name: input.name,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        isCurrent: input.isCurrent || false,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'AcademicYear',
        entityId: academicYear.id,
      },
    });

    return academicYear;
  }

  async updateAcademicYear(id: string, input: UpdateAcademicYearInput, updatedById: string) {
    const existing = await prisma.academicYear.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Academic year not found');
    }

    // If setting as current, unset other current years
    if (input.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { isCurrent: true, id: { not: id } },
        data: { isCurrent: false },
      });
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        name: input.name,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        isCurrent: input.isCurrent,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'AcademicYear',
        entityId: id,
      },
    });

    return academicYear;
  }

  async deleteAcademicYear(id: string, deletedById: string) {
    const existing = await prisma.academicYear.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Academic year not found');
    }

    await prisma.academicYear.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'AcademicYear',
        entityId: id,
      },
    });

    return { message: 'Academic year deleted successfully' };
  }

  // ============================================
  // SEMESTERS
  // ============================================

  async listSemesters(academicYearId?: string) {
    return prisma.semester.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      include: {
        academicYear: true,
        _count: {
          select: {
            classSubjects: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async getSemesterById(id: string) {
    const semester = await prisma.semester.findUnique({
      where: { id },
      include: {
        academicYear: true,
        classSubjects: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            subject: true,
            teacher: {
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
        },
      },
    });

    if (!semester) {
      throw new Error('Semester not found');
    }

    return semester;
  }

  async createSemester(input: CreateSemesterInput, createdById: string) {
    // Verify academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: input.academicYearId },
    });

    if (!academicYear) {
      throw new Error('Academic year not found');
    }

    const semester = await prisma.semester.create({
      data: {
        name: input.name,
        academicYearId: input.academicYearId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
      },
      include: {
        academicYear: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Semester',
        entityId: semester.id,
      },
    });

    return semester;
  }

  async updateSemester(id: string, input: UpdateSemesterInput, updatedById: string) {
    const existing = await prisma.semester.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Semester not found');
    }

    const semester = await prisma.semester.update({
      where: { id },
      data: {
        name: input.name,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      },
      include: {
        academicYear: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Semester',
        entityId: id,
      },
    });

    return semester;
  }

  async deleteSemester(id: string, deletedById: string) {
    const existing = await prisma.semester.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Semester not found');
    }

    await prisma.semester.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Semester',
        entityId: id,
      },
    });

    return { message: 'Semester deleted successfully' };
  }

  // ============================================
  // GRADES
  // ============================================

  async listGrades() {
    return prisma.grade.findMany({
      include: {
        classes: {
          include: {
            _count: {
              select: {
                enrollments: true,
              },
            },
          },
        },
      },
      orderBy: { level: 'asc' },
    });
  }

  async getGradeById(id: string) {
    const grade = await prisma.grade.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
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
            },
          },
        },
      },
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    return grade;
  }

  async createGrade(input: CreateGradeInput, createdById: string) {
    // Check if level already exists
    const existing = await prisma.grade.findFirst({
      where: { level: input.level },
    });

    if (existing) {
      throw new Error('Grade level already exists');
    }

    const grade = await prisma.grade.create({
      data: {
        name: input.name,
        level: input.level,
        description: input.description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Grade',
        entityId: grade.id,
      },
    });

    return grade;
  }

  async updateGrade(id: string, input: UpdateGradeInput, updatedById: string) {
    const existing = await prisma.grade.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Grade not found');
    }

    // Check if new level conflicts with existing
    if (input.level && input.level !== existing.level) {
      const levelExists = await prisma.grade.findFirst({
        where: { level: input.level, id: { not: id } },
      });

      if (levelExists) {
        throw new Error('Grade level already exists');
      }
    }

    const grade = await prisma.grade.update({
      where: { id },
      data: {
        name: input.name,
        level: input.level,
        description: input.description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Grade',
        entityId: id,
      },
    });

    return grade;
  }

  async deleteGrade(id: string, deletedById: string) {
    const existing = await prisma.grade.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Grade not found');
    }

    // Check if grade has classes
    const classCount = await prisma.class.count({
      where: { gradeId: id },
    });

    if (classCount > 0) {
      throw new Error('Cannot delete grade with existing classes');
    }

    await prisma.grade.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Grade',
        entityId: id,
      },
    });

    return { message: 'Grade deleted successfully' };
  }

  // ============================================
  // CLASSES
  // ============================================

  async listClasses(gradeId?: string) {
    return prisma.class.findMany({
      where: gradeId ? { gradeId } : undefined,
      include: {
        grade: true,
        _count: {
          select: {
            enrollments: true,
            subjects: true,
          },
        },
      },
      orderBy: [{ grade: { level: 'asc' } }, { name: 'asc' }],
    });
  }

  async getClassById(id: string) {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        grade: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            academicYear: true,
          },
        },
        subjects: {
          include: {
            subject: true,
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            semester: true,
          },
        },
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    return classData;
  }

  async createClass(input: CreateClassInput, createdById: string) {
    // Verify grade exists
    const grade = await prisma.grade.findUnique({
      where: { id: input.gradeId },
    });

    if (!grade) {
      throw new Error('Grade not found');
    }

    const classData = await prisma.class.create({
      data: {
        name: input.name,
        gradeId: input.gradeId,
        capacity: input.capacity || 30,
        room: input.room,
      },
      include: {
        grade: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Class',
        entityId: classData.id,
      },
    });

    return classData;
  }

  async updateClass(id: string, input: UpdateClassInput, updatedById: string) {
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Class not found');
    }

    const classData = await prisma.class.update({
      where: { id },
      data: {
        name: input.name,
        capacity: input.capacity,
        room: input.room,
      },
      include: {
        grade: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Class',
        entityId: id,
      },
    });

    return classData;
  }

  async deleteClass(id: string, deletedById: string) {
    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Class not found');
    }

    // Check if class has active enrollments
    const activeEnrollments = await prisma.enrollment.count({
      where: { classId: id, status: 'ACTIVE' },
    });

    if (activeEnrollments > 0) {
      throw new Error('Cannot delete class with active enrollments');
    }

    await prisma.class.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Class',
        entityId: id,
      },
    });

    return { message: 'Class deleted successfully' };
  }

  // ============================================
  // SUBJECTS
  // ============================================

  async listSubjects() {
    return prisma.subject.findMany({
      include: {
        _count: {
          select: {
            classes: true,
            scores: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getSubjectById(id: string) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            semester: true,
          },
        },
      },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    return subject;
  }

  async createSubject(input: CreateSubjectInput, createdById: string) {
    // Check if code already exists
    const existing = await prisma.subject.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new Error('Subject code already exists');
    }

    const subject = await prisma.subject.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        credits: input.credits || 1,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Subject',
        entityId: subject.id,
      },
    });

    return subject;
  }

  async updateSubject(id: string, input: UpdateSubjectInput, updatedById: string) {
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Subject not found');
    }

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        credits: input.credits,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Subject',
        entityId: id,
      },
    });

    return subject;
  }

  async deleteSubject(id: string, deletedById: string) {
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Subject not found');
    }

    // Check if subject is assigned to any classes
    const assignmentCount = await prisma.classSubject.count({
      where: { subjectId: id },
    });

    if (assignmentCount > 0) {
      throw new Error('Cannot delete subject with existing class assignments');
    }

    await prisma.subject.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Subject',
        entityId: id,
      },
    });

    return { message: 'Subject deleted successfully' };
  }
}