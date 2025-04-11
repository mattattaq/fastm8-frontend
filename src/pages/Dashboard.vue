<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import ProgressCircle from "../components/ProgressCircle.vue";
import Footer from "../components/Footer.vue";
import { editLogs } from '../api';
import { useSettings } from '../stores/settings';

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
const logs = ref([]);

const { settings: fastingSettings } = useSettings();

const fastingEndTime = computed(() => {
  if (!startTime.value) return null;
  const end = new Date(startTime.value);
  end.setHours(end.getHours() + fastingWindow);
  return end;
});
let interval = null;
const alternatingText = ref("M");
let typingInterval = null;

// Add computed properties for recommended windows
const recommendedWindows = computed(() => {
  const now = new Date();
  const settings = fastingSettings.value;

  // Ensure preferredEatingWindow exists with default values
  const preferredWindow = settings.preferredEatingWindow || {
    startHour: 8,
    startMinute: 0
  };

  // Get the most recent completed fast from logs
  const recentFast = logs.value
    .filter(log => log.endTime)
    .sort((a, b) => new Date(b.endTime) - new Date(a.endTime))[0];

  let eatingStart, eatingEnd;

  if (recentFast && (now - new Date(recentFast.endTime)) < 24 * 60 * 60 * 1000) {
    // If there's a recent fast (within 24 hours), base the eating window on its end time
    const endTime = new Date(recentFast.endTime);
    eatingStart = new Date(endTime);

    // If the end time is in the past, use now as the start time
    if (eatingStart < now) {
      eatingStart = new Date(now);
    }

    eatingEnd = new Date(eatingStart);
    eatingEnd.setHours(eatingStart.getHours() + settings.eatingHours);
  } else {
    // Otherwise, use the preferred eating window from settings
    eatingStart = new Date(now);
    eatingEnd = new Date(now);

    // Set to preferred start time
    eatingStart.setHours(preferredWindow.startHour, preferredWindow.startMinute, 0, 0);

    // If preferred start time has passed today, set for today
    if (eatingStart < now) {
      eatingStart = new Date(now);
    }

    // Set end time based on eating hours
    eatingEnd = new Date(eatingStart);
    eatingEnd.setHours(eatingStart.getHours() + settings.eatingHours);
  }

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
  return date.toLocaleString('en-US', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: !fastingSettings.value.use24HourFormat
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

// Add fetch logs function
const fetchLogs = async () => {
  if (!token || !userId) {
    console.error("No user token or ID found.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/logs?userId=${userId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      logs.value = data;
    }
  } catch (error) {
    console.error("Error fetching logs:", error);
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
  fetchLogs();
  updateProgress();
  interval = setInterval(updateProgress, 1000);
  startAlternating();
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
  if (typingInterval) clearInterval(typingInterval);
});

const stopFast = async () => {
  if (!startTime.value) {
    console.log("No active fast to end");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/edit`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logIds: [parseInt(fastLogId)],
        edits: [{
          endTime: new Date().toISOString(),
          isComplete: true
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to end fast');
    }

    // Reset fastLogId and startTime after successful update
    localStorage.removeItem("fastLogId");
    startTime.value = null;
    await fetchOpenFastLogs();
  } catch (error) {
    console.error("Error ending fast:", error);
  }
};

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
const toggleDisabled = computed(() => !startTime.value);

// Format times for display
const formattedStartTime = computed(() => {
  if (!startTime.value) return "Not started";
  return startTime.value.toLocaleString("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: !fastingSettings.value.use24HourFormat
  });
});

const formattedEndTime = computed(() => {
  if (!fastingEndTime.value) return "N/A";
  return fastingEndTime.value.toLocaleString("en-US", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: !fastingSettings.value.use24HourFormat
  });
});

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

// Start alternating the "M" effect
const startAlternating = () => {
  if (!typingInterval) {
    typingInterval = setInterval(() => {
      alternatingText.value = alternatingText.value === "M" ? "^" : "M";
    }, 500);
  }
};

// Stop alternating and reset text
const stopAlternating = () => {
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
  alternatingText.value = "M";
};
</script>

<template>
  <!-- Edit Modal -->
  <div v-if="isEditModalOpen" class="modal-overlay">
    <div class="modal">
      <h2>Edit Start Time</h2>
      <input type="datetime-local" v-model="newStartTime" class="input" />
      <div class="modal-buttons">
        <button @click="isEditModalOpen = false" class="button secondary">Cancel</button>
        <button @click="submitEdit" class="button">OK</button>
      </div>
    </div>
  </div>
  <!-- Confirmation Modal -->
  <div v-if="isConfirmModalOpen" class="modal-overlay" id="confirm">
    <div class="modal">
      <h2>Confirm Change</h2>
      <p>Are you sure you want to update your fast start time to:<br><strong>{{ newStartTime }}</strong>?</p>
      <div class="modal-buttons">
        <button @click="isConfirmModalOpen = false" class="button secondary">Cancel</button>
        <button @click="confirmEditStartTime" class="button">Confirm</button>
      </div>
    </div>
  </div>
  <!-- Loading Overlay -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-spinner"></div>
  </div>
  <div class="container">
    <div class="left">
      <div class="header">
        <h1>Fast{{ alternatingText }}8</h1>
        <div class="protocol-label">
          {{ fastingSettings.protocol }}
        </div>
      </div>
      <p class="welcome">Welcome <b>{{ userName }}</b>!</p>

      <!-- Recommended windows section -->
      <div class="recommended-windows" v-if="!startTime">
        <h3>Recommended Windows</h3>
        <div class="window-info">
          <div class="window-section">
            <h4>Current Eating Window</h4>
            <p class="time-range eating">
              {{ formatTime(recommendedWindows.eatingWindow.start) }} -
              {{ formatTime(recommendedWindows.eatingWindow.end) }}
            </p>
            <p class="window-duration">{{ fastingSettings.eatingHours }} hours</p>
            <p class="window-tip">Make sure to eat nutrient-dense foods during this window</p>
          </div>
          <div class="window-section">
            <h4>Next Fasting Window</h4>
            <p class="time-range fasting">
              {{ formatTime(recommendedWindows.nextFast.start) }} -
              {{ formatTime(recommendedWindows.nextFast.end) }}
            </p>
            <p class="window-duration">{{ fastingSettings.fastingHours }} hours</p>
            <p class="window-tip">Stay hydrated and keep busy during your fast</p>
          </div>
        </div>
        <div class="action-buttons">
          <button class="button" @click="toggleFast">Start Fast</button>
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
          <button class="button" @click="toggleFast">Edit</button>
          <button class="button stop" :class="{ disabled: toggleDisabled }" @click="stopFast">
            End Fast
          </button>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  background: linear-gradient(135deg, var(--dark) 0%, #1a1f2e 100%);
  box-sizing: border-box;
}

.left {
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-sizing: border-box;
  padding: 0 16px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: nowrap;
  gap: 12px;
}

h1 {
  color: var(--mint);
  margin: 0;
  font-size: clamp(1.5em, 5vw, 2em);
  transition: transform 0.3s ease-in-out;
  white-space: nowrap;
}

h1:hover {
  transform: scale(1.05);
}

.protocol-label {
  background: rgba(0, 255, 200, 0.1);
  border: 1px solid var(--mint);
  color: var(--mint);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: clamp(0.8em, 3vw, 0.9em);
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.welcome {
  color: var(--mint);
  margin-bottom: 24px;
  font-size: clamp(1em, 4vw, 1.1em);
}

.recommended-windows {
  background: rgba(0, 255, 200, 0.05);
  border: 1px solid var(--mint);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-sizing: border-box;
  width: 100%;
}

.window-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  box-sizing: border-box;
}

.window-section {
  margin-bottom: 0;
  padding: 12px;
  background: rgba(0, 255, 200, 0.03);
  border-radius: 8px;
  transition: all 0.3s ease;
  box-sizing: border-box;
  width: 100%;
}

.window-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 200, 0.1);
}

.window-section h4 {
  color: var(--mint);
  margin: 0 0 12px 0;
  font-size: clamp(1em, 4vw, 1.1em);
  font-weight: 600;
  white-space: nowrap;
}

.time-range {
  font-size: clamp(0.9em, 3.5vw, 1.2em);
  font-weight: bold;
  color: var(--green);
  margin: 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 4px;
  box-sizing: border-box;
}

.time-range.eating::before {
  content: "🍽️";
  font-size: 1.4em;
  animation: eat 0.5s ease-in-out infinite;
}

.time-range.fasting::before {
  content: "⏳";
  font-size: 1.4em;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes eat {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
  }
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
  flex-wrap: nowrap;
}

.button.stop {
  background: #ff6b6b;
  border-color: #ff6b6b;
}

.button.stop:hover {
  background: #ff5252;
  border-color: #ff5252;
}

.button.disabled {
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
  font-size: clamp(1.5em, 8vw, 2em);
  font-weight: bold;
  color: var(--mint);
  margin: 0;
  white-space: nowrap;
}

.time-remaining {
  color: var(--mint);
  opacity: 0.8;
  margin-top: 8px;
  font-size: clamp(0.9em, 3vw, 1em);
  white-space: nowrap;
}

.window-tip {
  color: var(--mint);
  opacity: 0.7;
  font-size: clamp(0.8em, 3vw, 0.9em);
  margin-top: 8px;
  font-style: italic;
  padding: 0 4px;
  box-sizing: border-box;
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
  font-size: clamp(0.8em, 3vw, 0.9em);
  font-weight: 600;
  white-space: nowrap;
}

.motivational-message {
  color: var(--mint);
  font-style: italic;
  margin-top: 16px;
  font-size: clamp(0.9em, 3vw, 1.1em);
  text-align: center;
  padding: 0 12px;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--lite-dark);
  padding: clamp(16px, 4vw, 24px);
  border-radius: 12px;
  border: 2px solid var(--mint);
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  margin: 0 12px;
}

.modal h2 {
  color: var(--mint);
  margin: 0 0 20px 0;
  font-size: clamp(1.2em, 5vw, 1.4em);
  text-align: center;
}

.modal input[type="datetime-local"] {
  width: 100%;
  padding: 12px;
  margin-bottom: 20px;
  border: 1px solid var(--mint);
  border-radius: 8px;
  background: rgba(0, 255, 200, 0.05);
  color: var(--mint);
  font-size: clamp(0.9em, 3vw, 1em);
}

.modal input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.7;
}

.modal input[type="datetime-local"]:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 0 2px rgba(0, 255, 200, 0.2);
}

.modal-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal button {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--mint);
  background: var(--mint);
  color: var(--lite-dark);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.modal button:hover {
  background: var(--green);
  border-color: var(--green);
}

.modal button:last-child {
  background: transparent;
  color: var(--mint);
}

.modal button:last-child:hover {
  background: rgba(0, 255, 200, 0.1);
}

/* Confirmation modal specific styles */
#confirm .modal {
  text-align: center;
}

#confirm p {
  color: var(--mint);
  margin-bottom: 20px;
  line-height: 1.5;
}

#confirm .modal-buttons {
  justify-content: center;
}

/* Loading state */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  border: 4px solid rgba(0, 255, 200, 0.1);
  border-top: 4px solid var(--mint);
  border-radius: 50%;
  width: clamp(30px, 10vw, 40px);
  height: clamp(30px, 10vw, 40px);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Media query for small screens */
@media (max-width: 375px) {
  .left {
    padding: 0 12px;
  }

  .recommended-windows {
    padding: 12px;
  }

  .window-section {
    padding: 10px;
  }

  .time-range {
    font-size: 0.9em;
    padding: 0 2px;
  }

  .window-tip {
    font-size: 0.8em;
    padding: 0 2px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }

  .button {
    width: 100%;
  }
}
</style>
