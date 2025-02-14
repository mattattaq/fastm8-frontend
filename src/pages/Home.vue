<!-- src/pages/Home.vue -->
<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

onMounted(() => {
  const isLoggedIn = localStorage.getItem("userToken") !== null;
  if (isLoggedIn) {
    router.push("/fastm8-frontend/dashboard");
  } else {
    router.push("/fastm8-frontend/login");
  }
});
</script>

<template>
  <p>Redirecting...</p>
</template>
