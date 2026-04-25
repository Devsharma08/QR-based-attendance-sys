import { Request,Response,Router } from "express";
import { PrismaClient } from "@prisma/client";
import {verifyToken,requiredRole} from '../middleware/auth';
const router = Router();
const prisma = new PrismaClient();


router.use(verifyToken);
router.use(requiredRole(['TEACHER']));


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