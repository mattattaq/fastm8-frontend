import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
console.log("API Base URL:", API_BASE_URL);

export const checkServerStatus = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/status`);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/login`, {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
