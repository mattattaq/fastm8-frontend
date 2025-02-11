const API_URL = "https://api.fastm8.app";

export async function checkServerStatus() {
    try {
        const response = await fetch(`${API_URL}/status`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching server status:", error);
        return null;
    }
}