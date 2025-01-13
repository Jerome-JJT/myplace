import express from "express";
import WebSocket from "ws";
import cookieParser from 'cookie-parser';

import { sendUpdates } from "./ws";

const app = express();
app.use(express.json());
app.use(cookieParser());


const { queryToken, authenticateToken, profile } = require('./login');
const { getPixels, getImage } = require('./pixels');
const { setPixel } = require('./pixels_actions');

app.get('/get', queryToken, getPixels);
app.get('/getimage', authenticateToken, getImage);
app.post('/set', authenticateToken, setPixel);


const { mockLogin, poLogin, apiLogin, apiCallback, logout } = require('./login');

if (process.env.NODE_ENV === 'DEV') {
    app.get('/login/mock', mockLogin);
    app.post('/login/mock', mockLogin);
}
app.get('/login/po', poLogin);
app.get('/login/api', apiLogin);
app.get('/login/callback', apiCallback);
app.get('/logout', logout);
app.get('/profile', authenticateToken, profile);


const { getLeaderboards } = require('./leaderboard');

app.get('/leaderboards', getLeaderboards);


setInterval(() => {
    sendUpdates(wss);
}, 500);

const server = app.listen(8080, () => {
    console.log('Server is running on port 8080');
});

const wss = new WebSocket.Server({ server: server });
