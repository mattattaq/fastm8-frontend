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
  <h1>FastM8</h1>
  <p>Welcome <b>{{ userName }}</b>!</p>
  <p>Make a duration selection for logs</p>
  <select name="calendar" id="date-select">
    <option value="1 day">1 Day</option>
    <option value="1 day">7 Day</option>
    <option value="1 day">30 Day</option>
  </select>
  <div class="container">
    <div id="log-wrapper">
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
      <div class="log">
        <p>Start Time: <span class="highlight">2/18/24 18:00</span></p>
        <p>End Time: <span class="highlight">2/18/24 20:30</span></p>
        <p>Total Fasting Time: <span class="highlight">2.5 hours</span></p>
      </div>
    </div>

  </div>
  <Footer />
</template>

<style>
#log-wrapper {
  width: 100%;
  height: 60vh;
  border: solid var(--mint);
  display: block;
  overflow: scroll;
}

h1 {
  padding: 0;
  margin: 0;
}

p {
  margin: 0;
  margin: 0;
}

.log {
  width: calc(100% - 16px);
  background: var(--lite-dark);
  min-height: 50px;
  margin: 12px 0;
  text-align: left;
  padding: 6px 6px 6px 6px;
  border-radius: 8px;
}

.highlight {
  font-weight: bold;
  color: var(--green);
  float: right;
}
</style>