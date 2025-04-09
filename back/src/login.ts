import { Request, Response } from 'express';
import axios from 'axios';
import SHA256 from 'crypto-js/sha256';
import * as bcrypt from 'bcrypt';

import {
    OAUTH2_AUTHORIZE_URL, OAUTH2_TOKEN_URL, OAUTH2_CALLBACK_URL, OAUTH2_INFO_URL,
    OAUTH2_EMAIL_FIELD, OAUTH2_ID_FIELD, OAUTH2_USERNAME_FIELD,
    OAUTH2_UID,
    OAUTH2_SECRET,
    DEV_MODE
} from './consts';
import { LoggedRequest } from './types';
import { getLastUserPixels } from './pixels_actions';
import { objUrlEncode } from './objUrlEncode';
import { getUserPresets } from './game_config';
import { checkUserExists, createDirectUser, createLocalUser, getNumHash, getUser, loginUser } from './login_helpers';

export const mockLogin = async (req: Request, res: Response) => {
    if (await loginUser(-1, res)) {
        return res.status(200).json({ message: 'Login successful' });
    }
    else {
        return res.status(410).json({ message: 'Login failed' });
    }
}

export const localLogin = async (req: Request, res: Response) => {
    const { username: username_raw, password } = req.body;
    const username = (username_raw as string | undefined)?.trim();

    const errors = [];

    if (username === undefined || username === null) {
        errors.push('Username is required');
    }
    if (password === undefined || password === null) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(410).json({
            message: 'Login account validation error',
            errors: errors
        });
    }
    else {
        const user = await getUser(username!);

        if (user === undefined || user.password === undefined || user.password === null) {
            errors.push('Login error');
            if (DEV_MODE) {
                errors.push('Account not found');
            }
            return res.status(410).json({
                message: 'Login account login error',
                errors: errors
            });
        }
        else {
            if (await bcrypt.compare(password, user.password)) {

                if (await loginUser(user.id, res)) {
                    return res.status(200).json({ message: 'Login success' });
                }
                else {
                    return res.status(410).json({ message: 'Login failed', errors: ['Unknown error'] });
                }
            }
            else {
                errors.push('Login error');
                if (DEV_MODE) {
                    errors.push('Password error');
                }
                return res.status(410).json({
                    message: 'Login account login error',
                    errors: errors
                });
            }
        }
    }
}

export const localCreate = async (req: Request, res: Response) => {
    const { username: username_raw, email: email_raw, password, isUnhashed } = req.body;
    const username = (username_raw as string | undefined)?.trim();
    const email = (email_raw as string | undefined)?.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors = [];

    if (username === undefined || username === null) {
        errors.push('Username is required');
    }
    else if (username.length < 3) {
        errors.push('Username min length is 3');
    }
    if (email === undefined || email === null) {
        errors.push('Email is required');
    }
    else if (!emailRegex.test(email)) {
        errors.push('Email is invalid');
    }
    if (password === undefined || password === null) {
        errors.push('Password is required');
    }
    else if (password.length < 16 && isUnhashed !== true) {
        errors.push('Password length invalid');
    }

    if (errors.length > 0) {
        return res.status(410).json({
            message: 'Create account validation error',
            errors: errors
        });
    }
    else {
        const matches = await checkUserExists(username!, email!);

        if (matches.length > 0) {
            if (matches.find((m) => m.username == username)) {
                errors.push('Username already exists');
            }
            if (matches.find((m) => m.email == email)) {
                errors.push('Email already exists');
            }
            return res.status(410).json({
                message: 'Create account duplicate error',
                errors: errors
            });
        }
        else {
            const prePassword = isUnhashed === true ? SHA256(password).toString() : password;
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(prePassword, saltRounds);

            if (await createLocalUser(username!, email!, hashedPassword, false)) {
                return res.status(201).json({ message: 'Create success, login now' });
            }
            else {
                return res.status(410).json({ message: 'Create failed', errors: ['Unknown error'] });
            }
        }
    }
}

export const guestLogin = async (req: Request, res: Response) => {
    let uniqid = `${req.socket.remoteAddress}_${req.headers['x-forwarded-for']}_${req.headers['user-agent']}`;
    let uniqnum = getNumHash(uniqid);

    if (uniqnum > 0) {
        uniqnum = -uniqnum;
    }
    uniqnum = (uniqnum % 100000000) - 100;

    if (await loginUser(uniqnum, res)) {
        return res.redirect('/')
    }
    else {
        if (await createDirectUser(uniqnum, `Guest_${uniqnum}`, `guest_${uniqnum}@email.com`, false)) {
            if (await loginUser(uniqnum, res)) {
                return res.redirect('/')
            }
            else {
                return res.status(410).json({ message: 'Login failed' });
            }
        }
        else {
            return res.status(410).json({ message: 'Login failed' });
        }
    }
}

export const apiLogin = (req: Request, res: Response) => {
    const args = objUrlEncode({
        response_type: 'code',
        scope: 'public',
        client_id: OAUTH2_UID,
        redirect_uri: OAUTH2_CALLBACK_URL
    });
    return res.redirect(`${OAUTH2_AUTHORIZE_URL}?${args}`);
}

export const apiCallback = async (req: Request, res: Response) => {
    try {
        const token = await axios.post(OAUTH2_TOKEN_URL!, {
            grant_type: 'authorization_code',
            code: req.query.code,
            client_id: OAUTH2_UID,
            client_secret: OAUTH2_SECRET,
            redirect_uri: OAUTH2_CALLBACK_URL,
        }, {})

        if (token.status === 200) {
            const access_token: string = token.data.access_token;

            const userInfos = await axios.get(OAUTH2_INFO_URL!, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })

            if (userInfos.status === 200) {
                const userId = userInfos.data[OAUTH2_ID_FIELD!];
                const userUsername = userInfos.data[OAUTH2_USERNAME_FIELD!];
                const userEmail = OAUTH2_EMAIL_FIELD ? userInfos.data[OAUTH2_EMAIL_FIELD] : null;

                if (await loginUser(userId, res)) {
                    return res.redirect('/')
                    // return res.status(200).json({ message: 'Login successful' });
                }
                else {
                    if (await createDirectUser(userId, userUsername, userEmail, false)) {
                        if (await loginUser(userId, res)) {
                            return res.redirect('/')
                            // return res.status(200).json({ message: 'Login successful' });
                        }
                        else {
                            if (DEV_MODE) {
                                return res.status(410).json({ message: 'Login failed', dev_reason: 'Login after create failed' });
                            }
                            else {
                                return res.status(410).json({ message: 'Login failed' });
                            }
                        }
                    }
                    else {
                        if (DEV_MODE) {
                            return res.status(410).json({ message: 'Login failed', dev_reason: 'Create fail' });
                        }
                        else {
                            return res.status(410).json({ message: 'Login failed' });
                        }
                    }
                }
            }
            else {
                if (DEV_MODE) {
                    return res.status(410).json({ message: 'Login failed', dev_reason: 'Not 200 from api info', url: userInfos });
                }
                else {
                    return res.status(410).json({ message: 'Login failed' });
                }
                // return res.redirect('/')
            }
        }
        else {
            if (DEV_MODE) {
                console.error('LOGIN FAILED');
                return res.status(410).json({ message: 'Login failed', dev_reason: 'Not 200 from api info', url: token });
            }
            else {
                return res.status(410).json({ message: 'Login failed' });
            }
            // return res.redirect('/')
        }
    }
    catch (e: any) {
        if (e.status === 401) {
            if (DEV_MODE) {
                console.error('LOGIN FAILED');
                return res.status(410).json({ message: 'API login failed', dev_reason: 'Received 401', url: e });
            }
            else {
                return res.status(410).json({ message: 'API login failed' });
            }
        }
    }
}

export const logout = (req: Request, res: Response) => {
    res.clearCookie('token');
    res.clearCookie('refresh');
    return res.status(200).json({ message: 'Logged out successfully' });
}


export const profile = async (req: LoggedRequest, res: Response) => {
    const user = req.user!;

    const userPreset = getUserPresets(user.id);
    const timers = getLastUserPixels(user.id);

    return res.status(200).json({
        userInfos: {
            timers: await timers,
            ...(await userPreset),
            ...req.user
        }
    });
};
