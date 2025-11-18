import {
  API_BACKEND,
  GEO_IP_INFO,
  KEYCLOAK_API,
  QST_BACKEND,
  STRDB_BACKEND,
  STUDY_MATERIALS,
} from '@env';
import logger from '../services/logger';
import mqtt from '../shared/mqtt';

const NAMESPACE = 'Api';

class Api {
  static encode = encodeURIComponent;

  constructor() {
    this.accessToken = null;
  }

  static makeParams = params =>
    `${Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(pair => {
        const key = pair[0];
        const value = pair[1];
        if (Array.isArray(value)) {
          return value.map(val => `${key}=${Api.encode(val)}`).join('&');
        }
        return `${key}=${Api.encode(value)}`;
      })
      //can happen if parameter value is empty array
      .filter(p => p !== '')
      .join('&')}`;

  // Galaxy API

  fetchConfig = () =>
    this.logAndParse(
      'fetch config',
      fetch(this.urlFor('/v2/config'), this.defaultOptions())
    );

  fetchAvailableRooms = (params = {}) =>
    this.logAndParse(
      'fetch available rooms',
      fetch(
        `${this.urlFor('/groups')}?${Api.makeParams(params)}`,
        this.defaultOptions()
      )
    );

  urlFor = path => API_BACKEND + path;

  defaultOptions = () => {
    return {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };
  };

  logAndParse = (action, fetchPromise) => {
    return fetchPromise
      .then(response => {
        if (!response.ok) {
          logger.error(
            NAMESPACE,
            `${action} status:`,
            response.status,
            response.statusText
          );
          // Try to extract more detailed error information if possible
          return response.text().then(errorText => {
            let errorMessage;
            try {
              // Try to parse as JSON to get structured error details
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.error || errorText;
              logger.error(NAMESPACE, `${action} error response:`, errorJson);
            } catch (e) {
              // If not valid JSON, use as raw text
              errorMessage = errorText;
              logger.error(
                NAMESPACE,
                `${action} error response text:`,
                errorText
              );
            }
            throw new Error(errorMessage || response.statusText);
          });
        }
        return response.json();
      })
      .catch(err => {
        logger.error(NAMESPACE, `${action} error`, err);
        logger.error(NAMESPACE, `${action} error details:`, err.message);
        return Promise.reject(err);
      });
  };

  setAccessToken = token => {
    logger.debug(NAMESPACE, 'setAccessToken', token);
    this.accessToken = token;
    mqtt.setToken(token);
  };
  fetchMaterials = async () => {
    try {
      const res = await fetch(STUDY_MATERIALS, { method: 'GET' });
      logger.debug(NAMESPACE, 'fetchMaterials', res);
      return res.json();
    } catch (e) {
      logger.error(NAMESPACE, 'fetchMaterials error:', e);
      return null;
    }
  };

  makeOptions = payload => {
    const options = {
      ...this.defaultOptions(),
      method: 'POST',
    };
    if (payload) {
      options.body = JSON.stringify(payload);
      options.headers['Content-Type'] = 'application/json';
    }
    return options;
  };
  sendQuestion = data => {
    const options = this.makeOptions(data);
    return this.logAndParse(
      `send question`,
      fetch(`${QST_BACKEND}/ask`, options)
    );
  };
  fetchQuestions = data => {
    try {
      logger.debug(
        NAMESPACE,
        `fetchQuestions - endpoint URL: ${QST_BACKEND}/feed`
      );
      logger.debug(NAMESPACE, 'fetchQuestions - request data:', data);

      // Validate that serialUserId is present and valid
      if (!data || !data.serialUserId) {
        logger.error(
          NAMESPACE,
          'fetchQuestions - Missing required field: serialUserId'
        );
        return Promise.reject(
          new Error('Missing required field: serialUserId')
        );
      }

      const options = this.makeOptions(data);
      return this.logAndParse(
        `fetch questions`,
        fetch(`${QST_BACKEND}/feed`, options)
      );
    } catch (error) {
      logger.error(NAMESPACE, 'fetchQuestions preparation error:', error);
      return Promise.reject(error);
    }
  };

  fetchStrServer = data => {
    logger.debug(NAMESPACE, 'fetchStrServer - request data:', data);
    const options = this.makeOptions(data);
    const url = `${STRDB_BACKEND}/server`;
    return this.logAndParse(
      `fetch str server for: ${data}`,
      fetch(url, options)
    );
  };

  fetchVHInfo = async () => {
    try {
      logger.debug(NAMESPACE, 'fetchVHInfo');
      const res = await fetch(this.urlFor('/v2/vhinfo'), this.defaultOptions());

      if (!res.ok) {
        logger.error(NAMESPACE, 'fetchVHInfo HTTP error:', res);

        if (res.status === 401 || res.status === 403) {
          throw new Error('UNAUTHORIZED');
        } else if (res.status >= 500 && res.status < 600) {
          throw new Error('SERVER_ERROR');
        } else if (
          res.status === 0 ||
          res.status === 408 ||
          res.status === 429
        ) {
          throw new Error('NETWORK_ERROR');
        } else {
          throw new Error(`HTTP_${res.status}`);
        }
      }

      const data = await res.json();
      logger.debug(NAMESPACE, 'fetchVHInfo data:', data);
      return data;
    } catch (e) {
      logger.error(NAMESPACE, 'fetchVHInfo error:', e);
      throw e;
    }
  };

  fetchGeoInfo = async () => {
    const defaultInfo = {
      ip: '127.0.0.1',
      country: 'XX',
    };
    try {
      const response = await fetch(GEO_IP_INFO);
      if (response.ok) {
        return await response.json();
      } else {
        return defaultInfo;
      }
    } catch (ex) {
      logger.debug(NAMESPACE, `get geoInfo`, ex);
      return defaultInfo;
    }
  };
  removeMember = () => {
    logger.info(NAMESPACE, 'Removing member');
    const options = this.defaultOptions();
    options.method = 'DELETE';

    return this.logAndParse(
      'remove member',
      fetch(`${KEYCLOAK_API}/self_remove`, options)
    );
  };
}

const defaultApi = new Api();

export default defaultApi;
