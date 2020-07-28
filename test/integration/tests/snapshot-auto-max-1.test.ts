import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest } from '../server/utils/graphql-client';
import { waitUntilSnapshotRequestIsDone } from '../server/utils/snapshot-client';
import * as paginatedQuery from './jsonRequestsAndHeaders/paginatedQuery.json';

let polarisServer: PolarisServer;
beforeEach(async () => {
    polarisServer = await startTestServer({
        snapshotConfig: {
            autoSnapshot: true,
            maxPageSize: 1,
            snapshotCleaningInterval: 1000,
            secondsToBeOutdated: 60,
            entitiesAmountPerFetch: 50,
        },
    });
    await initializeDatabase();
});
afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('snapshot pagination tests with auto enabled', () => {
    describe('max page size is 1', () => {
        describe('snap request is false', () => {
            it('should paginated anyway', async () => {
                const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                    ...paginatedQuery.headers,
                    'snap-request': false,
                });
                const pageIds = paginatedResult.extensions.snapResponse.pagesIds;
                await waitUntilSnapshotRequestIsDone(
                    paginatedResult.extensions.snapResponse.snapshotMetadataId,
                    1000,
                );
                expect(pageIds.length).toBe(2);
            });

            it('should paginated according to minimal snap page size provided', async () => {
                const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                    ...paginatedQuery.headers,
                    'snap-request': false,
                    'snap-page-size': 10,
                });
                const pageIds = paginatedResult.extensions.snapResponse.pagesIds;
                await waitUntilSnapshotRequestIsDone(
                    paginatedResult.extensions.snapResponse.snapshotMetadataId,
                    1000,
                );
                expect(pageIds.length).toBe(2);
            });
        });
    });
});
