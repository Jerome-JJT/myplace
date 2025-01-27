import { Response } from 'express';

import { CANVAS_X, CANVAS_Y, PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER, redisTimeout, UTC_TIME_END, UTC_TIME_START } from './consts';
import { LoggedRequest, Pixel } from './types';
import { redisClient } from './redis';
import { pool } from './db';
import { updates } from './ws';
import { checkAdmin } from './login';

export const getLastUserPixels = async (user_id: number): Promise<number[]> => {

    const result = await pool.query(`
        SELECT (EXTRACT(EPOCH FROM (set_time + INTERVAL '1 minute' * $2)) * 1000)::BIGINT AS set_time
        FROM board
        WHERE user_id = $1 AND 
        (set_time + INTERVAL '1 minute' * $2) > NOW()
        ORDER BY set_time DESC
        LIMIT $3
    `, [user_id, PIXEL_MINUTE_TIMER, PIXEL_BUFFER_SIZE]);

    return result.rows.map((r: {set_time: string}) => parseInt(r.set_time));
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
            if (x < 0 || y < 0 || x >= CANVAS_X || y >= CANVAS_Y || color == null || color == undefined) {
                return res.status(406).send('Bad payload');
            }
            try {
                const ret = await pool.query(`
                    INSERT INTO board (x, y, color_id, user_id)
                    VALUES ($1, $2, $3, $4)
                    RETURNING x, y, color_id, (EXTRACT(EPOCH FROM set_time) * 1000)::BIGINT AS set_time, 
                    (EXTRACT(EPOCH FROM (set_time + INTERVAL '1 minute' * $5)) * 1000)::BIGINT AS cd_time
                    `, [x, y, color, user.id, PIXEL_MINUTE_TIMER]);
                    
                const inserted = ret.rows.length === 1 ? ret.rows[0] : null;
        
                if (inserted !== null) {
                    const key = `${inserted.x}:${inserted.y}`;
                    const p: Pixel = { username: user.username, color_id: inserted.color_id, set_time: parseInt(inserted.set_time) }
            
                    await redisClient.set(key, JSON.stringify(p), 'EX', redisTimeout());

                    updates.push({ ...p, x: inserted.x, y: inserted.y });
                    timers.unshift(parseInt(inserted.cd_time));
                    return res.status(201).send({
                        update: { ...p, x: inserted.x, y: inserted.y },
                        timers: timers
                    });
                }
                else {
                    return res.status(417).send('Strange insertion error appened');
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
