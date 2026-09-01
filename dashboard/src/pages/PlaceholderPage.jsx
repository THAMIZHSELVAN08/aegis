import React from "react";
import { Typography, Box, Grid, Button } from "@mui/material";
import MainLayout from "../layouts/MainLayout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";
import { BACKGROUND, ACCENT, TEXT, RADIUS } from "../theme/theme";

function PlaceholderPage({ title }) {
    const navigate = useNavigate();

    return (
        <MainLayout>
            <Box mb={4}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate("/dashboard")}
                    sx={{ mb: 2, color: ACCENT, fontSize: "0.82rem" }}
                >
                    Back to SCADA Overview
                </Button>

                <Typography className="text-eyebrow" sx={{ mb: 0.5 }}>
                    AEGIS SCADA SUITE
                </Typography>

                <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                        color: TEXT.primary,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {title} SCADA Module
                </Typography>

                <Typography variant="body2" sx={{ color: TEXT.muted, mt: 0.8 }}>
                    Dedicated full-screen management view for {title.toLowerCase()} telemetry and SCADA controls.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box
                        sx={{
                            p: 3, // 24px
                            borderRadius: `${RADIUS.md}px`,
                            bgcolor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                            <SecurityIcon sx={{ color: ACCENT, fontSize: 28 }} />
                            <Typography variant="h6" fontWeight={700} color={TEXT.primary}>
                                {title} Operational Environment
                            </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ color: TEXT.muted, mb: 3, lineHeight: 1.6 }}>
                            This dedicated module allows deep-dive inspection, parameter tuning, historical logging, and export of all SCADA telemetry for {title.toLowerCase()}.
                        </Typography>

                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ p: 2, borderRadius: `${RADIUS.sm}px`, bgcolor: BACKGROUND.app, border: `1px solid ${BACKGROUND.border}` }}>
                                    <span className="soc-badge soc-badge-normal" style={{ marginBottom: 8 }}>
                                        STREAM ACTIVE
                                    </span>
                                    <Typography variant="subtitle2" fontWeight={700} color={TEXT.primary}>
                                        Telemetry Link
                                    </Typography>
                                    <Typography variant="caption" color={TEXT.muted}>
                                        Live WebSocket connection to IEEE 14 bus
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ p: 2, borderRadius: `${RADIUS.sm}px`, bgcolor: BACKGROUND.app, border: `1px solid ${BACKGROUND.border}` }}>
                                    <span className="soc-badge soc-badge-accent" style={{ marginBottom: 8 }}>
                                        ML SHIELD ON
                                    </span>
                                    <Typography variant="subtitle2" fontWeight={700} color={TEXT.primary}>
                                        Ensemble Model
                                    </Typography>
                                    <Typography variant="caption" color={TEXT.muted}>
                                        Random Forest + XGBoost active
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Box
                        sx={{
                            p: 3, // 24px
                            borderRadius: `${RADIUS.md}px`,
                            bgcolor: BACKGROUND.card,
                            border: `1px solid ${BACKGROUND.border}`,
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} color={TEXT.primary} mb={1}>
                            Quick Navigation
                        </Typography>
                        <Typography variant="body2" color={TEXT.muted} mb={2.5}>
                            Jump back to the main real-time dashboard or toggle simulation parameters.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate("/dashboard")}
                            sx={{ borderRadius: `${RADIUS.sm}px` }}
                        >
                            Open Main SCADA Dashboard
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </MainLayout>
    );
}

export default PlaceholderPage;
