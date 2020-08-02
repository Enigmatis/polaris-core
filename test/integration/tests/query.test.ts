import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as argsQuery from './jsonRequestsAndHeaders/irrelevantEntities.json';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterEach(() => {
    return stopTestServer(polarisServer);
});

describe('simple queries', () => {
    it('all entities query', async () => {
        const result: any = await graphQLRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.allBooks[0].title).toEqual('Book1');
        expect(result.allBooks[1].title).toEqual('Book2');
    });

    it('query with arguments', async () => {
        const result: any = await graphQLRequest(argsQuery.request, argsQuery.headers);
        expect(result.bookByTitle[0].title).toEqual('Book3');
    });
});
