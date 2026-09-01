import React from "react";
import { Box, Typography, Paper, Stack, LinearProgress, Chip } from "@mui/material";
import { BACKGROUND, STATUS, TEXT, ACCENT } from "../theme/theme";

function ConfidenceBreakdown({ confidenceBreakdown, mainConfidence, prediction }) {
    if (!confidenceBreakdown) {
        return (
            <Paper sx={{ p: 2, bgcolor: BACKGROUND.card, border: `1px solid ${BACKGROUND.border}` }}>
                <Typography sx={{ fontSize: "0.78rem", color: TEXT.muted }}>
                    Confidence: {(mainConfidence * 100).toFixed(1)}% (Ensemble Model)
                </Typography>
            </Paper>
        );
    }

    const { ensemble, xgboost, random_forest } = confidenceBreakdown;

    const submodels = [
        { key: "ensemble", label: "Ensemble Consensus", data: ensemble, color: ACCENT, isMain: true },
        { key: "xgboost", label: "XGBoost Classifier", data: xgboost, color: "#3B82F6", isMain: false },
        { key: "random_forest", label: "Random Forest", data: random_forest, color: "#8B5CF6", isMain: false },
    ];

    return (
        <Paper
            sx={{
                p: 2,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                borderRadius: 2,
                width: "100%",
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: TEXT.primary }}>
                        🎯 Confidence & Sub-Model Voter Breakdown
                    </Typography>
                    <Typography sx={{ fontSize: "0.7rem", color: TEXT.muted }}>
                        Multi-model consensus probability distribution
                    </Typography>
                </Box>

                <Chip
                    label={prediction || "NORMAL"}
                    size="small"
                    sx={{
                        fontWeight: 700,
                        fontSize: "0.68rem",
                        bgcolor: prediction === "ATTACK DETECTED" ? STATUS.criticalBg : STATUS.normalBg,
                        color: prediction === "ATTACK DETECTED" ? STATUS.critical : STATUS.normal,
                        border: `1px solid ${prediction === "ATTACK DETECTED" ? STATUS.criticalBorder : STATUS.normalBorder}`,
                    }}
                />
            </Stack>

            <Stack spacing={1.5}>
                {submodels.map((item) => {
                    const isAttack = item.data?.prediction === "ATTACK DETECTED";
                    const attackProb = item.data?.attack_probability ?? (isAttack ? item.data?.confidence : 1 - item.data?.confidence);
                    const pct = Math.round(attackProb * 100);

                    return (
                        <Box key={item.key}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.4 }}>
                                <Typography sx={{ fontSize: "0.75rem", fontWeight: item.isMain ? 700 : 500, color: TEXT.primary }}>
                                    {item.label}
                                </Typography>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography sx={{ fontSize: "0.72rem", color: isAttack ? STATUS.critical : STATUS.normal, fontWeight: 700 }}>
                                        {item.data?.prediction || "NORMAL"}
                                    </Typography>

                                    <Typography sx={{ fontSize: "0.72rem", color: TEXT.muted, fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                                        {pct}% Attack Prob
                                    </Typography>
                                </Stack>
                            </Stack>

                            <LinearProgress
                                variant="determinate"
                                value={pct}
                                sx={{
                                    height: item.isMain ? 8 : 6,
                                    bgcolor: BACKGROUND.hover,
                                    "& .MuiLinearProgress-bar": {
                                        bgcolor: isAttack ? STATUS.critical : STATUS.normal,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
}

export default ConfidenceBreakdown;
