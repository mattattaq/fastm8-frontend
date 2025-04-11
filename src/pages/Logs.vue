<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import Footer from "../components/Footer.vue";
import DateRangeModal from "../components/DateRangeModal.vue";

const router = useRouter();
const token = localStorage.getItem("userToken") || null;
const userId = localStorage.getItem("userId") || null;
const userName = localStorage.getItem("userName");
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const logs = ref([]);
const selectedDuration = ref("Select date range");
const startDate = ref(null);
const endDate = ref(null);
const isLoading = ref(false);
const error = ref(null);
const showDateModal = ref(false);

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

const formatDateRange = (start, end) => {
  if (!start || !end) return "Select date range";
  const startFormatted = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endFormatted = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startFormatted} - ${endFormatted}`;
};

onMounted(() => {
  if (userId) {
    fetchLogs();
  }
});

onUnmounted(() => {
});
</script>

<template>
  <div class="logs-container">
    <h1>FastM8</h1>
    <p class="welcome">Welcome <b>{{ userName }}</b>!</p>
    <div class="controls">
      <p>Select date range for logs</p>
      <button class="date-select-button" @click="showDateModal = true">
        {{ selectedDuration }}
      </button>
    </div>

    <div class="container">
      <div v-if="isLoading" class="loading">Loading logs...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <div v-else-if="logs.length === 0" class="no-logs">No logs found for the selected period</div>
      <div v-else id="log-wrapper">
        <div v-for="(log, index) in logs" :key="index" class="log">
          <p>Start Time: <span class="highlight">{{ log.startTime }}</span></p>
          <p>End Time: <span class="highlight">{{ log.endTime }}</span></p>
          <p>Total Fasting Time: <span class="highlight">{{ log.totalTime }}</span></p>
        </div>
      </div>
    </div>
    <Footer />

    <DateRangeModal v-model:show="showDateModal" v-model:selectedRange="selectedDuration" v-model:startDate="startDate"
      v-model:endDate="endDate" @update:selectedRange="handleDurationChange" />
  </div>
</template>

<style>
.logs-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

#log-wrapper {
  width: 100%;
  height: 60vh;
  border: 2px solid var(--mint);
  border-radius: 8px;
  display: block;
  overflow-y: auto;
  padding: 16px;
  background: var(--lite-dark);
}

h1 {
  padding: 0;
  margin: 0 0 16px 0;
  color: var(--mint);
}

.welcome {
  margin-bottom: 24px;
  font-size: 1.1em;
}

.controls {
  margin-bottom: 24px;
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
  margin: 12px 0;
  text-align: left;
  padding: 12px;
  border-radius: 8px;
  transition: transform 0.2s ease;
}

.log:hover {
  transform: translateX(4px);
}

.highlight {
  font-weight: bold;
  color: var(--green);
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
</style>