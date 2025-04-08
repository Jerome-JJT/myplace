import express, { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import cookieParser from 'cookie-parser';
import { Duplex } from 'stream';

import { sendUpdates, sendPing, sendConnecteds } from "./ws";
import { DEV_MODE, ENABLE_GUEST_LOGIN, ENABLE_LOCAL_LOGIN, ENABLE_OAUTH2_LOGIN, ENABLE_UNLOGGED_VIEW } from "./consts";

import './game_config';

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use((err: any, req: Request, res: Response, next: NextFunction): any => {
    console.log(err);
    if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
        console.error('NOT JSON PAYLOAD', err.body);
        return res.status(400).send({ status: 404, message: 'NOT JSON PAYLOAD' });
    }
    next();
});


const { queryToken, authenticateToken, upgradeRequest } = require('./tokenManagement');
const { profile } = require('./login');
const { getPixels, getImage, getMyBoard } = require('./pixels');
const { setPixel } = require('./pixels_actions');
const { getLeaderboards } = require('./leaderboard');

if (ENABLE_UNLOGGED_VIEW === false) {
    app.get('/get', authenticateToken, getPixels);
    app.get('/leaderboards', authenticateToken, getLeaderboards);
}
else {
    app.get('/get', queryToken, getPixels);
    app.get('/leaderboards', queryToken, getLeaderboards);
}
app.get('/getimage', authenticateToken, getImage);
app.post('/set', authenticateToken, setPixel);


const { mockLogin, guestLogin, localLogin, localCreate, apiLogin, apiCallback, logout } = require('./login');
const { rotate_tokens } = require('./login_helpers');

if (DEV_MODE === true) {
    app.get('/login/mock', mockLogin);
    app.post('/login/mock', mockLogin);
}
if (ENABLE_GUEST_LOGIN === true) {
    app.get('/login/guest', guestLogin);
}
if (ENABLE_LOCAL_LOGIN === true) {
    app.post('/login/login', localLogin);
    app.post('/login/create', localCreate);
}
if (ENABLE_OAUTH2_LOGIN === true) {
    app.get('/login/api', apiLogin);
    app.get('/login/callback', apiCallback);
}
app.get('/logout', logout);
app.get('/profile', authenticateToken, profile);

app.get('/myboard', authenticateToken, getMyBoard);
app.get('/rotate_tokens', authenticateToken, rotate_tokens);



setInterval(() => {
    sendUpdates(wss);
}, 500);
// setInterval(() => {
//     sendPing(wss);
// }, 10000);
setInterval(() => {
    sendConnecteds(wss);
}, 10000);


const server = app.listen(8080, () => {
    console.log('Server is running on port 8080');
});

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request: Request, socket: Duplex, head: Buffer) => 
    upgradeRequest(request, socket, head, wss)
);

wss.on('connection', (client) => {
    const str = JSON.stringify({
        type: 'connecteds',
        nbConnecteds: wss.clients.size
    });

    client.send(str);
});