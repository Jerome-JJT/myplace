import { Pixel } from "./pixels";
import WebSocket from "ws";

export interface Update extends Pixel {
    x: number
    y: number
}

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