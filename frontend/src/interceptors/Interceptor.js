import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
    headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
});

const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh_token");
    console.log("Refreshing token with refresh token:", refresh);
    try {
        const response = await axios.post("http://localhost:8000/api/token/refresh/", {
            refresh: refresh,
        });
        const { access } = response.data;
        console.log("New access token:", access);
        localStorage.setItem("access_token", access);
        api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        return true; // Successfully refreshed
    } catch (error) {
        console.error("Failed to refresh token", error.response || error);
        return false; // Failed to refresh


    }
};

// Add interceptor to retry on 401
api.interceptors.response.use(
    (response) => response, // Return the response if successful
    async (error) => {
        console.log("Interceptor detected error:", error.response?.status);
        if (error.response?.status === 401 && error.config && !error.config._retry) {
            console.log("Attempting token refresh...");
            error.config._retry = true;
            const refreshed = await refreshToken();
            if (refreshed) {
                error.config.headers["Authorization"] = `Bearer ${localStorage.getItem("access_token")}`;
                return api.request(error.config);
            }
            if (!refreshed) {
                // Redirect to login if refresh token is invalid or expired
                localStorage.clear();
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;