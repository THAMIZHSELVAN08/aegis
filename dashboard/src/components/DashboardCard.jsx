import React from "react";
import { Box, Typography } from "@mui/material";
import { BACKGROUND, TEXT, RADIUS } from "../theme/theme";

/**
 * DashboardCard
 * CodeFronts SaaS Card Wrapper with theme-adaptive background, 12px radius, and crisp 1px border.
 */
function DashboardCard({ title, children, height = 400, action = null, noPad = false }) {
    return (
        <Box
            sx={{
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                boxShadow: "var(--card-shadow)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                transition: "border-color 0.25s ease, background-color 0.25s ease, box-shadow 0.25s ease",
                "&:hover": {
                    borderColor: BACKGROUND.borderHover,
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${BACKGROUND.border}`,
                    flexShrink: 0,
                    transition: "border-color 0.2s ease",
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: TEXT.primary,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        letterSpacing: "-0.01em",
                    }}
                >
                    {title}
                </Typography>
                {action}
            </Box>

            {/* Content */}
            <Box
                sx={{
                    flexGrow: 1,
                    height: height === "auto" ? "auto" : height,
                    overflow: "auto",
                    p: noPad ? 0 : 3,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default DashboardCard;