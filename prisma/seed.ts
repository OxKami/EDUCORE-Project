import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create admin user
  console.log('Creating admin user...');
  const adminPassword = await hashPassword('Admin@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@educore.la' },
    update: {},
    create: {
      email: 'admin@educore.la',
      username: 'admin',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      phoneNumber: '+856 20 12345678',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create academic year
  console.log('\nCreating academic year...');
  const academicYear = await prisma.academicYear.create({
    data: {
      name: '2024-2025',
      startDate: new Date('2024-08-01'),
      endDate: new Date('2025-05-31'),
      isCurrent: true,
    },
  });
  console.log('✅ Academic year created:', academicYear.name);

  // Create semesters
  console.log('\nCreating semesters...');
  const semester1 = await prisma.semester.create({
    data: {
      name: 'Semester 1',
      academicYearId: academicYear.id,
      startDate: new Date('2024-08-01'),
      endDate: new Date('2024-12-31'),
    },
  });

  const semester2 = await prisma.semester.create({
    data: {
      name: 'Semester 2',
      academicYearId: academicYear.id,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-05-31'),
    },
  });
  console.log('✅ Semesters created');

  // Create grades
  console.log('\nCreating grades...');
  const grades = await Promise.all([
    prisma.grade.create({ data: { name: 'Grade 1', level: 1 } }),
    prisma.grade.create({ data: { name: 'Grade 2', level: 2 } }),
    prisma.grade.create({ data: { name: 'Grade 3', level: 3 } }),
    prisma.grade.create({ data: { name: 'Grade 4', level: 4 } }),
    prisma.grade.create({ data: { name: 'Grade 5', level: 5 } }),
    prisma.grade.create({ data: { name: 'Grade 6', level: 6 } }),
  ]);
  console.log('✅ Created', grades.length, 'grades');

  // Create subjects
  console.log('\nCreating subjects...');
  const subjects = await Promise.all([
    prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH', credits: 4 } }),
    prisma.subject.create({ data: { name: 'English', code: 'ENG', credits: 4 } }),
    prisma.subject.create({ data: { name: 'Lao Language', code: 'LAO', credits: 4 } }),
    prisma.subject.create({ data: { name: 'Science', code: 'SCI', credits: 3 } }),
    prisma.subject.create({ data: { name: 'Social Studies', code: 'SOC', credits: 3 } }),
    prisma.subject.create({ data: { name: 'Physical Education', code: 'PE', credits: 2 } }),
  ]);
  console.log('✅ Created', subjects.length, 'subjects');

  // Create teacher
  console.log('\nCreating sample teacher...');
  const teacherPassword = await hashPassword('Teacher@123');
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@educore.la',
      username: 'teacher01',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      phoneNumber: '+856 20 87654321',
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'TEACH-2024-001',
      specialization: 'Mathematics',
      qualification: "Bachelor's Degree in Mathematics",
      hireDate: new Date('2024-01-01'),
      salary: 5000000,
    },
  });
  console.log('✅ Teacher created:', teacherUser.email);

  // Create classes
  console.log('\nCreating classes...');
  const class1A = await prisma.class.create({
    data: {
      name: '1A',
      gradeId: grades[0].id,
      capacity: 30,
      room: 'Room 101',
    },
  });

  const class1B = await prisma.class.create({
    data: {
      name: '1B',
      gradeId: grades[0].id,
      capacity: 30,
      room: 'Room 102',
    },
  });
  console.log('✅ Classes created');

  // Create students
  console.log('\nCreating sample students...');
  for (let i = 1; i <= 5; i++) {
    const studentPassword = await hashPassword('Student@123');
    const studentUser = await prisma.user.create({
      data: {
        email: `student${i}@educore.la`,
        username: `student${String(i).padStart(3, '0')}`,
        password: studentPassword,
        firstName: `Student${i}`,
        lastName: 'Test',
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        studentId: `STD-2024-${String(i).padStart(3, '0')}`,
        dateOfBirth: new Date('2015-01-15'),
        gender: i % 2 === 0 ? 'Male' : 'Female',
        address: `Address ${i}, Vientiane`,
        enrollmentDate: new Date('2024-08-01'),
      },
    });

    // Enroll student
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: class1A.id,
        academicYearId: academicYear.id,
        status: 'ACTIVE',
      },
    });
  }
  console.log('✅ Created 5 students');

  // Create system config
  console.log('\nCreating system configuration...');
  await prisma.systemConfig.createMany({
    data: [
      {
        key: 'school_name',
        value: 'EduCore Demo School',
        description: 'Official school name',
        category: 'GENERAL',
        isPublic: true,
      },
      {
        key: 'school_address',
        value: 'Vientiane, Lao PDR',
        description: 'School address',
        category: 'GENERAL',
        isPublic: true,
      },
      {
        key: 'currency',
        value: 'LAK',
        description: 'Default currency',
        category: 'FINANCE',
        isPublic: true,
      },
    ],
  });
  console.log('✅ System configuration created');

  console.log('\n🎉 Database seeding completed!\n');
  console.log('📝 Login credentials:');
  console.log('-----------------------------------');
  console.log('Admin:');
  console.log('  Email: admin@educore.la');
  console.log('  Password: Admin@123\n');
  console.log('Teacher:');
  console.log('  Email: teacher@educore.la');
  console.log('  Password: Teacher@123\n');
  console.log('Student:');
  console.log('  Email: student1@educore.la');
  console.log('  Password: Student@123');
  console.log('-----------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });