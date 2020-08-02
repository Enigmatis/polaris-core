import { RealitiesHolder, Reality } from '@enigmatis/polaris-common';
import { AbstractPolarisLogger } from '@enigmatis/polaris-logs';
import {
    getConnectionForReality,
    PolarisConnectionManager,
    SnapshotMetadata,
    SnapshotPage,
} from '@enigmatis/polaris-typeorm';

let snapshotCleanerInterval: NodeJS.Timeout;

export const setSnapshotCleanerInterval = (
    realitiesHolder: RealitiesHolder,
    secondsToBeOutdated: number,
    snapshotCleaningInterval: number,
    logger: AbstractPolarisLogger,
    connectionManager: PolarisConnectionManager,
): void => {
    snapshotCleanerInterval = global.setInterval(
        () =>
            deleteOutdatedSnapshotPagesAndMetadata(
                realitiesHolder,
                secondsToBeOutdated,
                logger,
                connectionManager,
            ),
        snapshotCleaningInterval * 1000,
    );
};

export const clearSnapshotCleanerInterval = (): void => {
    if (snapshotCleanerInterval) {
        clearInterval(snapshotCleanerInterval);
    }
};

const deleteOutdatedSnapshotPagesAndMetadata = (
    realitiesHolder: RealitiesHolder,
    secondsToBeOutdated: number,
    logger: AbstractPolarisLogger,
    connectionManager: PolarisConnectionManager,
): void => {
    realitiesHolder.getRealitiesMap().forEach(async (reality: Reality) => {
        const connection = getConnectionForReality(
            reality.id,
            realitiesHolder as any,
            connectionManager,
        );
        const snapshotRepository = connection.getRepository(SnapshotPage);
        const snapshotMetadataRepository = connection.getRepository(SnapshotMetadata);
        await snapshotRepository.query(`DELETE FROM "${snapshotRepository.metadata.schema}".${snapshotRepository.metadata.tableName} 
                                        WHERE EXTRACT(EPOCH FROM (NOW() - "lastAccessedTime")) > ${secondsToBeOutdated};`);

        await snapshotMetadataRepository.query(`DELETE FROM "${snapshotMetadataRepository.metadata.schema}".${snapshotMetadataRepository.metadata.tableName} 
                                        WHERE EXTRACT(EPOCH FROM (NOW() - "lastAccessedTime")) > ${secondsToBeOutdated};`);

        logger.debug(`Snapshot cleaner has deleted outdated pages for reality id ${reality.id}`);
    });
};
