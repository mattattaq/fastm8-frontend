<script setup>
import { ref, onMounted } from "vue";
import { checkServerStatus } from "./api";

const serverStatus = ref("Loading...");

onMounted(async () => {
    const status = await checkServerStatus();
    serverStatus.value = status ? "Backend is up!" : "Error connecting.";
});
</script>

<template>
  <div>
      <h1>FastM8</h1>
      <p>{{ serverStatus }}</p>
  </div>
</template>

<style scoped>
</style>
