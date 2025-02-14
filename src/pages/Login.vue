<!-- src/pages/Login.vue -->
<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../api"; // Ensure this function calls your API

const router = useRouter();
const email = ref("");
const password = ref("");
const loginMessage = ref("");

const login = async () => {
  if (!email.value || !password.value) {
    loginMessage.value = "Please enter email and password.";
    return;
  }

  try {
    const response = await loginUser(email.value, password.value);
    localStorage.setItem("userToken", response.token); // Store token
    router.push("/dashboard"); // Redirect after login
  } catch (error) {
    loginMessage.value = "Login failed: " + (error.response?.data?.error || error.message);
  }
};
</script>

<template>
  <div>
    <h2>Login</h2>
    <form @submit.prevent="login">
      <label>Email:</label>
      <input type="email" v-model="email" required />
      <label>Password:</label>
      <input type="password" v-model="password" required />
      <button type="submit">Login</button>
    </form>
    <p v-if="loginMessage">{{ loginMessage }}</p>
  </div>
</template>
