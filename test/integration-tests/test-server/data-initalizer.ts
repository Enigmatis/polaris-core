import { connection } from './connection-manager';
import { Author } from './dal/author';
import { Book } from './dal/book';
import { polarisGraphQLLogger } from './logger';

export async function deleteTables() {
    const tables = ['book', 'author', 'dataVersion'];
    for (const table of tables) {
        if (connection) {
            try {
                await connection.getRepository(table).query('DELETE FROM "' + table + '";');
            } catch (e) {
                polarisGraphQLLogger.debug("Couldn't delete table (might never existed)");
            }
        }
    }
}

function getAuthors(): Author[] {
    return [new Author('Author', 'First'), new Author('Author', 'Two')];
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
    const authorRepo = connection.getRepository(Author);
    const bookRepo = connection.getRepository(Book);
    await authorRepo.save(authors);
    await bookRepo.save([books[0], books[1]]);
    connection.manager.queryRunner.data = { requestHeaders: { realityId: 3 } };
    await bookRepo.save(books[2]);
    connection.manager.queryRunner.data.returnedExtensions = {};
    await bookRepo.save(books[3]);
    books[4].setDeleted(true);
    await bookRepo.save(books[4]);
    delete connection.manager.queryRunner.data.requestHeaders;
    delete connection.manager.queryRunner.data.returnedExtensions;
}

export async function initializeDatabase() {
    await deleteTables();
    await connection.synchronize();
    const authors: Author[] = getAuthors();
    const books: Book[] = getBooks(authors);
    await createExampleData(authors, books);
}
