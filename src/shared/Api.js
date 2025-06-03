import {
  API_BACKEND,
  STUDY_MATERIALS,
  QST_BACKEND,
  STRDB_BACKEND,
  GEO_IP_INFO,
} from "@env";
import mqtt from "../shared/mqtt";
import { debug, error } from '../services/logger';

const NAMESPACE = 'Api';

class Api {
  static encode = encodeURIComponent;

  constructor() {
    this.accessToken = null;
    this.username = null;
    this.password = null;
  }

  static makeParams = (params) =>
    `${Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map((pair) => {
        const key = pair[0];
        const value = pair[1];
        if (Array.isArray(value)) {
          return value.map((val) => `${key}=${Api.encode(val)}`).join("&");
        }
        return `${key}=${Api.encode(value)}`;
      })
      //can happen if parameter value is empty array
      .filter((p) => p !== "")
      .join("&")}`;

  // Galaxy API

  fetchConfig = () =>
    this.logAndParse(
      "fetch config",
      fetch(this.urlFor("/v2/config"), this.defaultOptions())
    );

  fetchAvailableRooms = (params = {}) =>
    this.logAndParse(
      "fetch available rooms",
      fetch(
        `${this.urlFor("/groups")}?${Api.makeParams(params)}`,
        this.defaultOptions()
      )
    );

  urlFor = (path) => API_BACKEND + path;

  defaultOptions = () => {
    const auth = this.accessToken
      ? `Bearer ${this.accessToken}`
      : `Basic ${btoa(`${this.username}:${this.password}`)}`;

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
          error(
            NAMESPACE,
            `${action} status:`,
            response.status,
            response.statusText
          );
          // Try to extract more detailed error information if possible
          return response.text().then((errorText) => {
            let errorMessage;
            try {
              // Try to parse as JSON to get structured error details
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.message || errorJson.error || errorText;
              error(NAMESPACE, `${action} error response:`, errorJson);
            } catch (e) {
              // If not valid JSON, use as raw text
              errorMessage = errorText;
              error(NAMESPACE, `${action} error response text:`, errorText);
            }
            throw new Error(errorMessage || response.statusText);
          });
        }
        return response.json();
      })
      .catch((err) => {
        error(NAMESPACE, `${action} error`, err);
        error(NAMESPACE, `${action} error details:`, err.message);
        return Promise.reject(err);
      });
  };

  setAccessToken = (token) => {
    this.accessToken = token;
    mqtt.setToken(token);
  };
  fetchMaterials = async () => {
    try {
      const res = await fetch(STUDY_MATERIALS, { method: "GET" });
      return res.json();
    } catch (e) {
      return null;
    }
  };

  makeOptions = (payload) => {
    const options = {
      ...this.defaultOptions(),
      method: "POST",
    };
    if (payload) {
      options.body = JSON.stringify(payload);
      options.headers["Content-Type"] = "application/json";
    }
    return options;
  };
  sendQuestion = (data) => {
    const options = this.makeOptions(data);
    return this.logAndParse(
      `send question`,
      fetch(`${QST_BACKEND}/ask`, options)
    );
  };
  fetchQuestions = (data) => {
    try {
      debug(NAMESPACE, `fetchQuestions - endpoint URL: ${QST_BACKEND}/feed`);
      debug(NAMESPACE, "fetchQuestions - request data:", data);

      // Validate that serialUserId is present and valid
      if (!data || !data.serialUserId) {
        error(
          NAMESPACE,
          "fetchQuestions - Missing required field: serialUserId"
        );
        return Promise.reject(
          new Error("Missing required field: serialUserId")
        );
      }

      const options = this.makeOptions(data);
      return this.logAndParse(
        `fetch questions`,
        fetch(`${QST_BACKEND}/feed`, options)
      );
    } catch (error) {
      error(NAMESPACE, "fetchQuestions preparation error:", error);
      return Promise.reject(error);
    }
  };

  fetchStrServer = (data) => {
    debug(NAMESPACE, "fetchStrServer - request data:", data);
    const options = this.makeOptions(data);
    const url = `${STRDB_BACKEND}/server`;
    return this.logAndParse(
      `fetch str server for: ${data}`,
      fetch(url, options)
    );
  };

  fetchVHInfo = () =>
    this.logAndParse(
      `fetch vh info`,
      fetch(this.urlFor("/v2/vhinfo"), this.defaultOptions())
    );

  fetchGeoInfo = async () => {
    const defaultInfo = {
      ip: "127.0.0.1",
      country: "XX",
    };
    try {
      const response = await fetch(GEO_IP_INFO);
      if (response.ok) {
        return await response.json();
      } else {
        return defaultInfo;
      }
    } catch (ex) {
      debug(NAMESPACE, `get geoInfo`, ex);
      return defaultInfo;
    }
  };
}

const defaultApi = new Api();

export default defaultApi;
