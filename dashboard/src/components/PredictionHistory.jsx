import React from "react";
import {
    Box, Typography, List, ListItem,
    ListItemText, ListItemIcon, ListItemButton
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { BACKGROUND, STATUS, TEXT } from "../theme/theme";

function PredictionHistory({ history = [], onSelectEvent }) {
    return (
        <Box sx={{ height: "100%", overflow: "hidden" }}>
            <List dense disablePadding sx={{ height: "100%", overflow: "auto" }}>
                {[...history].reverse().map((item, i) => {
                    const attack = item.prediction === "ATTACK DETECTED";
                    const color = attack ? STATUS.critical : STATUS.normal;

                    return (
                        <ListItem
                            key={i}
                            disablePadding
                            secondaryAction={null}
                        >
                            <ListItemButton
                                onClick={() => onSelectEvent?.(item)}
                                disabled={!onSelectEvent}
                                sx={{
                                    px: 2,
                                    py: 1.2,
                                    borderBottom: `1px solid ${BACKGROUND.border}`,
                                    transition: "background-color 0.15s ease",
                                    "&:hover": {
                                        bgcolor: BACKGROUND.hover,
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 32, color }}>
                                    {attack ? (
                                        <WarningAmberRoundedIcon sx={{ fontSize: 18 }} />
                                    ) : (
                                        <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
                                    )}
                                </ListItemIcon>

                                <ListItemText
                                    primary={item.prediction}
                                    secondary={`Ground Truth: ${item.groundTruth || "Nominal"} · Confidence: ${(item.confidence * 100).toFixed(1)}%`}
                                    primaryTypographyProps={{
                                        fontWeight: 700,
                                        fontSize: "0.82rem",
                                        color: TEXT.primary,
                                    }}
                                    secondaryTypographyProps={{
                                        fontSize: "0.72rem",
                                        color: TEXT.muted,
                                        fontFamily: "var(--font-mono)",
                                    }}
                                />

                                <span className={attack ? "soc-badge soc-badge-critical" : "soc-badge soc-badge-normal"}>
                                    {item.groundTruth && item.groundTruth !== "None (Clean Baseline)" ? item.groundTruth : (attack ? "ATTACK" : "NORMAL")}
                                </span>
                            </ListItemButton>
                        </ListItem>
                    );
                })}
                {history.length === 0 && (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography sx={{ fontSize: "0.85rem", color: TEXT.muted }}>
                            No predictions logged yet. Simulation running.
                        </Typography>
                    </Box>
                )}
            </List>
        </Box>
    );
}

export default PredictionHistory;