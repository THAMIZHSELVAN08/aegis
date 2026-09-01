import React, { useCallback, useEffect, useState } from "react";
import { Grid, Box, Drawer, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useLocation } from "react-router-dom";

import Header from "../components/Header";
import AttackAlert from "../components/AttackAlert";
import KPICards from "../components/KPICards";
import DashboardCard from "../components/DashboardCard";

import VoltageChart from "../components/VoltageChart";
import PowerChart from "../components/PowerChart";
import PredictionHistory from "../components/PredictionHistory";
import BusTable from "../components/BusTable";

import GridTopology from "../components/topology/GridTopology";
import MainLayout from "../layouts/MainLayout";
import SimulationControls from "../components/SimulationControls";
import GridHealth from "../components/GridHealth";
import EventTimeline from "../components/EventTimeline";
import ShapExplanation from "../components/ShapExplanation";
import ModelMetrics from "../components/ModelMetrics";
import ConfidenceBreakdown from "../components/ConfidenceBreakdown";
import ContingencyAnalysis from "../components/ContingencyAnalysis";
import { getLiveReading } from "../services/api";
import { calculateGridHealth } from "../utils/gridHealth";

function Dashboard() {
    const location = useLocation();
    const [prediction, setPrediction] = useState("Loading...");
    const [confidence, setConfidence] = useState(0);

    const [reading, setReading] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [activePowerData, setActivePowerData] = useState([]);
    const [reactivePowerData, setReactivePowerData] = useState([]);
    const [history, setHistory] = useState([]);
    const [totalSamples, setTotalSamples] = useState(0);
    const [attackCount, setAttackCount] = useState(0);
    const [simulationAttack, setSimulationAttack] = useState(false);
    const [isRunning, setIsRunning] = useState(true);
    const [explanation, setExplanation] = useState(null);
    const [confidenceBreakdown, setConfidenceBreakdown] = useState(null);
    const [drawerExplanation, setDrawerExplanation] = useState(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchData = useCallback(async (forcedAttackType = null) => {
        try {
            const params = {};
            if (forcedAttackType) {
                params.inject = true;
                params.attack_type = forcedAttackType;
            } else if (simulationAttack) {
                params.inject = true;
            }

            const data = await getLiveReading(params);
            const reading = { ...data.reading };

            const currentPrediction = data.prediction;
            const currentConfidence = data.confidence;

            setPrediction(currentPrediction);
            setConfidence(currentConfidence);
            setReading(reading);
            setExplanation(data.explanation ?? null);
            setConfidenceBreakdown(data.confidence_breakdown ?? null);

            setHistory(prev => {
                const updated = [
                    {
                        time: new Date().toLocaleTimeString(),
                        prediction: currentPrediction,
                        confidence: currentConfidence,
                        explanation: data.explanation ?? null,
                        groundTruth: data.ground_truth_attack_type || (data.ground_truth_attack_injected ? "FDIA Attack" : "None"),
                        injected: data.ground_truth_attack_injected,
                        topFeature: data.explanation?.features?.[0]?.label ?? "N/A",
                    },
                    ...prev
                ];
                return updated.slice(0, 30);
            });

            setTotalSamples(prev => prev + 1);
            if (currentPrediction === "ATTACK DETECTED") {
                setAttackCount(prev => prev + 1);
            }

            const nowStr = new Date().toLocaleTimeString();
            const vVal = reading.vm_pu_bus0 ?? reading.vm_pu_bus1 ?? 1.0;
            const pVal = reading.p_mw_bus0 ?? reading.p_mw_bus1 ?? 0;
            const qVal = reading.q_mvar_bus0 ?? reading.q_mvar_bus1 ?? 0;

            setChartData(prev => {
                const updated = [...prev, { time: nowStr, voltage: parseFloat(vVal.toFixed(4)) }];
                return updated.slice(-20);
            });

            setActivePowerData(prev => {
                const updated = [...prev, { time: nowStr, value: parseFloat(pVal.toFixed(2)), p: parseFloat(pVal.toFixed(2)) }];
                return updated.slice(-20);
            });

            setReactivePowerData(prev => {
                const updated = [...prev, { time: nowStr, value: parseFloat(qVal.toFixed(2)), q: parseFloat(qVal.toFixed(2)) }];
                return updated.slice(-20);
            });
        } catch (err) {
            console.error(err);
        }
    }, [simulationAttack]);

    useEffect(() => {
        if (!isRunning) return;
        fetchData();
        const timer = setInterval(() => fetchData(), 2000);
        return () => clearInterval(timer);
    }, [isRunning, fetchData]);

    useEffect(() => {
        const hash = location.hash.replace("#", "");
        if (!hash) return;

        const timer = setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 150);

        return () => clearTimeout(timer);
    }, [location.pathname, location.hash]);

    // Single source of truth for bus health — shared by Header and GridHealth
    const { healthPct, healthyBuses, totalBuses } = calculateGridHealth(reading);

    return (
        <MainLayout>
            <Box id="dashboard" sx={{ scrollMarginTop: 100 }}>
                {/* Header */}
                <Header
                    gridHealth={healthPct}
                    healthyBuses={healthyBuses}
                    totalBuses={totalBuses}
                />

                {/* Attack Alert */}
                <AttackAlert
                    prediction={prediction}
                    confidence={confidence}
                />

                {/* KPI Cards */}
                <KPICards
                    prediction={prediction}
                    confidence={confidence}
                    totalSamples={totalSamples}
                    attackCount={attackCount}
                />

                {/* Simulation Controls */}
                <SimulationControls
                    running={isRunning}
                    onPause={() => setIsRunning(false)}
                    onResume={() => setIsRunning(true)}
                    onAttack={(type) => {
                        setSimulationAttack(true);
                        fetchData(type);
                    }}
                    onReset={() => {
                        setSimulationAttack(false);
                        setHistory([]);
                        setTotalSamples(0);
                        setAttackCount(0);
                        setPrediction("NORMAL");
                        setConfidence(0);
                        setChartData([]);
                        setActivePowerData([]);
                        setReactivePowerData([]);
                        setExplanation(null);
                        setDrawerOpen(false);
                        setDrawerExplanation(null);
                        fetchData();
                    }}
                />

                {/* Dashboard Grid */}
                <Grid container spacing={3}>
                    {/* Analytics Section */}
                    <Grid size={{ xs: 12, lg: 6 }} id="analytics" sx={{ scrollMarginTop: 100 }}>
                        <DashboardCard title="📈 Real-Time Voltage Stream (Bus 1)">
                            <VoltageChart data={chartData} />
                        </DashboardCard>
                    </Grid>

                    {/* Active Power */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <DashboardCard title="⚡ Active Power Load (Bus 1)">
                            <PowerChart
                                title="Active Power (MW)"
                                type="active"
                                data={activePowerData}
                            />
                        </DashboardCard>
                    </Grid>

                    {/* Reactive Power */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <DashboardCard title="🔋 Reactive Power Load (Bus 1)">
                            <PowerChart
                                title="Reactive Power (MVAR)"
                                type="reactive"
                                data={reactivePowerData}
                            />
                        </DashboardCard>
                    </Grid>

                    {/* Machine Learning Section */}
                    <Grid size={{ xs: 12, lg: 6 }} id="machine-learning" sx={{ scrollMarginTop: 100 }}>
                        <DashboardCard title="📜 ML Prediction Timeline">
                            <PredictionHistory
                                history={history}
                                onSelectEvent={(item) => {
                                    if (item.prediction === "ATTACK DETECTED" && item.explanation) {
                                        setDrawerExplanation(item);
                                        setDrawerOpen(true);
                                    }
                                }}
                            />
                        </DashboardCard>
                    </Grid>

                    {/* SHAP Explainability */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <DashboardCard title="🔍 Why This Prediction?">
                            <ShapExplanation
                                explanation={explanation}
                                prediction={prediction}
                            />
                        </DashboardCard>
                    </Grid>

                    {/* Sub-Model Confidence Calibration */}
                    <Grid size={{ xs: 12 }}>
                        <ConfidenceBreakdown
                            confidenceBreakdown={confidenceBreakdown}
                            mainConfidence={confidence}
                            prediction={prediction}
                        />
                    </Grid>

                    {/* Model Evaluation & Performance Metrics */}
                    <Grid size={{ xs: 12 }}>
                        <DashboardCard title="📊 Machine Learning Evaluation & Performance Metrics" height="auto">
                            <ModelMetrics />
                        </DashboardCard>
                    </Grid>

                    {/* SCADA Topology Section */}
                    <Grid size={{ xs: 12 }} id="topology" sx={{ scrollMarginTop: 100 }}>
                        <DashboardCard
                            title="⚡ IEEE 14 Bus Interactive SCADA Monitor"
                            height="auto"
                        >
                            <GridTopology
                                reading={reading}
                                prediction={prediction}
                            />
                        </DashboardCard>
                    </Grid>

                    {/* Bus Monitor Section */}
                    <Grid size={{ xs: 12 }} id="bus-monitor" sx={{ scrollMarginTop: 100 }}>
                        <DashboardCard
                            title="🚌 IEEE 14 Bus Telemetry Grid Monitor"
                            height="auto"
                        >
                            <BusTable reading={reading} />
                        </DashboardCard>
                    </Grid>

                    {/* Contingency Analysis Section */}
                    <Grid size={{ xs: 12 }} id="contingency">
                        <DashboardCard title="🛡️ Power Flow N-1 Contingency & Resilience Analysis" height="auto">
                            <ContingencyAnalysis />
                        </DashboardCard>
                    </Grid>

                    {/* Security Section */}
                    <Grid size={{ xs: 12, lg: 6 }} id="security" sx={{ scrollMarginTop: 100 }}>
                        <DashboardCard title="🛡️ Grid Security Health" height="auto" noPad>
                            <GridHealth reading={reading} />
                        </DashboardCard>
                    </Grid>

                    {/* Timeline Audit */}
                    <Grid size={{ xs: 12, lg: 6 }}>
                        <DashboardCard title="📜 Live Event Audit Stream" height={360}>
                            <EventTimeline history={history} />
                        </DashboardCard>
                    </Grid>
                </Grid>

                <Drawer
                    anchor="right"
                    open={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    PaperProps={{
                        sx: {
                            width: { xs: "100%", sm: 420 },
                            bgcolor: "var(--bg-card)",
                            borderLeft: "1px solid var(--border)",
                            p: 3,
                        },
                    }}
                >
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "1rem" }}>
                                Flagged Event Explanation
                            </Typography>
                            {drawerExplanation?.time && (
                                <Typography sx={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {drawerExplanation.time}
                                </Typography>
                            )}
                        </Box>
                        <IconButton onClick={() => setDrawerOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <ShapExplanation
                        explanation={drawerExplanation?.explanation}
                        prediction={drawerExplanation?.prediction}
                        compact
                    />
                </Drawer>
            </Box>
        </MainLayout>
    );
}

export default Dashboard;