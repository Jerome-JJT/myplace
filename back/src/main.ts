import express, { Request, Response, NextFunction } from "express";
import WebSocket from "ws";
import cookieParser from 'cookie-parser';

import { sendUpdates, sendPing, sendConnecteds } from "./ws";
import { ENABLE_GUEST_LOGIN, ENABLE_OAUTH2_LOGIN } from "./consts";

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


const { queryToken, authenticateToken, profile } = require('./login');
const { getPixels, getImage, getMyBoard } = require('./pixels');
const { setPixel } = require('./pixels_actions');

app.get('/get', queryToken, getPixels);
app.get('/getimage', authenticateToken, getImage);
app.post('/set', authenticateToken, setPixel);


const { mockLogin, guestLogin, apiLogin, apiCallback, logout, rotate_tokens } = require('./login');

if (process.env.NODE_ENV === 'DEV') {
    app.get('/login/mock', mockLogin);
    app.post('/login/mock', mockLogin);
}
if (ENABLE_GUEST_LOGIN === true) {
    app.get('/login/guest', guestLogin);
}
if (ENABLE_OAUTH2_LOGIN === true) {
    app.get('/login/api', apiLogin);
    app.get('/login/callback', apiCallback);
}
app.get('/logout', logout);
app.get('/profile', authenticateToken, profile);

app.get('/myboard', authenticateToken, getMyBoard);
app.get('/rotate_tokens', authenticateToken, rotate_tokens);


const { getLeaderboards } = require('./leaderboard');

app.get('/leaderboards', getLeaderboards);


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

const wss = new WebSocket.Server({ server: server });
wss.on('connection', (client) => {
    const str = JSON.stringify({
        type: 'connecteds',
        nbConnecteds: wss.clients.size
    });

    client.send(str);
});