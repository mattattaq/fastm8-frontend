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
  try {
    const permission = await Notification.requestPermission();
    console.log("Notification Permission:", permission);
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
};

// Send a local notification (works immediately if permission is granted)
const sendLocalNotification = () => {
  if (!("Notification" in window)) {
    console.error("This browser does not support notifications.");
    return;
  }

  if (Notification.permission === "granted") {
    new Notification("FastM8 Alert", {
      body: "This is a local notification!",
      icon: "/fastm8-frontend/img/icons/icon-192x192.png", // Ensure icon exists
    });
    console.log("Local notification sent!");
  } else {
    console.warn("Notification permission not granted.");
  }
};

// Simulate a push notification using service worker
const sendPushNotification = async () => {
  if (!("serviceWorker" in navigator)) {
    alert("Service workers are not supported in your browser.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification("FastM8 Push", {
      body: "This is a simulated push notification!",
      icon: "/fastm8-frontend/img/icons/icon-192x192.png",
    });
    console.log("Push notification triggered!");
  } catch (error) {
    console.error("Error triggering push notification:", error);
  }
};
</script>

<template>
  <button @click="requestPermission">Enable Notifications</button>
  <button @click="sendLocalNotification">Send Local Notification</button>
  <button @click="sendPushNotification">Send Push Notification</button>
  <div>
    <h1>FastM8</h1>
    <p>{{ serverStatus }}</p>
  </div>
</template>

<style scoped>
button {
  margin: 5px;
}
</style>
