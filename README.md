<p align="center">
    <img height="190" src="https://github.com/Enigmatis/polaris-nest-logger/raw/master/polarisen.png" alt="polaris logo" /><br><br>
    Create a graphql service easily, integrated with typeorm, middlewares, standard logs, and more!<br><br>
    <img alt="npm (scoped)" src="https://img.shields.io/npm/v/@enigmatis/polaris-core">
    <img alt="npm (scoped with tag)" src="https://img.shields.io/npm/v/@enigmatis/polaris-core/beta">
    <img alt="Travis (.org) branch" src="https://travis-ci.com/Enigmatis/polaris-core.svg?branch=master">
    <a href="https://www.codacy.com/gh/Enigmatis/polaris-core?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Enigmatis/polaris-core&amp;utm_campaign=Badge_Grade"><img src="https://api.codacy.com/project/badge/Grade/6a403edb43684b2382728837f58bbfbb"/></a>
</p>

# polaris-core

Polaris is a set of libraries that help you create the perfect graphql service, integrated with type orm and the hottest API standards.
polaris-core organizes all of the libraries for you, and let you create your graphql service as easily as it can be.

## Features

-   GraphQL service creation (integrated with apollo-server & express)
-   Auto soft deletion of entities
-   Fetching Deltas of entities (including irrelevant entities)
-   Support realities
-   Standard errors
-   Standard logs
-   Standard GraphQL scalars

### PolarisServer

This is the server that you will use in order to create your own standardized GraphQL server.\
`PolarisServer` uses `ApolloServer` and starts the server with `Express`.

### PolarisServerConfig

Through this interface you should set the following configurations which will be supplied to the `PolarisServer`:

-   **typeDefs** (_any_) - The GraphQL schema written in SDL (Schema Definition Language).
    This will be used in order to create your GraphQL API.
-   **resolvers** (_any_) - The GraphQL resolvers that will be tied to your GraphQL schema.
    This object contains functions and logic for the GraphQL engine to invoke when using fields from the schema.
-   **port** (_number_) - Specify a port the `PolarisServer` should start the server on.
-   **applicationProperties** (_ApplicationProperties - optional_) - Properties that describe your repository.
    If you don't provide those properties, the core will put 'v1' in the version.
-   **customMiddlewares** (_any[] - optional_) - Custom middlewares that can be provided the `PolarisServer` with.
-   **customContext** (_(context: any, connection?: Connection) => any - optional_) - You can provide the `PolarisServer` your own custom context.
    If you do not set your custom context, the core will use a default context.
-   **loggerConfiguration** (_LoggerConfiguration - optional_) - This is an interface that defines the logger in the `PolarisServer`.
    If you do not provide this property, the core will use default values for the logger.
-   **middlewareConfiguration** (_MiddlewareConfiguration - optional_) - This is an interface that defines what core middlewares should be activated/disabled.
-   **connection** (_Connection - optional_) - This class represents your connection with the database. Used in the core middlewares.

### MiddlewareConfiguration

As mentioned above, this interface defines what core middlewares should be activated/disabled.

-   **allowDataVersionAndIrrelevantEntitiesMiddleware** (_boolean_) - Determine if `DataVersionMiddleware` and `IrrelevantEntitiesMiddleware` should be applied to the request.
-   **allowSoftDeleteMiddleware** (_boolean_) - Determine if `SoftDeleteMiddleware` should be applied to the request.
-   **allowRealityMiddleware** (_boolean_) - Determine if `RealityMiddleware` should be applied to the request.

### Example

```Typescript

import { ApplicationProperties, PolarisServer } from '@enigmatis/polaris-core';

const typeDefs = `
    type Query {
        allPersons: [Person]
    }

    type Person implements RepositoryEntity {
        id: String!
        deleted: Boolean!
        createdBy: String!
        creationTime: DateTime!
        lastUpdatedBy: String
        lastUpdateTime: DateTime
        realityId: Int!
        name: String
    }
`;
const resolvers = {
    Query: {
        allPersons: () => [
            { name: 'foo bar', realityId: 0, deleted: false, dataVersion: 2 },
            { name: 'superman', realityId: 0, deleted: true, dataVersion: 3 },
            { name: 'hello world', realityId: 1, deleted: true, dataVersion: 3 },
            { name: 'something', realityId: 1, deleted: false, dataVersion: 4 },
        ],
    },
};
const applicationProperties: ApplicationProperties = {
    id: 'p0laris-c0re',
    name: 'polaris-core',
    version: 'v1',
    environment: 'environment',
    component: 'component',
};
const server = new PolarisServer({
    typeDefs,
    resolvers,
    port: 4000,
    applicationProperties,
});
server.start();

```

For any additional help and requests, feel free to contact us :smile:
