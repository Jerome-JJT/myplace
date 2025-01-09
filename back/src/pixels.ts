import { Response } from 'express';

import { CANVAS_X, CANVAS_Y, redisTimeout, } from './consts';
import { Color, LoggedRequest, Pixel } from './types';
import { redisClient } from './redis';
import { pool } from './db';
import { checkAdmin } from './login';
const { createCanvas } = require('canvas');

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

async function viewTimedBoard(time: string, {user_id = null}: {user_id?: string | null}) {
    const board: (Pixel | null)[][] = [];
    
    console.log('22222', user_id);
    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, ranked_board.color_id, users.name, ranked_board.set_time::TIMESTAMPTZ
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
            JOIN users ON users.id = board.user_id
            WHERE board.set_time < $1 AND
            ($2 IS NULL OR 
                (CAST($2 AS INTEGER) IS NOT NULL AND users.id = $2) OR
                (CAST($2 AS VARCHAR) IS NOT NULL AND users.name = $2)
            )
        ) as ranked_board
        LEFT JOIN users ON users.id = ranked_board.user_id
        WHERE rn = 1
    `, [time, user_id]);
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
    return {board};
}


async function createBoardImage(time: string, {scale = 1, transparent = false, user_id = null}: {scale?: number, transparent?: boolean, user_id?: string | null}) {
    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, users.name, ranked_board.set_time::TIMESTAMPTZ, colors.red, colors.green, colors.blue
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
            JOIN users ON users.id = board.user_id
            WHERE board.set_time < $1 AND
            ($2 IS NULL OR 
                (CAST($2 AS INTEGER) IS NOT NULL AND users.id = $2) OR
                (CAST($2 AS VARCHAR) IS NOT NULL AND users.name = $2)
            )
        ) as ranked_board
        LEFT JOIN users ON users.id = ranked_board.user_id
        JOIN colors ON colors.id = ranked_board.color_id
        WHERE rn = 1
    `, [time, user_id]);
    const mapResults = new Map();
    result.rows.forEach((v) => {
        mapResults.set(`${v.x}:${v.y}`, v)
    });

    const colors = await getColors();
    const color1 = colors.find((v) => v.id === 1);
    const white = color1 !== undefined ? color1 : {red: 255, green: 255, blue: 255};

    const canvas = createCanvas(CANVAS_X * scale, CANVAS_X * scale);
    const ctx = canvas.getContext('2d');

    for (let x = 0; x < CANVAS_X; x++) {
        for (let y = 0; y < CANVAS_X; y++) {
            const cell = mapResults.get(`${x}:${y}`);

            if (cell !== undefined) {
                const { red, green, blue } = cell;
                ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
            else {
                if (transparent === true) {
                    ctx.fillStyle = `rgba(0, 0, 0, 255)`;
                }
                else {
                    ctx.fillStyle = `rgb(${white.red}, ${white.green}, ${white.blue})`;
                }
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }

    return {canvas};
}


async function getColors(): Promise<Color[]> {
    const result = await pool.query(`
        SELECT id, name, red, green, blue
        FROM colors
        ORDER BY corder ASC
    `);

    return result.rows;
}

async function getTimes(): Promise<{min_time: string, max_time: string}> {
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

    return times;
}

export const getPixels = async (req: LoggedRequest, res: Response) => {
    try {
        const colors = await getColors();
        if (req.query.time !== undefined && (req.user?.soft_is_admin === true && await checkAdmin(req.user?.id))) {
            const {min_time, max_time} = await getTimes();

            console.log(req.query, typeof(req.query.user_id))

            if (req.query.type === 'image') {

                const {canvas} = await createBoardImage(new Date(req.query.time as string).toISOString(), {
                    user_id: req.query.user_id as string || null
                });

                const buffer = canvas.toBuffer('image/png');
                const image = buffer.toString('base64');

                return res.status(200).json({
                    colors: colors, 
                    type: 'image',
                    image: image,
                    min_time: min_time,
                    max_time: max_time,
                });

            }
            else {
                const {board} = await viewTimedBoard(new Date(req.query.time as string).toISOString(), {
                    user_id: req.query.user_id as string || null
                });
                
                return res.status(200).json({
                    colors: colors, 
                    type: 'board',
                    board: board,
                    min_time: min_time,
                    max_time: max_time,
                });
            }
        }
        else {
            const board = await initializeBoard();
            return res.status(200).json({
                colors: colors,
                type: 'board',
                board: board
            });
        }
    } //
    catch (err) {
        console.error(err);
        return res.status(500).send('Error fetching board data.');
    }
}

export const getImage = async (req: LoggedRequest, res: Response) => {
    try {
        if (req.user?.soft_is_admin === true && await checkAdmin(req.user?.id)) {

            const askedTime = req.query.time;
            const askedScale = parseInt(req.query.scale as string);
            
            const time = askedTime !== undefined ? new Date(askedTime as string) : new Date();
            const scale = !Number.isNaN(askedScale) ? askedScale : 8;

            const {canvas} = await createBoardImage(time.toISOString(), {
                scale: scale, 
                transparent: req.query.transparent !== undefined,
                user_id: req.query.user_id as string || null
            });

            res.setHeader('Content-Type', 'image/png');
            return canvas.pngStream().pipe(res);
        }
        else {
            return res.status(403).json('Forbidden');
        }
    } //
    catch (err) {
        console.error(err);
        return res.status(500).send('Error fetching board data.');
    }
}
