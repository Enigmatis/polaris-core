import { getPolarisConnectionManager } from '@enigmatis/polaris-typeorm';
import { Author } from './dal/author';
import { Book } from './dal/book';

export async function deleteTables() {
    const connection = getPolarisConnectionManager().get();
    const tables = ['book', 'author', 'dataVersion'];
    for (const table of tables) {
        if (connection) {
            await connection.getRepository(table).query('DELETE FROM "' + table + '";');
        }
    }
}

function getAuthors(): Author[] {
    return [new Author('Author1', 'First'), new Author('Author2', 'Two')];
}

function getBooks(authors: Author[]): Book[] {
    return [
        new Book('Book1', authors[0]),
        new Book('Book2', authors[1]),
        new Book('Book3', authors[0]),
        new Book('Book4', authors[0]),
        new Book('Book5', authors[1]),
    ];
}

async function createExampleData(authors: Author[], books: Book[]) {
    const connection = getPolarisConnectionManager().get();
    const authorRepo = connection.getRepository(Author);
    const bookRepo = connection.getRepository(Book);
    const context = {
        requestHeaders: { realityId: 0 },
        returnedExtensions: {},
    } as any;
    await authorRepo.save(context, authors);
    await bookRepo.save(context, [books[0], books[1]]);
    context.requestHeaders.realityId = 3;
    delete context.returnedExtensions.globalDataVersion;
    await bookRepo.save(context, books[2]);
    delete context.returnedExtensions.globalDataVersion;
    await bookRepo.save(context, books[3]);
    books[4].setDeleted(true);
    await bookRepo.save(context, books[4]);
}

export async function initializeDatabase() {
    const connection = getPolarisConnectionManager().get();
    await deleteTables();
    await connection.synchronize();
    const authors: Author[] = getAuthors();
    const books: Book[] = getBooks(authors);
    await createExampleData(authors, books);
}
