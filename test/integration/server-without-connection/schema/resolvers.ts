const allBooks = [
    { id: 1, title: 'Book1', realityId: 0, deleted: false, dataVersion: 2, coverColor: 'Red' },
    { id: 2, title: 'Book2', realityId: 0, deleted: false, dataVersion: 3, coverColor: 'Orange' },
    { id: 3, title: 'Book3', realityId: 0, deleted: false, dataVersion: 3, coverColor: 'Green' },
    { id: 4, title: 'Book4', realityId: 1, deleted: false, dataVersion: 4, coverColor: 'Yellow' },
];

export const resolvers = {
    Query: {
        allBooks: () => allBooks,
        bookByTitle: (parent: any, args: any) => {
            return allBooks.filter(book => book.title === args.title);
        },
    },
};
