import { PolarisGraphQLContext } from '@enigmatis/polaris-common';
import { DeleteResult, getPolarisConnectionManager, Like } from '../../../../src/index';
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
        updateBook: async (
            parent: any,
            args: any,
            context: PolarisGraphQLContext,
        ): Promise<Book | undefined> => {
            const connection = getPolarisConnectionManager().get();
            const bookRepo = connection.getRepository(Book);
            const result = await bookRepo.find(context, {
                where: { title: Like(`%${args.title}%`) },
            });
            const bookToUpdate = result.length > 0 ? result[0] : undefined;
            if (bookToUpdate) {
                await bookRepo.update(context, { title: args.newTitle }, bookToUpdate);
            }
            return bookToUpdate;
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
};
