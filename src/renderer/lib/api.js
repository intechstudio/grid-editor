import { get } from "svelte/store";
import { appSettings } from "../runtime/app-helper.store";

const env = window.ctxProcess.env();
const apiUrl =
  env.NODE_ENV === "development" ? env.HQ_API_URL_DEV : env.HQ_API_URL_PROD;

async function send({ method, path, data }) {
  const auth = get(appSettings).persistant.authIdToken;

  const options = {
    method,
    // detault headers are sent with all requests
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth}`,
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  async function retryRequest(url, opts) {
    // get a new token
    const response = await api.post("auth/exchange-token", {
      refreshToken: get(appSettings).persistant.authRefreshToken,
    });
    if (response.ok == true) {
      // update the token in the persistant store
      appSettings.update((s) => {
        s.persistant.authIdToken = response.data.id_token;
        s.persistant.authRefreshToken = response.data.refresh_token;
        return s;
      });
      // retry the request and return it
      console.log("Token refreshed and retrying request ", url);
      return wrappedFetch(url, opts);
    } else {
      return response;
    }
  }

  function wrappedFetch(url, opts) {
    return fetch(url, opts)
      .then((r) => r.text())
      .then(async (json) => {
        try {
          let resParsed = JSON.parse(json);
          if (resParsed?.error === "Token expired") {
            resParsed = await retryRequest(url, opts);
          }
          return resParsed;
        } catch (err) {
          return json;
        }
      })
      .catch((err) =>
        console.error(`Fetch Failed, API error from ${apiUrl}/${path}: ${err}`)
      );
  }

  return wrappedFetch(`${apiUrl}/${path}`, options);
}

const api = {
  get: function (path) {
    return send({ method: "GET", path });
  },
  del: function (path) {
    return send({ method: "DELETE", path });
  },
  post: function (path, data) {
    return send({ method: "POST", path, data });
  },
  patch: function (path, data) {
    return send({ method: "PATCH", path, data });
  },
};

export default api;
