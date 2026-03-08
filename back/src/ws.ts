import WebSocket from "ws";

import { Update } from "./types";

export const updates: Update[] = [];

export const sendUpdates = (wss: WebSocket.Server) => {

    if (updates.length > 0) {
        const str = JSON.stringify({
            type: 'updates',
            updates: updates,
        });

        const anonStr = JSON.stringify({
            type: 'updates',
            updates: updates.map(u => {
                u['u'] = 'Anon';
                return u;
            }),
        });

        wss.clients.forEach((client) => {

            console.log((client as any).user!, updates)


            if (client.readyState === WebSocket.OPEN && (client as any).user !== undefined) {
                client.send(str);
            }
            else if(client.readyState === WebSocket.OPEN) {
                client.send(anonStr);
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