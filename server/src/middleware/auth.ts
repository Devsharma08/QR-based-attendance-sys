import {Request,Response,NextFunction} from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET as string || 'securitycode';

// extends the express request to add user property
export interface authRequest extends Request{
    user?: string;    
}

// the bouncer
export const verifyToken = async(req:authRequest,res:Response,next:NextFunction)=>{
    try {
        const token = req.headers.authorization;
        if(token && !token?.startsWith('Bearer')){
         return res.status(401).json({message:'Authorization token missing or malformed.'});   
        }

        const authToken = token?.split(' ')[1];
        if (!authToken){
            return res.status(401).json({message:'Authorization token missing or malformed.'});   
        }

        jwt.verify(authToken,jwtSecret,(err,decodedUser)=>{
         if(err){
            return res.status(401).json({message:'Invalid authorization token.'})
         }

         req.user = decodedUser as string;
         next();
        })

    } catch (error) {
        return res.status(500).json({message:'Server error.'});
    }
}

// role guard
export const requiredRole = (allowedRoles:string[]) =>{
   return (req:authRequest,res:Response,next:NextFunction)=>{
    try {
     
     // need to define the payload for user
     const user = req.user as any;
     if(!user || !allowedRoles.includes(user.role)) return res.status(403).json({message:'Forbidden: Not authorized to perform this action'});
     

     if(!allowedRoles.includes(user.role)){
         return res.status(403).json({ message: `Forbidden: Requires one of [${allowedRoles.join(', ')}]` });
     }

     // alowed to pass - autorization complete
     next();


    } catch (error) {
     return res.status(500).json({message:'Server error.'});
    }

   }
}