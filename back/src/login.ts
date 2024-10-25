import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

import { JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN, PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER } from './consts';
import { LoggedRequest, UserInfos } from './types';
import { pool } from './db';
import { getLastUserPixels } from './pixels';
import { objUrlEncode } from './objUrlEncode';
import axios from 'axios';


const checkToken = async (req: LoggedRequest, res: Response, next: any, fail: boolean = false) => {
    const token = req.cookies.token;
    const refresh = req.cookies.refresh;
    if (!token && !refresh) {
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
                jwt.verify(refresh, process.env.JWT_SECRET as string, async (err: any, decoded: any) => {
                    if (err) {
                        res.clearCookie('token');
                        res.clearCookie('refresh');
                        if (fail) {
                            return res.status(401).json({ message: 'Invalid or expired token' });
                        }
                        else {
                            req.user = undefined;
                            return next();
                        }
                    }
                    else {
                        const logged = await loginUser(decoded.username, res);
                        if (logged) {
                            return res.status(426).json({ message: 'Token refreshed' });
                        }
                        else {
                            res.clearCookie('token');
                            res.clearCookie('refresh');
                            return res.status(410).json({ message: 'Login failed' });
                        }
                    }
                })
            }
            else 
            {
                if (decoded.soft_is_banned) {
                    return res.status(409).json({ message: 'Conflict' });
                }
                else {
                    req.user = decoded;
                    return next();
                }
            }
        });
    }
}

export const queryToken = async (req: LoggedRequest, res: Response, next: any) => {
    return await checkToken(req, res, next, false);
}
export const authenticateToken = async (req: LoggedRequest, res: Response, next: any) => {
    return await checkToken(req, res, next, true);
}

const loginUser = async (username: string, res: Response): Promise<boolean> => {
    const result = await pool.query(`
        SELECT id, name, email, is_admin, banned_at
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
                soft_is_admin: user.is_admin,
                soft_is_banned: user.banned_at ? true : false,
            } as UserInfos,
            process.env.JWT_SECRET as string, 
            { 
                expiresIn: JWT_EXPIRES_IN 
            }
        );
        const refresh = jwt.sign(
            { 
                id: user.id,
                username: user.name,
            } as UserInfos,
            process.env.JWT_SECRET as string, 
            { 
                expiresIn: JWT_REFRESH_EXPIRES_IN 
            }
        );
    
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * JWT_EXPIRES_IN * 1000,
        });
        res.cookie('refresh', refresh, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 4 * JWT_REFRESH_EXPIRES_IN * 1000,
        });
        return true;
    }
    else {
        return false;
    }
}

const createUser = async (id: number, username: string, email: string, admin: boolean): Promise<boolean> => {
    try {
        const result = await pool.query(`
            INSERT INTO users (id, name, email, is_admin) 
            VALUES
            ($1, $2, $3, $4)
        `, [id, username, email, admin]);
    
        return result.rowCount === 1;
    }
    catch {
        return false;
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

export const mockLogin = async (req: Request, res: Response) => {
    if (await loginUser('moi', res)) { 
        return res.status(200).json({ message: 'Login successful' });
    }
    else {
        return res.status(410).json({ message: 'Login failed' });
    }
}

export const apiLogin = (req: Request, res: Response) => {
    const args = objUrlEncode({
        response_type: 'code',
        client_id: process.env.API_UID,
        scope: 'public',
        redirect_uri: process.env.API_CALLBACK
    });
    return res.redirect(`https://api.intra.42.fr/oauth/authorize?${args}`);
}

export const apiCallback = async (req: Request, res: Response) => {
    const token = await axios.post('https://api.intra.42.fr/oauth/token', {
        grant_type: 'authorization_code',
        client_id: process.env.API_UID,
        client_secret: process.env.API_SECRET,
        code: req.query.code,
        redirect_uri: process.env.API_CALLBACK,
    }, {})

    if (token.status === 200) {
        const access_token: string = token.data.access_token;

        const user = await axios.get('https://api.intra.42.fr/v2/me', {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })

        if (user.status === 200) {
            if (await loginUser(user.data.login, res)) { 
                return res.redirect('/')
                // return res.status(200).json({ message: 'Login successful' });
            }
            else {
                if (await createUser(user.data.id, user.data.login, user.data.email, user.data['staff?'])) {
                    if (await loginUser(user.data.login, res)) { 
                        return res.redirect('/')
                        // return res.status(200).json({ message: 'Login successful' });
                    }
                    else {
                        return res.status(410).json({ message: 'Login failed' });
                    }
                }
                else {
                    return res.status(410).json({ message: 'Login failed' });
                }
            }
        }
        else {
            console.error('LOGIN FAILED');
            return res.status(410).json({ message: 'Login failed' });
            // return res.redirect('/')
        }
    }
    else {
        console.error('LOGIN FAILED');
        return res.status(410).json({ message: 'Login failed' });
        // return res.redirect('/')
    }
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
