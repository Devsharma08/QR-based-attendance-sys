import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken, requiredRole } from '../middleware/auth';
const router = Router();

router.use(verifyToken);
router.use(requiredRole(['HOD']));

const prisma = new PrismaClient();

// create a physical classroom
router.post('/rooms', async (req: Request, res: Response) => {
  // add capacity default 60 and deptId (room belong to this dept)
  const { name, qrPayload, capacity, departmentId } = req.body;
  if (!name || !qrPayload || !departmentId) {
    return res.status(400).json({ message: "Name and QR payload and departmentId are required" });
  }
  const room = await prisma.room.create({
    data: {
      name,
      qrPayload,
      capacity: capacity ? parseInt(capacity,10) : 60,
      departmentId
    }
  })
  res.json(room);
})

// timetable management
router.post('/timetable', async (req: Request, res: Response) => {
  const { dayOfWeek, startTime, endTime, subjectId, teacherId, roomId, batch } = req.body;

  // validation
  if (!dayOfWeek || !startTime || !endTime || !subjectId || !teacherId || !roomId) {
    return res.status(400).json({ message: "All scheduling fields are required." });
  }



  try {


    // cheking if teacher already has another booking at the same time
    const existingTeacherBooking = await prisma.timetable.findFirst({
      where: {
        teacherId: teacherId,
        dayOfWeek: dayOfWeek,
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      }
    })

    if (existingTeacherBooking) {
      return res.status(400).json({ message: "Teacher already has a booking at the same time" })
    }

    // check duplicate booking
    const existingBooking = await prisma.timetable.findFirst({
      where: {
        roomId: roomId,
        dayOfWeek: dayOfWeek,
        startTime: { lt: endTime },
        endTime: { gt: startTime }
      }
    })

    if (existingBooking) {
      return res.status(400).json({ message: "Duplicate booking detected" })
    }

    const schedule = await prisma.timetable.create({
      data: {
        dayOfWeek,
        startTime,
        endTime,
        subjectId,
        teacherId,
        roomId,
        batch: batch || null
      }
    })
    res.status(201).json(schedule);
  } catch (error: any) {
    console.log("timetable error:", error);
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Duplicate booking detected" })
    }
    if (error.code === "P2003") {
      return res.status(400).json({ message: "Invalid booking detected" })
    }
    res.status(500).json({ error: "Failed to create timetable" });
  }
})

// get time table from the deptId query
router.get('/timetable', async (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string;
  try{
  if (!departmentId) {
    return res.status(400).json({ message: "departmentId is required" });
  }
  const timetable = await prisma.timetable.findMany({
    where: {
      room:{
        departmentId: departmentId
      }
    },
    select: {
      id:true,
      startTime: true,
      teacherId:true,
      roomId:true,
      batch:true,
      endTime: true,
      dayOfWeek: true,
      teacher:{
        select:{
          name:true,
          email:true
        }
      },
      room:{
        select:{
          name:true,
          qrPayload:true
        }
      },
      subject:{
        select:{
          code:true,
          name:true
        }
      }
    }
  });
  res.json(timetable);
}catch(error){
  console.log("timetable error:", error);
  res.status(500).json({ error: "Failed to fetch timetable" });
}
})

// deleting the schedule from the timetable
router.delete('/timetable', async (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string;
  const {subjectId,teacherId,roomId,dayOfWeek,startTime,endTime,batch} = req.body;


  if (!departmentId || !subjectId || !teacherId || !roomId || !dayOfWeek || !startTime || !endTime || !batch) {
    return res.status(400).json({ message: "All scheduling fields are required." });
  }

  const timetableData = await prisma.timetable.findFirst({
    where: {
      room:{
        departmentId: departmentId
      },
      dayOfWeek: dayOfWeek,
      startTime: startTime,
      endTime: endTime,
      subjectId: subjectId,
      teacherId: teacherId,
      roomId: roomId,
      batch: batch
    }
  })

  if(!timetableData){
    return res.status(404).json({ message: "Timetable not found" });
  }

  try{
    const timetable = await prisma.timetable.delete({
      where: {
        id:timetableData.id
      }
    });
    res.json(timetable);
  }catch(error){
    console.log("timetable error:", error);
    res.status(500).json({ error: "Failed to delete timetable" });
  }
})

// delete the room 
router.delete('/rooms/:roomId',async(req:Request,res:Response)=>{
  const roomId = req.params.roomId as string;
  const departmentId = req.query.departmentId as string;

  try{
    const room = await prisma.room.findUnique({
      where: {
        id: roomId as string
      }
    });

  if(!room){
    return res.status(404).json({ message: "Room not found" });
  }
  if(room.departmentId !== departmentId){
    return res.status(403).json({ message: "Room not found" });
  }

  await prisma.room.delete({
    where: {
      id: roomId as string
    }
  })
  
   res.json({ message: "Room deleted successfully" });
  }catch(error){
     console.error("error deleting room:",error);
    return res.status(500).json({message:"internal server error"})
  }
})


// create a specific subject
router.post('/subjects', async (req: Request, res: Response) => {
  const { code, name } = req.body;
  const departmentId = req.query.departmentId as string;
  
  if (!code || !name || !departmentId) {
    return res.status(400).json({ message: "Code, name and departmentId are required" });
  }
  const subject = await prisma.subject.create({
    data: {
      code,
      name,
      departmentId
    }
  })
  res.json(subject);
})

// update a subject
router.patch('/subjects',async(req:Request,res:Response)=>{
  const {code,name,id} = req.body;
  const departmentId = req.query.departmentId as string;

  
  if(!departmentId || !code || !name || !id){
    return res.status(400).json({ message: "departmentId, code and name are required" });
  }
  try{
    // check if subject is in the department
    let subject = await prisma.subject.findUnique({
      where: {
        id: id
      }
    });

    if(!subject){
      return res.status(404).json({ message: "Subject not found" });
    }

    if(subject.departmentId !== departmentId){
      return res.status(403).json({ message: "Not authorized" });
    }
    
    subject = await prisma.subject.update({
      where: {
        id: id
      },
      data: {
        code,
        name,
        departmentId
      }
    })

    res.status(200).json(subject);
  }catch(error){
    console.log("subject error:", error);
    res.status(500).json({ error: "Failed to update subject" });
  }
})

// delete a subject
router.delete('/subjects/:subjectId',async(req:Request,res:Response)=>{
  const subjectId = req.params.subjectId as string;
  const departmentId = req.query.departmentId as string;

  if(!departmentId){
    return res.status(400).json({ message: "departmentId is required" });
  }
  try{
    // check if subject is in the department
    let subject = await prisma.subject.findUnique({
      where: {
        id: subjectId
      }
    });

    if(!subject){
      return res.status(404).json({ message: "Subject not found" });
    }

    if(subject.departmentId !== departmentId){
      return res.status(403).json({ message: "Not authorized" });
    }
    
    await prisma.subject.delete({
      where: {
        id: subjectId
      }
    })

    res.status(200).json({message:"Subject deleted successfully"});
  }catch(error){
    console.log("subject error:", error);
    res.status(500).json({ error: "Failed to delete subject" });
  }
})

// get all subjects of all departments
router.get('/subjects/all',async(req:Request,res:Response)=>{
  try {
    const subjects = await prisma.subject.findMany();
    res.json(subjects);
  } catch (error) {
    console.log("subjects error:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
})

// get all subjects of a particular department
router.get('/subjects',async(req:Request,res:Response)=>{
  const departmentId = req.query.departmentId as string;
  if(!departmentId){
    return res.status(400).json({ message: "departmentId is required" });
  }
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        departmentId
      }
    });
    res.json(subjects);
  } catch (error) {
    console.log("subjects error:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
})

// get all teachers of a department + extra common teachers
router.get('/teachers', async (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string;
  if (!departmentId) {
    return res.status(400).json({ message: "departmentId is required" });
  }
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: 'TEACHER',
        departmentId: departmentId || null
      },
      select: {
        id: true,
        name: true,
        email: true,
        departmentId: true
      }
    });
    res.json(teachers);
  } catch (error) {
    console.log("teachers error:", error);
    res.status(500).json({ error: "Failed to fetch teachers" });
  }

})

// get all rooms of a department + extra common rooms
router.get('/rooms', async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }
    const rooms = await prisma.room.findMany({
      where: {
        departmentId
      }
    });
    res.json(rooms);
  } catch (error) {
    console.log("rooms error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
})

// get all subjects of a department + extra common subjects
router.get('/subjects', async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string;
    if (!departmentId) {
      return res.status(400).json({ message: "departmentId is required" });
    }
    const subjects = await prisma.subject.findMany({
      where: {
        departmentId
      }
    });
    res.json(subjects);
  } catch (error) {
    console.log("subjects error:", error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
})

// get all students belongs to a department
router.get('/students', async (req: Request, res: Response) => {
  const departmentId = req.query.departmentId as string;
  if (!departmentId) {
    return res.status(400).json({ message: "departmentId is required" });
  }
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', departmentId },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  res.json(students);
})

export default router;
