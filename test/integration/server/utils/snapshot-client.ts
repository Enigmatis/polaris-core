import axios from 'axios';
import { port } from '../resources/polaris-properties.json';

export const url = `http://localhost:${port}/snapshot`;

export const snapshotRequest = async (snapshotId: string) => {
    return axios(url + '?id=' + snapshotId, { method: 'get' });
};
