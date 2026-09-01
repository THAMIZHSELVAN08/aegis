import React from "react";
import {
    Box,
    Typography,
    Chip,
    Stack,
} from "@mui/material";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    ReferenceLine,
} from "recharts";
import { BACKGROUND, STATUS, TEXT } from "../theme/theme";

function ShapExplanation({ explanation, prediction, compact = false }) {
    if (!explanation?.features?.length) {
        return (
            <Box sx={{ p: compact ? 2 : 3, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", color: TEXT.muted }}>
                    Waiting for model explanation data...
                </Typography>
            </Box>
        );
    }

    const isGlobal = explanation.method === "global_feature_importance";

    const chartData = explanation.features.map((item) => ({
        name: item.label,
        value: isGlobal
            ? Math.abs(item.importance ?? 0)
            : (item.shap_value ?? 0),
        direction: item.direction,
        feature: item.feature,
    }));

    const getBarColor = (direction) => {
        if (direction === "toward_attack" || direction === "informational") {
            return STATUS.critical;
        }
        if (direction === "toward_normal") {
            return STATUS.normal;
        }
        return TEXT.muted;
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}
            >
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: TEXT.primary }}>
                        Why this prediction?
                    </Typography>
                    <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted, mt: 0.3 }}>
                        {explanation.label}
                        {explanation.latency_ms != null ? ` · ${explanation.latency_ms} ms` : ""}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Chip
                        size="small"
                        label={isGlobal ? "Global" : "SHAP"}
                        sx={{
                            fontWeight: 700,
                            fontSize: "0.68rem",
                            bgcolor: BACKGROUND.hover,
                            color: TEXT.primary,
                        }}
                    />
                    {prediction && (
                        <Chip
                            size="small"
                            label={prediction}
                            sx={{
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                bgcolor: prediction === "ATTACK DETECTED"
                                    ? STATUS.criticalBg
                                    : STATUS.normalBg,
                                color: prediction === "ATTACK DETECTED"
                                    ? STATUS.critical
                                    : STATUS.normal,
                                border: `1px solid ${
                                    prediction === "ATTACK DETECTED"
                                        ? STATUS.criticalBorder
                                        : STATUS.normalBorder
                                }`,
                            }}
                        />
                    )}
                </Stack>
            </Stack>

            {!isGlobal && (
                <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: STATUS.critical }} />
                        <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                            Pushed toward ATTACK
                        </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: STATUS.normal }} />
                        <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted }}>
                            Pushed toward NORMAL
                        </Typography>
                    </Stack>
                </Stack>
            )}

            <ResponsiveContainer width="100%" height={compact ? 220 : 260}>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                >
                    <XAxis
                        type="number"
                        tick={{ fill: TEXT.muted, fontSize: 10, fontFamily: "var(--font-mono)" }}
                        stroke="var(--border)"
                        tickLine={false}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fill: TEXT.muted, fontSize: 10 }}
                        stroke="var(--border)"
                        tickLine={false}
                    />
                    <ReferenceLine x={0} stroke="var(--border)" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                            borderRadius: 8,
                            fontSize: 12,
                            color: TEXT.primary,
                        }}
                        formatter={(value, _name, entry) => {
                            const item = entry.payload;
                            if (isGlobal) {
                                return [value.toFixed(4), "Importance"];
                            }
                            return [
                                `${value >= 0 ? "+" : ""}${value.toFixed(4)}`,
                                item.direction === "toward_attack"
                                    ? "Toward ATTACK"
                                    : "Toward NORMAL",
                            ];
                        }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                        {chartData.map((entry, index) => (
                            <Cell key={index} fill={getBarColor(entry.direction)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}

export default ShapExplanation;
