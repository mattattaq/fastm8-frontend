<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import Footer from "../components/Footer.vue";
import { useSettings } from '../stores/settings';

const router = useRouter();
const token = localStorage.getItem("userToken") || null;
const userId = localStorage.getItem("userId") || null;
const userName = localStorage.getItem("userName");
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const { settings, saveSettings } = useSettings();

// Initialize default settings
const defaultSettings = {
  use24HourFormat: false,
  preferredEatingWindow: {
    startTime: '08:00',
    endTime: '16:00'
  },
  fastingHours: 16,
  eatingHours: 8
};

const protocols = [
  {
    value: '16:8',
    label: '16:8 (16 hours fasting, 8 hours eating)',
    description: 'The most popular intermittent fasting method. Fast for 16 hours and eat during an 8-hour window. Great for beginners and sustainable long-term.',
    benefits: ['Improved insulin sensitivity', 'Weight management', 'Better digestion', 'Sustainable lifestyle']
  },
  {
    value: '18:6',
    label: '18:6 (18 hours fasting, 6 hours eating)',
    description: 'A moderate fasting approach. Fast for 18 hours with a 6-hour eating window. Good for those comfortable with 16:8 looking for more benefits.',
    benefits: ['Enhanced fat burning', 'Increased autophagy', 'Better focus', 'More time-efficient']
  },
  {
    value: '20:4',
    label: '20:4 (20 hours fasting, 4 hours eating)',
    description: 'An advanced fasting protocol. Fast for 20 hours with a 4-hour eating window. Best for experienced fasters seeking maximum benefits.',
    benefits: ['Maximum fat burning', 'Strong autophagy response', 'Deep ketosis', 'Time optimization']
  },
  {
    value: 'OMAD',
    label: 'OMAD (One Meal A Day)',
    description: 'The most intense daily fasting protocol. Eat one large, nutrient-dense meal per day. Recommended for experienced fasters only.',
    benefits: ['Simplified eating schedule', 'Maximum time efficiency', 'Deep metabolic benefits', 'Strong discipline building']
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Create your own fasting schedule. Choose fasting and eating windows that fit your lifestyle and goals.',
    benefits: ['Personalized approach', 'Flexible scheduling', 'Customizable to your needs']
  }
];

const selectedProtocol = ref('16:8');
const customFastingHours = ref(16);
const customEatingHours = ref(8);

const use24HourFormat = computed({
  get: () => settings.value.use24HourFormat,
  set: (value) => {
    settings.value.use24HourFormat = value;
  }
});

// Update settings save function
const saveSettingsToServer = () => {
  try {
    // Update settings based on selected protocol
    if (selectedProtocol.value === 'custom') {
      settings.value.fastingHours = customFastingHours.value;
      settings.value.eatingHours = customEatingHours.value;
    } else {
      const [fasting, eating] = selectedProtocol.value.split(':').map(Number);
      settings.value.fastingHours = fasting;
      settings.value.eatingHours = eating;
    }

    // Save to localStorage using the store
    saveSettings(settings.value);
    console.log("Settings saved successfully");
  } catch (error) {
    console.error("Error saving settings:", error);
  }
};

// Logout function
const logout = () => {
  localStorage.clear(); // Clears all stored data, including userToken and userId
  router.push("/fastm8-frontend/login"); // Redirect to login
};

// Initialize settings with default values if they don't exist
onMounted(() => {
  const savedSettings = localStorage.getItem('fastingSettings');
  if (savedSettings) {
    const parsedSettings = JSON.parse(savedSettings);
    // Merge saved settings with defaults to ensure all properties exist
    settings.value = {
      ...defaultSettings,
      ...parsedSettings,
      preferredEatingWindow: {
        ...defaultSettings.preferredEatingWindow,
        ...(parsedSettings.preferredEatingWindow || {})
      }
    };
  } else {
    settings.value = defaultSettings;
  }
  saveSettings(settings.value);
});

onUnmounted(() => {
});

</script>

<template>
  <div class="settings-container">
    <h1>FastM8</h1>
    <p class="welcome">Welcome <b>{{ userName }}</b>!</p>

    <div class="settings-section">
      <h2>Fasting Settings</h2>
      <div class="form-group">
        <label>Select Fasting Protocol</label>
        <select v-model="selectedProtocol" class="protocol-select">
          <option v-for="protocol in protocols" :key="protocol.value" :value="protocol.value">
            {{ protocol.label }}
          </option>
        </select>
      </div>

      <div class="setting-item">
        <label>
          <input type="checkbox" v-model="use24HourFormat" />
          Use 24-hour time format
        </label>
      </div>

      <div class="protocol-info">
        <h3>{{protocols.find(p => p.value === selectedProtocol)?.label}}</h3>
        <p class="description">{{protocols.find(p => p.value === selectedProtocol)?.description}}</p>
        <div class="benefits">
          <h4>Key Benefits:</h4>
          <ul>
            <li v-for="(benefit, index) in protocols.find(p => p.value === selectedProtocol)?.benefits" :key="index">
              {{ benefit }}
            </li>
          </ul>
        </div>
      </div>

      <div v-if="selectedProtocol === 'custom'" class="custom-settings">
        <div class="form-group">
          <label>Fasting Hours</label>
          <input type="number" v-model="customFastingHours" min="1" max="23" class="number-input">
        </div>
        <div class="form-group">
          <label>Eating Hours</label>
          <input type="number" v-model="customEatingHours" min="1" max="23" class="number-input">
        </div>
      </div>

      <div class="form-group" v-if="settings.value?.preferredEatingWindow">
        <label>Default Eating Window</label>
        <div class="time-input-group">
          <div class="time-input">
            <label>Start Time</label>
            <input type="time" v-model="settings.value.preferredEatingWindow.startTime"
              :class="{ 'time-input-field': true }">
          </div>
          <div class="time-input">
            <label>End Time</label>
            <input type="time" v-model="settings.value.preferredEatingWindow.endTime"
              :class="{ 'time-input-field': true }">
          </div>
        </div>
      </div>

      <button @click="saveSettingsToServer" class="save-button">Save Settings</button>
    </div>
  </div>
  <Footer />
</template>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

.settings-section {
  background: var(--lite-dark);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--mint);
  margin-bottom: 20px;
}

h2 {
  color: var(--mint);
  margin: 0 0 20px 0;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: var(--mint);
}

.protocol-select {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--mint);
  background: var(--lite-dark);
  color: var(--mint);
  font-size: 1em;
}

.number-input {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--mint);
  background: var(--lite-dark);
  color: var(--mint);
  font-size: 1em;
}

.custom-settings {
  margin-top: 16px;
  padding: 16px;
  border: 1px solid var(--mint);
  border-radius: 8px;
}

.save-button {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  background: var(--mint);
  border: 1px solid var(--mint);
  color: var(--lite-dark);
  font-size: 1em;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
}

.save-button:hover {
  background: var(--green);
  border-color: var(--green);
}

.protocol-info {
  margin: 20px 0;
  padding: 20px;
  background: rgba(0, 255, 200, 0.05);
  border-radius: 8px;
  border: 1px solid var(--mint);
}

.protocol-info h3 {
  color: var(--mint);
  margin: 0 0 16px 0;
  font-size: 1.2em;
  font-weight: 600;
}

.description {
  color: var(--mint);
  margin-bottom: 20px;
  line-height: 1.6;
  font-size: 1.05em;
}

.benefits {
  margin-top: 20px;
}

.benefits h4 {
  color: var(--mint);
  margin: 0 0 12px 0;
  font-size: 1.1em;
  font-weight: 600;
}

.benefits ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefits li {
  color: var(--mint);
  line-height: 1.4;
  padding-left: 0;
  position: relative;
}

.benefits li::before {
  display: none;
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: var(--mint);
}

.setting-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  background: var(--lite-dark);
  border: 1px solid var(--mint);
  border-radius: 4px;
  appearance: none;
  -webkit-appearance: none;
  position: relative;
  transition: all 0.2s ease;
}

.setting-item input[type="checkbox"]:checked {
  background: var(--mint);
  border-color: var(--mint);
}

.setting-item input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  color: var(--lite-dark);
  font-size: 14px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.setting-item input[type="checkbox"]:hover {
  background: rgba(0, 255, 200, 0.1);
}

.setting-item input[type="checkbox"]:checked:hover {
  background: var(--mint);
  opacity: 0.9;
}

.time-input-group {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.time-input {
  flex: 1;
}

.time-input label {
  display: block;
  margin-bottom: 4px;
  color: var(--mint);
  font-size: 0.9em;
}

.time-input-field {
  width: 100%;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--mint);
  background: rgba(0, 255, 200, 0.05);
  color: var(--mint);
}

.time-input-field::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.7;
}
</style>
