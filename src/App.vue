<script setup>
import { ref, onMounted } from "vue";
import { checkServerStatus } from "./api";

const serverStatus = ref("Loading...");

// Fetch backend status on mount
onMounted(async () => {
  const status = await checkServerStatus();
  serverStatus.value = status ? "Backend is up!" : "Error connecting.";
});

// Request notification permission
const requestPermission = async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    console.log("Notifications enabled!");
  } else {
    console.log("Notifications denied!");
  }
};

// Simulate sending a push notification
const sendPushNotification = async () => {
  if ('PushManager' in window) {
    navigator.serviceWorker.ready.then(serviceWorkerRegistration => {
      serviceWorkerRegistration.showNotification('Hello World', {
        body: 'This is a simulated push notification from the Vue app!',
        icon: '/icons/icon-192x192.png', // Customize icon
      });
    });
  } else {
    alert('Push notifications are not supported in your browser.');
  }
};
</script>

<template>
  <button @click="requestPermission">Enable Notifications</button>
  <button @click="sendPushNotification">Send Push Notification</button>
  <div>
    <h1>FastM8</h1>
    <p>{{ serverStatus }}</p>
  </div>
</template>

<style scoped>
</style>
