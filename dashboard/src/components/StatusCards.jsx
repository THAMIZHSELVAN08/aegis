import React from "react";
import { Box, Typography } from "@mui/material";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

function Card({ title, value, color, barValue = 100 }) {
    return (
        <Box
            sx={{
                p: 3, // 24px padding
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                boxShadow: "var(--card-shadow)",
                flex: 1,
                minWidth: "220px",
                height: "100%",
                minHeight: 160,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                    borderColor: BACKGROUND.borderHover,
                },
            }}
        >
            <Typography className="text-eyebrow" sx={{ fontSize: "0.68rem", mb: 1.5 }}>
                {title}
            </Typography>

            <Typography
                sx={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1.75rem",
                    fontWeight: 700,
                    color: TEXT.primary,
                    lineHeight: 1.1,
                    my: 1,
                }}
            >
                {value}
            </Typography>

            <Box
                sx={{
                    width: "100%",
                    height: 3,
                    borderRadius: `${RADIUS.pill}px`,
                    bgcolor: "rgba(125, 125, 125, 0.12)",
                    overflow: "hidden",
                    mt: "auto",
                }}
            >
                <Box
                    sx={{
                        width: `${Math.min(Math.max(barValue, 0), 100)}%`,
                        height: "100%",
                        borderRadius: `${RADIUS.pill}px`,
                        bgcolor: color,
                    }}
                />
            </Box>
        </Box>
    );
}

function StatusCards({ prediction, confidence }) {
    const attack = prediction === "ATTACK DETECTED";

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 2.5,
                mb: 3,
            }}
        >
            <Card
                title="SYSTEM STATUS"
                value={prediction}
                color={attack ? STATUS.critical : STATUS.normal}
                barValue={100}
            />

            <Card
                title="CONFIDENCE"
                value={`${(confidence * 100).toFixed(1)}%`}
                color={ACCENT}
                barValue={confidence * 100}
            />

            <Card
                title="ML MODEL"
                value="XGBoost"
                color={ACCENT}
                barValue={100}
            />

            <Card
                title="LAST UPDATE"
                value={new Date().toLocaleTimeString()}
                color={STATUS.warning}
                barValue={100}
            />
        </Box>
    );
}

export default StatusCards;