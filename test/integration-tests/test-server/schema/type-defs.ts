export const typeDefs = `
    type Query {
        allBooks: [Book]!
        allBooksWithWarnings: [Book]!
        authorById(id: String!): Author
        bookByTitle(title: String!): [Book]!
        authorsByName(name: String!): [Author]!
        authorsByFirstNameFromCustomHeader: [Author]!
    }

    type Mutation {
        createAuthor(firstName: String!, lastName: String!): Author!
        updateBooksByTitle(title: String!, newTitle: String!): [Book]!
        deleteBook(id: String!): Boolean
        deleteAuthor(id: String!): Boolean
    }

    type Subscription {
        bookUpdated: Book
    }

    type Book implements RepositoryEntity {
        id: String!
        deleted: Boolean!
        createdBy: String!
        creationTime: DateTime!
        lastUpdatedBy: String
        lastUpdateTime: DateTime
        realityId: Int!
        title: String
        author: Author
    }

    type Author implements RepositoryEntity {
        id: String!
        deleted: Boolean!
        createdBy: String!
        creationTime: DateTime!
        lastUpdatedBy: String
        lastUpdateTime: DateTime
        realityId: Int!
        firstName: String
        lastName: String
        books: [Book]
    }
`;
