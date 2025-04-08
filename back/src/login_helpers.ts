import jwt from 'jsonwebtoken';
import { Response } from 'express';

import {
    JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN,
    JWT_SECRET,
    DEV_MODE
} from './consts';
import { LoggedRequest, UserInfos } from './types';
import { pool } from './db';

export const loginUser = async (id: number, res: Response, verify_seq: number | undefined = undefined): Promise<boolean> => {
    const result = await pool.query(`
        SELECT id, username, email, is_admin, banned_at, token_seq
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

export const createDirectUser = async (id: number, username: string, email: string | null, admin: boolean): Promise<boolean> => {
    try {
        const result = await pool.query(`
            INSERT INTO users (id, username, email, is_admin) 
            VALUES
            ($1, $2, $3, $4)
        `, [id, username, email, admin]);

        return result.rowCount === 1;
    }
    catch {
        return false;
    }
}

export const createLocalUser = async (username: string, email: string, password: string, admin: boolean): Promise<boolean> => {
    try {
        const result = await pool.query(`
            INSERT INTO users (username, email, password, is_admin) 
            VALUES
            ($1, $2, $3, $4)
        `, [username, email, password, admin]);

        return result.rowCount === 1;
    }
    catch {
        return false;
    }
}

export const checkUserExists = async (username: string, email: string) => {
    const result = await pool.query(`
        SELECT username, email
        FROM users
        WHERE username = $1 OR email = $2
    `, [username, email]);

    return result.rows as any[];
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

export const getNumHash = (input: string) => {
    var hash = 0, len = input.length;
    for (var i = 0; i < len; i++) {
        hash = ((hash << 5) - hash) + input.charCodeAt(i);
        hash |= 0; // to 32bit integer
    }
    return hash;
}

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