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
const fastingEndTime = computed(() => {
  if (!startTime.value) return null;
  const end = new Date(startTime.value);
  end.setHours(end.getHours() + fastingWindow);
  return end;
});
let interval = null;

// Add ref for mouth animation
const mouthChar = ref('M');

// Animate mouth
const animateMouth = () => {
  mouthChar.value = mouthChar.value === 'M' ? '^' : 'M';
};

// Add computed property for eating window
const eatingWindow = computed(() => {
  if (!logs.value || logs.value.length === 0) return null;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Find the most recent completed fast within the last 24 hours
  const recentFast = logs.value
    .filter(log => log.endTime && log.isComplete)
    .find(log => new Date(log.endTime) > twentyFourHoursAgo);

  if (!recentFast) return null;

  // Calculate eating window start (when the last fast ended)
  const eatingStart = new Date(recentFast.endTime);

  // Calculate eating window end (8 hours after start)
  const eatingEnd = new Date(eatingStart);
  eatingEnd.setHours(eatingStart.getHours() + 8);

  return {
    start: eatingStart,
    end: eatingEnd
  };
});

// Get settings for time format
const { settings } = useSettings();

// Add a computed property to access 'protocol' safely
const protocol = computed(() => {
  // Ensure settings.value is available
  if (!settings.value) {
    console.warn('Settings are not yet available.');
    return 'N/A'; // Fallback value
  }
  const protocolValue = settings.value.protocol;
  if (!protocolValue) {
    console.warn('Protocol not found in settings, using default.');
    return 'N/A'; // Default fallback value
  }
  return protocolValue;
});
console.log(protocol.value, "protocol");
// Update formatted eating window times to respect 24-hour setting
const formattedEatingWindow = computed(() => {
  if (!eatingWindow.value) return null;

  const formatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !settings.use24HourFormat
  };

  const weekdayOptions = {
    weekday: 'short'
  };

  const startDate = eatingWindow.value.start;
  const endDate = eatingWindow.value.end;

  return {
    start: `${startDate.toLocaleString('en-US', weekdayOptions)} ${startDate.toLocaleString('en-US', formatOptions)}`,
    end: `${endDate.toLocaleString('en-US', weekdayOptions)} ${endDate.toLocaleString('en-US', formatOptions)}`
  };
});

// Add logs ref to store the fetched logs
const logs = ref([]);

// Fetch open logs when the dashboard loads
const fetchOpenFastLogs = async () => {
  if (!token || !userId) {
    console.error("No user token or ID found.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/open-logs?userId=${userId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });

    const data = await response.json();
    logs.value = data;  // Store all logs
    console.log("Open logs data: ", data);

    if (response.ok && data.length > 0) {
      // Check for the most recent log with no end time (open fast)
      const openLog = data.find(log => !log.endTime);
      console.log("Current open log:", openLog);

      if (openLog) {
        localStorage.setItem("fastLogId", openLog.id);
        startTime.value = new Date(openLog.startTime);
      } else {
        localStorage.removeItem("fastLogId");
        startTime.value = null;
      }
    } else {
      localStorage.removeItem("fastLogId");
      startTime.value = null;
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
  interval = setInterval(() => {
    updateProgress();
    animateMouth();
  }, 500);

});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});

const stopFast = async () => {
  if (!fastLogId || toggleDisabled.value) {
    console.log("Button is disabled or fastLogId is invalid.");
    return;
  }
  const endTime = new Date().toISOString();
  console.log("stopping fast");
  console.log(fastLogId, "fastLogId");
  console.log(toggleDisabled.value, "toggleDisabled");
  console.log(startTime.value, "startTime");
  console.log(endTime.value, "endTime");
  try {
    await editLogs(
      [parseInt(fastLogId)],
      [{
        endTime: endTime,
        isComplete: true
      }],
      token
    );

    // Reset fastLogId after successful update
    localStorage.removeItem("fastLogId");
    await fetchOpenFastLogs(); // Refresh logs
  } catch (error) {
    console.error("Error updating logs:", error);
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
const toggleDisabled = computed(() => fastLogId === null);


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
    <h1>Fast<span class="mouth">{{ mouthChar }}</span>8</h1>
    <p>Welcome <b>{{ userName }}</b>! <span v-if="protocol" class="protocol-label">{{ protocol }}</span></p>


    <div v-if="startTime">
      <p>You started your fast on <strong>{{ formattedStartTime }}</strong></p>
      <ProgressCircle :progress="progress" />
      <p>{{ elapsedTime.hours }}:{{ elapsedTime.minutes }}:{{ elapsedTime.seconds }}</p>
      <p class="sub"><b>Endtime:</b> {{ formattedEndTime }}</p>
      <div class="action-buttons">
        <button class="button" @click="toggleFast">Edit</button>
        <button class="button stop" @click="stopFast">
          End Fast
        </button>
      </div>
    </div>
    <div v-else>
      <h2>Recommended Windows</h2>
      <div class="recommended-windows">
        <div class="window-section">
          <h3>Current Eating Window</h3>
          <div class="window-content">
            <div class="time-range eating">
              {{ formattedEatingWindow?.start }} - {{ formattedEatingWindow?.end }}
            </div>
            <div v-if="fastingSettings" class="window-duration">{{ fastingSettings.eatingHours }} hours</div>
            <p class="message">Make sure to eat nutrient-dense foods during this window</p>
          </div>
        </div>

        <div class="window-section">
          <h3>Next Fasting Window</h3>
          <div class="window-content">
            <div class="time-range fasting">
              <template v-if="formattedEatingWindow">
                {{ formattedEatingWindow.end }} - {{ formattedEatingWindow.start }}
              </template>
              <template v-else>
                Not available
              </template>
            </div>
            <div v-if="fastingSettings" class="window-duration">{{ fastingSettings.fastingHours }} hours</div>
            <p class="message">Stay hydrated and keep busy during your fast</p>
          </div>
        </div>

        <button class="start-fast" @click="toggleFast">Start Fast</button>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style scoped>
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

h1 {
  font-size: clamp(2em, 8vw, 2.5em);
  margin-bottom: 1rem;
  color: var(--mint);
}

.window-section {
  margin: 1rem 0;
  transition: all 0.3s ease;
  box-sizing: border-box;
  width: 100%;
}

.window-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 200, 0.1);
}

.window-section h3 {
  color: var(--mint);
  margin: 0 0 12px 0;
  font-size: clamp(1em, 4vw, 1.1em);
  font-weight: 600;
  white-space: nowrap;
}

.window-content {
  background: rgba(14, 27, 32, 0.5);
  border-radius: 8px;
  padding: 1rem;
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
  text-wrap: auto;
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

.start-fast {
  width: 100%;
  max-width: 300px;
  background: rgba(149, 243, 217, 0.1);
  border: 1px solid #95f3d9;
  color: #95f3d9;
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1em;
  font-weight: 500;
}

.start-fast:hover {
  background: rgba(149, 243, 217, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(149, 243, 217, 0.2);
}

.icon {
  font-size: 1.2em;
  margin-right: 0.5rem;
  vertical-align: middle;
}

.mouth {
  display: inline-block;
}

.message {
  color: #7a8b99;
  font-style: italic;
  font-size: 0.95em;
  margin-top: 0.8rem;
  line-height: 1.4;
}
</style>
