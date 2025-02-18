<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ProgressCircle from "../components/ProgressCircle.vue";
import Footer from "../components/Footer.vue";

const router = useRouter();
const startTime = ref(null);
const fastingWindow = 16;
const progress = ref(0);
const elapsedTime = ref({ hours: 0, minutes: 0, seconds: 0 });
const token = localStorage.getItem("userToken") || null;
const userId = localStorage.getItem("userId") || null;
const userName = localStorage.getItem("userName")
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const fastingEndTime = computed(() => {
  if (!startTime.value) return null;
  const end = new Date(startTime.value);
  end.setHours(end.getHours() + fastingWindow);
  return end;
});

// Logout function
const logout = () => {
  localStorage.clear(); // Clears all stored data, including userToken and userId
  router.push("/fastm8-frontend/login"); // Redirect to login
};

// Fetch open logs when the dashboard loads
const fetchOpenFastLogs = async () => {
  if (!token || !userId) {
    console.error("No user token or ID found.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/open-logs?userId=${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Grabbing logs")
    const data = await response.json();
    console.log("data: ", data)
    if (response.ok && data.length > 0) {
      // Check for the most recent log with no end time (open fast)
      const openLog = data.find(log => !log.endTime);
      console.log(openLog, "openLog");
      if (openLog) {
        startTime.value = new Date(openLog.startTime);
      }
    }
  } catch (error) {
    console.error("Error fetching open fast logs:", error);
  }
};


// Update progress & elapsed time
const updateProgress = () => {
  if (!startTime.value) {
    progress.value = 0;
    return;
  }

  const now = new Date();
  const totalDuration = fastingEndTime.value - startTime.value;
  const elapsedDuration = now - startTime.value;

  elapsedTime.value = {
    hours: Math.floor(elapsedDuration / (1000 * 60 * 60)),
    minutes: Math.floor((elapsedDuration % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((elapsedDuration % (1000 * 60)) / 1000),
  };

  progress.value = now >= fastingEndTime.value ? 100 : (elapsedDuration / totalDuration) * 100;
};

// Timer update every minute
let interval = null;
onMounted(() => {
  fetchOpenFastLogs();
  updateProgress();
  interval = setInterval(updateProgress, 1000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const toggleFast = async () => {
  if (!token || !userId) {
    console.error("No user token or ID found.");
    return;
  }

  // Fetch open fasting logs for the user
  const response = await fetch(`${API_BASE_URL}/api/open-logs?userId=${userId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (response.ok && data.length > 0) {
    // If there's an open fast, complete it
    const openLog = data[0]; // Get the first open log

    // Check if we have the log id in localStorage, otherwise, we'll need to assign it.
    if (!localStorage.getItem("fastLogId")) {
      // Save the log id to localStorage
      localStorage.setItem("fastLogId", openLog.id);
    }

    const endTime = new Date().toISOString();

    // Update the existing log with an end time and mark it as complete
    try {
      const updateResponse = await fetch(`${API_BASE_URL}/api/logs`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          id: openLog.id, // Use the id from localStorage or the open log
          startTime: openLog.startTime, // Keep the original start time
          endTime,
          duration: (new Date(endTime) - new Date(openLog.startTime)) / 1000, // Calculate duration in seconds
          isComplete: true,
        }),
      });

      if (updateResponse.ok) {
        startTime.value = null; // Clear the start time
        progress.value = 0;
        elapsedTime.value = { hours: 0, minutes: 0, seconds: 0 };
        console.log("Fast stopped and logged successfully.");
        localStorage.removeItem("fastLogId"); // Remove the log id after completing
      } else {
        console.error("Failed to update fast log.");
      }
    } catch (error) {
      console.error("Error stopping fast:", error);
    }
  } else {
    // If no open fast exists, start a new fast log
    startTime.value = new Date();

    try {
      const createResponse = await fetch(`${API_BASE_URL}/api/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          startTime: startTime.value.toISOString(),
          endTime: "", // No end time yet
          duration: 0, // Initial duration
          isComplete: false,
        }),
      });

      const createData = await createResponse.json();

      if (createResponse.ok) {
        // Save the newly created log id to localStorage for future reference
        localStorage.setItem("fastLogId", createData.id);
        console.log("Fast started successfully.");
      } else {
        console.error("Failed to start fast log.");
      }
    } catch (error) {
      console.error("Error starting fast:", error);
    }
  }
};

// Compute button text
const startOrStop = computed(() => (startTime.value ? "Stop" : "Start"));

// Format times for display
const formattedStartTime = computed(() =>
  startTime.value ? startTime.value.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }) : "Not started"
);

const formattedEndTime = computed(() =>
  fastingEndTime.value ? fastingEndTime.value.toLocaleString("en-US", { weekday: "long", hour: "numeric", minute: "2-digit", hour12: true }) : "N/A"
);
</script>

<template>
  <div class="container">
    <div class="left">
      <h1>FastM8</h1>
      <p>Welcome <b>{{ userName }}</b>!</p>
      <div v-if="startTime">
        <p>You started your fast on <strong>{{ formattedStartTime }}</strong></p>
        <p>Here is how far into your fasting window you are:</p>
        <ProgressCircle :progress="progress" />
        <p>{{ elapsedTime.hours }}:{{ elapsedTime.minutes }}:{{ elapsedTime.seconds }}</p>
      </div>
    </div>
    <div class="right">
      <button class="circle" @click="toggleFast">{{ startOrStop }}</button>
      <br />
      <button class="circle" @click="logout">Logout</button>
    </div>
  </div>
  <Footer />
</template>
