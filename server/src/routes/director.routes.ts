import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requiredRole } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);
router.use(requiredRole(['DIRECTOR']));

// ─────────────────────────────────────────────
// DEPARTMENT CRUD
// ─────────────────────────────────────────────

// GET all departments (with user/subject/room counts)
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: {
            users: true,
            subjects: true,
            rooms: true,
          }
        }
      }
    });
    res.json(departments);
  } catch (error) {
    console.error('departments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST create a department
router.post('/departments', async (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Department name is required' });
  try {
    const dept = await prisma.department.create({ data: { name } });
    res.status(201).json(dept);
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Department already exists' });
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PATCH update a department name
router.patch('/departments/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: 'Department name is required' });
  try {
    const dept = await prisma.department.update({ where: { id }, data: { name } });
    res.json(dept);
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Department not found' });
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE a department
router.delete('/departments/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Department not found' });
    if (error.code === 'P2003') return res.status(400).json({ message: 'Cannot delete — department has linked data (users/rooms/subjects).' });
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ─────────────────────────────────────────────
// OVERVIEW ANALYTICS
// ─────────────────────────────────────────────

// GET campus-wide overview stats
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [
      totalDepts,
      totalStudents,
      totalTeachers,
      totalSessions,
      totalAttendances,
      activeSessions
    ] = await Promise.all([
      prisma.department.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'TEACHER' } }),
      prisma.session.count(),
      prisma.attendance.count(),
      prisma.session.count({ where: { status: 'ACTIVE' } }),
    ]);

    res.json({
      totalDepts,
      totalStudents,
      totalTeachers,
      totalSessions,
      totalAttendances,
      activeSessions,
      // Campus-wide attendance rate
      attendanceRate: totalSessions > 0
        ? Math.round((totalAttendances / (totalSessions * Math.max(totalStudents, 1))) * 100)
        : 0,
    });
  } catch (error) {
    console.error('overview error:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// ─────────────────────────────────────────────
// HEAD-TO-HEAD DEPARTMENT ANALYTICS
// ─────────────────────────────────────────────

// GET per-department analytics for comparison
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { users: true, subjects: true, rooms: true }
        }
      }
    });

    const analytics = await Promise.all(departments.map(async (dept) => {
      // Students in this dept
      const studentCount = await prisma.user.count({
        where: { departmentId: dept.id, role: 'STUDENT' }
      });

      // Teachers in this dept
      const teacherCount = await prisma.user.count({
        where: { departmentId: dept.id, role: 'TEACHER' }
      });

      // Total sessions for this dept (via rooms)
      const sessionCount = await prisma.session.count({
        where: {
          timetable: {
            room: { departmentId: dept.id }
          }
        }
      });

      // Total attendances for this dept
      const attendanceCount = await prisma.attendance.count({
        where: {
          session: {
            timetable: {
              room: { departmentId: dept.id }
            }
          }
        }
      });

      // Closed sessions (for rate calculation)
      const closedSessions = await prisma.session.count({
        where: {
          status: 'CLOSED',
          timetable: { room: { departmentId: dept.id } }
        }
      });

      // Attendance rate: attendances / (closedSessions * students), capped at 100
      const maxPossible = closedSessions * Math.max(studentCount, 1);
      const attendanceRate = maxPossible > 0
        ? Math.min(100, Math.round((attendanceCount / maxPossible) * 100))
        : 0;

      return {
        id: dept.id,
        name: dept.name,
        studentCount,
        teacherCount,
        subjectCount: dept._count.subjects,
        roomCount: dept._count.rooms,
        sessionCount,
        attendanceCount,
        closedSessions,
        attendanceRate,
        // Ratio of teachers per student (higher = more personalized teaching)
        teacherStudentRatio: studentCount > 0
          ? parseFloat((teacherCount / studentCount).toFixed(2))
          : 0,
      };
    }));

    res.json(analytics);
  } catch (error) {
    console.error('analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET all users across the system (for a master user list)
router.get('/users', async (req: Request, res: Response) => {
  const role = req.query.role as string;
  const departmentId = req.query.departmentId as string;
  try {
    const users = await prisma.user.findMany({
      where: {
        ...(role ? { role: role as any } : {}),
        ...(departmentId ? { departmentId: departmentId as string } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        batch: true,
        semester: true,
        year: true,
        contactNumber: true,
        roleNumber: true,
        studentType: true,
        departmentId: true,
        department: { select: { name: true } }
      },
      orderBy: { role: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error('users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
