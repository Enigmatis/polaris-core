import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import {getConnectionManager, Like, PolarisFindOptions, PolarisSaveOptions} from '../../../../src/index';
import { Author } from '../dal/author';
import { Book } from '../dal/book';
import { polarisGraphQLLogger } from '../logger';

export const resolvers = {
    Query: {
        allBooks: async (parent: any, args: any, context: PolarisGraphQLContext): Promise<Book[]> => {
            const connection = getConnectionManager().get();
            polarisGraphQLLogger.debug("I'm the resolver of all books");
            const result = await connection
                .getRepository(Book)
                .find(new PolarisFindOptions({ relations: ['author']}, context) as any);
            return result;
        },
        bookByTitle: (parent: any, args: any): Promise<Book[]> => {
            const connection = getConnectionManager().get();
            return connection.getRepository(Book).find({
                where: { title: Like(`%${args.title}%`) },
                relations: ['author'],
            });
        },
        authorsByName: async (parent: any, args: any): Promise<Author[]> => {
            const connection = getConnectionManager().get();
            const result = await connection.getRepository(Author).find({
                where: { firstName: Like(`%${args.name}%`) },
            });
            return result;
        },
        authorById: async (parent: any, args: any): Promise<Author | {}> => {
            const connection = getConnectionManager().get();
            return connection.getRepository(Author).findOne({ where: { id: args.id } }) || {};
        },
    },
    Mutation: {
        createAuthor: async (parent: any, args: any): Promise<Author> => {
            const connection = getConnectionManager().get();
            const authorRepo = connection.getRepository(Author);
            const newAuthor = new Author(args.firstName, args.lastName);
            const fuckingContext: any = {};
            await authorRepo.save(newAuthor, fuckingContext);
            return newAuthor;
        },
        updateBook: async (parent: any, args: any): Promise<Book> => {
            const connection = getConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            const result = await bookRepo.find({ where: { title: Like(`%${args.title}%`) } });
            const bookToUpdate = result.length > 0 ? result[0] : undefined;
            if (bookToUpdate) {
                bookToUpdate.title = args.newTitle;
                await bookRepo.save(bookToUpdate);
            }
            return bookToUpdate;
        },
        deleteBook: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<boolean> => {
            const connection = getConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            await bookRepo.delete({ criteria: args.id, context } as any);
            return true;
        },
        deleteAuthor: async (parent: any, args: any): Promise<boolean> => {
            const connection = getConnectionManager().get();
            const authorRepos = connection.getRepository(Author);
            await authorRepos.delete(args.id);
            return true;
        },
    },
};
