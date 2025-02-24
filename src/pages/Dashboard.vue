<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ProgressCircle from "../components/ProgressCircle.vue";
import Footer from "../components/Footer.vue";
import { editLogs } from '../api';

const router = useRouter();
const startTime = ref(null);
const fastingWindow = 16;
const progress = ref(0);
const elapsedTime = ref({ hours: 0, minutes: 0, seconds: 0 });
const token = localStorage.getItem("userToken") || null;
const userId = localStorage.getItem("userId") || null;
const userName = localStorage.getItem("userName");
const fastLogId = localStorage.getItem("fastLogId") || null;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const isEditModalOpen = ref(false);
const isConfirmModalOpen = ref(false);
const isLoading = ref(false);
const newStartTime = ref(null);
const fastingEndTime = computed(() => {
  if (!startTime.value) return null;
  const end = new Date(startTime.value);
  end.setHours(end.getHours() + fastingWindow);
  return end;
});
let interval = null;


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
    console.log("Grabbing logs");

    const data = await response.json();
    console.log("data: ", data);

    if (response.ok && data.length > 0) {
      // Check for the most recent log with no end time (open fast)
      const openLog = data.find(log => !log.endTime);
      console.log(openLog, "openLog");

      // Save the log id to localStorage as an integer
      if (openLog) {
        localStorage.setItem("fastLogId", openLog.id);  // Store as string but it's an integer
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

onMounted(() => {
  fetchOpenFastLogs();
  updateProgress();
  interval = setInterval(updateProgress, 1000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const stopFast = async (logIds, edits, token) => {
  console.log(toggleDisabled.value);
  if (toggleDisabled.value) {
    console.log("Button is disabled or fastLogId is invalid.");
    return;
  }
  console.log(logIds, "logIds");
  console.log(edits, "edits");
  try {
    const data = await editLogs(logIds, edits, token); // Use the imported editLogs function
    console.log(data.message);

    // Reset fastLogId after successful update
    localStorage.removeItem("fastLogId");
    fetchOpenFastLogs(); // Refresh logs
  } catch (error) {
    console.error("Error updating logs:", error);
  }
}

// Toggle Fast
const toggleFast = async () => {
  if (!token || !userId) {
    console.error("No user token or ID found.");
    return;
  }

  if (startTime.value) {
    // If fasting is active, open edit modal
    newStartTime.value = startTime.value.toISOString().slice(0, 16);
    // turn on the confirm modal.
    isEditModalOpen.value = true;
  } else {
    // Start a new fast
    console.log("new log");
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, startTime: new Date().toISOString(), isComplete: false }),
      });

      if (response.ok) {
        console.log("New fast started.");
        fetchOpenFastLogs(); // Refresh logs
      } else {
        console.error("Failed to start fast.");
      }
    } catch (error) {
      console.error("Error starting fast:", error);
    }
  }
};

// update newStartTime with whatever the value is, turn off the isEditModalOpen and turn on isConfirmModalOpen
const submitEdit = async () => {
  isEditModalOpen.value = false;
  isConfirmModalOpen.value = true;
  newStartTime.value = document.querySelector('input[type="datetime-local"]').value;
  console.log(newStartTime, " newStartTime");
}
// Confirm Edit Start Time
const confirmEditStartTime = async () => {
  if (!newStartTime.value) {
    console.error("No new start time selected.");
    return;
  }

  const selectedDate = new Date(newStartTime.value);
  console.log("Selected Date:", selectedDate);

  if (isNaN(selectedDate.getTime())) {
    console.error("Invalid date format:", newStartTime.value);
    return;
  }

  isLoading.value = true; // Show loading screen

  try {
    await editLogs(
      [parseInt(fastLogId)], // Ensure fastLogId is an integer
      [{ startTime: selectedDate.toISOString() }], // Convert to ISO format
      token
    );

    console.log("Successfully updated fast log.");
    isConfirmModalOpen.value = false;
  } catch (error) {
    console.error("Error updating fast log:", error);
  } finally {
    await fetchOpenFastLogs(); // Ensure this runs after the update
    isLoading.value = false; // Hide loading screen
  }
};

// Compute button text
const startOrEdit = computed(() => (startTime.value ? "Edit" : "Start"));
const toggleDisabled = computed(() => typeof (fastLogId) !== null);

// Format times for display
const formattedStartTime = computed(() =>
  startTime.value ? startTime.value.toLocaleString("en-US", {
    weekday: "long", hour: "numeric", minute: "2-digit", hour12: true
  }) : "Not started"
);

const formattedEndTime = computed(() =>
  fastingEndTime.value ? fastingEndTime.value.toLocaleString("en-US", {
    weekday: "long", hour: "numeric", minute: "2-digit", hour12: true
  }) : "N/A"
);
</script>

<template>
  <!-- Edit Modal -->
  <div v-if="isEditModalOpen" class="modal-overlay">
    <div class="modal">
      <h2>Edit Start Time</h2>
      <input type="datetime-local" v-model="newStartTime" />
      <button @click="submitEdit">OK</button>
      <button @click="isEditModalOpen = false">Cancel</button>
    </div>
  </div>
  <!-- Confirmation Modal -->
  <div v-if="isConfirmModalOpen" class="modal-overlay" id="confirm">
    <div class="modal">
      <h2>Confirm Change</h2>
      <p>Are you sure you want to update to {{ newStartTime }}?</p>
      <button @click="confirmEditStartTime">Confirm</button>
      <button @click="isConfirmModalOpen = false">Cancel</button>
    </div>
  </div>
  <div class="container">
    <div class="left">
      <h1>FastM8</h1>
      <p>Welcome <b>{{ userName }}</b>!</p>
      <div v-if="startTime">
        <p>You started your fast on <strong>{{ formattedStartTime }}</strong></p>
        <ProgressCircle :progress="progress" />
        <p>{{ elapsedTime.hours }}:{{ elapsedTime.minutes }}:{{ elapsedTime.seconds }}</p>
        <p class="sub"><b>Endtime:</b> {{ formattedEndTime }}</p>
      </div>
    </div>
    <div class="right">
      <button class="circle" @click="toggleFast">{{ startOrEdit }}</button>
      <br />
      <button :class="['circle', { disabled: toggleDisabled }]"
        @click="stopFast([fastLogId], [{ endTime: new Date().toDateString, isComplete: true }])">
        Stop
      </button>
    </div>
  </div>
  <Footer />
</template>
