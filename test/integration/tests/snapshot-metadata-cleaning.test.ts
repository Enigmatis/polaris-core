import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest } from '../server/utils/graphql-client';
import { metadataRequest, waitUntilSnapshotRequestIsDone } from '../server/utils/snapshot-client';
import * as paginatedQuery from './jsonRequestsAndHeaders/paginatedQuery.json';

let polarisServer: PolarisServer;
beforeEach(async () => {
    polarisServer = await startTestServer({
        snapshotConfig: {
            autoSnapshot: true,
            maxPageSize: 3,
            snapshotCleaningInterval: 5,
            secondsToBeOutdated: 5,
            entitiesAmountPerFetch: 50,
        },
    });
    await initializeDatabase();
});
afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('snapshot metadata cleaned every interval', () => {
    it('should remove expired metadata', async () => {
        const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
            ...paginatedQuery.headers,
        });
        const snapshotMetadataId = paginatedResult.extensions.snapResponse.snapshotMetadataId;
        await waitUntilSnapshotRequestIsDone(snapshotMetadataId, 500);
        await sleep(11000);
        const metadataResponse = await metadataRequest(snapshotMetadataId);
        expect(metadataResponse.data).toBe('');

        function sleep(ms: number) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    });
});
