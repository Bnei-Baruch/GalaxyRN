import { API_BACKEND, STUDY_MATERIALS, QST_BACKEND } from '@env';
import mqtt from '../shared/mqtt';

class Api {
  static encode = encodeURIComponent;

  constructor() {
    this.accessToken = null;
    this.username    = null;
    this.password    = null;
  }

  static makeParams = (params) =>
    `${Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map((pair) => {
        const key   = pair[0];
        const value = pair[1];
        if (Array.isArray(value)) {
          return value.map((val) => `${key}=${Api.encode(val)}`).join('&');
        }
        return `${key}=${Api.encode(value)}`;
      })
      //can happen if parameter value is empty array
      .filter((p) => p !== '')
      .join('&')}`;

  // Galaxy API

  fetchConfig = () => this.logAndParse('fetch config', fetch(this.urlFor('/v2/config'), this.defaultOptions()));

  fetchAvailableRooms = (params = {}) =>
    this.logAndParse(
      'fetch available rooms',
      fetch(`${this.urlFor('/groups')}?${Api.makeParams(params)}`, this.defaultOptions())
    );

  urlFor = (path) => API_BACKEND + path;

  defaultOptions = () => {
    const auth = this.accessToken ? `Bearer ${this.accessToken}` : `Basic ${btoa(`${this.username}:${this.password}`)}`;

    return {
      headers: {
        Authorization: auth,
      },
    };
  };

  logAndParse = (action, fetchPromise) => {
    return fetchPromise
      .then((response) => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
        return response.json();
      })
      .then((data) => {
        //console.debug(`[API] ${action} success`, data);
        return data;
      })
      .catch((err) => {
        console.error(`[API] ${action} error`, err);
        return Promise.reject(err);
      });
  };

  setAccessToken = (token) => {
    this.accessToken = token;
    mqtt.setToken(token);
  };
  fetchMaterials = async () => {
    try {
      const res = await fetch(STUDY_MATERIALS, { method: 'GET' });
      return res.json();
    } catch (e) {
      return null;
    }
  };

  makeOptions  = (payload) => {
    const options = {
      ...this.defaultOptions(),
      method: 'POST',
    };
    if (payload) {
      options.body                    = JSON.stringify(payload);
      options.headers['Content-Type'] = 'application/json';
    }
    return options;
  };
  sendQuestion = (data) => {
    const options = this.makeOptions(data);
    return this.logAndParse(`send question`, fetch(`${QST_BACKEND}/ask`, options));
  };
  getQuestions = (data) => {
    const options = this.makeOptions(data);
    return this.logAndParse(`get questions`, fetch(`${QST_BACKEND}/feed`, options));
  };

}

const defaultApi = new Api();

export default defaultApi;
