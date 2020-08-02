import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest, graphQLRequest } from '../server/utils/graphql-client';
import * as multipleMutationsWithBrokenOne from './jsonRequestsAndHeaders/multipleMutationsWithBrokenOne.json';
import * as simpleQuery from './jsonRequestsAndHeaders/simpleQuery.json';

let polarisServer: PolarisServer;

describe('transactional mutations enabled integration tests', () => {
    beforeEach(async () => {
        polarisServer = await startTestServer();
        await initializeDatabase();
    });

    afterEach(async () => {
        await stopTestServer(polarisServer);
    });

    it("execute multiple mutations in one request and one of the mutations is broken, the data version wasn't changed", async () => {
        let dataVersionBeforeUpdate;
        try {
            dataVersionBeforeUpdate = (
                await graphqlRawRequest(simpleQuery.request, simpleQuery.headers)
            ).extensions.globalDataVersion;
            await graphQLRequest(
                multipleMutationsWithBrokenOne.request,
                undefined,
                multipleMutationsWithBrokenOne.variables,
            );
        } catch (err) {
            const dataVersionAfterUpdate = (
                await graphqlRawRequest(simpleQuery.request, simpleQuery.headers)
            ).extensions.globalDataVersion;
            expect(dataVersionAfterUpdate).toEqual(dataVersionBeforeUpdate);
        }
    });

    it("execute multiple mutations in one request and one of the mutations is broken, the data in db wasn't changed", async () => {
        try {
            await graphQLRequest(
                multipleMutationsWithBrokenOne.request,
                undefined,
                multipleMutationsWithBrokenOne.variables,
            );
        } catch (err) {
            const result: any = await graphqlRawRequest(
                multipleMutationsWithBrokenOne.dataValidateRequest,
                undefined,
                multipleMutationsWithBrokenOne.variables,
            );
            expect(result.data.a.length).toEqual(0);
            expect(result.data.b.length).toEqual(0);
        }
    });
});
