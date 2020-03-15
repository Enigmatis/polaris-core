import * as Websocket from 'ws';

export const initializeWebsocket = async (url: string): Promise<Websocket> => {
    const ws = new Websocket(url);

    ws.onopen = () => {
        const onopen = 'WebSocket is open now.';
    };

    ws.onmessage = event => {
        const onmessage = `WebSocket message received: ${event}`;
    };

    ws.onerror = event => {
        const onerror = `WebSocket error observed: ${event}`;
    };

    return ws;
};
