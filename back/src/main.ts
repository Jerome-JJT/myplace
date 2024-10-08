import express from "express";
import WebSocket from "ws";
import cookieParser from 'cookie-parser';
import { sendUpdates } from "./ws";
// const { redisClient } = require('./redis');

const app = express();
app.use(express.json());
app.use(cookieParser());


const { authenticateToken, profile } = require('./login');
const { getPixels, setPixel } = require('./pixels');

app.get('/get', getPixels);
app.post('/set', authenticateToken, setPixel);


const { mockLogin, logout } = require('./login');

app.post('/mocklogin', mockLogin);
app.post('/logout', logout);
app.get('/profile', authenticateToken, profile);

setInterval(() => {
    sendUpdates(wss);
}, 1000);

const server = app.listen(8080, () => {
    console.log('Server is running on port 8080');
});

const wss = new WebSocket.Server({ server: server });
