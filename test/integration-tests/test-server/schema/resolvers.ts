import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import {
    getConnectionManager,
    Like,
    PolarisFindOptions,
    PolarisSaveOptions,
} from '../../../../src/index';
import { Author } from '../dal/author';
import { Book } from '../dal/book';
import { polarisGraphQLLogger } from '../logger';

export const resolvers = {
    Query: {
        allBooks: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book[]> => {
            const connection = getConnectionManager().get();
            polarisGraphQLLogger.debug("I'm the resolver of all books");
            const result = await connection
                .getRepository(Book)
                .find(new PolarisFindOptions({ relations: ['author'] }, context) as any);
            return result;
        },
        bookByTitle: (parent: any, args: any, context: PolarisGraphQLContext): Promise<Book[]> => {
            const connection = getConnectionManager().get();
            return connection.getRepository(Book).find(
                new PolarisFindOptions(
                    {
                        where: { title: Like(`%${args.title}%`) },
                        relations: ['author'],
                    },
                    context,
                ) as any,
            );
        },
        authorsByName: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author[]> => {
            const connection = getConnectionManager().get();
            const result = await connection.getRepository(Author).find(
                new PolarisFindOptions(
                    {
                        where: { firstName: Like(`%${args.name}%`) },
                    },
                    context,
                ) as any,
            );
            return result;
        },
        authorById: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author | {}> => {
            const connection = getConnectionManager().get();
            return (
                (await connection
                    .getRepository(Author)
                    .findOne(new PolarisFindOptions({ where: { id: args.id } }, context) as any)) ||
                {}
            );
        },
    },
    Mutation: {
        createAuthor: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author> => {
            const connection = getConnectionManager().get();
            const authorRepo = connection.getRepository(Author);
            const newAuthor = new Author(args.firstName, args.lastName);
            await authorRepo.save(new PolarisSaveOptions(newAuthor, context) as any);
            return newAuthor;
        },
        updateBook: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book> => {
            const connection = getConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            const result = await bookRepo.find({ where: { title: Like(`%${args.title}%`) } });
            const bookToUpdate = result.length > 0 ? result[0] : undefined;
            if (bookToUpdate) {
                await bookRepo.update(new PolarisSaveOptions(bookToUpdate, context) as any, {
                    title: args.newTitle,
                });
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
            const result = await bookRepo.delete(new PolarisFindOptions(args.id, context) as any);
            return result.affected > 0;
        },
        deleteAuthor: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<boolean> => {
            const connection = getConnectionManager().get();
            const authorRepos = connection.getRepository(Author);
            await authorRepos.delete(
                new PolarisFindOptions({ where: { id: args.id } }, context) as any,
            );
            return true;
        },
    },
};
