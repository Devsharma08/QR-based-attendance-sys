import express from "express";
import cors from 'cors';
import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import authRoutes from './routes/auth.routes';
import hodRoutes from './routes/hod.routes';
import teacherRoutes from './routes/teacher.routes'
import studentRoutes from './routes/student.routes'
import directorRoutes from './routes/director.routes'


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

// DIRECTOR ROUTES
app.use('/api/director', directorRoutes);


// health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});