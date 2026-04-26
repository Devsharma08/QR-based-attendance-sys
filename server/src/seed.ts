import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Optional: Uncomment these to wipe the database clean before seeding
  /*
  await prisma.attendance.deleteMany();
  await prisma.session.deleteMany();
  await prisma.timetable.deleteMany();
  await prisma.room.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  */

  // Common password for all test users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Department
  const dept = await prisma.department.create({
    data: { name: "Computer Science" }
  });
  console.log("✅ Created Department: CS");

  // 2. Create HOD
  const hod = await prisma.user.create({
    data: {
      name: "Dr. Alan Turing",
      email: "hod@college.edu",
      password: hashedPassword,
      role: "HOD",
      departmentId: dept.id
    }
  });
  console.log("✅ Created HOD (hod@college.edu)");

  // 3. Create Teachers
  const teacher1 = await prisma.user.create({
    data: { name: "Prof. Grace Hopper", email: "grace@college.edu", password: hashedPassword, role: "TEACHER", departmentId: dept.id }
  });
  const teacher2 = await prisma.user.create({
    data: { name: "Prof. John von Neumann", email: "john@college.edu", password: hashedPassword, role: "TEACHER", departmentId: dept.id }
  });
  console.log("✅ Created Teachers (grace@, john@)");

  // 4. Create Students (Batch A & B)
  const students = [];
  for (let i = 1; i <= 10; i++) {
    // Group 1
    students.push(await prisma.user.create({
      data: { name: `Student A${i}`, email: `studentA${i}@college.edu`, password: hashedPassword, role: "STUDENT", departmentId: dept.id, batch: "Group-1" }
    }));
    // Group 2
    students.push(await prisma.user.create({
      data: { name: `Student B${i}`, email: `studentB${i}@college.edu`, password: hashedPassword, role: "STUDENT", departmentId: dept.id, batch: "Group-2" }
    }));
  }
  console.log(`✅ Created ${students.length} Students (studentA1@... - studentB10@...)`);

  // 5. Create Rooms
  const room1 = await prisma.room.create({ data: { name: "Lab 1", qrPayload: "room-lab-1-secret", capacity: 60, departmentId: dept.id } });
  const room2 = await prisma.room.create({ data: { name: "Lecture Hall A", qrPayload: "room-hall-a-secret", capacity: 120, departmentId: dept.id } });
  console.log("✅ Created Rooms (Lab 1, Lecture Hall A)");

  // 6. Create Subjects
  const sub1 = await prisma.subject.create({ data: { code: "CS101", name: "Intro to Programming", departmentId: dept.id } });
  const sub2 = await prisma.subject.create({ data: { code: "CS201", name: "Data Structures", departmentId: dept.id } });
  console.log("✅ Created Subjects (CS101, CS201)");

  // 7. Create Timetables
  const tt1 = await prisma.timetable.create({
    data: { dayOfWeek: "MONDAY", startTime: "09:00", endTime: "10:30", subjectId: sub1.id, teacherId: teacher1.id, roomId: room1.id, batch: "Group-1" }
  });
  const tt2 = await prisma.timetable.create({
    data: { dayOfWeek: "MONDAY", startTime: "11:00", endTime: "12:30", subjectId: sub2.id, teacherId: teacher2.id, roomId: room2.id, batch: null } // null = whole class
  });
  console.log("✅ Created Timetables");

  // 8. Simulate an active session and some attendance
  const session = await prisma.session.create({
    data: { timetableId: tt1.id, status: "ACTIVE" }
  });
  
  // Add first 3 students from Group-1 to this session's attendance
  for(let i=0; i<3; i++) {
    await prisma.attendance.create({
      data: { sessionId: session.id, studentId: students[i*2].id } // *2 to only grab Group 1 students
    });
  }
  console.log("✅ Created an Active Session & Dummy Attendance");

  console.log("🎉 Seeding complete! All accounts use password: 'password123'");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
