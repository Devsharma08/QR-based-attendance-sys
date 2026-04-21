import express from "express";
import cors from 'cors';
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'


const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

// security and parsing middleware
app.use(express.json());
app.use(cors());



// supabase auth routes
app.post('/api/webhook/supabase', async (req, res) => {
  // supabase sends a secure payload with type and record
  const { type, record } = req.body;

  try {
    // we only care when a new user is created
    if (type === "INSERT") {
      console.log("New user created:", record);

      // sync the exact uuid from supabase into our aurchitectural user table
      await prisma.user.create({
        data: {
          id: record.id,
          email: record.email,
          name: record.raw_user_meta_data.name || "Student",
          role: record.raw_user_meta_data.role || "STUDENT"
        }
      })

      console.log("sync completed");
    }

    res.status(200).json({ message: "webhook processed" });
  } catch (error) {
    console.log("webhook  error:", error);
    res.status(500).json({
      error: "failed to sync user"
    })
  }
})

// -------------------  HOD routes ----------------------
// create a physical classroom
app.post('/api/rooms', async (req, res) => {
  const { name, qrPayload } = req.body;
  if (!name || !qrPayload) {
    return res.status(400).json({ message: "Name and QR payload are required" });
  }
  const room = await prisma.room.create({
    data: {
      name,
      qrPayload
    }
  })
  res.json(room);
})

// timetable management
app.post('/api/timetable', async (req, res) => {
  const { dayOfWeek, startTime, endTime, subjectId, teacherId, roomId } = req.body;

  // validation
  if (!dayOfWeek || !startTime || !endTime || !subjectId || !teacherId || !roomId) {
    return res.status(400).json({ message: "All scheduling fields are required." });
  }

  try {
    const schedule = await prisma.timetable.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        subjectId,
        teacherId,
        roomId
      }
    })
    res.status(201).json(schedule);
  } catch (error) {
    console.log("timetable error:", error);
    res.status(500).json({ error: "Failed to create timetable" });
  }
})

// create a specific subject
app.post('/api/subjects', async (req, res) => {
  const { code, name, department } = req.body;
  if (!code || !name || !department) {
    return res.status(400).json({ message: "Code, name and department are required" });
  }
  const subject = await prisma.subject.create({
    data: {
      code,
      name,
      department
    }
  })
  res.json(subject);
})

// ------------------------ Teacher routes ----------
app.post('/api/session/start', async (req, res) => {
  const { timetableId } = req.body;
  if (!timetableId) {
    return res.status(400).json({ message: "Timetable ID is required" });
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


// ------------ student route ------------------
// scaning qr code
app.post('/api/scan', async (req, res) => {
  const { studentId, qrPayload,deviceId } = req.body;

  if (!studentId || !qrPayload || !deviceId) {
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

    if(!student.deviceId){
      await prisma.user.update({
        where:{id:studentId},
        data:{deviceId:deviceId,deviceBoundAt:new Date()} // Tracks exactly when they were locked
      })

      console.log(`🔒 Device permanently bound for student: ${student.email}`);
    } else if(student.deviceId && student.deviceId !== deviceId){
       return res.status(403).json({ 
        message: "SECURITY ALERT: Fingerprint mismatch! Proxy attendance attempt blocked. Please contact your HOD if you purchased a new device." 
      });
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

// health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});