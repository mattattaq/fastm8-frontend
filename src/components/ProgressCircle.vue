<template>
    <div class="progress-circle-container">
      <!-- SVG for the full circle -->
      <svg class="progress-circle" viewBox="0 0 100 100">
        <!-- Background arc (the full circle) -->
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="#e6e6e6"
          stroke-width="10"
          fill="none"
        />
        <!-- Progress arc (dynamic part) -->
        <circle
          cx="50"
          cy="50"
          r="45"
          :stroke="progressCircleColor"
          stroke-width="10"
          fill="none"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="dashOffset"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <!-- Display progress percentage inside the circle -->
      <p class="progress-text">{{ displayProgress }}%</p>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  // Props: progress percentage
  const props = defineProps({
    progress: {
      type: Number,
      required: true,
    },
  });
  
  // Set the color of the progress circle (blue if elapsed past fasting end time)
  const progressCircleColor = computed(() => {
    return props.progress === 100 ? 'blue' : '#4caf50'; // Blue if progress is 100%
  });
  
  // Calculate the circumference of the circle
  const radius = 45; // radius of the circle
  const circumference = computed(() => 2 * Math.PI * radius);
  
  // Calculate the stroke-dashoffset to create the progress effect
  const dashOffset = computed(() => {
    return circumference.value - (props.progress / 100) * circumference.value;
  });
  
  // Safely display the progress percentage and handle NaN cases
  const displayProgress = computed(() => {
    return isNaN(props.progress) ? 0 : Math.round(props.progress); // Fallback to 0 if NaN
  });
  </script>
  
  <style scoped>
  .progress-circle-container {
    position: relative;
    display: inline-block;
    width: 120px;
    height: 120px;
  }
  
  .progress-circle {
    transform: rotate(180deg); /* This rotates the whole SVG to start the stroke at the top */
    width: 100%;
    height: 100%;
  }
  
  .progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    font-weight: bold;
    color: #fff; /* Color of the percentage text */
  }
  
  circle {
    transition: stroke-dashoffset 0.5s ease;
  }
  </style>
  