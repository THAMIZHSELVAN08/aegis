import React from "react";
import { Box, Typography } from "@mui/material";
import { BACKGROUND, TEXT, RADIUS } from "../theme/theme";

/**
 * DashboardCard
 * CodeFronts SaaS Card Wrapper with consistent 12px radius, 1px border, and 24px padding.
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
                transition: "border-color 0.2s ease, background-color 0.2s ease",
                "&:hover": {
                    borderColor: BACKGROUND.borderHover,
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 3, // 24px
                    py: 2, // 16px
                    borderBottom: `1px solid ${BACKGROUND.border}`,
                    flexShrink: 0,
                    transition: "border-color 0.2s ease",
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 600,
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
                    p: noPad ? 0 : 3, // 24px padding
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default DashboardCard;