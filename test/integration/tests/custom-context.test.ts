import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as request from './jsonRequestsAndHeaders/customHeaders.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('custom context tests', () => {
    test('querying author by custom header in the custom context', async () => {
        const result = await graphQLRequest(request.query, request.headers);

        expect(result.authorsByFirstNameFromCustomHeader[0].firstName).toEqual('Author1');
        expect(result.authorsByFirstNameFromCustomHeader[0].realityId).toEqual(0);
    });
});
