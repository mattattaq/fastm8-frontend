import { ref, computed } from "vue";

const settings = ref({
  protocol: "16:8",
  fastingHours: 16,
  eatingHours: 8,
  use24HourFormat: false,
  preferredEatingWindow: {
    startHour: 10,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
  },
});

// Load settings from localStorage on initialization
const savedSettings = localStorage.getItem("fastingSettings");
if (savedSettings) {
  settings.value = JSON.parse(savedSettings);
}

export function useSettings() {
  const saveSettings = (newSettings) => {
    settings.value = { ...settings.value, ...newSettings };
    localStorage.setItem("fastingSettings", JSON.stringify(settings.value));
  };

  return {
    settings: computed(() => settings.value),
    saveSettings,
  };
}
