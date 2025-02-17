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

// Track the alternation of "M" and "^"
const alternatingText = ref("M");

// Computed property for dynamic text effect
const dynamicText = computed(() => {
  const baseText = "FastM8";
  const mIndex = baseText.indexOf("M");
  return baseText.slice(0, mIndex) + alternatingText.value + baseText.slice(mIndex + 1);
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

// Handle input focus and blur
const handleFocus = () => {
  isFocused.value = true;
  startAlternating();
};

const handleBlur = () => {
  isFocused.value = false;
  stopAlternating();
};

// Handle login
const login = async () => {
  console.log("Logging in...")
  if (!email.value || !password.value) {
    loginMessage.value = "Please enter email and password.";
    return;
  }

  try {
    const response = await loginUser(email.value, password.value);

    // Store token and userId in localStorage
    localStorage.setItem("userToken", response.token);
    localStorage.setItem("userId", response.userId);
    localStorage.setItem("userName", response.username)
    // Redirect to dashboard
    router.push("/fastm8-frontend/dashboard").catch(err => {
      console.error("Router push failed:", err);
    });

  } catch (error) {
    loginMessage.value = "Login failed: " + (error.response?.data?.error || error.message);
  }
};
</script>

<template>
  <div>
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
h2 {
  font-size: 2rem;
  font-weight: bold;
  transition: transform 0.3s ease-in-out;
}

.eating {
  animation: eatM 0.5s ease-in-out forwards;
}

@keyframes eatM {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1) rotate(-10deg); }
}
</style>
