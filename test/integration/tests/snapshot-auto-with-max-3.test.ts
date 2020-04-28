import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest } from '../server/utils/graphql-client';
import * as paginatedQuery from './jsonRequestsAndHeaders/paginatedQuery.json';

let polarisServer: PolarisServer;
beforeEach(async () => {
    polarisServer = await startTestServer({
        snapshotConfig: {
            autoSnapshot: true,
            maxPageSize: 3,
            snapshotCleaningInterval: 60,
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
    describe('max page size is 3', () => {
        describe('snap request is true', () => {
            it('should not paginate if total count is smaller than minimal page size', async () => {
                const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                    ...paginatedQuery.headers,
                    'snap-page-size': 10,
                });
                const snapResponse = paginatedResult.extensions.snapResponse;
                expect(snapResponse).toBeUndefined();
                expect(paginatedResult.data.allBooksPaginated.length).toBe(2);
            });
        });
        describe('snap request is false', () => {
            it('should paginate if total count is larger than minimal page size', async () => {
                const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                    ...paginatedQuery.headers,
                    'snap-request': false,
                    'snap-page-size': 1,
                });
                const pageIds = paginatedResult.extensions.snapResponse.pagesIds;
                expect(pageIds.length).toBe(2);
            });

            it('should not paginate if total count is smaller than minimal page size', async () => {
                const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                    ...paginatedQuery.headers,
                    'snap-request': false,
                    'snap-page-size': 10,
                });
                const snapResponse = paginatedResult.extensions.snapResponse;
                expect(snapResponse).toBeUndefined();
                expect(paginatedResult.data.allBooksPaginated.length).toBe(2);
            });
        });
    });
});
