<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../api";

const router = useRouter();
const email = ref("");
const password = ref("");
const loginMessage = ref("");
const isFocused = ref(false);  // Track if any input field is focused
let typingInterval = null;  // Store the interval for alternating text

// To track the alternation of "M" and "^"
const alternatingText = ref("M"); // Initially "M"

// Computed property for dynamic text effect (Alternating M with ^)
const dynamicText = computed(() => {
  const baseText = "FastM8";
  const mIndex = baseText.indexOf("M");
  
  // Replace the "M" with the alternating value
  return baseText.slice(0, mIndex) + alternatingText.value + baseText.slice(mIndex + 1);
});

// Function to start alternating the text
const startAlternating = () => {
  // Start alternating between "M" and "^" every 500ms
  if (!typingInterval) {  // Prevent setting multiple intervals
    typingInterval = setInterval(() => {
      alternatingText.value = alternatingText.value === "M" ? "^" : "M";
    }, 500);
  }
};

// Function to stop alternating the text
const stopAlternating = () => {
  if (typingInterval) {
    clearInterval(typingInterval); // Clear the interval
    typingInterval = null; // Reset the interval variable
  }
  alternatingText.value = "M"; // Reset to default "M" when stopped
};

// Function to handle input focus and blur events
const handleFocus = () => {
  isFocused.value = true;
  startAlternating();  // Start alternating when focused
};

const handleBlur = () => {
  isFocused.value = false;
  stopAlternating();  // Stop alternating when blurred
};

const login = async () => {
  if (!email.value || !password.value) {
    loginMessage.value = "Please enter email and password.";
    return;
  }

  try {
    const response = await loginUser(email.value, password.value);
    localStorage.setItem("userToken", response.token); // Store token
    router.push("/fastm8-frontend/dashboard"); // Redirect after login
  } catch (error) {
    loginMessage.value = "Login failed: " + (error.response?.data?.error || error.message);
  }
};
</script>

<template>
  <div>
    <!-- Dynamic text effect on h2 -->
    <h2 :class="{'eating': isFocused}">{{ dynamicText }}</h2>

    <form @submit.prevent="login">
      <label>Email:</label>
      <input type="email" v-model="email" @focus="handleFocus" @blur="handleBlur" required />
      <label>Password:</label>
      <input type="password" v-model="password" @focus="handleFocus" @blur="handleBlur" required />
      <button type="submit">Login</button>
    </form>

    <p v-if="loginMessage">{{ loginMessage }}</p>
  </div>
</template>

<style scoped>
/* Add some basic styles for h2 */
h2 {
  font-size: 2rem;
  font-weight: bold;
  transition: transform 0.3s ease-in-out;
}

.eating {
  animation: eatM 0.5s ease-in-out forwards;
}

/* CSS keyframe animation for the "eating" effect */
@keyframes eatM {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1) rotate(-10deg);
  }
}
</style>
