import React from "react";
import { Box, Typography, Chip, Stack } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

function EventTimeline({ events = [], history = [] }) {
    const rawList = events.length > 0 ? events : history;

    return (
        <Box sx={{ height: "100%", overflow: "auto", pr: 0.5 }}>
            {rawList.length === 0 ? (
                <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography sx={{ fontSize: "0.85rem", color: TEXT.muted }}>
                        No audit stream events logged yet. Telemetry monitoring active.
                    </Typography>
                </Box>
            ) : (
                <Box
                    sx={{
                        position: "relative",
                        pl: 3.5,
                        "&::before": {
                            content: '""',
                            position: "absolute",
                            left: "14px",
                            top: "8px",
                            bottom: "8px",
                            width: "2px",
                            bgcolor: "var(--border)",
                        },
                    }}
                >
                    {rawList.map((evt, i) => {
                        const attack = evt.type === "attack" || evt.prediction === "ATTACK DETECTED";
                        const dotColor = attack ? STATUS.critical : ACCENT;
                        const timeDisplay = evt.time || (evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString());
                        const groundTruth = evt.groundTruth || (evt.injected ? "FDIA Attack" : "None (Clean Baseline)");
                        const topFeature = evt.topFeature || (evt.explanation?.features?.[0]?.label ?? "N/A");

                        return (
                            <Box
                                key={i}
                                sx={{
                                    position: "relative",
                                    mb: 2,
                                    "&:last-child": { mb: 0 },
                                }}
                            >
                                {/* Dot */}
                                <Box
                                    sx={{
                                        position: "absolute",
                                        left: "-25px",
                                        top: "4px",
                                        width: 18,
                                        height: 18,
                                        borderRadius: "50%",
                                        bgcolor: BACKGROUND.card,
                                        border: `2px solid ${dotColor}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: "50%",
                                            bgcolor: dotColor,
                                        }}
                                    />
                                </Box>

                                {/* Event Entry */}
                                <Box
                                    sx={{
                                        p: 1.8,
                                        borderRadius: `${RADIUS.sm}px`,
                                        bgcolor: BACKGROUND.app,
                                        border: `1px solid ${BACKGROUND.border}`,
                                        borderLeft: `3px solid ${dotColor}`,
                                        boxShadow: "var(--card-shadow)",
                                        "&:hover": {
                                            borderColor: BACKGROUND.borderHover,
                                            bgcolor: BACKGROUND.hover,
                                        },
                                    }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {attack ? (
                                                <WarningAmberRoundedIcon sx={{ fontSize: 16, color: STATUS.critical }} />
                                            ) : (
                                                <InfoRoundedIcon sx={{ fontSize: 16, color: ACCENT }} />
                                            )}
                                            <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: TEXT.primary }}>
                                                {attack ? `Threat Audit: ${groundTruth}` : "SCADA Nominal Stream Log"}
                                            </Typography>
                                        </Box>

                                        <Typography sx={{ fontSize: "0.68rem", color: TEXT.muted, fontFamily: "var(--font-mono)" }}>
                                            {timeDisplay}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" gap={0.8}>
                                        <Chip
                                            label={`Truth: ${groundTruth}`}
                                            size="small"
                                            sx={{
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                bgcolor: evt.injected ? STATUS.warningBg : STATUS.normalBg,
                                                color: evt.injected ? STATUS.warning : STATUS.normal,
                                                border: `1px solid ${evt.injected ? STATUS.warningBorder : STATUS.normalBorder}`,
                                            }}
                                        />

                                        <Chip
                                            label={`Pred: ${evt.prediction} (${(evt.confidence * 100).toFixed(1)}%)`}
                                            size="small"
                                            sx={{
                                                fontSize: "0.65rem",
                                                fontWeight: 700,
                                                bgcolor: attack ? STATUS.criticalBg : STATUS.normalBg,
                                                color: attack ? STATUS.critical : STATUS.normal,
                                                border: `1px solid ${attack ? STATUS.criticalBorder : STATUS.normalBorder}`,
                                            }}
                                        />

                                        {topFeature && topFeature !== "N/A" && (
                                            <Chip
                                                label={`SHAP Driver: ${topFeature}`}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: "0.65rem", color: TEXT.muted }}
                                            />
                                        )}
                                    </Stack>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}

export default EventTimeline;