import { ApplicationProperties } from '@enigmatis/polaris-common';
import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    const applicationProperties: ApplicationProperties = {
        id: '123123',
        name: 'polaris core tests',
    };
    polarisServer = await startTestServer({ applicationProperties });
    await initializeDatabase();
});

afterEach(() => {
    return stopTestServer(polarisServer);
});

describe('application properties tests', () => {
    test('application properties was provided without version and the default version was applied', async () => {
        const result: any = await graphQLRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.allBooks[0].title).toEqual('Book1');
        expect(result.allBooks[1].title).toEqual('Book2');
    });
});
