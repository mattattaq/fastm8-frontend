/* eslint-disable no-console */

import { register } from "register-service-worker";

const baseUrl =
  import.meta.env.MODE === "production"
    ? "/fastm8-frontend/"
    : "/fastm8-frontend/";

register(`${baseUrl}service-worker.js`, {
  ready() {
    console.log("App is being served from cache by a service worker.");
  },
  registered() {
    console.log("Service worker has been registered.");
  },
  cached() {
    console.log("Content has been cached for offline use.");
  },
  updatefound() {
    console.log("New content is downloading.");
  },
  updated() {
    console.log("New content is available; please refresh.");
  },
  offline() {
    console.log(
      "No internet connection found. App is running in offline mode."
    );
  },
  error(error) {
    console.error("Error during service worker registration:", error);
  },
});
