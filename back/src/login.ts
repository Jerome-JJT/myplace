import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface UserInfos {
    id: number
    username: string
}
export interface LoggedRequest extends Request {
  user: UserInfos
}

export const authenticateToken = (req: LoggedRequest, res: Response, next: any) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}

export const mockLogin = (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    } 

    const token = jwt.sign(
        { 
            id: 92477, 
            username: username 
        }, 
        process.env.JWT_SECRET as string, 
        { 
            expiresIn: process.env.JWT_EXPIRES_IN 
        }
    );

    res.cookie('token', token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        secure: true,
        maxAge: 3600000,
    });

    res.json({ message: 'Login successful' });
}


export const logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
}

export const profile = (req: LoggedRequest, res: Response) => {
    res.json(req.user);
};

module.exports = { authenticateToken, mockLogin, logout, profile }