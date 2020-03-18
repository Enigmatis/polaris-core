import { PolarisServer } from '../../../src';
import * as customContextFields from '../test-server/constants/custom-context-fields.json';
import { initializeDatabase } from '../test-server/data-initalizer';
import { graphQLRequest } from '../test-server/graphql-client';
import { startTestServer, stopTestServer } from '../test-server/test-server';
import * as customContextCustomFieldRequest from './jsonRequestsAndHeaders/customContextCustomField.json';
import * as customContextInstanceMethodRequest from './jsonRequestsAndHeaders/customContextInstanceMethod.json';
import * as customHeadersRequest from './jsonRequestsAndHeaders/customHeaders.json';

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
