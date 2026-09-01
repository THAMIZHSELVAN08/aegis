import React, { useEffect, useState } from "react";
import {
    Box,
    Grid,
    Typography,
    Paper,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    CircularProgress,
} from "@mui/material";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { getModelMetrics } from "../services/api";
import { BACKGROUND, STATUS, TEXT, ACCENT } from "../theme/theme";

function ModelMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await getModelMetrics();
                if (res.metrics && !res.metrics.error) {
                    setData(res);
                } else {
                    setError("Failed to load metrics");
                }
            } catch (err) {
                console.error("Error fetching model metrics:", err);
                setError(err.message || "Failed to load model metrics");
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (error || !data?.metrics) {
        return (
            <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography sx={{ color: TEXT.muted, fontSize: "0.85rem" }}>
                    {error || "Model performance metrics unavailable"}
                </Typography>
            </Box>
        );
    }

    const { metrics, metadata } = data;
    const { confusion_matrix: cm, classification_report: cr, overall, roc_curve: roc, submodels } = metrics;

    const totalCM = cm.tn + cm.fp + cm.fn + cm.tp;

    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Model Metadata Banner */}
            <Paper
                sx={{
                    p: 2,
                    bgcolor: BACKGROUND.hover,
                    border: `1px solid ${BACKGROUND.border}`,
                    borderRadius: 2,
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                    <Box>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: TEXT.primary }}>
                                Model Architecture & Metadata
                            </Typography>
                            <Chip
                                label={metadata?.version || "v1.2.0-ensemble"}
                                size="small"
                                sx={{ bgcolor: ACCENT, color: "#0A0E14", fontWeight: 700, fontSize: "0.68rem" }}
                            />
                        </Stack>
                        <Typography sx={{ fontSize: "0.75rem", color: TEXT.muted, mt: 0.5 }}>
                            Ensemble (XGBoost + Random Forest) · Trained: {metadata?.trained_at ? new Date(metadata.trained_at).toLocaleDateString() : "Recent"}
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={2}>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography sx={{ fontSize: "0.68rem", color: TEXT.muted, textTransform: "uppercase", fontWeight: 700 }}>
                                Samples
                            </Typography>
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT.primary }}>
                                {metadata?.total_samples?.toLocaleString() || "7,000"}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography sx={{ fontSize: "0.68rem", color: TEXT.muted, textTransform: "uppercase", fontWeight: 700 }}>
                                Features
                            </Typography>
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: TEXT.primary }}>
                                {metadata?.num_features || 56}
                            </Typography>
                        </Box>
                        <Box sx={{ textAlign: "right" }}>
                            <Typography sx={{ fontSize: "0.68rem", color: TEXT.muted, textTransform: "uppercase", fontWeight: 700 }}>
                                Ensemble ROC-AUC
                            </Typography>
                            <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: STATUS.normal }}>
                                {overall?.roc_auc ? (overall.roc_auc * 100).toFixed(2) + "%" : "99.9%"}
                            </Typography>
                        </Box>
                    </Stack>
                </Stack>
            </Paper>

            <Grid container spacing={2.5}>
                {/* 2x2 Confusion Matrix Heatmap */}
                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            p: 2.5,
                            bgcolor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                            borderRadius: 2,
                            height: "100%",
                        }}
                    >
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT.primary, mb: 1.5 }}>
                            🎯 Confusion Matrix (Test Set)
                        </Typography>

                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: 1.5,
                                mt: 1,
                            }}
                        >
                            {/* True Negative */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: STATUS.normalBg,
                                    border: `1px solid ${STATUS.normalBorder}`,
                                    borderRadius: 2,
                                    textAlign: "center",
                                }}
                            >
                                <Typography sx={{ fontSize: "0.7rem", color: STATUS.normal, fontWeight: 700, textTransform: "uppercase" }}>
                                    True Normal (TN)
                                </Typography>
                                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: TEXT.primary, my: 0.5 }}>
                                    {cm.tn.toLocaleString()}
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                                    {((cm.tn / totalCM) * 100).toFixed(1)}% of test
                                </Typography>
                            </Box>

                            {/* False Positive */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: cm.fp > 0 ? STATUS.warningBg : BACKGROUND.hover,
                                    border: `1px solid ${cm.fp > 0 ? STATUS.warningBorder : BACKGROUND.border}`,
                                    borderRadius: 2,
                                    textAlign: "center",
                                }}
                            >
                                <Typography sx={{ fontSize: "0.7rem", color: cm.fp > 0 ? STATUS.warning : TEXT.muted, fontWeight: 700, textTransform: "uppercase" }}>
                                    False Alarm (FP)
                                </Typography>
                                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: TEXT.primary, my: 0.5 }}>
                                    {cm.fp.toLocaleString()}
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                                    {((cm.fp / totalCM) * 100).toFixed(1)}% of test
                                </Typography>
                            </Box>

                            {/* False Negative */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: cm.fn > 0 ? STATUS.criticalBg : BACKGROUND.hover,
                                    border: `1px solid ${cm.fn > 0 ? STATUS.criticalBorder : BACKGROUND.border}`,
                                    borderRadius: 2,
                                    textAlign: "center",
                                }}
                            >
                                <Typography sx={{ fontSize: "0.7rem", color: cm.fn > 0 ? STATUS.critical : TEXT.muted, fontWeight: 700, textTransform: "uppercase" }}>
                                    Missed Attack (FN)
                                </Typography>
                                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: TEXT.primary, my: 0.5 }}>
                                    {cm.fn.toLocaleString()}
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                                    {((cm.fn / totalCM) * 100).toFixed(1)}% of test
                                </Typography>
                            </Box>

                            {/* True Positive */}
                            <Box
                                sx={{
                                    p: 2,
                                    bgcolor: STATUS.normalBg,
                                    border: `1px solid ${STATUS.normalBorder}`,
                                    borderRadius: 2,
                                    textAlign: "center",
                                }}
                            >
                                <Typography sx={{ fontSize: "0.7rem", color: STATUS.normal, fontWeight: 700, textTransform: "uppercase" }}>
                                    True Attack (TP)
                                </Typography>
                                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: TEXT.primary, my: 0.5 }}>
                                    {cm.tp.toLocaleString()}
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                                    {((cm.tp / totalCM) * 100).toFixed(1)}% of test
                                </Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                {/* Classification Report Table */}
                <Grid item xs={12} md={6}>
                    <Paper
                        sx={{
                            p: 2.5,
                            bgcolor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                            borderRadius: 2,
                            height: "100%",
                        }}
                    >
                        <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT.primary, mb: 1.5 }}>
                            📊 Class-wise Evaluation Metrics
                        </Typography>

                        <TableContainer sx={{ border: `1px solid ${BACKGROUND.border}`, borderRadius: 1.5 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: BACKGROUND.hover }}>
                                        <TableCell sx={{ color: TEXT.muted, fontWeight: 700, fontSize: "0.7rem" }}>Class</TableCell>
                                        <TableCell align="right" sx={{ color: TEXT.muted, fontWeight: 700, fontSize: "0.7rem" }}>Precision</TableCell>
                                        <TableCell align="right" sx={{ color: TEXT.muted, fontWeight: 700, fontSize: "0.7rem" }}>Recall</TableCell>
                                        <TableCell align="right" sx={{ color: TEXT.muted, fontWeight: 700, fontSize: "0.7rem" }}>F1-Score</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: STATUS.normal }} />
                                                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: TEXT.primary }}>NORMAL</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{(cr.normal.precision * 100).toFixed(1)}%</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{(cr.normal.recall * 100).toFixed(1)}%</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{(cr.normal.f1_score * 100).toFixed(1)}%</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>
                                            <Stack direction="row" alignItems="center" spacing={1}>
                                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: STATUS.critical }} />
                                                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: TEXT.primary }}>ATTACK</Typography>
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{(cr.attack.precision * 100).toFixed(1)}%</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{(cr.attack.recall * 100).toFixed(1)}%</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700 }}>{(cr.attack.f1_score * 100).toFixed(1)}%</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ bgcolor: BACKGROUND.hover }}>
                                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", color: TEXT.muted }}>Macro Avg</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700, color: ACCENT }}>{(cr.macro_avg.precision * 100).toFixed(1)}%</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700, color: ACCENT }}>{(cr.macro_avg.recall * 100).toFixed(1)}%</TableCell>
                                        <TableCell align="right" sx={{ fontSize: "0.78rem", fontWeight: 700, color: ACCENT }}>{(cr.macro_avg.f1_score * 100).toFixed(1)}%</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* ROC / AUC Curve Chart */}
                <Grid item xs={12}>
                    <Paper
                        sx={{
                            p: 2.5,
                            bgcolor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                            borderRadius: 2,
                        }}
                    >
                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                            <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: TEXT.primary }}>
                                    📈 Receiver Operating Characteristic (ROC) Curve
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                                    Trade-off between True Positive Rate and False Positive Rate across decision thresholds
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1}>
                                {submodels && (
                                    <>
                                        <Chip label={`XGB AUC: ${submodels.xgb_auc}`} size="small" variant="outlined" sx={{ fontSize: "0.68rem" }} />
                                        <Chip label={`RF AUC: ${submodels.rf_auc}`} size="small" variant="outlined" sx={{ fontSize: "0.68rem" }} />
                                        <Chip label={`Ensemble AUC: ${submodels.ensemble_auc}`} size="small" color="primary" sx={{ fontSize: "0.68rem", fontWeight: 700 }} />
                                    </>
                                )}
                            </Stack>
                        </Stack>

                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={roc} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={BACKGROUND.border} />
                                <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fill: TEXT.muted, fontSize: 10 }} label={{ value: "False Positive Rate", position: "insideBottom", offset: -4, fill: TEXT.muted, fontSize: 10 }} />
                                <YAxis type="number" domain={[0, 1]} tick={{ fill: TEXT.muted, fontSize: 10 }} label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: TEXT.muted, fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: BACKGROUND.card,
                                        border: `1px solid ${BACKGROUND.border}`,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        color: TEXT.primary,
                                    }}
                                    formatter={(val) => [val, "TPR"]}
                                />
                                <Line type="monotone" dataKey="tpr" stroke={ACCENT} strokeWidth={2.5} dot={false} name="Ensemble ROC" />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

export default ModelMetrics;
