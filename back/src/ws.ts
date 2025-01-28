import WebSocket from "ws";

import { Update } from "./types";

export const updates: Update[] = [];

export const sendUpdates = (wss: WebSocket.Server) => {
    if (updates.length > 0) {
        const str = JSON.stringify({
            type: 'updates',
            updates: updates,
        });

        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(str);
            }
        });

        updates.splice(0, updates.length);
    }
}

export const sendPing = (wss: WebSocket.Server) => {
    const str = JSON.stringify({
        type: 'ping'
    });

    wss.clients.forEach((client) => {
        client.send(str);
    });
}

export const sendConnecteds = (wss: WebSocket.Server) => {
    const str = JSON.stringify({
        type: 'connecteds',
        nbConnecteds: wss.clients.size
    });

    wss.clients.forEach((client) => {
        client.send(str);
    });
}