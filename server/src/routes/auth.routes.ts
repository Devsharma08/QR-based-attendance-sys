import {Request,Response,Router} from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
 

const JWT_SECRET = process.env.JWT_SECRET as string;
const prisma = new PrismaClient();
const router = Router();


// 1. Sign Up
router.post('/signup', async (req:Request, res:Response):Promise<any> => {
  try {
    const { email, password, name, role,department,batch } = req.body;
    
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
        batch: role.toUpperCase()==='STUDENT' ? batch : null, // only for students
      }
    });

    const payload: any = {
      id: user.id,
      name: user.name,
      role: user.role,
    };

    if(role.toUpperCase()==='STUDENT'){
      payload.batch=batch;
    }
    if(role.toUpperCase()!=='DIRECTOR'){
      payload.department=department;
    }

    // Generate a secure JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    // res.json({ token, user });

    res.json({
      token: token,
      user: {
        id: user.id,
        name: user.name,
        departmentId: user.departmentId || null,
        batch: user.batch || null,
        role: user.role,
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
    const user = await prisma.user.findUnique({ where: { email }});
    
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
      departmentId: user.departmentId || null
    };
    
    // Generate a secure JWT
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
});


export default router;