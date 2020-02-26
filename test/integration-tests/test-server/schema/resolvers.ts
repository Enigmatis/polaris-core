import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import {
    DeleteResult,
    getConnectionManager,
    Like,
    PolarisCriteria,
    PolarisFindManyOptions,
    PolarisFindOneOptions,
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
            polarisGraphQLLogger.debug("I'm the resolver of all books", context);
            return connection
                .getRepository(Book)
                .find(new PolarisFindManyOptions({ relations: ['author'] }, context) as any);
        },
        bookByTitle: (parent: any, args: any, context: PolarisGraphQLContext): Promise<Book[]> => {
            const connection = getConnectionManager().get();
            return connection.getRepository(Book).find(
                new PolarisFindManyOptions(
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
            return connection.getRepository(Author).find(
                new PolarisFindManyOptions(
                    {
                        where: { firstName: Like(`%${args.name}%`) },
                    },
                    context,
                ) as any,
            );
        },
        authorById: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Author | undefined> => {
            const connection = getConnectionManager().get();
            return connection
                .getRepository(Author)
                .findOne(new PolarisFindOneOptions({ where: { id: args.id } }, context) as any, {});
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
        ): Promise<Book | undefined> => {
            const connection = getConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            const result = await bookRepo.find({ where: { title: Like(`%${args.title}%`) } });
            const bookToUpdate = result.length > 0 ? result[0] : undefined;
            if (bookToUpdate) {
                await bookRepo.update(new PolarisFindOneOptions(bookToUpdate, context) as any, {
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
            const result: DeleteResult = await bookRepo.delete(
                new PolarisCriteria(args.id, context) as any,
            );
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
            const connection = getConnectionManager().get();
            const authorRepos = connection.getRepository(Author);
            await authorRepos.delete(
                new PolarisCriteria({ where: { id: args.id } }, context) as any,
            );
            return true;
        },
    },
};
