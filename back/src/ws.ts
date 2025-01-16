import WebSocket from "ws";

import { Update } from "./types";

export const updates: Update[] = [];

export const sendUpdates = (wss: WebSocket.Server) => {
    if (updates.length > 0) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(updates));
            }
        });

        updates.splice(0, updates.length);
    }
}

export const sendPing = (wss: WebSocket.Server) => {
    wss.clients.forEach((client) => {
        client.send('ping');
    });
}