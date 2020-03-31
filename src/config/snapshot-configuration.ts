export interface SnapshotConfiguration {
    snapshotCleaningInterval: number;
    secondsToBeOutdated: number;
    maxPageSize: number;
    entitiesAmountPerFetch: number;
    autoSnapshot: boolean;
}
