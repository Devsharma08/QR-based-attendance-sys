import express from "express";
import cors from 'cors';
import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import authRoutes from './routes/auth.routes';
import hodRoutes from './routes/hod.routes';
import teacherRoutes from './routes/teacher.routes'
import studentRoutes from './routes/student.routes'


const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

// security and parsing middleware
app.use(express.json());
app.use(cors());

//   AUTH ROUTE 
app.use('/api/auth',authRoutes);

// HOD ROUTES
app.use('/api/hod',hodRoutes);

// TEACHER ROUTES
app.use('/api/teacher',teacherRoutes);

// STUDENT ROUTES
app.use('/api/student',studentRoutes);



// --------------------- Export Routes --------------------
// gen an excel report for a specific session
app.get('/api/student/export/session/:sessionId',async(req,res)=>{
  const {sessionId} = req.params;

  try {
    // fetch everything about the session
    const session = await prisma.session.findUnique({
      where:{id:sessionId},
      include:{
        timetable:{
          include:{subject:true,teacher:true,room:true}
        },
        attendances:{
          include:{student:true} // pull their roll,names,email and emails
        }
      }
    });

    if(!session){
      return res.status(404).json({
        message:'Session not found'
      })
    }

    // build the spreadsheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance report');

    // title block
    sheet.mergeCells(`A1:D1`);
    sheet.getCell('A1').value = `Attendance for: ${session.timetable.subject.name}`;
    sheet.getCell('A1').font = {bold:true,size:16};

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Room: ${session.timetable.room.name} | Date:${session.date.toLocaleDateString()}`;

    // add empty row for spacing
    sheet.addRow([]);

    // header row
    sheet.getRow(4).values = ['Roll No','Name','Email','Scan time'];
    sheet.getRow(4).font = {bold:true};
    
    // populate data 
    session.attendances.forEach(att=>{
      sheet.addRow([
        att.student.rollNumber || 'N/A',
        att.student.name,
        att.student.email,
        att.markedAt.toLocaleTimeString()
      ])
    })
    
    // package it up and force browser to download
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.setHeader('Content-Disposition', `attachment;filename="attendance_${session.timetable.subject.code}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.log("Export error:",error);
    res.status(500).json({error:'Failed to export attendance'});
  }
})

// health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});