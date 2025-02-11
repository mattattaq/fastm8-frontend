import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './registerServiceWorker'

createApp(App).mount('#app')
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").then(() => {
      console.log("Service Worker Registered");
    });
  }if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/service-worker.js").then(() => {
      console.log("Service Worker Registered");
    });
  }