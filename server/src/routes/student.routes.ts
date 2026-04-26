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
      message: "studentId, qrPayload, and a unique deviceId are strictly required."
    })
  }

  try {

    // first finding the student to check their device status
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if(!student){
      return res.status(404).json({
        message: "Student not found."
      })
    }

    // finding in what room student physically standing on
    const room = await prisma.room.findUnique({
      where: { qrPayload }
    });

    if (!room) {
      return res.status(404).json({
        message: "Invalid or expired QR code."
      })
    }

    // find the active session currently happening inside that exact room.

    const activeSession = await prisma.session.findFirst({
      where: {
        status: "ACTIVE",
        timetable: {
          roomId: room.id
        }
      },
      include: {
        timetable: {
          include: { subject: true, teacher: true }
        }
      }
    })

    if (!activeSession) {
      return res.status(404).json({ message: "No active class is running in this room right now. Did the teacher click Start?" });
    }

    // batch security
    if(activeSession.timetable.batch && student.batch!==activeSession.timetable.batch){
      return res.status(403).json({ 
        message: `ACCESS DENIED: This class is only for ${activeSession.timetable.batch}. You are in ${student.batch || 'no batch'}.` 
      });
    }

    // mark the present
    const attendance = await prisma.attendance.create({
      data: {
        sessionId: activeSession.id,
        studentId: studentId
      }
    })

    res.status(201).json({
      message: "Attendance perfectly captured!",
      subjectName: activeSession.timetable.subject.name,
      teacherName: activeSession.timetable.teacher.name,
      attendanceRecord: attendance
    });

  } catch (error: any) {
    // If Prisma throws 'P2002', it means our @@unique([studentId, sessionId]) safety constraint blocked a duplicate!
    if (error.code === 'P2002') {
      return res.status(400).json({ message: "You are already marked present for this class. Stop scanning!" });
    }
    console.error("Matchmaking error:", error);
    res.status(500).json({ error: "Failed to process scan." });
  }
})

// get student attendance history
router.get('/history', async(req:Request,res:Response)=>{
  const studentId = req.query.studentId as string;
  try{
    if(!studentId){
      return res.status(400).json({
        message: "studentId is required."
      })
    }

    const history = await prisma.attendance.findMany({
      where: {
        studentId
      },
      include: {
        session: {
          include: {
            timetable: {
              include: { subject: true, teacher: true }
            }
          }
        }
      },
      orderBy:{
        markedAt:"desc"
      }
    })

    res.status(200).json(history);
    
  } catch(error:any){
    console.error("fetch history error:", error);
    res.status(500).json({ error: "Failed to fetch attendance history." });
  }

})

export default router;
