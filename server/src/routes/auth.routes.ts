import {Request,Response,Router} from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
 

const JWT_SECRET = process.env.JWT_SECRET as string;
const prisma = new PrismaClient();
const router = Router();

const getDeptNameById = async(id:string | null):Promise<string | null>=>{
  if(!id) return null;
  const dept = await prisma.department.findUnique({
    where:{id}
  });
  return dept?.name || null;
}


// 1. Sign Up
router.post('/signup', async (req:Request, res:Response):Promise<any> => {
  try {
    const { email, password, name, role, department, batch, semester, year, contactNumber } = req.body;
    
    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email }});

    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    let deptId = null;
  
    // find/create the department
    if(department){
      const deptRecord = await prisma.department.upsert({
        where:{name:department},
        update:{},
        create:{name:department}
      });
      deptId = deptRecord.id;
    }
    // hashing password
    const hashedPassword = await bcrypt.hash(password,10);
    // create user
    const user = await prisma.user.create({
      data: { 
        email, 
        password:hashedPassword, 
        name, 
        role: role.toUpperCase(),
        departmentId: deptId,
        contactNumber,
        batch: role.toUpperCase()==='STUDENT' ? batch : null, // only for students
        semester: role.toUpperCase()==='STUDENT' ? parseInt(semester) : null,
        year: role.toUpperCase()==='STUDENT' ? parseInt(year) : null
      }
    });

    const payload: any = {
      id: user.id,
      name: user.name,
      role: user.role,
      year: user.year,
      semester: user.semester,
      contactNumber: user.contactNumber
    };

    if(role.toUpperCase()==='STUDENT'){
      payload.batch=batch;
    }
    if(role.toUpperCase()!=='DIRECTOR'){
      payload.department=department;
    }

    // Generate a secure JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        departmentId: user.departmentId || null,
        departmentName: department || null,
        batch: user.batch || null,
        role: user.role,
        semester: user.semester || null,
        year: user.year || null,
        contactNumber: user.contactNumber || null
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during signup" });
  }
});
// 2. Log In
router.post('/login', async (req:Request, res:Response) => {
  try {
    const { email, password} = req.body;
    
    // Find the user
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { department: { select: { name: true } } }
    });
    
    // Check if user exists and password matches
    const isPasswordValid = user && await bcrypt.compare(password, user.password);
  
    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a secure JWT
    const payload: any = {
      id: user.id,
      name: user.name,
      role: user.role,
      batch: user.batch || null,
      departmentId: user.departmentId || null,
      departmentName: user.department?.name || null,
      semester: user.semester || null,
      year: user.year || null,
      contactNumber: user.contactNumber || null
    };
    
    // Generate a secure JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId || null,
        departmentName: user.department?.name || null,
        batch: user.batch || null,
        semester: user.semester || null,
        year: user.year || null,
        contactNumber: user.contactNumber || null
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
});


export default router;