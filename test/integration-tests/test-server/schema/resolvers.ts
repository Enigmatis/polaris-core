import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { PubSub } from 'apollo-server-express';
import { DeleteResult, getPolarisConnectionManager, Like } from '../../../../src/index';
import { Author } from '../dal/author';
import { Book } from '../dal/book';
import { polarisGraphQLLogger } from '../logger';
import { TestContext } from '../test-context';

const pubsub = new PubSub();
const BOOK_UPDATED = 'BOOK_UPDATED';

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
            await authorRepos.delete(context, args.id);
            return true;
        },
    },
    Subscription: {
        bookUpdated: {
            subscribe: () => pubsub.asyncIterator([BOOK_UPDATED]),
        },
    },
};
