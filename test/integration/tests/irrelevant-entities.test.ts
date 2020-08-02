import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphqlRawRequest, graphQLRequest } from '../server/utils/graphql-client';
import * as createAuthor from './jsonRequestsAndHeaders/createAuthor.json';
import * as createBook from './jsonRequestsAndHeaders/createBook.json';
import * as deleteBook from './jsonRequestsAndHeaders/deleteBook.json';
import * as simpleQuery from './jsonRequestsAndHeaders/includeLinkedOperDisabled.json';
import * as irrelevantEntities from './jsonRequestsAndHeaders/irrelevantEntities.json';
import * as irrelevantEntitiesDataVersion from './jsonRequestsAndHeaders/irrelevantEntitiesDataVersion.json';
import * as multipleIrrelevantEntities from './jsonRequestsAndHeaders/multipleQueries.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterEach(() => {
    return stopTestServer(polarisServer);
});

describe('irrelevant entities in response', () => {
    it('should have irrelevant entities if the response is partial', async () => {
        const result: any = await graphqlRawRequest(
            irrelevantEntities.request,
            irrelevantEntities.headers,
        );
        const irrelevantId = ((await graphQLRequest(
            simpleQuery.request,
            simpleQuery.headers,
        )) as any).allBooks[1].id;
        expect(result.extensions.irrelevantEntities.bookByTitle).toContain(irrelevantId);
    });
    it(
        'create 2 new books one deleted and one not answering criteria,' +
            'getting both in irrelevant response',
        async () => {
            const authorId: any = ((await graphqlRawRequest(
                createAuthor.request,
                createAuthor.headers,
            )) as any).data.createAuthor.id;
            const newBook: any = await graphqlRawRequest(createBook.request, createBook.headers, {
                id: authorId,
                title: 'book03',
            });
            const newBook2Id: any = ((await graphqlRawRequest(
                createBook.request,
                createBook.headers,
                {
                    id: authorId,
                    title: 'book004',
                },
            )) as any).data.createBook.id;
            const deletedBookId = newBook.data.createBook.id;
            await graphQLRequest(deleteBook.request, deleteBook.headers, {
                id: deletedBookId,
            });
            const result: any = await graphqlRawRequest(
                irrelevantEntitiesDataVersion.request,
                irrelevantEntitiesDataVersion.headers,
            );
            const allBooksResult: any = await graphQLRequest(
                simpleQuery.request,
                simpleQuery.headers,
            );
            expect(allBooksResult.allBooks).not.toContain(deletedBookId);
            expect(result.extensions.irrelevantEntities.bookByTitle).toContain(deletedBookId);
            expect(result.extensions.irrelevantEntities.bookByTitle).toContain(newBook2Id);
        },
    );

    it('should not get irrelevant entities if no data version in headers', async () => {
        const result = await graphqlRawRequest(irrelevantEntities.request, { 'reality-id': 3 });
        expect(result.extensions.irrelevantEntities).toBeUndefined();
    });

    it('should place irrelevant response in the specific field info', async () => {
        const result: any = await graphqlRawRequest(
            multipleIrrelevantEntities.request,
            multipleIrrelevantEntities.headers,
        );
        expect(result.extensions.irrelevantEntities.a).toBeDefined();
        expect(result.extensions.irrelevantEntities.b).toBeDefined();
        expect(result.extensions.irrelevantEntities.a).toContain(result.data.b[0].id);
        expect(result.extensions.irrelevantEntities.b).toContain(result.data.a[0].id);
    });
});
