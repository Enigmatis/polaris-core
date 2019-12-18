import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../test-server/data-initalizer';
import { graphQLRequest } from '../test-server/graphql-client';
import { startTestServer, stopTestServer } from '../test-server/test-server';
import * as deleteAuthor from './jsonRequestsAndHeaders/deleteAuthor.json';
import * as deleteBook from './jsonRequestsAndHeaders/deleteBook.json';
import * as authorsByName from './jsonRequestsAndHeaders/queryAuthorsByName.json';
import * as bookByTitle from './jsonRequestsAndHeaders/queryBooksByTitle.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterEach(async () => {
    await stopTestServer(polarisServer);
});

describe('soft delete tests', () => {
    it('should filter deleted entities', async () => {
        const bookDeleteionCriteria = {
            title: '4',
        };
        const bookToDelete = await graphQLRequest(
            bookByTitle.request,
            bookByTitle.headers,
            bookDeleteionCriteria,
        );
        await graphQLRequest(deleteBook.request, deleteBook.headers, {
            id: bookToDelete.bookByTitle[0].id,
        });
        const afterBookDeleteionResponse = await graphQLRequest(
            bookByTitle.request,
            bookByTitle.headers,
            bookDeleteionCriteria,
        );
        expect(afterBookDeleteionResponse.bookByTitle.length).toBe(0);
    });

    it('should delete linked entities to deleted entities', async () => {
        const authorDeletionCriteria = {
            name: '1',
        };

        const bookDeleteionCriteria = {
            title: '1',
        };

        const authorToDelete = await graphQLRequest(
            authorsByName.request,
            authorsByName.headers,
            authorDeletionCriteria,
        );
        await graphQLRequest(deleteAuthor.request, deleteAuthor.headers, {
            id: authorToDelete.authorsByName[0].id,
        });
        const afterBookDeleteionResponse = await graphQLRequest(
            bookByTitle.request,
            bookByTitle.headers,
            bookDeleteionCriteria,
        );
        expect(afterBookDeleteionResponse.bookByTitle.length).toBe(0);
    });
});
