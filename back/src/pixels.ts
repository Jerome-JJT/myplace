import { Request, Response } from 'express';

import { CANVAS_X, CANVAS_Y, PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER } from './consts';
import { Color, LoggedRequest, Pixel } from './types';
import { redisClient } from './redis';
import { pool } from './db';
import { updates } from './ws';
import { checkAdmin } from './login';


async function initializeBoard() {
    const board: (Pixel | null)[][] = [];

    for (let x = 0; x < CANVAS_X; x++) {
        const lineExpire = Math.floor(Math.random() * 3600);
        board[x] = [];
        for (let y = 0; y < CANVAS_Y; y++) {
            const key = `${x}:${y}`;

            const cachedCell = await redisClient.get(key);
            if (cachedCell) {
                board[x][y] = JSON.parse(cachedCell);
            } //
            else {
                const result = await pool.query(`
                    SELECT board.x, board.y, board.color_id, users.name, board.set_time::TIMESTAMPTZ
                    FROM board
                    JOIN users ON board.user_id = users.id
                    WHERE board.x = $1 AND board.y = $2
                    ORDER BY board.set_time DESC
                    LIMIT 1
                `, [x, y]);

                if (result.rows.length > 0) {
                    const cell = result.rows[0];
                    const p: Pixel = { color_id: cell.color_id, username: cell.name, set_time: cell.set_time }
                    board[x][y] = p;
                } //
                else {
                    const p: Pixel = { color_id: 1, username: 'null', set_time: '1900-01-01T00:00:00.000Z' }
                    board[x][y] = p;
                }
                await redisClient.set(key, JSON.stringify(board[x][y]), 'EX', lineExpire);
            }
        }
    }
    return board;
}

async function viewTimedBoard(time: string) {
    const board: (Pixel | null)[][] = [];
    const times = {
        min_time: '',
        max_time: ''
    }
    console.log(time);

    const time_result = await pool.query(`
        SELECT MIN(board.set_time::TIMESTAMPTZ) AS min_time, MAX(board.set_time::TIMESTAMPTZ) AS max_time
        FROM board
        LIMIT 1
    `, []);
    if (time_result.rows.length > 0) {
        const cell = time_result.rows[0];
        times.min_time = cell.min_time;
        times.max_time = cell.max_time;
    }

    for (let x = 0; x < CANVAS_X; x++) {
        board[x] = [];
        for (let y = 0; y < CANVAS_Y; y++) {

            const result = await pool.query(`
                SELECT board.x, board.y, board.color_id, users.name, board.set_time::TIMESTAMPTZ
                FROM board
                JOIN users ON board.user_id = users.id
                WHERE board.x = $1 AND board.y = $2 AND board.set_time < $3
                ORDER BY board.set_time DESC
                LIMIT 1
            `, [x, y, time]);

            if (result.rows.length > 0) {
                const cell = result.rows[0];
                const p: Pixel = { color_id: cell.color_id, username: cell.name, set_time: cell.set_time }
                board[x][y] = p;
            }
            else {
                const p: Pixel = { color_id: 1, username: 'null', set_time: '1900-01-01T00:00:00.000Z' }
                board[x][y] = p;
            }
        }
    }
    return {board, ...times};
}

async function getColor(): Promise<Color[]> {
    const result = await pool.query(`
        SELECT id, name, red, green, blue
        FROM colors
        ORDER BY id
    `);

    return result.rows;
}

export const getPixels = async (req: LoggedRequest, res: Response) => {
    try {
        const colors = await getColor();
        if (req.query.time !== undefined && (req.user?.soft_is_admin === true && await checkAdmin(req.user?.id))) {
            const {board, min_time, max_time} = await viewTimedBoard(new Date(req.query.time as string).toISOString());
            res.json({
                colors: colors, 
                board: board,
                min_time: min_time,
                max_time: max_time,
            });
        }
        else {
            const board = await initializeBoard();
            res.json({
                colors: colors, 
                board: board
            });
        }
    } //
    catch (err) {
        console.error(err);
        res.status(500).send('Error fetching board data.');
    }
}


export const getLastUserPixels = async (user_id: number): Promise<string[]> => {

    const result = await pool.query(`
        SELECT (set_time + INTERVAL '1 minute' * $2)::TIMESTAMPTZ AS set_time
        FROM board
        WHERE user_id = $1 AND 
        (set_time + INTERVAL '1 minute' * $2) > NOW()
        ORDER BY set_time DESC
        LIMIT $3
    `, [user_id, PIXEL_MINUTE_TIMER, PIXEL_BUFFER_SIZE]);

    return result.rows.map((r: {set_time: string}) => r.set_time);
}

export const setPixel = async (req: LoggedRequest, res: Response) => {
    const { x, y, color } = req.body;
    const user = req.user!;
    const timers = await getLastUserPixels(user.id)

    console.log("PRINT", x, y, color, user);

    if (timers.length < PIXEL_BUFFER_SIZE || (user.soft_is_admin === true && (await checkAdmin(user.id)))) {
        try {
            const ret = await pool.query(`
                INSERT INTO board (x, y, color_id, user_id)
                VALUES ($1, $2, $3, $4)
                RETURNING x, y, color_id, (set_time + INTERVAL '1 minute' * $5)::TIMESTAMPTZ AS set_time
                `, [x, y, color, user.id, PIXEL_MINUTE_TIMER]);
                
            const inserted = ret.rows.length === 1 ? ret.rows[0] : null;
    
            if (inserted !== null) {
                const key = `${inserted.x}:${inserted.y}`;
                const p: Pixel = { username: user.username, color_id: inserted.color_id, set_time: inserted.set_time }
        
                await redisClient.set(key, JSON.stringify(p));
        
                updates.push({ ...p, x: inserted.x, y: inserted.y });
                timers.unshift(inserted.set_time);
                res.status(201).send({
                    update: { ...p, x: inserted.x, y: inserted.y },
                    timers: timers
                });
            }
            else {
                res.status(417).send('Strange insertion error append');
            }
        } //
        catch (err) {
            console.error(err);
            res.status(500).send('Error updating cell.');
        }
    }
    else {
        console.log('Timeout limit reached');
        res.status(425).send({
            timers: timers,
            message: 'Too early'
        });
    }
}
