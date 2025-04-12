<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import Footer from "../components/Footer.vue";
import DateRangeModal from "../components/DateRangeModal.vue";
import EditLogModal from "../components/EditLogModal.vue";
import WeeklyFastingSummary from "../components/WeeklyFastingSummary.vue";

const router = useRouter();
const token = localStorage.getItem("userToken") || null;
const userId = localStorage.getItem("userId") || null;
const userName = localStorage.getItem("userName");
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const logs = ref([]);
const selectedDuration = ref("Last 7 Days");
const startDate = ref(null);
const endDate = ref(null);
const isLoading = ref(false);
const error = ref(null);
const showDateModal = ref(false);
const showEditModal = ref(false);
const selectedLog = ref(null);
const fastingSettings = ref({
  protocol: '16:8',
  fastingHours: 16,
  eatingHours: 8,
  use24HourFormat: false
});
const isDeleteModalOpen = ref(false);
const logToDelete = ref(null);

const activeFasts = computed(() => {
  return logs.value.filter(log => !log.endTime).length;
});

// Logout function
const logout = () => {
  localStorage.clear();
  router.push("/fastm8-frontend/login");
};

const fetchLogs = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    let url = `${API_BASE_URL}/api/open-logs?userId=${userId}`;

    // Add date range if both start and end dates are selected
    if (startDate.value && endDate.value) {
      const startISO = startDate.value.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const endISO = endDate.value.toISOString().split('T')[0];     // Format: YYYY-MM-DD
      url += `&startDate=${startISO}&endDate=${endISO}`;
    }

    console.log('Fetching logs from:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch logs: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('Received data:', data);
    logs.value = data;
  } catch (err) {
    console.error('Error details:', err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleDurationChange = (range) => {
  selectedDuration.value = range;
  fetchLogs();
};

const calculateFastingTime = (startTime, endTime) => {
  if (!startTime) return null;
  if (!endTime) return 'In Progress';

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Active';
  const date = new Date(dateString);
  const settings = JSON.parse(localStorage.getItem('fastingSettings')) || fastingSettings.value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: !settings.use24HourFormat
  });
};

const handleEdit = (log) => {
  selectedLog.value = log;
  showEditModal.value = true;
};

const saveEdit = async (editData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/edit`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editData)
    });

    if (!response.ok) {
      throw new Error('Failed to update log');
    }

    // Refresh logs after successful edit
    await fetchLogs();
  } catch (err) {
    console.error('Error updating log:', err);
    error.value = err.message;
  }
};

const handleDelete = async () => {
  if (!logToDelete.value) return;

  try {
    const userId = localStorage.getItem("userId");
    const response = await fetch(`${API_BASE_URL}/api/logs?userId=${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logIds: [logToDelete.value.id]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to delete log');
    }

    // Remove the deleted log from local state
    logs.value = logs.value.filter(log => log.id !== logToDelete.value.id);
    isDeleteModalOpen.value = false;
    logToDelete.value = null;

    // Refresh logs to ensure we're in sync with the server
    await fetchLogs();
  } catch (error) {
    console.error('Error deleting log:', error);
  }
};

const confirmDelete = (log) => {
  logToDelete.value = log;
  isDeleteModalOpen.value = true;
};

onMounted(() => {
  if (userId) {
    // Load fasting settings
    const savedSettings = localStorage.getItem('fastingSettings');
    if (savedSettings) {
      fastingSettings.value = JSON.parse(savedSettings);
    }

    // Set initial date range to last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6); // 6 days ago to include today

    startDate.value = sevenDaysAgo;
    endDate.value = today;

    fetchLogs();
  }
});

onUnmounted(() => {
});
</script>

<template>
  <div class="container">
    <h1>FastM8</h1>
    <p class="welcome">Welcome <b>{{ userName }}</b>!</p>
    <div class="controls">
      <div class="controls-row">
        <p>Select date range for logs</p>
        <button class="date-select-button" @click="showDateModal = true">
          {{ selectedDuration }}
        </button>
      </div>
      <div class="controls-row">
        <p>Current Protocol: {{ fastingSettings.protocol }}</p>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Loading logs...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else-if="logs.length === 0" class="no-logs">No logs found for the selected period</div>
    <div v-else>
      <WeeklyFastingSummary :logs="logs" :target-hours="fastingSettings.fastingHours" />
      <div id="log-wrapper">
        <div v-for="(log, index) in logs" :key="index"
          :class="['log', { 'active': !log.endTime, 'completed': log.endTime }]">
          <div class="log-header">
            <span class="status-badge" :class="{ 'active': !log.endTime, 'completed': log.endTime }">
              {{ !log.endTime ? 'Active' : 'Completed' }}
            </span>
            <button class="edit-button" @click="handleEdit(log)">Edit</button>
          </div>
          <p>Start Time: <span class="highlight">{{ formatDateTime(log.startTime) }}</span></p>
          <p>End Time: <span class="highlight">{{ formatDateTime(log.endTime) }}</span></p>
          <p>Total Fasting Time: <span class="highlight-time">{{ calculateFastingTime(log.startTime, log.endTime)
              }}</span></p>
        </div>
      </div>
    </div>
  </div>
  <Footer />

  <DateRangeModal v-model:show="showDateModal" v-model:selectedRange="selectedDuration" v-model:startDate="startDate"
    v-model:endDate="endDate" @update:selectedRange="handleDurationChange" />

  <!-- Delete Confirmation Modal -->
  <div v-if="isDeleteModalOpen" class="modal-overlay">
    <div class="modal">
      <h2>Delete Active Fast</h2>
      <p>Are you sure you want to delete this active fasting log? This action cannot be undone.</p>
      <div class="modal-buttons">
        <button @click="isDeleteModalOpen = false" class="button secondary">Cancel</button>
        <button @click="handleDelete" class="button delete">Delete</button>
      </div>
    </div>
  </div>

  <EditLogModal v-model:show="showEditModal" :log="selectedLog" @save="saveEdit" @delete="(log) => {
    if (!log.endTime) {
      confirmDelete(log);
    }
  }" />
</template>

<style>
#log-wrapper {
  width: auto;
  height: 60vh;
  border: 2px solid var(--mint);
  border-radius: 8px;
  display: block;
  overflow-y: auto;
  padding: 16px;
  background: var(--lite-dark);
  margin-top: 8px;
}

h1 {
  padding: 0;
  margin: 0 0 16px 0;
  color: var(--mint);
}

.welcome {
  font-size: 1.1em;
}


.controls-row {
  margin-bottom: 8px;
}

.date-select-button {
  margin-top: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid var(--mint);
  background: var(--lite-dark);
  color: var(--mint);
  cursor: pointer;
  font-size: 1em;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
}

.date-select-button:hover {
  background: rgba(0, 255, 200, 0.1);
}

.log {
  width: calc(100% - 24px);
  background: rgba(255, 255, 255, 0.05);
  min-height: 50px;
  margin: 8px 0;
  text-align: left;
  padding: 12px;
  border-radius: 8px;
  transition: transform 0.2s ease;
  position: relative;
  box-sizing: border-box;
}

.log:hover {
  transform: translateX(4px);
}

.log.active {
  border-left: 4px solid var(--mint);
  background: rgba(0, 255, 200, 0.05);
}

.log.completed {
  border-left: 4px solid var(--green);
  background: rgba(0, 255, 0, 0.05);
}

.log-header {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.status-badge.active {
  background: rgba(0, 255, 200, 0.2);
  color: var(--mint);
}

.status-badge.completed {
  background: rgba(0, 255, 0, 0.2);
  color: var(--green);
}

.highlight {
  font-weight: bold;
  color: var(--green);
  float: right;
}

.highlight-time {
  font-weight: bold;
  color: #ff6b35;
  float: right;
}

.loading,
.error,
.no-logs {
  text-align: center;
  padding: 20px;
  color: var(--mint);
}

.error {
  color: #ff6b6b;
}

/* Custom scrollbar */
#log-wrapper::-webkit-scrollbar {
  width: 8px;
}

#log-wrapper::-webkit-scrollbar-track {
  background: var(--lite-dark);
}

#log-wrapper::-webkit-scrollbar-thumb {
  background: var(--mint);
  border-radius: 4px;
}

#log-wrapper::-webkit-scrollbar-thumb:hover {
  background: var(--green);
}

.edit-button {
  padding: 4px 8px;
  border-radius: 4px;
  background: transparent;
  border: 1px solid var(--mint);
  color: var(--mint);
  cursor: pointer;
  font-size: 0.8em;
  transition: all 0.2s ease;
  min-width: 60px;
  text-align: center;
}

.edit-button:hover {
  background: rgba(0, 255, 200, 0.1);
}


/* Add spacing between WeeklyFastingSummary and log wrapper */
.WeeklyFastingSummary {
  margin-bottom: 16px;
}
</style>