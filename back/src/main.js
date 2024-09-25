const express = require('express');
const redis = require('redis');
const { Pool } = require('pg');
const WebSocket = require('ws');
const app = express();
app.use(express.json());

// Connect to Redis
const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD
});
redisClient.connect();

const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
});

const wss = new WebSocket.Server({ port: 8081 });

let updates = [];

async function initializeBoard() {
    const board = [];

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
                    board[x][y] = { color_id: cell.color_id, user: cell.name, time: cell.set_time };
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

async function getColor() {
    const colors = [];

    const result = await pool.query(`
        SELECT id, name, red, green, blue
        FROM colors
        ORDER BY id
    `);

    return result.rows;
}

app.get('/get', async (req, res) => {
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
});

app.post('/set', async (req, res) => {
    const { x, y, color, user_id } = req.body;

    try {
        const key = `${x}:${y}`;
        const cell = { color, user_id, time: new Date().toISOString() };
        await redisClient.set(key, JSON.stringify(cell));

        const colorResult = await pool.query(`
            INSERT INTO colors (red, green, blue)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING id
        `, [color.red, color.green, color.blue]);

        const color_id = colorResult.rows.length > 0 ? colorResult.rows[0].id : null;

        await pool.query(`
            INSERT INTO board (x, y, color_id, user_id, set_time)
            VALUES ($1, $2, $3, $4, NOW())
        `, [x, y, color_id, user_id]);

        updates.push({ x, y, color, user_id, time: new Date().toISOString() });

        res.send('Cell updated successfully.');
    } //
    catch (err) {
        console.error(err);
        res.status(500).send('Error updating cell.');
    }
});

// WebSocket broadcasting every second
setInterval(() => {
    if (updates.length > 0) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(updates));
            }
        });
        updates = []; // Clear the updates after broadcasting
    }
}, 1000);

// Start the HTTP server
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
