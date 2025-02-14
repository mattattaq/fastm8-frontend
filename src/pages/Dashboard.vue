<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ProgressCircle from "../components/ProgressCircle.vue";

const router = useRouter();

// Logout function
const logout = () => {
  localStorage.removeItem("userToken");
  router.push("/fastm8-frontend/login");
};

// Track fasting state
const startTime = ref(new Date("2025-02-14T08:00:00")); // Replace with API-driven value
const fastingWindow = 16; // Fasting window in hours
const progress = ref(0);
const elapsedTime = ref({ hours: 0, minutes: 0 });

// Compute fasting end time
const fastingEndTime = computed(() => {
  if (!startTime.value) return null;
  const end = new Date(startTime.value);
  end.setHours(end.getHours() + fastingWindow);
  return end;
});

// Toggle fasting state
const toggleFast = () => {
  if (startTime.value) {
    startTime.value = null;
    progress.value = 0;
    elapsedTime.value = { hours: 0, minutes: 0 };
  } else {
    startTime.value = new Date(); // Set new start time
  }
};

// Compute button text
const startOrStop = computed(() => (startTime.value ? "Stop Fast" : "Start Fast"));

// Update progress & elapsed time
const updateProgress = () => {
  if (!startTime.value) {
    progress.value = 0;
    return;
  }

  const now = new Date();
  const totalDuration = fastingEndTime.value - startTime.value;
  const elapsedDuration = now - startTime.value;

  // Calculate elapsed time in hours & minutes
  elapsedTime.value = {
    hours: Math.floor(elapsedDuration / (1000 * 60 * 60)),
    minutes: Math.floor((elapsedDuration % (1000 * 60 * 60)) / (1000 * 60)),
  };

  // Calculate fasting progress
  progress.value = now >= fastingEndTime.value ? 100 : (elapsedDuration / totalDuration) * 100;
};

// Update every minute
let interval = null;
onMounted(() => {
  updateProgress();
  interval = setInterval(updateProgress, 60000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

// Format times for display
const formattedStartTime = computed(() =>
  startTime.value ? startTime.value.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }) : "Not started"
);

const formattedEndTime = computed(() =>
  fastingEndTime.value ? fastingEndTime.value.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"
);
</script>

<template>
  <div>
    <h1>Dashboard</h1>
    <p>Welcome! You are logged in.</p>

    <h1>FastM8</h1>
    <p>You started your fast on <strong>{{ formattedStartTime }}</strong></p>
    <p>Here is how far into your fasting window you are:</p>
    <ProgressCircle :progress="progress" />

    <p>Your scheduled fasting window closes on <strong>{{ formattedEndTime }}</strong></p>

    <p>Fasting time that has elapsed: {{ elapsedTime.hours }} hours, {{ elapsedTime.minutes }} minutes</p>

    <button @click="toggleFast">{{ startOrStop }}</button>
    <br />
    <button @click="logout">Logout</button>
  </div>
</template>
