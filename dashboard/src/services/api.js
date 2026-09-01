import axios from "axios";

const API = axios.create({
    baseURL: "http://127.0.0.1:5000/api"
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