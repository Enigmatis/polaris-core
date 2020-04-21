import { PolarisServer } from '../../../src';
import { startTestServer, stopTestServer } from '../server-without-connection/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as argsQuery from './jsonRequestsAndHeaders/queryWithArgs.json';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
});

afterEach(async () => {
    return stopTestServer(polarisServer);
});

describe('simple queries without connection', () => {
    it('all entities query', async () => {
        const result = await graphQLRequest(simpleQuery.request, simpleQuery.headers);
        expect(result.allBooks[0].title).toEqual('Book1');
        expect(result.allBooks[1].title).toEqual('Book2');
    });

    it('query with arguments', async () => {
        const result = await graphQLRequest(argsQuery.request, argsQuery.headers);
        expect(result.bookByTitle[0].title).toEqual('Book3');
    });
});
