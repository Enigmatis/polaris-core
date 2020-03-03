export const typeDefs = `
    type Query {
        allBooks: [Book]!
        authorById(id: String!): Author
        bookByTitle(title: String!): [Book]!
        authorsByName(name: String!): [Author]!
        authorsByFirstNameFromCustomHeader: [Author]!
    }

    type Mutation{
        createAuthor(firstName: String!, lastName: String!): Author!
        updateBook(title: String!, newTitle: String!): Book
        deleteBook(id:String!): Boolean
        deleteAuthor(id:String!): Boolean
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
    
    type Author implements RepositoryEntity{
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
