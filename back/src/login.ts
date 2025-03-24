import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import axios from 'axios';

import {
    JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN,
    OAUTH2_AUTHORIZE_URL, OAUTH2_TOKEN_URL, OAUTH2_CALLBACK_URL, OAUTH2_INFO_URL,
    OAUTH2_EMAIL_FIELD, OAUTH2_ID_FIELD, OAUTH2_USERNAME_FIELD,
    PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER,
    JWT_SECRET,
    OAUTH2_UID,
    OAUTH2_SECRET,
    DEV_MODE
} from './consts';
import { LoggedRequest, UserInfos } from './types';
import { pool } from './db';
import { getLastUserPixels } from './pixels_actions';
import { objUrlEncode } from './objUrlEncode';


export const loginUser = async (id: number, res: Response, verify_seq: number | undefined = undefined): Promise<boolean> => {
    const result = await pool.query(`
        SELECT id, username, email, is_admin, banned_at, token_seq, campus_name
        FROM users
        WHERE id = $1
        LIMIT 1
    `, [id]);

    if (result.rows.length > 0) {
        const user = result.rows[0];

        if (verify_seq !== undefined && verify_seq !== user.token_seq) {
            return false;
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                soft_is_admin: user.is_admin,
                soft_is_banned: user.banned_at ? true : false,
                campus_name: user.campus_name
            } as UserInfos,
            JWT_SECRET,
            {
                expiresIn: JWT_EXPIRES_IN
            }
        );
        const refresh = jwt.sign(
            {
                id: user.id,
                username: user.username,
                token_seq: user.token_seq,
            } as UserInfos,
            JWT_SECRET,
            {
                expiresIn: JWT_REFRESH_EXPIRES_IN
            }
        );

        res.cookie('token', token, {
            httpOnly: true,
            sameSite: "strict",
            secure: DEV_MODE === false,
            maxAge: 4 * JWT_EXPIRES_IN * 1000,
        });
        res.cookie('refresh', refresh, {
            httpOnly: true,
            sameSite: "strict",
            secure: DEV_MODE === false,
            maxAge: 4 * JWT_REFRESH_EXPIRES_IN * 1000,
        });
        return true;
    }
    else {
        return false;
    }
}

const createUser = async (id: number, username: string, email: string | null, admin: boolean, campus_name?: string): Promise<boolean> => {
    try {
        const result = await pool.query(`
            INSERT INTO users (id, username, email, is_admin, campus_name) 
            VALUES
            ($1, $2, $3, $4, $5)
        `, [id, username, email, admin, campus_name]);
    
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
    if (await loginUser(-1, res)) {
        return res.status(200).json({ message: 'Login successful' });
    }
    else {
        return res.status(410).json({ message: 'Login failed' });
    }
}

const getHash = (input: string) => {
    var hash = 0, len = input.length;
    for (var i = 0; i < len; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0; // to 32bit integer
    }
    return hash;
}

export const guestLogin = async (req: Request, res: Response) => {
    let uniqid = `${req.socket.remoteAddress}_${req.headers['x-forwarded-for']}_${req.headers['user-agent']}`;
    let uniqnum = getHash(uniqid);

    if (uniqnum > 0) {
        uniqnum = -uniqnum;
    }
    uniqnum = (uniqnum % 100000000) - 100;

    if (await loginUser(uniqnum, res)) {
        return res.redirect('/')
    }
    else {
        if (await createUser(uniqnum, `Guest_${uniqnum}`, `guest_${uniqnum}@email.com`, false)) {
            if (await loginUser(uniqnum, res)) {
                return res.redirect('/')
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

export const apiLogin = (req: Request, res: Response) => {
    const args = objUrlEncode({
        response_type: 'code',
        scope: 'public',
        client_id: OAUTH2_UID,
        redirect_uri: OAUTH2_CALLBACK_URL
    });
    return res.redirect(`${OAUTH2_AUTHORIZE_URL}?${args}`);
}

export const apiCallback = async (req: Request, res: Response) => {
    try {
        const token = await axios.post(OAUTH2_TOKEN_URL!, {
            grant_type: 'authorization_code',
            code: req.query.code,
            client_id: OAUTH2_UID,
            client_secret: OAUTH2_SECRET,
            redirect_uri: OAUTH2_CALLBACK_URL,
        }, {})

        if (token.status === 200) {
            const access_token: string = token.data.access_token;

            const userInfos = await axios.get(OAUTH2_INFO_URL!, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })

            if (userInfos.status === 200) {
                const userId = userInfos.data[OAUTH2_ID_FIELD!];
                const userUsername = userInfos.data[OAUTH2_USERNAME_FIELD!];
                const userEmail = OAUTH2_EMAIL_FIELD ? userInfos.data[OAUTH2_EMAIL_FIELD] : null;

                if (await loginUser(userId, res)) {
                    return res.redirect('/')
                    // return res.status(200).json({ message: 'Login successful' });
                }
                else {
                    const userPrimaryCampus = (userInfos.data.campus_users as any[]).filter((v) => v.is_primary);
                    const userCampus = userPrimaryCampus.length === 1 ? (userInfos.data.campus as any[]).filter((v) => v.id === userPrimaryCampus[0].campus_id) : [];
                    const userCampusName = userCampus.length === 1 ? userCampus[0].name : undefined;

                    if (await createUser(userId, userUsername, userEmail, false, userCampusName)) {
                        if (await loginUser(userId, res)) { 
                            return res.redirect('/')
                            // return res.status(200).json({ message: 'Login successful' });
                        }
                        else {
                            if (DEV_MODE) {
                                return res.status(410).json({ message: 'Login failed', dev_reason: 'Login after create failed' });
                            }
                            else {
                                return res.status(410).json({ message: 'Login failed' });
                            }
                        }
                    }
                    else {
                        if (DEV_MODE) {
                            return res.status(410).json({ message: 'Login failed', dev_reason: 'Create fail' });
                        }
                        else {
                            return res.status(410).json({ message: 'Login failed' });
                        }
                    }
                }
            }
            else {
                if (DEV_MODE) {
                    return res.status(410).json({ message: 'Login failed', dev_reason: 'Not 200 from api info', url: userInfos });
                }
                else {
                    return res.status(410).json({ message: 'Login failed' });
                }
                // return res.redirect('/')
            }
        }
        else {
            if (DEV_MODE) {
                console.error('LOGIN FAILED');
                return res.status(410).json({ message: 'Login failed', dev_reason: 'Not 200 from api info', url: token });
            }
            else {
                return res.status(410).json({ message: 'Login failed' });
            }
            // return res.redirect('/')
        }
    }
    catch (e: any) {
        if (e.status === 401) {
            if (DEV_MODE) {
                console.error('LOGIN FAILED');
                return res.status(410).json({ message: 'API login failed', dev_reason: 'Received 401', url: e });
            }
            else {
                return res.status(410).json({ message: 'API login failed' });
            }
        }
    }
}

export const logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    res.clearCookie('refresh');
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


export const rotate_tokens = async (req: LoggedRequest, res: Response) => {
    const user = req.user!;

    const result = await pool.query(`
        UPDATE users 
        SET token_seq = token_seq + 1
        WHERE id = $1
    `, [user.id]);

    if (result.rowCount === 1) {
        return res.status(200).json({ message: 'Success' });
    }
    else {
        return res.status(417).json({ message: 'Preconfition failed' });
    }
}