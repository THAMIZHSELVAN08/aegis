import React from "react";
import { Box } from "@mui/material";
import Sidebar from "../components/Sidebar";
import { BACKGROUND, TEXT } from "../theme/theme";

function MainLayout({ children }) {
    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                width: "100%",
                bgcolor: BACKGROUND.app,
                color: TEXT.primary,
                position: "relative",
                overflowX: "hidden",
            }}
        >
            {/* Minimal SOC ambient grid pattern */}
            <div className="soc-bg-grid" />

            {/* Sidebar */}
            <Sidebar />

            {/* Main content area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: "100%",
                    minWidth: 0,
                    p: { xs: 2, sm: 3, md: 3.5 },
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {children}
            </Box>
        </Box>
    );
}

export default MainLayout;