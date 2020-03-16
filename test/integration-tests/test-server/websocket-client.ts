import { SubscriptionClient } from 'subscriptions-transport-ws';
import * as ws from 'ws';

export class WebsocketClient {
    public readonly receivedMessages: any[] = [];
    public readonly subscriptionClient: SubscriptionClient;

    constructor(url: string) {
        this.subscriptionClient = new SubscriptionClient(url, { reconnect: true }, ws);

        this.subscriptionClient.client.onmessage = (event: { data: any }) => {
            const data = JSON.parse(event.data);
            if (data.payload) {
                this.receivedMessages.push(data.payload.data);
            }
        };
    }

    public close = async (): Promise<void> => {
        await this.subscriptionClient.close();
    };

    public send = async (query: string): Promise<void> => {
        const body = { type: 'start', payload: { query } };
        await this.subscriptionClient.client.send(JSON.stringify(body));
    };
}
