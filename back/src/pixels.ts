import { redisClient } from './redis';
import { pool } from './db';
import { Request, Response } from 'express';
import { updates } from './ws';
import { Color, LoggedRequest, Pixel } from './types';



async function initializeBoard() {
    const board: (Pixel | null)[][] = [];

    for (let x = 0; x < 100; x++) {
        const lineExpire = Math.floor(Math.random() * 3600);
        board[x] = [];
        for (let y = 0; y < 100; y++) {
            const key = `${x}:${y}`;

            const cachedCell = await redisClient.get(key);
            if (cachedCell) {
                board[x][y] = JSON.parse(cachedCell);
            } //
            else {
                const result = await pool.query(`
                    SELECT b.x, b.y, b.color_id, u.name, b.set_time
                    FROM board b
                    JOIN users u ON b.user_id = u.id
                    WHERE b.x = $1 AND b.y = $2
                    ORDER BY b.set_time DESC
                    LIMIT 1
                `, [x, y]);

                if (result.rows.length > 0) {
                    const cell = result.rows[0];
                    const p: Pixel = { color_id: cell.color_id, username: cell.name, set_time: cell.set_time }
                    board[x][y] = p;
                    await redisClient.set(key, JSON.stringify(board[x][y]), 'EX', lineExpire);
                } //
                else {
                    board[x][y] = null;
                }
            }
        }
    }
    return board;
}

async function getColor(): Promise<Color[]> {
    const result = await pool.query(`
        SELECT id, name, red, green, blue
        FROM colors
        ORDER BY id
    `);

    return result.rows;
}

export const getPixels = async (req: Request, res: Response) => {
    try {
        const board = await initializeBoard();
        const colors = await getColor();
        res.json({
            colors: colors, 
            board: board
        });
    } //
    catch (err) {
        console.error(err);
        res.status(500).send('Error fetching board data.');
    }
}


export const getLastUserPixels = async (user_id: number): Promise<Date[]> => {

    const pixel_buffer = process.env.PIXEL_BUFFER_SIZE;
    const pixel_timer = process.env.PIXEL_MINUTE_TIMER;

    const result = await pool.query(`
        SELECT set_time
        FROM board
        WHERE user_id = $1 AND set_time > NOW() - INTERVAL '1 minute' * $2
        ORDER BY set_time DESC
        LIMIT $3
    `, [user_id, pixel_timer, pixel_buffer]);

    return result.rows.map((r: {set_time: Date}) => r.set_time);
}

export const setPixel = async (req: LoggedRequest, res: Response) => {
    const { x, y, color } = req.body;
    const user = req.user;

    console.log("PRINT", x, y, color, user)

    try {
        
        const ret = await pool.query(`
            INSERT INTO board (x, y, color_id, user_id)
            VALUES ($1, $2, $3, $4)
            RETURNING x, y, color_id, set_time
            `, [x, y, color, user.id]);
            
        const inserted = ret.rows.length === 1 ? ret.rows[0] : null;

        if (inserted !== null) {
            const key = `${inserted.x}:${inserted.y}`;
            const p: Pixel = { username: user.username, color_id: inserted.color_id, set_time: inserted.set_time }
    
            await redisClient.set(key, JSON.stringify(p));
    
            updates.push({ ...p, x: inserted.x, y: inserted.y });
            res.status(201).send({
                update: { ...p, x: inserted.x, y: inserted.y },
                timers: getLastUserPixels(user.id)
            });
        }
        else {
            res.status(417).send({});
        }
    } //
    catch (err) {
        console.error(err);
        res.status(500).send('Error updating cell.');
    }
}
