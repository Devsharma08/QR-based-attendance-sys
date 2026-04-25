import { Request,Response,Router } from "express";
import { DayOfWeek, PrismaClient } from "@prisma/client";
import {verifyToken,requiredRole} from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();

interface teacherRequest extends Request{
  user: {
    id: string;
    role: string;
  };
}


router.use(verifyToken);
router.use(requiredRole(['TEACHER']));


// get all the timetable for a specific teacher
router.get('/timetable', async (req:Request, res:Response) => {
  try{
    const teacherId = (req as teacherRequest).user.id;
    if(!teacherId){
      return res.status(400).json({message:"Teacher ID not found"})
    }

    const timetable = await prisma.timetable.findMany({
      where: {
        teacherId,
      },include:{
        subject:{select:{code:true,name:true}},
        room:{select:{name:true}}
      },orderBy:[
        {dayOfWeek: 'asc'},
        {startTime: 'asc'},
      ]
    });
    if(!timetable){
      return res.status(400).json({message:"No timetable found"})
    }
    res.status(200).json(timetable);
  } catch (error) {
    console.error("session start error", error);
    res.status(500).json({ error: "Failed to start the session." });
  }
})


// Get Live Attendance for an active session
router.get('/session/:sessionId/live', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  try {
    const attendances = await prisma.attendance.findMany({
      where: { 
       id: sessionId as string
      },
      include: {
        student: { select: { name: true, email: true, batch: true } }
      },
      orderBy: { markedAt: 'desc' } 
    });
    res.json(attendances);
  } catch (error) {
    console.error("live attendance error", error);
    res.status(500).json({ error: "Failed to fetch live attendance" });
  }
});

// stop a running class
router.post('/session/:sessionId/stop', async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  try {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'CLOSED' }
    });
    res.json({ message: "Session closed successfully", session });
  } catch (error) {
    console.error("stop session error", error);
    res.status(500).json({ error: "Failed to close session" });
  }
});

// start a session
router.post('/session/start', async (req:Request, res:Response) => {
  const { timetableId,teacherId } = req.body;
  if (!timetableId || !teacherId) {
    return res.status(400).json({ message: "Timetable ID and teacherId are required" });
  }

  try {
    const existingSession = await prisma.session.findFirst({
      where: {
        timetableId,
        status: "ACTIVE"
      }
    });

    if (existingSession) {
      return res.status(400).json({ message: "class already running!", session: existingSession });
    }

    const newSession = await prisma.session.create({
      data: {
        timetableId,
        status: "ACTIVE"
      }
    })

    res.status(201).json(newSession);
  } catch (error) {
    console.error("session start error", error);
    res.status(500).json({ error: "Failed to start the session." });
  }
})

export default router;