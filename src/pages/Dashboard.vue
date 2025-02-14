<!-- src/pages/Dashboard.vue -->
<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const logout = () => {
  localStorage.removeItem("userToken"); // Remove token
  router.push("/fastm8-frontend/login"); // Redirect to login
};
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome! You are logged in.</p>
    <h1>FastM8</h1>

    <!-- Health Check Section -->
    <p>{{ serverStatus }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>
