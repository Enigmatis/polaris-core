import { PolarisServer } from '../../../src';
import { initializeDatabase } from '../server/dal/data-initalizer';
import { startTestServer, stopTestServer } from '../server/test-server';
import { graphQLRequest } from '../server/utils/graphql-client';
import * as includeLinkedOperDisabled from './jsonRequestsAndHeaders/includeLinkedOperDisabled.json';
import * as includeLinkedOperEnabled from './jsonRequestsAndHeaders/includeLinkedOperEnabled.json';
import * as mutation from './jsonRequestsAndHeaders/mutation.json';

let polarisServer: PolarisServer;

beforeEach(async () => {
    polarisServer = await startTestServer();
    await initializeDatabase();
});

afterEach(() => {
    return stopTestServer(polarisServer);
});

describe('reality is specified in the headers', () => {
    it('should set reality of the entity from the header', async () => {
        const result = await graphQLRequest(
            mutation.request,
            { 'reality-id': 3 },
            {
                firstName: 'Amos',
                lastName: 'Oz',
            },
        );

        expect(result.createAuthor.realityId).toEqual(3);
    });

    it('should filter entities for the specific reality', async () => {
        const result = await graphQLRequest(
            includeLinkedOperDisabled.request,
            includeLinkedOperDisabled.headers,
        );
        result.allBooks.forEach((book: { realityId: number }) => {
            expect(book.realityId).toEqual(3);
        });
    });

    describe('include linked operational entities', () => {
        it('should link operational entities if set to true', async () => {
            const result = await graphQLRequest(
                includeLinkedOperEnabled.request,
                includeLinkedOperEnabled.headers,
            );

            result.allBooks.forEach(
                (book: { realityId: number; author: { realityId: number } }) => {
                    expect(book.realityId).toBe(3);
                    expect(book.author.realityId).toBe(0);
                },
            );
        });

        it('should filter operational entities if set to false', async () => {
            const result = await graphQLRequest(
                includeLinkedOperDisabled.request,
                includeLinkedOperDisabled.headers,
            );

            result.allBooks.forEach((book: { author: any }) => {
                expect(book.author).toBeNull();
            });
        });
    });
});
