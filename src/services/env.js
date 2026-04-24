import {
    API_BACKEND,
    API_BACKEND_RU,
    GEO_IP_INFO,
    GEO_IP_INFO_RU,
    MQTT_URL,
    MQTT_URL_RU,
    MSG_URL,
    MSG_URL_RU,
    STRDB_BACKEND,
    STRDB_BACKEND_RU,
    STUN_SERVER,
    STUN_SERVER_RU,
    STUN_SRV_GXY,
    STUN_SRV_GXY_RU,
    STUN_SRV_STR,
    STUN_SRV_STR_RU,
} from '@env';
import { getFromStorage } from '../tools';
import { STORAGE_KEYS } from '../constants';
import { GEO_REGION_AUTO, GEO_REGION_RU } from '../consts';
import { fetchGeoInfo } from './Api';
import { useUserStore } from '../zustand/user';

const NAMESPACE = 'EnvPatch';

const DEFAULT_ENV = {
    GEO_IP_INFO,
    STUN_SERVER,
    STUN_SRV_STR,
    STUN_SRV_GXY,
    API_BACKEND,
    STRDB_BACKEND,
    MSG_URL,
    MQTT_URL,
};

const ENV_BY_REGION = {
    [GEO_REGION_RU]: {
        GEO_IP_INFO: GEO_IP_INFO_RU,
        STUN_SERVER: STUN_SERVER_RU,
        STUN_SRV_STR: STUN_SRV_STR_RU,
        STUN_SRV_GXY: STUN_SRV_GXY_RU,
        API_BACKEND: API_BACKEND_RU,
        STRDB_BACKEND: STRDB_BACKEND_RU,
        MSG_URL: MSG_URL_RU,
        MQTT_URL: MQTT_URL_RU,
    },
};

const FALLBACK_GEO_BY_REGION = {
    [GEO_REGION_RU]: { country: 'Russia', code: 'RU' },
};
const DEFAULT_FALLBACK_GEO = { ip: '127.0.0.1', country: 'XX', code: 'XX' };

let envObj = { ...DEFAULT_ENV };

const applyRegionEnv = (region) => {
    console.log(NAMESPACE, 'applyRegionEnv', region);
    const patch = ENV_BY_REGION[region];
    envObj = patch ? { ...DEFAULT_ENV, ...patch } : { ...DEFAULT_ENV };
    console.log(NAMESPACE, 'env after patch', envObj);
};

const tryFetchGeoInfo = async (url = envObj.GEO_IP_INFO) => {
    try {
        const geoInfo = await fetchGeoInfo(url);
        useUserStore.getState().setGeoInfo(geoInfo);
        console.log(NAMESPACE, 'fetched geo info', geoInfo);
        return geoInfo;
    } catch (ex) {
        console.log(NAMESPACE, 'fetchGeoInfo failed', url, ex);
        return null;
    }
};

export const initEnv = async () => {
    const storedRegion = await getFromStorage(STORAGE_KEYS.GEO_REGION, GEO_REGION_AUTO);
    console.log(NAMESPACE, 'stored region', storedRegion);

    if (storedRegion !== GEO_REGION_AUTO) {
        applyRegionEnv(storedRegion);
        const geoInfo = await tryFetchGeoInfo();
        const mustFields = FALLBACK_GEO_BY_REGION[storedRegion] ?? DEFAULT_FALLBACK_GEO;
        console.log(NAMESPACE, 'must fields for region', storedRegion, mustFields);
        useUserStore.getState().setGeoInfo({ ...geoInfo, ...mustFields });
        console.log(NAMESPACE, 'final geo info', useUserStore.getState().geoInfo);
        return;
    }

    const geoUrls = [GEO_IP_INFO, ...Object.values(ENV_BY_REGION).map(e => e.GEO_IP_INFO)];
    let geoInfo = null;
    for (const url of geoUrls) {
        geoInfo = await tryFetchGeoInfo(url);
        if (geoInfo) break;
    }

    if (geoInfo) {
        applyRegionEnv(geoInfo.code);
    } else {
        console.log(NAMESPACE, 'all geo sources failed, using defaults');
        useUserStore.getState().setGeoInfo(DEFAULT_FALLBACK_GEO);
    }
};

export const getEnvValue = (key) => envObj[key];
