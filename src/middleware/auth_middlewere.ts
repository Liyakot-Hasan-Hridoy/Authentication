import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface UserRequest extends Request {
    user?: any; 
}


export const verifyToken = (req: UserRequest, res: Response, next: NextFunction) => {
    try {
        let token;
        let authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith("Bearer")) {
            token = authHeader.split(" ")[1];
            jwt.verify(token, "ok", (error, user) => {
                if (error) {
                    console.error(error);
                    return res.status(401).json({ success: false, msg: "Invalid token" });
                }
                req.user = user;
                next();
            });
        } else {
            return res.status(401).json({ success: false, msg: "Invalid or missing token in the Authorization header" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, msg: "Internal Server error" });
    }
};

export default verifyToken;