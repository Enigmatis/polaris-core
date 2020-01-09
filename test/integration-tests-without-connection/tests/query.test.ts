import { PolarisServer } from '../../../src';
import { graphQLRequest } from '../../integration-tests/test-server/graphql-client';
import { startTestServer, stopTestServer } from '../server/test-server-without-connection';
import * as argsQuery from './jsonRequestsAndHeaders/queryWithArgs.json';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';
let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
});

afterEach(() => {
    return stopTestServer(polarisServer);
});

describe('simple queries', () => {
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
