<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import ProgressCircle from "../components/ProgressCircle.vue";

// Router instance for redirection
const router = useRouter();

// Logout function
const logout = () => {
  localStorage.removeItem("userToken"); // Remove token from localStorage
  router.push("/fastm8-frontend/login"); // Redirect to login page
};
// startTime should come from the endpoint while fasting window should be a setting in the app
// Set start time and fasting window
const startTime = new Date("2025-02-14T08:00:00");
const fastingWindow = 16; // in hours

// Calculate fasting end time
const fastingEndTime = computed(() => {
  let end = new Date(startTime);
  end.setHours(end.getHours() + fastingWindow);
  return end;
});

// Reactive state for progress and elapsed time
const progress = ref(0);
const elapsedTime = ref({ hours: 0, minutes: 0 });

// Function to update progress and elapsed time
const updateProgress = () => {
  const now = new Date();
  const totalDuration = fastingEndTime.value - startTime; // Total fasting window in ms
  const elapsedDuration = now - startTime; // Time passed since start time

  // Update elapsed time (hours and minutes)
  const hours = Math.floor(elapsedDuration / (1000 * 60 * 60));
  const minutes = Math.floor((elapsedDuration % (1000 * 60 * 60)) / (1000 * 60));
  elapsedTime.value = { hours, minutes };

  // Update progress percentage
  if (now < startTime) {
    progress.value = 0; // Before start time, no progress
  } else if (now > fastingEndTime.value) {
    progress.value = 100; // After fasting end time, 100% progress
  } else {
    progress.value = Math.min((elapsedDuration / totalDuration) * 100, 100);
  }
};

// Recalculate progress every minute
let interval = null;
onMounted(() => {
  updateProgress(); // Initial calculation
  interval = setInterval(updateProgress, 60000); // Update every minute
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

// Format dates for display
const formattedStartTime = computed(() =>
  startTime.toLocaleString("en-US", 
  { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true })
);
const formattedEndTime = computed(() =>
  fastingEndTime.value.toLocaleString("en-US", 
  { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true })
);
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome! You are logged in.</p>

    <h1>FastM8</h1>
    <p>You started your fast on <strong>{{ formattedStartTime }}</strong></p>
    
    <!-- ProgressCircle component with reactive progress -->
    <p>Here is how far into your fasting window you are:</p>
    <ProgressCircle :progress="progress" />

    <p>Your scheduled fasting window closes on <strong>{{ formattedEndTime }}</strong></p>

    <!-- Display the elapsed time in hours and minutes -->
    <p>Fasting time that has elapsed: {{ elapsedTime.hours }} hours, {{ elapsedTime.minutes }} minutes</p>

    <!-- Logout button -->
    <button @click="logout">Logout</button>
  </div>
</template>
