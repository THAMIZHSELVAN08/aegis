import React from "react";
import { Box, Typography } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { BACKGROUND, STATUS, TEXT, RADIUS } from "../theme/theme";

function AttackAlert({ prediction, confidence }) {
    const attack = prediction === "ATTACK DETECTED";
    const statusColor = attack ? STATUS.critical : STATUS.normal;
    const statusBg = attack ? STATUS.criticalBg : STATUS.normalBg;
    const statusBorder = attack ? STATUS.criticalBorder : STATUS.normalBorder;

    return (
        <Box
            sx={{
                mb: 3,
                p: 3, // 24px padding
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                borderLeft: `3px solid ${statusColor}`,
                boxShadow: "var(--card-shadow)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                transition: "border-color 0.2s ease, background-color 0.2s ease",
            }}
        >
            <Box display="flex" alignItems="center" gap={2}>
                <Box
                    sx={{
                        width: 40,
                        height: 40,
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: statusBg,
                        border: `1px solid ${statusBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: statusColor,
                        flexShrink: 0,
                        transition: "all 0.2s ease",
                    }}
                >
                    {attack ? (
                        <WarningAmberRoundedIcon sx={{ fontSize: 22 }} />
                    ) : (
                        <CheckCircleRoundedIcon sx={{ fontSize: 22 }} />
                    )}
                </Box>

                <Box>
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: "0.95rem",
                            color: TEXT.primary,
                            letterSpacing: "-0.01em",
                            mb: 0.2,
                        }}
                    >
                        {attack
                            ? "False Data Injection Attack Detected!"
                            : "Grid Operating Within Normal Parameters"}
                    </Typography>
                    <Typography
                        sx={{
                            fontSize: "0.8rem",
                            color: TEXT.muted,
                        }}
                    >
                        Prediction Status:{" "}
                        <strong style={{ color: statusColor, fontFamily: "var(--font-mono)" }}>
                            {prediction}
                        </strong>
                        {"  ·  "}
                        Confidence:{" "}
                        <strong style={{ color: TEXT.primary, fontFamily: "var(--font-mono)" }}>
                            {(confidence * 100).toFixed(2)}%
                        </strong>
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    px: 1.5,
                    py: 0.6,
                    borderRadius: `${RADIUS.sm}px`,
                    bgcolor: statusBg,
                    border: `1px solid ${statusBorder}`,
                    color: statusColor,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    transition: "all 0.2s ease",
                }}
            >
                {attack ? "THREAT LEVEL: CRITICAL" : "GRID STATE: NOMINAL"}
            </Box>
        </Box>
    );
}

export default AttackAlert;