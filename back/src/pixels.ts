import { Request, Response } from 'express';

import { CANVAS_X, CANVAS_Y, PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER, redisTimeout, UTC_TIME_END, UTC_TIME_START } from './consts';
import { Color, LoggedRequest, Pixel } from './types';
import { redisClient } from './redis';
import { pool } from './db';
import { updates } from './ws';
import { checkAdmin } from './login';


async function initializeBoard() {
    const board: (Pixel | null)[][] = [];

    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, ranked_board.color_id, users.name, ranked_board.set_time::TIMESTAMPTZ
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
        ) as ranked_board
        LEFT JOIN users ON users.id = ranked_board.user_id
        WHERE rn = 1
    `, []);
    const mapResults = new Map();
    result.rows.forEach((v) => {
        mapResults.set(`${v.x}:${v.y}`, v)
    });


    for (let x = 0; x < CANVAS_X; x++) {
        const lineExpire = redisTimeout();
        board[x] = [];
        const queryKeys: string[] = [];

        for (let y = 0; y < CANVAS_Y; y++) {
            const key = `${x}:${y}`;
            queryKeys.push(key);
        }
 
        const cachedCells = await redisClient.mGet(queryKeys);
        const cachedSet: {[key: string]: string} = {};

        for (let y = 0; y < CANVAS_Y; y++) {
            if (cachedCells[y] !== null) {
                board[x][y] = JSON.parse(cachedCells[y]);
            } //
            else {
                // const cell = result.rows.find((v) => {
                //     return v.x === x && v.y === y
                // });

                const cell = mapResults.get(`${x}:${y}`);
                if (cell !== undefined) {
                    const p: Pixel = { color_id: cell.color_id, username: cell.name, set_time: cell.set_time }
                    board[x][y] = p;
                } //
                else {
                    const p: Pixel = { color_id: 1, username: 'null', set_time: '1900-01-01T00:00:00.000Z' }
                    board[x][y] = p;
                }

                const key = `${x}:${y}`;
                cachedSet[key] = JSON.stringify(board[x][y]);
            }
        }

        if (Object.keys(cachedSet).length > 0) {
            await redisClient.mSet(cachedSet, 'EX', lineExpire);
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

    const time_result = await pool.query(`
        SELECT 
        MIN((EXTRACT(EPOCH FROM board.set_time))::INTEGER) AS min_time, 
        MAX((EXTRACT(EPOCH FROM board.set_time))::INTEGER) AS max_time
        FROM board
        LIMIT 1
    `, []);
    if (time_result.rows.length > 0) {
        const cell = time_result.rows[0];
        times.min_time = cell.min_time;
        times.max_time = cell.max_time;
    }

    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, ranked_board.color_id, users.name, ranked_board.set_time::TIMESTAMPTZ
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
            WHERE board.set_time < $1
        ) as ranked_board
        LEFT JOIN users ON users.id = ranked_board.user_id
        WHERE rn = 1
    `, [time]);
    const mapResults = new Map();
    result.rows.forEach((v) => {
        mapResults.set(`${v.x}:${v.y}`, v)
    });

    for (let x = 0; x < CANVAS_X; x++) {
        board[x] = [];
        for (let y = 0; y < CANVAS_Y; y++) {

            const cell = mapResults.get(`${x}:${y}`);
            if (cell !== undefined) {
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
        ORDER BY corder ASC
    `);

    return result.rows;
}

export const getPixels = async (req: LoggedRequest, res: Response) => {
    try {
        const colors = await getColor();
        if (req.query.time !== undefined && (req.user?.soft_is_admin === true && await checkAdmin(req.user?.id))) {
            const {board, min_time, max_time} = await viewTimedBoard(new Date(req.query.time as string).toISOString());

            return res.status(200).json({
                colors: colors, 
                board: board,
                min_time: min_time,
                max_time: max_time,
            });
        }
        else {
            const board = await initializeBoard();
            return res.status(200).json({
                colors: colors, 
                board: board
            });
        }
    } //
    catch (err) {
        console.error(err);
        return res.status(500).send('Error fetching board data.');
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

    const actualDate = Date.now();
    console.log(UTC_TIME_START, UTC_TIME_END, actualDate);

    console.log("PRINT", x, y, color, user);

    if ((UTC_TIME_START < actualDate && actualDate < UTC_TIME_END) || (user.soft_is_admin === true && (await checkAdmin(user.id)))) {
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
            
                    await redisClient.set(key, JSON.stringify(p), 'EX', redisTimeout());

                    updates.push({ ...p, x: inserted.x, y: inserted.y });
                    timers.unshift(inserted.set_time);
                    return res.status(201).send({
                        update: { ...p, x: inserted.x, y: inserted.y },
                        timers: timers
                    });
                }
                else {
                    return res.status(417).send('Strange insertion error append');
                }
            } //
            catch (err) {
                console.error(err);
                return res.status(500).send('Error updating cell.');
            }
        }
        else {
            console.log('Timeout limit reached');
            return res.status(425).send({
                timers: timers,
                message: 'Too early'
            });
        }
    }
    else {
        console.log('Hype incoming');
        return res.status(420).send({
            message: 'Enhance your hype',
            interval: (UTC_TIME_START > actualDate) ? Math.round((UTC_TIME_START - actualDate) / 1000) : Math.round((UTC_TIME_END - actualDate) / 1000),
        });
    }
}
