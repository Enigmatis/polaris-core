import * as Websocket from 'ws';
import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../test-server/data-initalizer';
import { graphQLRequest } from '../test-server/graphql-client';
import * as polarisProperties from '../test-server/polaris-properties.json';
import { startTestServer, stopTestServer } from '../test-server/test-server';
import { initializeWebsocket } from '../test-server/websocket-client';
import * as subscription from './jsonRequestsAndHeaders/subscription.json';

const SUBSCRIPTION_ENDPOINT = `ws://localhost:${polarisProperties.port}/${polarisProperties.version}/subscription`;

let polarisServer: PolarisServer;
let websocket: Websocket;

beforeEach(async () => {
    polarisServer = await startTestServer();
    websocket = await initializeWebsocket(SUBSCRIPTION_ENDPOINT);
    await initializeDatabase();
});

afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('subscription tests', () => {
    test('foo', async () => {
        const title = 'Book1';
        const newTitle = 'Just a Title';

        websocket.send(subscription.subscription);
        const result = await graphQLRequest(subscription.mutation, {}, { title, newTitle });

        expect(result.updateBooksByTitle[0].title).toBe(newTitle);
    });
});
