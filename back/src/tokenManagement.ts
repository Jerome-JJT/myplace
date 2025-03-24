import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Duplex } from 'stream';
import * as cookie from 'cookie';
import { WebSocketServer } from 'ws';

import {
    ENABLE_UNLOGGED_VIEW,
    JWT_SECRET,
} from './consts';
import { LoggedRequest } from './types';
import { loginUser } from './login';



export const upgradeRequest = async (request: Request, socket: Duplex, head: Buffer, wss: WebSocketServer) => {
    const cookies = cookie.parse(request.headers.cookie || '');

    jwt.verify(cookies.token || '', JWT_SECRET, (err: any, decoded_t: any) => {
        if (ENABLE_UNLOGGED_VIEW === false && err) {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
            socket.destroy()
            return
        }
        else {
            wss.handleUpgrade(request, socket, head, connection => {
                wss.emit('connection', connection, request)
            })
        }
    });
}

export const checkToken = async (req: LoggedRequest, res: Response, next: any, fail: boolean = false) => {
    const token = req.cookies.token;
    const refresh = req.cookies.refresh;
    if (!token && !refresh) {
        if (fail) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }
        else {
            req.user = undefined;
            return next();
        }
    }
    else {
        jwt.verify(token, JWT_SECRET, (err: any, decoded_t: any) => {
            if (err) {
                jwt.verify(refresh, JWT_SECRET, async (err: any, decoded_r: any) => {
                    if (err) {
                        res.clearCookie('token');
                        res.clearCookie('refresh');
                        if (fail) {
                            return res.status(401).json({ message: 'Invalid or expired token' });
                        }
                        else {
                            req.user = undefined;
                            return next();
                        }
                    }
                    else {
                        const logged = await loginUser(decoded_r.id, res, decoded_r.token_seq);
                        if (logged) {
                            return res.status(426).json({ message: 'Token refreshed' });
                        }
                        else {
                            res.clearCookie('token');
                            res.clearCookie('refresh');
                            return res.status(410).json({ message: 'Login failed' });
                        }
                    }
                })
            }
            else {
                if (decoded_t.soft_is_banned) {
                    return res.status(409).json({ message: 'Conflict' });
                }
                else {
                    req.user = decoded_t;
                    return next();
                }
            }
        });
    }
}

export const queryToken = async (req: LoggedRequest, res: Response, next: any) => {
    return await checkToken(req, res, next, false);
}
export const authenticateToken = async (req: LoggedRequest, res: Response, next: any) => {
    return await checkToken(req, res, next, true);
}
