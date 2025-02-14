import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import './registerServiceWorker'  // Ensure this file exists and properly registers the Service Worker

createApp(App).mount('#app');

// Register service worker manually if it's not handled inside `registerServiceWorker`
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/fastm8-frontend/service-worker.js")
        .then((registration) => {
            console.log("Service Worker Registered with scope:", registration.scope);
        })
        .catch((error) => {
            console.error("Service Worker registration failed:", error);
        });
}
