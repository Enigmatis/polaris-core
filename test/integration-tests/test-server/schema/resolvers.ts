import { Like } from '../../../../src/index';
import { connection } from '../connection-manager';
import { Author } from '../dal/author';
import { Book } from '../dal/book';
import { polarisGraphQLLogger } from '../logger';

export const resolvers = {
    Query: {
        allBooks: async (): Promise<Book[]> => {
            polarisGraphQLLogger.debug("I'm the resolver of all books");
            return connection.getRepository(Book).find({ relations: ['author'] });
        },
        bookByTitle: (parent: any, args: any): Promise<Book[]> => {
            return connection.getRepository(Book).find({
                where: { title: Like(`%${args.title}%`) },
                relations: ['author'],
            });
        },
        authorById: async (parent: any, args: any): Promise<Author | {}> =>
            connection.getRepository(Author).findOne({ where: { id: args.id } }) || {},
    },
    Mutation: {
        createAuthor: async (parent: any, args: any): Promise<Author> => {
            const authorRepo = connection.getRepository(Author);
            const newAuthor = new Author(args.firstName, args.lastName, []);
            await authorRepo.save(newAuthor);
            return newAuthor;
        },
        updateBook: async (parent: any, args: any): Promise<Book> => {
            const bookRepo = connection.getRepository(Book);
            const result = await bookRepo.find({ where: { title: Like(`%${args.title}%`) } });
            const bookToUpdate = result.length > 0 ? result[0] : undefined;
            if (bookToUpdate) {
                bookToUpdate.title = args.newTitle;
                await bookRepo.save(bookToUpdate);
            }
            return bookToUpdate;
        },
    },
};
