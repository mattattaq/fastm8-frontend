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

const fastingSettings = ref({
  protocol: '16:8',
  fastingHours: 16,
  eatingHours: 8
});

// Add computed properties for recommended windows
const recommendedWindows = computed(() => {
  const now = new Date();
  const settings = JSON.parse(localStorage.getItem('fastingSettings')) || fastingSettings.value;

  // Calculate recommended eating window
  const eatingStart = new Date(now);
  eatingStart.setHours(now.getHours() - settings.fastingHours);

  const eatingEnd = new Date(eatingStart);
  eatingEnd.setHours(eatingStart.getHours() + settings.eatingHours);

  // Calculate next fasting window
  const nextFastStart = new Date(eatingEnd);
  const nextFastEnd = new Date(nextFastStart);
  nextFastEnd.setHours(nextFastStart.getHours() + settings.fastingHours);

  return {
    eatingWindow: {
      start: eatingStart,
      end: eatingEnd
    },
    nextFast: {
      start: nextFastStart,
      end: nextFastEnd
    }
  };
});

// Add format time helper
const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
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

// Add time remaining calculation
const calculateTimeRemaining = () => {
  if (!startTime.value || !fastingEndTime.value) return '';

  const now = new Date();
  const end = new Date(fastingEndTime.value);
  const diffMs = end - now;

  if (diffMs <= 0) return 'Fast Complete!';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};

// Add motivational messages based on fasting progress
const motivationalMessage = computed(() => {
  if (!startTime.value) return null;

  const progress = (elapsedTime.value.hours / fastingSettings.value.fastingHours) * 100;

  if (progress < 25) return "You've got this! The first few hours are the hardest.";
  if (progress < 50) return "Great job! Your body is starting to burn fat.";
  if (progress < 75) return "Almost there! You're in the fat-burning zone.";
  if (progress < 100) return "Final stretch! You're doing amazing!";
  return "Congratulations! You've completed your fast!";
});

// Add fasting phase indicator
const fastingPhase = computed(() => {
  if (!startTime.value) return null;

  const hours = elapsedTime.value.hours;
  if (hours < 12) return "Early Fasting Phase";
  if (hours < 16) return "Fat Burning Phase";
  if (hours < 20) return "Deep Ketosis Phase";
  return "Autophagy Phase";
});
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
      <div class="header">
        <h1>FastM8</h1>
        <div class="protocol-label">
          {{ fastingSettings.protocol }}
        </div>
      </div>
      <p>Welcome <b>{{ userName }}</b>!</p>

      <!-- Recommended windows section -->
      <div class="recommended-windows" v-if="!startTime">
        <h3>Recommended Windows</h3>
        <div class="window-info">
          <div class="window-section">
            <h4>Current Eating Window</h4>
            <p class="time-range">
              {{ formatTime(recommendedWindows.eatingWindow.start) }} -
              {{ formatTime(recommendedWindows.eatingWindow.end) }}
            </p>
            <p class="window-duration">{{ fastingSettings.eatingHours }} hours</p>
            <p class="window-tip">Make sure to eat nutrient-dense foods during this window</p>
          </div>
          <div class="window-section">
            <h4>Next Fasting Window</h4>
            <p class="time-range">
              {{ formatTime(recommendedWindows.nextFast.start) }} -
              {{ formatTime(recommendedWindows.nextFast.end) }}
            </p>
            <p class="window-duration">{{ fastingSettings.fastingHours }} hours</p>
            <p class="window-tip">Stay hydrated and keep busy during your fast</p>
          </div>
        </div>
        <div class="action-buttons">
          <button class="start-button" @click="toggleFast">Start Fast</button>
        </div>
      </div>

      <!-- Active fast section -->
      <div v-if="startTime" class="active-fast">
        <div class="fast-status">
          <h3>Current Fast</h3>
          <div class="phase-indicator">
            <span class="phase-badge">{{ fastingPhase }}</span>
          </div>
          <p>Started: <strong>{{ formattedStartTime }}</strong></p>
          <p>Ends: <strong>{{ formattedEndTime }}</strong></p>
        </div>
        <ProgressCircle :progress="progress" />
        <div class="elapsed-time">
          <p class="timer">{{ elapsedTime.hours }}:{{ elapsedTime.minutes }}:{{ elapsedTime.seconds }}</p>
          <p class="time-remaining">Time Remaining: {{ calculateTimeRemaining() }}</p>
          <p class="motivational-message">{{ motivationalMessage }}</p>
        </div>
        <div class="action-buttons">
          <button class="edit-button" @click="toggleFast">Edit</button>
          <button class="stop-button" :class="{ disabled: toggleDisabled }"
            @click="stopFast([fastLogId], [{ endTime: new Date().toDateString, isComplete: true }])">
            End Fast
          </button>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style>
/* ... existing styles ... */

.recommended-windows {
  background: rgba(0, 255, 200, 0.05);
  border: 1px solid var(--mint);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.window-section {
  margin-bottom: 20px;
  padding: 16px;
  background: rgba(0, 255, 200, 0.03);
  border-radius: 8px;
}

.window-section h4 {
  color: var(--mint);
  margin: 0 0 12px 0;
  font-size: 1.1em;
  font-weight: 600;
}

.time-range {
  font-size: 1.2em;
  font-weight: bold;
  color: var(--green);
  margin: 8px 0;
}

.window-duration {
  color: var(--mint);
  opacity: 0.8;
  font-size: 0.9em;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  width: 100%;
}

.start-button,
.edit-button,
.stop-button {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--mint);
  background: var(--mint);
  color: var(--lite-dark);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9em;
  text-align: center;
  min-width: 0;
  /* Allow flex items to shrink below their content size */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.start-button:hover,
.edit-button:hover {
  background: var(--green);
  border-color: var(--green);
}

.stop-button {
  background: #ff6b6b;
  border-color: #ff6b6b;
}

.stop-button:hover {
  background: #ff5252;
  border-color: #ff5252;
}

.stop-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.active-fast {
  background: rgba(0, 255, 200, 0.05);
  border: 1px solid var(--mint);
  border-radius: 8px;
  padding: 20px;
  width: 100%;
  box-sizing: border-box;
}

.fast-status {
  margin-bottom: 20px;
}

.fast-status h3 {
  color: var(--mint);
  margin: 0 0 16px 0;
  font-size: 1.2em;
  font-weight: 600;
}

.elapsed-time {
  text-align: center;
  margin: 20px 0;
}

.timer {
  font-size: 2em;
  font-weight: bold;
  color: var(--mint);
  margin: 0;
}

.time-remaining {
  color: var(--mint);
  opacity: 0.8;
  margin-top: 8px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.protocol-label {
  background: rgba(0, 255, 200, 0.1);
  border: 1px solid var(--mint);
  color: var(--mint);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.window-tip {
  color: var(--mint);
  opacity: 0.7;
  font-size: 0.9em;
  margin-top: 8px;
  font-style: italic;
}

.phase-indicator {
  margin: 12px 0;
}

.phase-badge {
  background: rgba(0, 255, 200, 0.1);
  border: 1px solid var(--mint);
  color: var(--mint);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.9em;
  font-weight: 600;
}

.motivational-message {
  color: var(--mint);
  font-style: italic;
  margin-top: 16px;
  font-size: 1.1em;
  text-align: center;
}

/* ... rest of existing styles ... */

/* Update container styles to ensure proper width constraints */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  width: 100%;
}

.left {
  width: 100%;
}

.recommended-windows,
.active-fast {
  width: 100%;
  box-sizing: border-box;
}
</style>
