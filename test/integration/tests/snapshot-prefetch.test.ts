import {PolarisServer} from '../../../src';
import {initializeDatabase} from '../server/dal/data-initalizer';
import {startTestServer, stopTestServer} from '../server/test-server';
import {graphqlRawRequest} from '../server/utils/graphql-client';
import {snapshotRequest} from '../server/utils/snapshot-client';
import * as paginatedQuery from './jsonRequestsAndHeaders/paginatedQuery.json';

let polarisServer: PolarisServer;

afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('snapshot pagination tests with auto disabled', () => {
    describe('snap request is true', () => {
        describe('prefetch is 1', () => {
            it('should query the db every time', async () => {
                polarisServer = await startTestServer({
                    snapshotConfig: {
                        autoSnapshot: false,
                        maxPageSize: 5,
                        snapshotCleaningInterval: 60,
                        secondsToBeOutdated: 60,
                        entitiesAmountPerFetch: 1,
                    },
                });
                await initializeDatabase();
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    paginatedQuery.headers,
                );
                const firstPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[0]);
                const secondPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[1]);
                const returnedBookName = [
                    firstPage.data.data.allBooksPaginated['0'].title,
                    secondPage.data.data.allBooksPaginated['0'].title,
                ];

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(2);
                expect(returnedBookName).toContain('Book1');
                expect(returnedBookName).toContain('Book2');
            });
        });
        describe('prefetch is 2', () => {
            it('should query the db once', async () => {
                polarisServer = await startTestServer({
                    snapshotConfig: {
                        autoSnapshot: false,
                        maxPageSize: 5,
                        snapshotCleaningInterval: 60,
                        secondsToBeOutdated: 60,
                        entitiesAmountPerFetch: 2,
                    },
                });
                await initializeDatabase();
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    paginatedQuery.headers,
                );
                const firstPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[0]);
                const secondPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[1]);
                const returnedBookName = [
                    firstPage.data.data.allBooksPaginated['0'].title,
                    secondPage.data.data.allBooksPaginated['0'].title,
                ];

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(2);
                expect(returnedBookName).toContain('Book1');
                expect(returnedBookName).toContain('Book2');
            });

            it('should query the db once', async () => {
                polarisServer = await startTestServer({
                    snapshotConfig: {
                        autoSnapshot: false,
                        maxPageSize: 5,
                        snapshotCleaningInterval: 60,
                        secondsToBeOutdated: 60,
                        entitiesAmountPerFetch: 2,
                    },
                });
                await initializeDatabase();
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    {...paginatedQuery.headers, "snap-page-size": 2},
                );
                const firstPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[0]);
                const returnedBookName = [
                    firstPage.data.data.allBooksPaginated['0'].title,
                    firstPage.data.data.allBooksPaginated['1'].title,
                ];

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(1);
                expect(returnedBookName).toContain('Book1');
                expect(returnedBookName).toContain('Book2');
            });
        });
        describe('prefetch is larger than response size', () => {
            it('should query the db once', async () => {
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
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    paginatedQuery.headers,
                );
                const firstPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[0]);
                const secondPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[1]);
                const returnedBookName = [
                    firstPage.data.data.allBooksPaginated['0'].title,
                    secondPage.data.data.allBooksPaginated['0'].title,
                ];

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(2);
                expect(returnedBookName).toContain('Book1');
                expect(returnedBookName).toContain('Book2');
            });

            it('should query the db once', async () => {
                polarisServer = await startTestServer({
                    snapshotConfig: {
                        autoSnapshot: false,
                        maxPageSize: 5,
                        snapshotCleaningInterval: 60,
                        secondsToBeOutdated: 60,
                        entitiesAmountPerFetch: 2,
                    },
                });
                await initializeDatabase();
                const paginatedResult = await graphqlRawRequest(
                    paginatedQuery.request,
                    {...paginatedQuery.headers, "snap-page-size": 2},
                );
                const firstPage = await snapshotRequest(paginatedResult.extensions.snapResponse.pagesIds[0]);
                const returnedBookName = [
                    firstPage.data.data.allBooksPaginated['0'].title,
                    firstPage.data.data.allBooksPaginated['1'].title,
                ];

                expect(paginatedResult.extensions.snapResponse.pagesIds.length).toBe(1);
                expect(returnedBookName).toContain('Book1');
                expect(returnedBookName).toContain('Book2');
            });
        });
    });
});
