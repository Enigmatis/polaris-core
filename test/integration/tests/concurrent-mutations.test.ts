import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as concurrentMutations from './jsonRequestsAndHeaders/concurrentMutations.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('concurrent mutations tests', () => {
    it('executes multiple concurrent mutations, the mutations executed successfully', async done => {
        let firstDone = false;
        let secondDone = false;
        let thirdDone = false;

        graphQLRequest(
            concurrentMutations.request,
            concurrentMutations.headers,
            concurrentMutations.variables,
        ).then(res => {
            expect(res.createAuthor).toBeDefined();
            expect(res.createAuthor.firstName).toBe(concurrentMutations.variables.firstName);
            expect(res.createAuthor.lastName).toBe(concurrentMutations.variables.lastName);
            firstDone = true;

            if (secondDone && thirdDone) {
                done();
            }
        });
        graphQLRequest(
            concurrentMutations.requestTwo,
            concurrentMutations.headers,
            concurrentMutations.variables,
        ).then(res => {
            expect(res.createAuthor).toBeDefined();
            expect(res.createAuthor.firstName).toBe(concurrentMutations.variables.fName);
            expect(res.createAuthor.lastName).toBe(concurrentMutations.variables.lName);
            secondDone = true;

            if (firstDone && thirdDone) {
                done();
            }
        });
        graphQLRequest(
            concurrentMutations.requestThree,
            concurrentMutations.headers,
            concurrentMutations.variables,
        ).then(res => {
            expect(res.createAuthor).toBeDefined();
            expect(res.createAuthor.firstName).toBe(concurrentMutations.variables.first);
            expect(res.createAuthor.lastName).toBe(concurrentMutations.variables.last);
            thirdDone = true;

            if (firstDone && secondDone) {
                done();
            }
        });
    });
});
