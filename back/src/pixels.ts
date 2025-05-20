import { Response } from 'express';

import { CANVAS_MIN_X, CANVAS_MIN_Y, CANVAS_MAX_X, CANVAS_MAX_Y, CANVAS_SIZE_X, CANVAS_SIZE_Y, redisTimeout, UTC_TIME_END } from './consts';
import { Color, LoggedRequest, PixelNetwork, PixelToNetwork } from './types';
import { redisClient } from './redis';
import { pool } from './db';
import { matchCampus } from './flag';
import { checkAdmin } from './login_helpers';
const { createCanvas } = require('canvas');

async function initializeBoard(loggedView = false) {
    const board: (PixelNetwork | null)[][] = [];

    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, ranked_board.color_id, users.username, users.campus_name, (EXTRACT(EPOCH FROM ranked_board.set_time) * 1000)::BIGINT AS set_time
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


    for (let x = CANVAS_MIN_X; x < CANVAS_MAX_X; x++) {
        const colExpire = redisTimeout();
        board[x - CANVAS_MIN_X] = [];
        const queryKeys: string[] = [];

        for (let y = CANVAS_MIN_Y; y < CANVAS_MAX_Y; y++) {
            const key = `${x}:${y}`;
            queryKeys.push(key);
        }
 
        const cachedCells = await redisClient.mGet(queryKeys);
        const cachedSet: {[key: string]: string} = {};

        for (let y = CANVAS_MIN_Y; y < CANVAS_MAX_Y; y++) {
            if (cachedCells[y - CANVAS_MIN_Y] !== null) {
                board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y] = JSON.parse(cachedCells[y - CANVAS_MIN_Y]);
                if (!loggedView && board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y]!.u !== 'null') board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y]!.u = 'Anon';     
            } //
            else {
                // const cell = result.rows.find((v) => {
                //     return v.x === x && v.y === y
                // });
                const key = `${x}:${y}`;
                const cell = mapResults.get(key);
                
                if (cell !== undefined) {
                    const p = PixelToNetwork({ color_id: cell.color_id, username: cell.username, campus_name: cell.campus_name, flag: matchCampus.get(cell.campus_name)?.countryCode, set_time: parseInt(cell.set_time) });
                    board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y] = p;
                    if (!loggedView) board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y]!.u = 'Anon';
                } //
                else {
                    const p = PixelToNetwork({ color_id: 1, username: 'null', campus_name: undefined, flag: undefined, set_time: 0 });
                    board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y] = p;
                }

                cachedSet[key] = JSON.stringify(board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y]);
            }
        }

        if (Object.keys(cachedSet).length > 0) {
            await redisClient.mSet(cachedSet, 'EX', colExpire);
        }
    }
    return board;
}

async function viewTimedBoard(time: string, {user_id = null}: {user_id?: string | null}) {
    const board: (PixelNetwork | null)[][] = [];
    
    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, ranked_board.color_id, users.username, users.campus_name, (EXTRACT(EPOCH FROM ranked_board.set_time) * 1000)::BIGINT AS set_time
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
            JOIN users ON users.id = board.user_id
            WHERE board.set_time < $1
        ) as ranked_board
        LEFT JOIN users ON users.id = ranked_board.user_id
        WHERE rn = 1 AND
        (
            CAST($2 AS VARCHAR) IS NULL OR
            CAST(users.id AS VARCHAR) = CAST($2 AS VARCHAR) OR
            CAST(users.username AS VARCHAR) = CAST($2 AS VARCHAR)
        )
    `, [time, user_id]);
    const mapResults = new Map();
    result.rows.forEach((v) => {
        mapResults.set(`${v.x}:${v.y}`, v)
    });

    for (let x = CANVAS_MIN_X; x < CANVAS_MAX_X; x++) {
        board[x - CANVAS_MIN_X] = [];
        for (let y = CANVAS_MIN_Y; y < CANVAS_MAX_Y; y++) {

            const key = `${x}:${y}`;
            const cell = mapResults.get(key);
            if (cell !== undefined) {
                const p = PixelToNetwork({ color_id: cell.color_id, username: cell.username, campus_name: cell.campus_name, flag: matchCampus.get(cell.campus_name)?.countryCode, set_time: parseInt(cell.set_time) })
                board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y] = p;
            }
            else {
                const p = PixelToNetwork({ color_id: 1, username: 'null', campus_name: undefined, flag: undefined, set_time: 0 })
                board[x - CANVAS_MIN_X][y - CANVAS_MIN_Y] = p;
            }
        }
    }
    return {board};
}


async function createBoardImage(time: string, {scale = 1, transparent = false, user_id = null}: {scale?: number, transparent?: boolean, user_id?: string | null}) {
    const result = await pool.query(`
        SELECT ranked_board.x, ranked_board.y, users.username, (EXTRACT(EPOCH FROM ranked_board.set_time) * 1000)::BIGINT AS set_time, colors.red, colors.green, colors.blue
        FROM (
            SELECT x, y, user_id, color_id, set_time,
                ROW_NUMBER() OVER (PARTITION BY x, y ORDER BY set_time DESC) as rn
            FROM board
            JOIN users ON users.id = board.user_id
            WHERE board.set_time < $1
        ) as ranked_board
        LEFT JOIN users ON users.id = ranked_board.user_id
        JOIN colors ON colors.id = ranked_board.color_id
        WHERE rn = 1 AND (
            CAST($2 AS VARCHAR) IS NULL OR
            CAST(users.id AS VARCHAR) = CAST($2 AS VARCHAR) OR
            CAST(users.username AS VARCHAR) = CAST($2 AS VARCHAR)
        )
    `, [time, user_id]);
    const mapResults = new Map();
    result.rows.forEach((v) => {
        mapResults.set(`${v.x}:${v.y}`, v)
    });

    const colors = await getColors();
    const color1 = colors.find((v) => v.id === 1);
    const white = color1 !== undefined ? color1 : {red: 255, green: 255, blue: 255};

    const canvas = createCanvas(CANVAS_SIZE_X * scale, CANVAS_SIZE_Y * scale);
    const ctx = canvas.getContext('2d');

    for (let x = CANVAS_MIN_X; x < CANVAS_MAX_X; x++) {
        for (let y = CANVAS_MIN_Y; y < CANVAS_MAX_Y; y++) {
            const cell = mapResults.get(`${x}:${y}`);

            if (cell !== undefined) {
                const { red, green, blue } = cell;
                ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                ctx.fillRect((x - CANVAS_MIN_X) * scale, (y - CANVAS_MIN_Y) * scale, scale, scale);
            }
            else {
                if (transparent === true) {
                    ctx.fillStyle = `rgba(0, 0, 0, 255)`;
                }
                else {
                    ctx.fillStyle = `rgb(${white.red}, ${white.green}, ${white.blue})`;
                }
                ctx.fillRect((x - CANVAS_MIN_X) * scale, (y - CANVAS_MIN_Y) * scale, scale, scale);
            }
        }
    }

    return {canvas};
}


async function getColors(): Promise<Color[]> {
    const result = await pool.query(`
        SELECT id, name, red, green, blue, row_number() OVER (ORDER BY corder ASC) AS corder
        FROM colors
        ORDER BY corder ASC
    `);

    return result.rows;
}

async function getTimes(): Promise<{min_time: number, max_time: number}> {
    const times = {
        min_time: 0,
        max_time: 0
    }

    const time_result = await pool.query(`
        SELECT 
        MIN((EXTRACT(EPOCH FROM board.set_time))::BIGINT * 1000) AS min_time, 
        MAX((EXTRACT(EPOCH FROM board.set_time))::BIGINT * 1000) AS max_time
        FROM board
        LIMIT 1
    `, []);
    if (time_result.rows.length > 0) {
        const cell = time_result.rows[0];
        times.min_time = parseInt(cell.min_time);
        times.max_time = parseInt(cell.max_time);
    }

    return times;
}

export const getPixels = async (req: LoggedRequest, res: Response) => {
    try {
        const colors = await getColors();
        if (req.query.time !== undefined && (req.user?.soft_is_admin === true && await checkAdmin(req.user?.id))) {
            const {min_time, max_time} = await getTimes();

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
            const board = await initializeBoard(req?.user !== undefined);
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

export const getMyBoard = async (req: LoggedRequest, res: Response) => {
    try {
        const user = req.user!;
        const actualDate = Date.now();

        if ((actualDate > UTC_TIME_END) || (user.soft_is_admin === true && (await checkAdmin(user.id)))) {

            const time = new Date();
            const scale = 8;

            const {canvas} = await createBoardImage(time.toISOString(), {
                scale: scale, 
                transparent: req.query.transparent !== undefined,
                user_id: `${user.id}`
            });

            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', `attachment; filename=myboard_${req.query.transparent !== undefined ? 'transparent' : 'white'}.png`);
            return canvas.pngStream().pipe(res);

        }
        else {
            return res.status(420).send({
                message: 'Enhance your hype',
            });
        }
    } //
    catch (err) {
        console.error(err);
        return res.status(500).send('Error fetching board data.');
    }
}
