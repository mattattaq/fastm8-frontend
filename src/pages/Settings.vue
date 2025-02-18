<script setup>
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import Footer from "../components/Footer.vue";

const router = useRouter();
const token = localStorage.getItem("userToken") || null;
const userId = localStorage.getItem("userId") || null;
const userName = localStorage.getItem("userName")
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Logout function
const logout = () => {
  localStorage.clear(); // Clears all stored data, including userToken and userId
  router.push("/fastm8-frontend/login"); // Redirect to login
};

onMounted(() => {
});

onUnmounted(() => {
});

</script>

<template>
  <div class="container">
    <div class="left">
      <h1>FastM8</h1>
      <p>Welcome <b>{{ userName }}</b>!</p>
    </div>
    <div class="right">
      <button class="circle" @click="logout">Logout</button>
    </div>
  </div>
  <Footer />
</template>
