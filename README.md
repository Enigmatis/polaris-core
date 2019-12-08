![Polaris-logo](static/img/polaris-logo.png)

# polaris-core

[![NPM version](https://img.shields.io/npm/v/@enigmatis/polaris-core.svg?style=flat-square)](https://www.npmjs.com/package/@enigmatis/polaris-core)
[![Build Status](https://travis-ci.com/Enigmatis/polaris-core.svg?branch=master)](https://travis-ci.com/Enigmatis/polaris-core)

This is the core library of polaris. This core is the best way to quickly build a data service based on polaris products.

## Features

-   Integration with ApolloServer and Express
-   Soft delete
-   Realities
-   Irrelevant entities
-   Data version
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
​
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
const applicationLogProperties: ApplicationProperties = {
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
    applicationLogProperties,
});
server.start();

```

For any additional help and requests, feel free to contact us :smile:
