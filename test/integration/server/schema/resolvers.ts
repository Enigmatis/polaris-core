import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PubSub } from 'apollo-server-express';
import {
    DeleteResult,
    getPolarisConnectionManager,
    Like,
    PaginatedResolver,
} from '../../../../src/index';
import { TestContext } from '../context/test-context';
import { Author } from '../dal/entities/author';
import { Book } from '../dal/entities/book';
import { polarisGraphQLLogger } from '../utils/logger';

const pubsub = new PubSub();
const BOOK_UPDATED = 'BOOK_UPDATED';

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const resolvers = {
    Query: {
        allBooks: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book[]> => {
            const connection = getPolarisConnectionManager().get();
            polarisGraphQLLogger.debug("I'm the resolver of all books", context);
            return connection.getRepository(Book).find(context, { relations: ['author'] });
        },
        allBooksPaginated: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<PaginatedResolver<Book>> => {
            const connection = getPolarisConnectionManager().get();
            polarisGraphQLLogger.debug("I'm the resolver of all books", context);
            return {
                getData: async (startIndex?: number, pageSize?: number): Promise<Book[]> => {
                    return connection.getRepository(Book).find(context, {
                        relations: ['author'],
                        skip: startIndex,
                        take: pageSize,
                    });
                },
                totalCount: (): Promise<number> => {
                    return connection.getRepository(Book).count(context);
                },
            };
        },
        allBooksWithWarnings: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book[]> => {
            const connection = getPolarisConnectionManager().get();
            context.returnedExtensions.warnings = ['warning 1', 'warning 2'];
            return connection.getRepository(Book).find(context, { relations: ['author'] });
        },
        bookByTitle: (parent: any, args: any, context: PolarisGraphQLContext): Promise<Book[]> => {
            const connection = getPolarisConnectionManager().get();
            return connection.getRepository(Book).find(context, {
                where: { title: Like(`%${args.title}%`) },
                relations: ['author'],
            });
        },
        authorsByName: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author[]> => {
            const connection = getPolarisConnectionManager().get();
            return connection
                .getRepository(Author)
                .find(context, { where: { firstName: Like(`%${args.name}%`) } });
        },
        authorById: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author | undefined> => {
            const connection = getPolarisConnectionManager().get();
            return connection
                .getRepository(Author)
                .findOne(context, { where: { id: args.id } }, {});
        },
        authorsByFirstNameFromCustomHeader: async (
            parent: any,
            args: any,
            context: TestContext,
        ): Promise<Author[]> => {
            const connection = getPolarisConnectionManager().get();
            return connection.getRepository(Author).find(context, {
                where: { firstName: Like(`%${context.requestHeaders.customHeader}%`) },
            });
        },
        customContextCustomField: (parent: any, args: any, context: TestContext): number =>
            context.customField,
        customContextInstanceMethod: (parent: any, args: any, context: TestContext): string =>
            context.instanceInContext.doSomething(),
    },
    Mutation: {
        createAuthor: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author> => {
            const connection = getPolarisConnectionManager().get();
            const authorRepo = connection.getRepository(Author);
            const newAuthor = new Author(args.firstName, args.lastName);
            await authorRepo.save(context, newAuthor);
            return newAuthor;
        },
        createBook: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book | undefined> => {
            const connection = getPolarisConnectionManager().get();
            const authorRepo = connection.getRepository(Author);
            const bookRepo = connection.getRepository(Book);
            const author = await authorRepo.findOne(context, { where: { id: args.id } });
            if (author) {
                const newBook = new Book(args.title, author);
                await bookRepo.save(context, newBook);
                return newBook;
            }
        },
        updateBooksByTitle: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book[]> => {
            const connection = getPolarisConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            const result: Book[] = await bookRepo.find(context, {
                where: { title: Like(`%${args.title}%`) },
            });

            result.forEach(book => (book.title = args.newTitle));
            await bookRepo.save(context, result);
            result.forEach(book => pubsub.publish(BOOK_UPDATED, { bookUpdated: book }));
            return result;
        },
        deleteBook: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<boolean> => {
            const connection = getPolarisConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            const result: DeleteResult = await bookRepo.delete(context, args.id);
            return (
                result &&
                result.affected !== null &&
                result.affected !== undefined &&
                result.affected > 0
            );
        },
        deleteAuthor: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<boolean> => {
            const connection = getPolarisConnectionManager().get();
            const authorRepos = connection.getRepository(Author);
            const result: DeleteResult = await authorRepos.delete(context, args.id);
            return (
                result &&
                result.affected !== null &&
                result.affected !== undefined &&
                result.affected > 0
            );
        },
    },
    Subscription: {
        bookUpdated: {
            subscribe: () => pubsub.asyncIterator([BOOK_UPDATED]),
        },
    },
};
