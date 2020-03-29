import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as mutation from './jsonRequestsAndHeaders/mutation.json';

let polarisServer: PolarisServer;

describe('transactional mutations integration tests', () => {
    beforeEach(async () => {
        polarisServer = await startTestServer();
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });

    it('execute multiple mutations concurrently', async done => {
        let firstDone = false;
        let secondDone = false;
        const firstResult = graphQLRequest(mutation.request, mutation.headers).then(value => {
            // tslint:disable-next-line:no-console
            console.log(value);
            firstDone = true;
        });
        const secondResult = graphQLRequest(mutation.requestTwo, mutation.headers).then(value => {
            // tslint:disable-next-line:no-console
            console.log(value);
            secondDone = true;
        });
        if (firstDone && secondDone) {
            done();
        }
        // expect(result.allBooks[0].title).toEqual('Book1');
        // expect(result.allBooks[1].title).toEqual('Book2');
    });
});
