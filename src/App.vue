<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { checkServerStatus } from "./api";

const router = useRouter();
const serverStatus = ref("Loading...");

// Check if user is authenticated
const isAuthenticated = () => localStorage.getItem("userToken") !== null;

// Redirect if not authenticated
onMounted(async () => {
  if (!isAuthenticated() && router.currentRoute.value.path !== "/login") {
    router.push("/login");
  }
  serverStatus.value = (await checkServerStatus()) ? "Backend is up!" : "Error connecting.";
});
</script>

<template>
  <div>
    <router-view />
  </div>
</template>
