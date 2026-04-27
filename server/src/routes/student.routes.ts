import {Response,Request,Router} from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requiredRole } from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();

router.use(verifyToken);
router.use(requiredRole(['STUDENT']));


// scaning qr code
router.post('/scan', async (req:Request, res:Response) => {
  const { studentId, qrPayload } = req.body;

  if (!studentId || !qrPayload) {
    return res.status(400).json({
      message: "studentId and qrPayload are strictly required."
    })
  }

  try {
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if(!student){
      return res.status(404).json({ message: "Student not found." })
    }

    const room = await prisma.room.findUnique({
      where: { qrPayload }
    });

    if (!room) {
      return res.status(404).json({ message: "Invalid or expired QR code." })
    }

    const activeSession = await prisma.session.findFirst({
      where: {
        status: "ACTIVE",
        timetable: { roomId: room.id }
      },
      include: {
        timetable: {
          include: { subject: true, teacher: true }
        }
      }
    })

    if (!activeSession) {
      return res.status(404).json({ message: "No active class is running in this room right now." });
    }

    if(activeSession.timetable.batch && student.batch!==activeSession.timetable.batch){
      return res.status(403).json({ 
        message: `ACCESS DENIED: This class is only for ${activeSession.timetable.batch}.` 
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        sessionId: activeSession.id,
        studentId: studentId
      }
    })

    res.status(201).json({
      message: "Attendance captured!",
      subjectName: activeSession.timetable.subject.name,
      teacherName: activeSession.timetable.teacher.name,
      attendanceRecord: attendance
    });

  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "You are already marked present for this class." });
    }
    console.error("Scan error:", error);
    res.status(500).json({ error: "Failed to process scan." });
  }
})

// get student attendance history
router.get('/history', async(req:Request,res:Response)=>{
  const studentId = req.query.studentId as string;
  try{
    if(!studentId || studentId === "undefined"){
      return res.status(400).json({ message: "Valid studentId is required." })
    }

    const history = await prisma.attendance.findMany({
      where: { studentId },
      include: {
        session: {
          include: {
            timetable: {
              include: { subject: true, teacher: true }
            }
          }
        }
      },
      orderBy:{ markedAt:"desc" }
    })

    res.status(200).json(history);
    
  } catch(error:any){
    console.error("fetch history error:", error);
    res.status(500).json({ error: "Failed to fetch history." });
  }
})

// get student attendance summary for grid view (P/A)
router.get('/summary', async (req: Request, res: Response) => {
  const studentId = req.query.studentId as string;
  console.log(`[SUMMARY] Request received for ID: "${studentId}"`);
  
  try {
    if (!studentId || studentId === "undefined") {
      console.error("[SUMMARY] Invalid studentId provided");
      return res.status(400).json({ message: "Valid studentId is required." });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrolledSubjects: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    if (!student) {
      console.error(`[SUMMARY] Student with ID ${studentId} not found in database.`);
      return res.status(404).json({ message: "Student not found in database." });
    }

    console.log(`[SUMMARY] Found student: ${student.name}. Enrolled in ${student.enrolledSubjects.length} subjects.`);

    const subjectIds = student.enrolledSubjects.map(s => s.id);

    const sessions = await prisma.session.findMany({
      where: {
        timetable: {
          subjectId: { in: subjectIds },
          batch: student.batch
        },
        status: "CLOSED"
      },
      include: {
        timetable: true,
        attendances: {
          where: { studentId }
        }
      },
      orderBy: { startedAt: "asc" }
    });

    res.status(200).json({
      subjects: student.enrolledSubjects,
      sessions: sessions.map(s => ({
        id: s.id,
        date: s.startedAt,
        subjectId: s.timetable.subjectId,
        present: s.attendances.length > 0
      }))
    });

  } catch (error: any) {
    console.error("Summary error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
})


export default router;
