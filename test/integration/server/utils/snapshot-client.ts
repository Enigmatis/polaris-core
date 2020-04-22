import axios from 'axios';
import * as polarisProperties from "../resources/polaris-properties.json";

export const url = `http://localhost:${polarisProperties.port}/snapshot`;


export const snapshotRequest = async (snapshotId: string) => {
    return  axios(url + "?id=" + snapshotId, {method:'get'});
};