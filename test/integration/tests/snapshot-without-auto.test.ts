import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest } from '../server/utils/graphql-client';
import { snapshotRequest } from '../server/utils/snapshot-client';
import * as paginatedQuery from './jsonRequestsAndHeaders/paginatedQuery.json';

let polarisServer: PolarisServer;
beforeEach(async () => {
    polarisServer = await startTestServer({
        snapshotConfig: {
            autoSnapshot: false,
            maxPageSize: 5,
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

describe('snapshot pagination tests with auto disabled', () => {
    describe('snap request is true', () => {
        describe('snap page size', () => {
            it('snap size is 1 divides to 2 pages', async () => {
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    paginatedQuery.headers,
                );

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(2);
            });
            it('snap size is 2 divides to 1 page', async () => {
                const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                    ...paginatedQuery.headers,
                    'snap-page-size': 3,
                });

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(1);
            });
        });
        describe('data is accessible by snapshot page id', () => {
            it('should return data for page id', async () => {
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    paginatedQuery.headers,
                );
                const pageIds = paginatedResult.extensions.snapResponse.pagesIds;
                const firstPage = await snapshotRequest(pageIds[0]);
                const secondPage = await snapshotRequest(pageIds[1]);
                const returnedBookName = [
                    firstPage.data.data.allBooksPaginated['0'].title,
                    secondPage.data.data.allBooksPaginated['0'].title,
                ];

                expect(returnedBookName).toContain('Book1');
                expect(returnedBookName).toContain('Book2');
            });
            it('should return extensions for page id', async () => {
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    paginatedQuery.headers,
                );
                const pageIds = paginatedResult.extensions.snapResponse.pagesIds;
                const firstPage = await snapshotRequest(pageIds[0]);
                const secondPage = await snapshotRequest(pageIds[1]);

                expect(firstPage.data.extensions.totalCount).toBe(2);
                expect(firstPage.data.extensions.globalDataVersion).toBe(3);
                expect(secondPage.data.extensions.totalCount).toBe(2);
                expect(secondPage.data.extensions.globalDataVersion).toBe(3);
            });
        });
        it('should return empty data and regular extensions', async () => {
            const paginatedResult = await graphqlRawRequest(
                paginatedQuery.request,
                paginatedQuery.headers,
            );

            expect(paginatedResult.data).toStrictEqual({});
            expect(paginatedResult.extensions.globalDataVersion).toBe(3);
            expect(paginatedResult.extensions.totalCount).toBe(2);
        });
    });
});
