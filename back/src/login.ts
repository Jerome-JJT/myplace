import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

import { PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER } from './consts';
import { LoggedRequest, UserInfos } from './types';
import { pool } from './db';
import { getLastUserPixels } from './pixels';


const checkToken = (req: LoggedRequest, res: Response, next: any, fail: boolean = false) => {
    const token = req.cookies.token;
    if (!token) {
        if (fail) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
        else {
            req.user = undefined;
            return next();
        }
    }
    else {
        jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
            if (err) {
                if (fail) {
                    return res.status(403).json({ message: 'Invalid or expired token' });
                }
                else {
                    req.user = undefined;
                    return next();
                }
            }
            else 
            {
                req.user = decoded;
                return next();
            }
        });
    }
}

export const queryToken = (req: LoggedRequest, res: Response, next: any) => {
    return checkToken(req, res, next, false);
}
export const authenticateToken = (req: LoggedRequest, res: Response, next: any) => {
    return checkToken(req, res, next, true);
}

const loginUser = async (username: string, res: Response) => {
    const result = await pool.query(`
        SELECT id, name, email, is_admin
        FROM users
        WHERE name = $1
        LIMIT 1
    `, [username]);

    if (result.rows.length > 0) {
        const user = result.rows[0];

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.name,
                soft_is_admin: user.is_admin
            } as UserInfos,
            process.env.JWT_SECRET as string, 
            { 
                expiresIn: process.env.JWT_EXPIRES_IN 
            }
        );
    
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 3600000,
        });
    
        return res.status(200).json({ message: 'Login successful' });
    }
    else {
        return res.status(410).json({ message: 'Login failed' });
    }
}

export const checkAdmin = async (id: number) => {
    const result = await pool.query(`
        SELECT is_admin
        FROM users
        WHERE id = $1
        LIMIT 1
    `, [id]);

    if (result.rows.length > 0) {
        const user = result.rows[0];
        return user.is_admin;
    }
    else {
        return false;
    }
}

export const mockLogin = (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    loginUser('moi', res);
}


export const logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
}


export const profile = async (req: LoggedRequest, res: Response) => {
    const user = req.user!;

    const timers = await getLastUserPixels(user.id);
    return res.status(200).json({
        userInfos: {
            timers: timers,
            pixel_buffer: PIXEL_BUFFER_SIZE,
            pixel_timer: PIXEL_MINUTE_TIMER,
            ...req.user
        }
    });
};
