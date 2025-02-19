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

export const editLogs = async (logIds, edits, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs/edit`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ logIds, edits }),
    });

    const data = await response.json();

    if (response.ok) {
      return data; // Return the data to the caller
    } else {
      throw new Error(data.error || "Failed to update logs.");
    }
  } catch (error) {
    console.error("Error updating logs:", error);
    throw error; // Throw the error to be handled by the caller
  }
};
