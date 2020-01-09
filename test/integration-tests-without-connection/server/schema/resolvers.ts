const allBooks = [
    { id: 1, title: 'Book1', realityId: 0, deleted: false, dataVersion: 2 },
    { id: 2, title: 'Book2', realityId: 0, deleted: false, dataVersion: 3 },
    { id: 3, title: 'Book3', realityId: 0, deleted: false, dataVersion: 3 },
    { id: 4, title: 'Book4', realityId: 1, deleted: false, dataVersion: 4 },
];

export const resolvers = {
    Query: {
        allBooks: () => allBooks,
        bookByTitle: (parent: any, args: any) => {
            return allBooks.filter(book => book.title === args.title);
        },
    },
};
