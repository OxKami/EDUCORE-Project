import prisma from '../../config/database';
import { ScoreType } from '@prisma/client';

interface CreateScoreInput {
  studentId: string;
  classSubjectId: string;
  subjectId: string;
  scoreType: ScoreType;
  score: number;
  maxScore: number;
  weight: number;
  notes?: string;
  dateRecorded?: string;
}

interface UpdateScoreInput {
  score?: number;
  maxScore?: number;
  weight?: number;
  notes?: string;
}

interface BulkCreateScoresInput {
  classSubjectId: string;
  subjectId: string;
  scoreType: ScoreType;
  maxScore: number;
  weight: number;
  scores: {
    studentId: string;
    score: number;
    notes?: string;
  }[];
  dateRecorded?: string;
}

interface ListScoresQuery {
  studentId?: string;
  classSubjectId?: string;
  subjectId?: string;
  scoreType?: ScoreType;
  page?: number;
  limit?: number;
}

export class GradingService {
  async listScores(query: ListScoresQuery) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.studentId) {
      where.studentId = query.studentId;
    }

    if (query.classSubjectId) {
      where.classSubjectId = query.classSubjectId;
    }

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    if (query.scoreType) {
      where.scoreType = query.scoreType;
    }

    const [scores, total] = await Promise.all([
      prisma.score.findMany({
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
      }),
      prisma.score.count({ where }),
    ]);

    return {
      scores,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getScoreById(scoreId: string) {
    const score = await prisma.score.findUnique({
      where: { id: scoreId },
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
        subject: true,
        classSubject: {
          include: {
            class: {
              include: {
                grade: true,
              },
            },
            semester: true,
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

    if (!score) {
      throw new Error('Score not found');
    }

    return score;
  }

  async createScore(input: CreateScoreInput, createdById: string) {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: input.studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Verify class subject exists
    const classSubject = await prisma.classSubject.findUnique({
      where: { id: input.classSubjectId },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: input.subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    // Create score
    const score = await prisma.score.create({
      data: {
        studentId: input.studentId,
        classSubjectId: input.classSubjectId,
        subjectId: input.subjectId,
        scoreType: input.scoreType,
        score: input.score,
        maxScore: input.maxScore,
        weight: input.weight,
        notes: input.notes,
        dateRecorded: input.dateRecorded ? new Date(input.dateRecorded) : new Date(),
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
        subject: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: createdById,
        action: 'CREATE',
        entityType: 'Score',
        entityId: score.id,
        details: {
          studentId: input.studentId,
          subjectId: input.subjectId,
          scoreType: input.scoreType,
          score: input.score,
        },
      },
    });

    return score;
  }

  async bulkCreateScores(input: BulkCreateScoresInput, createdById: string) {
    // Verify class subject exists
    const classSubject = await prisma.classSubject.findUnique({
      where: { id: input.classSubjectId },
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: input.subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    // Verify all students exist
    const studentIds = input.scores.map(s => s.studentId);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
    });

    if (students.length !== studentIds.length) {
      throw new Error('One or more students not found');
    }

    // Create scores in transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdScores = await Promise.all(
        input.scores.map(scoreData =>
          tx.score.create({
            data: {
              studentId: scoreData.studentId,
              classSubjectId: input.classSubjectId,
              subjectId: input.subjectId,
              scoreType: input.scoreType,
              score: scoreData.score,
              maxScore: input.maxScore,
              weight: input.weight,
              notes: scoreData.notes,
              dateRecorded: input.dateRecorded ? new Date(input.dateRecorded) : new Date(),
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
      await tx.auditLog.create({
        data: {
          userId: createdById,
          action: 'CREATE',
          entityType: 'Score',
          details: {
            bulkCreate: true,
            classSubjectId: input.classSubjectId,
            scoreType: input.scoreType,
            count: input.scores.length,
          },
        },
      });

      return createdScores;
    });

    return result;
  }

  async updateScore(scoreId: string, input: UpdateScoreInput, updatedById: string) {
    const existing = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!existing) {
      throw new Error('Score not found');
    }

    const score = await prisma.score.update({
      where: { id: scoreId },
      data: {
        score: input.score,
        maxScore: input.maxScore,
        weight: input.weight,
        notes: input.notes,
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
        subject: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'Score',
        entityId: scoreId,
        details: JSON.parse(JSON.stringify({ updates: input })),
      },
    });

    return score;
  }

  async deleteScore(scoreId: string, deletedById: string) {
    const existing = await prisma.score.findUnique({
      where: { id: scoreId },
    });

    if (!existing) {
      throw new Error('Score not found');
    }

    await prisma.score.delete({
      where: { id: scoreId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: deletedById,
        action: 'DELETE',
        entityType: 'Score',
        entityId: scoreId,
      },
    });

    return { message: 'Score deleted successfully' };
  }

  async getStudentGrades(studentId: string, semesterId?: string) {
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Build where clause
    const where: any = { studentId };

    if (semesterId) {
      where.classSubject = {
        semesterId,
      };
    }

    // Get all scores
    const scores = await prisma.score.findMany({
      where,
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
    });

    // Group scores by subject
    const subjectGrades: any = {};

    scores.forEach(score => {
      const subjectId = score.subjectId;

      if (!subjectGrades[subjectId]) {
        subjectGrades[subjectId] = {
          subject: score.subject,
          class: score.classSubject.class,
          semester: score.classSubject.semester,
          scores: [],
          totalWeightedScore: 0,
          totalWeight: 0,
        };
      }

      const scoreNum = Number(score.score);
      const maxScoreNum = Number(score.maxScore);
      const weightNum = Number(score.weight);
      const percentage = (scoreNum / maxScoreNum) * 100;
      const weightedScore = percentage * weightNum;

      subjectGrades[subjectId].scores.push({
        id: score.id,
        scoreType: score.scoreType,
        score: score.score,
        maxScore: score.maxScore,
        weight: score.weight,
        percentage: Math.round(percentage * 100) / 100,
        weightedScore: Math.round(weightedScore * 100) / 100,
        notes: score.notes,
        dateRecorded: score.dateRecorded,
      });

      subjectGrades[subjectId].totalWeightedScore += weightedScore;
      subjectGrades[subjectId].totalWeight += weightNum;
    });

    // Calculate final grades
    const results = Object.values(subjectGrades).map((subjectData: any) => {
      const finalGrade = subjectData.totalWeight > 0
        ? Math.round((subjectData.totalWeightedScore / subjectData.totalWeight) * 100) / 100
        : 0;

      let letterGrade = 'F';
      if (finalGrade >= 90) letterGrade = 'A';
      else if (finalGrade >= 80) letterGrade = 'B';
      else if (finalGrade >= 70) letterGrade = 'C';
      else if (finalGrade >= 60) letterGrade = 'D';

      return {
        subject: subjectData.subject,
        class: subjectData.class,
        semester: subjectData.semester,
        scores: subjectData.scores,
        finalGrade,
        letterGrade,
        totalWeight: subjectData.totalWeight,
      };
    });

    return results;
  }

  async getClassSubjectScores(classSubjectId: string) {
    // Verify class subject exists
    const classSubject = await prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: {
        class: {
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
        subject: true,
        semester: true,
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
    });

    if (!classSubject) {
      throw new Error('Class subject not found');
    }

    // Get all scores for this class subject
    const scores = await prisma.score.findMany({
      where: { classSubjectId },
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
      orderBy: [
        { student: { user: { lastName: 'asc' } } },
        { scoreType: 'asc' },
      ],
    });

    // Group scores by student
    const studentScores: any = {};

    classSubject.class.enrollments.forEach(enrollment => {
      const studentId = enrollment.student.id;
      studentScores[studentId] = {
        student: enrollment.student,
        scores: [],
        totalWeightedScore: 0,
        totalWeight: 0,
      };
    });

    scores.forEach(score => {
      if (studentScores[score.studentId]) {
        const scoreNum = Number(score.score);
        const maxScoreNum = Number(score.maxScore);
        const weightNum = Number(score.weight);
        const percentage = (scoreNum / maxScoreNum) * 100;
        const weightedScore = percentage * weightNum;

        studentScores[score.studentId].scores.push({
          id: score.id,
          scoreType: score.scoreType,
          score: score.score,
          maxScore: score.maxScore,
          weight: score.weight,
          percentage: Math.round(percentage * 100) / 100,
          dateRecorded: score.dateRecorded,
        });

        studentScores[score.studentId].totalWeightedScore += weightedScore;
        studentScores[score.studentId].totalWeight += weightNum;
      }
    });

    // Calculate final grades
    const results = Object.values(studentScores).map((studentData: any) => {
      const finalGrade = studentData.totalWeight > 0
        ? Math.round((studentData.totalWeightedScore / studentData.totalWeight) * 100) / 100
        : 0;

      let letterGrade = 'F';
      if (finalGrade >= 90) letterGrade = 'A';
      else if (finalGrade >= 80) letterGrade = 'B';
      else if (finalGrade >= 70) letterGrade = 'C';
      else if (finalGrade >= 60) letterGrade = 'D';

      return {
        student: studentData.student,
        scores: studentData.scores,
        finalGrade,
        letterGrade,
      };
    });

    return {
      classSubject,
      students: results,
    };
  }
}