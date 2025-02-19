import { createApp } from "vue";
import App from "./App.vue";
import router from "./router"; // Import router
import { library } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {
  faHouse,
  faList,
  faCircleUser,
  faRightToBracket,
} from "@fortawesome/free-solid-svg-icons";

import "./style.css";
import "./registerServiceWorker";

library.add(faHouse, faList, faCircleUser, faRightToBracket);
const app = createApp(App);
app.component("font-awesome-icon", FontAwesomeIcon);
app.use(router);
app.mount("#app");

// Register service worker manually if it's not handled inside `registerServiceWorker`
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/fastm8-frontend/service-worker.js")
    .then((registration) => {
      console.log("Service Worker Registered with scope:", registration.scope);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}
