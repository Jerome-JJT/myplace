import fs from "fs";
import { event, gc_event, gc_level, level } from "./types";
import { PIXEL_BUFFER_SIZE, PIXEL_MINUTE_TIMER } from "./consts";
import { pool } from "./db";

let file: any = {}

try {
    const data = fs.readFileSync('/.game_config.json', 'utf8');
    file = JSON.parse(data);
    console.log('FILE LOADED SUCCESSFULLY');
}
catch (err) {
    console.error('CANNOT PARSE GAME CONFIG', err);
}

const raw_levels: gc_level[] = file?.leveling ?? [];
raw_levels.sort((a, b) => {
    return a.min_px - b.min_px
});
const raw_events: gc_event[] = file?.events ?? [];
raw_events.sort((a, b) => {
    if (a.start === b.start) { return 0; }
    else if (a.start < b.start) { return 1; }
    else { return 1; }
});

const levs: level[] = [];
const evens: event[] = [];

const optionParser = (input: string | undefined, base: number) => {
    if (input !== undefined) {
        let val = undefined;
        let op = input.charAt(0);

        if (op > '0' && op < '9') {
            val = parseInt(input);
            op = '=';
        }
        else {
            val = parseInt(input.substring(1));
        }

        if (op === '+') { base += val; }
        else if (op === '-') { base -= val; }
        else if (op === '=') { base = val; }
        else if (op === '%') { base = Math.floor(base * (val / 100)); }
        else { console.error('UNKNOWN PARSED LEVEL', input); }
    }

    return base;
}

let prevNb = PIXEL_BUFFER_SIZE;
let prevCd = PIXEL_MINUTE_TIMER;
raw_levels.forEach((rl, index) => {
    let nb = prevNb;
    let cd = prevCd;

    nb = optionParser(rl.nb_pixels || undefined, nb);
    cd = optionParser(rl.cooldown || undefined, cd);

    prevNb = nb;
    prevCd = cd;

    levs.push({
        num: index,
        min_px: rl.min_px,
        pixel_buffer: nb,
        pixel_timer: cd
    });
});

raw_events.forEach((re) => {
    evens.push({
        start: new Date(re.start),
        end: (re.end !== undefined && re.end !== null) ? new Date(re.end) : undefined,
        pixel_buffer: re.nb_pixels || undefined,
        pixel_timer: re.cooldown || undefined
    });
});


export const getUserPresets = async (userId: number): Promise<level> => {

    const result = await pool.query(`
        SELECT COUNT(*) AS tot FROM board WHERE user_id = $1
    `, [userId]);

    const currentPixels = result.rowCount === 1 ? result.rows[0].tot : 0;
    const good_level = levs.findLast((e) => currentPixels >= e.min_px) ?? levs[0];

    const now = new Date();
    const good_event = evens.findLast((e) => (now > e.start && (e.end === undefined || now < e.end)));
    
    return {
        ...good_level,
        pixel_buffer: optionParser(good_event?.pixel_buffer, good_level.pixel_buffer),
        pixel_timer: optionParser(good_event?.pixel_timer, good_level.pixel_timer)
    }
};
