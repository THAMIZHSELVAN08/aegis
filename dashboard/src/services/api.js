import axios from "axios";
import { io } from "socket.io-client";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api"
});

export const getLiveReading = async (params = {}) => {
    const response = await API.get("/live-reading", { params });
    return response.data;
};

export const getModelMetrics = async () => {
    const response = await API.get("/model-metrics");
    return response.data;
};

export const getContingencyAnalysis = async () => {
    const response = await API.get("/contingency-analysis");
    return response.data;
};

export const getHistory = async (limit = 50) => {
    const response = await API.get("/history", { params: { limit } });
    return response.data;
};

/**
 * Creates and returns a Socket.IO connection to the backend.
 * The socket base URL is derived from REACT_APP_API_URL by stripping the /api suffix.
 */
export const createSocket = () => {
    const apiUrl = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000/api";
    const socketUrl = apiUrl.replace(/\/api\/?$/, "");
    return io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
    });
};