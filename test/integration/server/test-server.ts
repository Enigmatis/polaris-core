import { RealitiesHolder } from '@enigmatis/polaris-common';
import { ConnectionlessIrrelevantEntitiesCriteria } from '@enigmatis/polaris-middlewares';
import {
    ConnectionOptions,
    DataVersion,
    getPolarisConnectionManager,
} from '@enigmatis/polaris-typeorm';
import { Client, Pool } from 'pg';
import { ExpressContext, PolarisServer, PolarisServerOptions } from '../../../src';
import * as customContextFields from './constants/custom-context-fields.json';
import { TestClassInContext } from './context/test-class-in-context';
import { TestContext } from './context/test-context';
import { initConnection } from './dal/connection-manager';
import { Author } from './dal/entities/author';
import { Book } from './dal/entities/book';
import * as polarisProperties from './resources/polaris-properties.json';
import { resolvers } from './schema/resolvers';
import { typeDefs } from './schema/type-defs';
import { loggerConfig } from './utils/logger';

export const connectionOptions: ConnectionOptions = {
    type: 'postgres',
    url: process.env.CONNECTION_STRING || '',
    entities: [__dirname + '/dal/entities/*.{ts,js}'],
    synchronize: true,
    dropSchema: true,
    logging: true,
    schema: process.env.SCHEMA_NAME,
};

const customContext = (context: ExpressContext): Partial<TestContext> => {
    const { req, connection } = context;
    const headers = req ? req.headers : connection?.context;

    return {
        customField: customContextFields.customField,
        instanceInContext: new TestClassInContext(
            customContextFields.instanceInContext.someProperty,
        ),
        requestHeaders: {
            customHeader: headers['custom-header'],
        },
    };
};

export async function startTestServer(
    config?: Partial<PolarisServerOptions>,
): Promise<PolarisServer> {
    await initConnection(connectionOptions);
    const options = { ...getDefaultTestServerConfig(), ...config };
    const server = new PolarisServer(options);
    await server.start();
    return server;
}

export async function stopTestServer(server: PolarisServer): Promise<void> {
    await server.stop();
    if (getPolarisConnectionManager().connections.length > 0) {
        await getPolarisConnectionManager()
            .get()
            .close();
    }
}

const getDefaultTestServerConfig = (): PolarisServerOptions => {
    return {
        typeDefs,
        resolvers,
        customContext,
        port: polarisProperties.port,
        logger: loggerConfig,
        supportedRealities: new RealitiesHolder(
            new Map([[3, { id: 3, type: 'notreal3', name: 'default' }]]),
        ),
        connectionManager: getPolarisConnectionManager(),
        connectionLessConfiguration: {
            getDataVersion(): Promise<DataVersion> {
                const pool = new Pool({
                    connectionString:
                        'postgres://vulcan_usr@galileo-dbs:vulcan_usr123@galileo-dbs.postgres.database.azure.com:5432/vulcan_db',
                    database: 'postgres',
                    port: 5432,
                });
                const query =
                    'SELECT "DataVersion"."id" AS "id", "DataVersion"."value" AS "value" \n' +
                    'FROM "arik"."data_version" "DataVersion" LIMIT 1';
                return pool.query(query).then(res => {
                    const dataVersion = new DataVersion(res.rows[0].value);
                    pool.end();
                    return dataVersion;
                });
            },
            getIrrelevantEntities(
                typeName: string,
                criteria: ConnectionlessIrrelevantEntitiesCriteria,
            ): Promise<any[]> {
                const pool = new Pool({
                    connectionString:
                        'postgres://vulcan_usr@galileo-dbs:vulcan_usr123@galileo-dbs.postgres.database.azure.com:5432/vulcan_db',
                    database: 'postgres',
                    port: 5432,
                });
                const query =
                    `SELECT * FROM "arik"."book" "${typeName}" \n` +
                    `WHERE NOT("${typeName}"."id" IN ('${criteria.notInIds?.join(',')}')) \n` +
                    `AND "${typeName}"."realityId" = ${criteria.realityId}`;
                return pool.query(query).then(res => {
                    const irrelevantEntities: any[] = [];
                    if (typeName === 'Book') {
                        res.rows.forEach(value => {
                            const book = new Book(
                                value.title,
                                new Author('first', 'last'),
                                value.id,
                            );
                            irrelevantEntities.push(book);
                        });
                    } else {
                        res.rows.forEach(value => {
                            irrelevantEntities.push(new Author(value.firstName, value.lastName));
                        });
                    }
                    pool.end();
                    return irrelevantEntities;
                });
            },
        },
    };
};
