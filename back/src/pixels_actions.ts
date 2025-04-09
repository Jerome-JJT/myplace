import { Response } from 'express';

import { CANVAS_MIN_X, CANVAS_MAX_X, CANVAS_MIN_Y, CANVAS_MAX_Y,
    redisTimeout, UTC_TIME_END, UTC_TIME_START } from './consts';
import { LoggedRequest, PixelToNetwork } from './types';
import { redisClient } from './redis';
import { pool } from './db';
import { updates } from './ws';
import { getUserPresets } from './game_config';
import { checkAdmin } from './login_helpers';

export const getLastUserPixels = async (user_id: number): Promise<number[]> => {
    const result = await pool.query(`
        SELECT (EXTRACT(EPOCH FROM cd_time) * 1000)::BIGINT AS cd_time
        FROM board
        WHERE user_id = $1 AND 
        cd_time > NOW()
        ORDER BY cd_time DESC
    `, [user_id]);

    return result.rows.map((r: {cd_time: string}) => parseInt(r.cd_time));
}

export const setPixel = async (req: LoggedRequest, res: Response) => {
    const { x, y, color } = req.body;
    const user = req.user!;

    const userPresetPromise = getUserPresets(user.id);
    const timersPromise = getLastUserPixels(user.id);
    const isAdminPromise = checkAdmin(user.id);
    const userPreset = await userPresetPromise;
    const timers = await timersPromise;
    const isAdmin = await isAdminPromise;

    const actualDate = Date.now();
    console.log(UTC_TIME_START, UTC_TIME_END, actualDate);
    console.log("PRINT", x, y, color, user);

    if ((UTC_TIME_START < actualDate && actualDate < UTC_TIME_END) || (user.soft_is_admin === true && isAdmin)) {
        if (timers.length < userPreset.pixel_buffer || (user.soft_is_admin === true && isAdmin)) {
            if (x < CANVAS_MIN_X || y < CANVAS_MIN_Y || x >= CANVAS_MAX_X || y >= CANVAS_MAX_Y || color == null || color == undefined) {
                return res.status(406).send('Bad payload');
            }
            try {
                const ret = await pool.query(`
                    INSERT INTO board (x, y, color_id, user_id, cd_time)
                    VALUES ($1, $2, $3, $4, (CURRENT_TIMESTAMP + INTERVAL '1 minute' * $5))
                    RETURNING x, y, color_id, 
                    (EXTRACT(EPOCH FROM set_time) * 1000)::BIGINT AS set_time, 
                    (EXTRACT(EPOCH FROM  cd_time) * 1000)::BIGINT AS cd_time
                    `, [x, y, color, user.id, userPreset.pixel_timer]);
                    
                const inserted = ret.rows.length === 1 ? ret.rows[0] : null;
        
                if (inserted !== null) {
                    const key = `${inserted.x}:${inserted.y}`;
                    const p = PixelToNetwork({ username: user.username, color_id: inserted.color_id, set_time: parseInt(inserted.set_time) })
            
                    const redisPromise = redisClient.set(key, JSON.stringify(p), 'EX', redisTimeout());

                    const newUserPreset = getUserPresets(user.id);

                    updates.push({ ...p, x: inserted.x, y: inserted.y });
                    timers.unshift(parseInt(inserted.cd_time));

                    await redisPromise;
                    return res.status(201).send({
                        update: { ...p, x: inserted.x, y: inserted.y },
                        timers: timers,
                        userInfos: {
                            ...(await newUserPreset)
                        }
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
