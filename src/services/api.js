const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/fastm8-frontend";

export const deleteLog = async (logId) => {
  try {
    const userId = localStorage.getItem("userId");
    const payload = {
      logIds: [logId],
    };
    console.log("Deleting log with payload:", payload);
    console.log("userId:", userId);

    const response = await fetch(`${API_BASE_URL}/api/logs?userId=${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server response:", errorText);
      throw new Error("Failed to delete log");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting log:", error);
    throw error;
  }
};

export const getLogs = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/logs`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch logs");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching logs:", error);
    throw error;
  }
};
