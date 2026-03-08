import { Request, Response } from 'express';
import { pool } from './db';
import { checkAdmin } from './login_helpers';
import { LoggedRequest } from './types';

export const getBanned = async (req: LoggedRequest, res: Response) => {

    const user = req.user!;

    if(!user.soft_is_admin || !(await checkAdmin(user.id)))
    {
        return res.status(403).send({
            message: 'Forbidden'
        });
    }

    const result = await pool.query(`
        SELECT users.id, users.username
        FROM users
        WHERE banned_at IS NOT NULL
    `, []);

    const bannedUsers = result.rows;

    return res.status(200).json({
        bannedUsers: bannedUsers,
    });
}

export const setBanned = async (req: LoggedRequest, res: Response) => {

    const user = req.user!;

    if(!user.soft_is_admin || !await checkAdmin(user.id))
    {
        return res.status(403).send({
            message: 'Forbidden'
        });
    }

    const { doBan, usernames } = req.body;

    await pool.query(`
        UPDATE users
        SET banned_at = CASE WHEN $1 THEN NOW() ELSE NULL END
        WHERE users.username = ANY($2) and is_admin = FALSE
    `, [doBan, usernames]);

    return res.status(200).send();
}


export const getAdmins = async (req: LoggedRequest, res: Response) => {

    const user = req.user!;

    if(!user.soft_is_admin || !await checkAdmin(user.id))
    {
        return res.status(403).send({
            message: 'Forbidden'
        });
    }

    const result = await pool.query(`
        SELECT users.id, users.username
        FROM users
        WHERE is_admin = TRUE
    `, []);

    const adminUsers = result.rows;

    return res.status(200).json({
        adminUsers: adminUsers,
    });
}

export const setAdmins = async (req: LoggedRequest, res: Response) => {

    const user = req.user!;

    if(!user.soft_is_admin || !await checkAdmin(user.id))
    {
        return res.status(403).send({
            message: 'Forbidden'
        });
    }

    const { doAdmin, usernames } = req.body;

    await pool.query(`
        UPDATE users
        SET is_admin = $1
        WHERE users.username = ANY($2)
    `, [doAdmin, usernames]);

    return res.status(200).send();
}