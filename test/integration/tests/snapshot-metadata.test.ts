import { SnapshotStatus } from '@enigmatis/polaris-typeorm';
import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest } from '../server/utils/graphql-client';
import {
    metadataRequest,
    snapshotRequest,
    waitUntilSnapshotRequestIsDone,
} from '../server/utils/snapshot-client';
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

describe('snapshot metadata is generated running snapshot pagination', () => {
    describe('snapshot metadata is returned upon request', () => {
        it('will generate metadata and return it when requested', async () => {
            const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                ...paginatedQuery.headers,
            });
            const snapshotMetadataId = paginatedResult.extensions.snapResponse.snapshotMetadataId;
            await waitUntilSnapshotRequestIsDone(snapshotMetadataId, 500);
            const snapshotMetadata: any = (await metadataRequest(snapshotMetadataId)).data;
            expect(snapshotMetadata.id).toBe(snapshotMetadataId);
            expect(snapshotMetadata.pagesCount).toBe(2);
            expect(snapshotMetadata.status).toBe(SnapshotStatus.DONE);
        });
    });

    describe('page generation will occur even after initial request ends', () => {
        it('returns IN_PROGRESS as status if pagination not ended yet', async () => {
            const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                ...paginatedQuery.headers,
            });
            const snapshotMetadataId = paginatedResult.extensions.snapResponse.snapshotMetadataId;
            const snapshotMetadata: any = (await metadataRequest(snapshotMetadataId)).data;
            await waitUntilSnapshotRequestIsDone(snapshotMetadataId, 500);
            expect(snapshotMetadata.status).toBe(SnapshotStatus.IN_PROGRESS);
        });

        it('not completed pages will return status in_progress', async () => {
            const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                ...paginatedQuery.headers,
            });
            const secondPageId = paginatedResult.extensions.snapResponse.pagesIds[1];
            const snapshotMetadataId = paginatedResult.extensions.snapResponse.snapshotMetadataId;
            const snapshotPage: any = (await snapshotRequest(secondPageId)).data;
            await waitUntilSnapshotRequestIsDone(snapshotMetadataId, 500);
            expect(snapshotPage.status).toBe(SnapshotStatus.IN_PROGRESS);
        });
    });

    describe('snapshot metadata request', () => {
        it('should update metadata last accessed time each access', async () => {
            const paginatedResult = await graphqlRawRequest(paginatedQuery.request, {
                ...paginatedQuery.headers,
            });
            const snapshotMetadataId = paginatedResult.extensions.snapResponse.snapshotMetadataId;
            await waitUntilSnapshotRequestIsDone(snapshotMetadataId, 500);
            const firstSnapshotMetadataRequest = await metadataRequest(snapshotMetadataId);

            const secondSnapshotMetadataRequest = await metadataRequest(snapshotMetadataId);
            expect(Date.parse(secondSnapshotMetadataRequest.data.lastAccessedTime)).toBeGreaterThan(
                Date.parse(firstSnapshotMetadataRequest.data.lastAccessedTime),
            );
        });
    });
});
