import { Request, Response } from 'express';
import { pool } from './db';



const getPlacedByUser = async () => {
    const result = await pool.query(`
        SELECT users.id, users.name, COUNT(*) AS count FROM board 
        JOIN users ON users.id = board.user_id 
        GROUP BY users.id, users.name
        ORDER BY COUNT(*) DESC
    `, []);

    return result.rows;
}

const getInPlaceByUser = async () => {
    const result = await pool.query(`
        SELECT users.name, COUNT(rn) AS count
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
        ) as ranked_board
        JOIN users ON users.id = ranked_board.user_id
        WHERE rn = 1
        GROUP BY users.name
        ORDER BY COUNT(rn) DESC
    `, []);

    return result.rows;
}


export const getLeaderboards = async (req: Request, res: Response) => {
    return res.status(200).json({ 
        placed: await getPlacedByUser(),
        inPlace: await getInPlaceByUser()
    });
}