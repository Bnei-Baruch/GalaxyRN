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

const envObj = {
    GEO_IP_INFO,
    STUN_SERVER,
    STUN_SRV_STR,
    STUN_SRV_GXY,
    API_BACKEND,
    STRDB_BACKEND,
    MSG_URL,
    MQTT_URL,

    GEO_IP_INFO_RU,
    STUN_SERVER_RU,
    STUN_SRV_STR_RU,
    STUN_SRV_GXY_RU,
    API_BACKEND_RU,
    STRDB_BACKEND_RU,
    MSG_URL_RU,
    MQTT_URL_RU,
};


let isNeedToPatch = false;
const NAMESPACE = 'EnvPatch';

const checkNeedToPatch = async () => {
    console.log(NAMESPACE, 'checkNeedToPatch');
    try {
        const res = await fetch(GEO_IP_INFO);
        console.log(NAMESPACE, 'fetch GEO_IP_INFO', res);
        if (!res.ok) {
            console.log(NAMESPACE, 'fetch GEO_IP_INFO failed');
            return true;
        }
        const data = await res.json();
        console.log(NAMESPACE, 'fetch GEO_IP_INFO data', data);
        if (data.code === 'RU') {
            return true;
        }
        return false;
    } catch (ex) {
        console.log(NAMESPACE, 'checkNeedToPatch error', ex);
        return true;
    }
};

export const initEnv = async () => {
    console.log(NAMESPACE, 'initEnv');
    isNeedToPatch = await checkNeedToPatch();
    return true;
};

export const getEnvValue = (key) => {
    const value = isNeedToPatch ? envObj[key + '_RU'] : envObj[key];
    console.log(NAMESPACE, 'getEnvValue', key, isNeedToPatch, value);
    return value;
};