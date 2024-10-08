import { redisClient } from './redis';
import { pool } from './db';
import { Request, Response } from 'express';
import { LoggedRequest } from './login';
import { updates } from './ws';

export interface Pixel {
    color_id: number
    username: string
    time: Date
}
export interface Color {
    id: number
    name: string
    red: number
    green: number
    blue: number
}

async function initializeBoard() {
    const board: (Pixel | null)[][] = [];

    for (let x = 0; x < 100; x++) {
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
                    const p: Pixel = { color_id: cell.color_id, username: cell.name, time: cell.set_time }
                    board[x][y] = p;
                    await redisClient.set(key, JSON.stringify(board[x][y]));
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

const getPixels = async (req: Request, res: Response) => {
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

const setPixel = async (req: LoggedRequest, res: Response) => {
    const { x, y, color } = req.body;
    const user = req.user;

    console.log("PRINT", x, y, color, user)

    try {
        const key = `${x}:${y}`;
        const timep = new Date();
        const p: Pixel = { color_id: color, username: user.username, time: timep }
        await redisClient.set(key, JSON.stringify(p));

        // const colorResult = await pool.query(`
        //     INSERT INTO colors (red, green, blue)
        //     VALUES ($1, $2, $3)
        //     ON CONFLICT DO NOTHING
        //     RETURNING id
        // `, [color.red, color.green, color.blue]);

        // const color_id = colorResult.rows.length > 0 ? colorResult.rows[0].id : null;

        await pool.query(`
            INSERT INTO board (x, y, color_id, user_id, set_time)
            VALUES ($1, $2, $3, $4, $5)
        `, [x, y, color, user.id, timep]);

        updates.push({ ...p, x: x, y: y });

        res.send('Cell updated successfully.');
    } //
    catch (err) {
        console.error(err);
        res.status(500).send('Error updating cell.');
    }
}

module.exports = { getPixels, setPixel }