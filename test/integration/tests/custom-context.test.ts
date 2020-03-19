import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as request from './jsonRequestsAndHeaders/customHeaders.json';

let polarisServer: PolarisServer;

beforeAll(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterAll(async () => {
    await stopTestServer(polarisServer);
});

describe('custom context tests', () => {
    test('querying author by custom header in the custom context', async () => {
        const result = await graphQLRequest(
            customHeadersRequest.query,
            customHeadersRequest.headers,
        );

        expect(result.authorsByFirstNameFromCustomHeader[0].firstName).toEqual('Author1');
        expect(result.authorsByFirstNameFromCustomHeader[0].realityId).toEqual(0);
    });

    test('querying custom field in the custom context', async () => {
        const result = await graphQLRequest(
            customContextCustomFieldRequest.query,
            customContextCustomFieldRequest.headers,
        );

        expect(result.customContextCustomField).toEqual(customContextFields.customField);
    });

    test('querying method of a TestClassInContext instance in the custom context', async () => {
        const result = await graphQLRequest(
            customContextInstanceMethodRequest.query,
            customContextInstanceMethodRequest.headers,
        );
        const expectedMethodResult = `did something successfully with someProperty of ${customContextFields.instanceInContext.someProperty}`;

        expect(result.customContextInstanceMethod).toEqual(expectedMethodResult);
    });
});
