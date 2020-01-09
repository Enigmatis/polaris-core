export const typeDefs = `
    type Query {
        allBooks: [Book]!
        bookByTitle(title: String!): [Book]!
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
    }
`;
