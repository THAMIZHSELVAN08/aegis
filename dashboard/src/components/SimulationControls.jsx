import React, { useState } from "react";
import {
    Typography,
    Button,
    Stack,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import WarningIcon from "@mui/icons-material/Warning";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

function SimulationControls({ running, onPause, onResume, onAttack, onReset, onOpenMetrics }) {
    const [attackType, setAttackType] = useState("voltage_manipulation");

    const handleInject = () => {
        if (onAttack) {
            onAttack(attackType);
        }
    };

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
                p: 2.5,
                mb: 3,
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                boxShadow: "var(--card-shadow)",
                transition: "background-color 0.2s ease, border-color 0.2s ease",
            }}
        >
            {/* Label */}
            <Box>
                <Typography className="text-eyebrow" sx={{ display: "block", mb: 0.2 }}>
                    SCADA OPERATIONAL OVERRIDES
                </Typography>
                <Box display="flex" alignItems="center" gap={1.2}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "0.95rem", color: TEXT.primary }}>
                        Live Grid Simulation & Multi-Attack Injection
                    </Typography>
                    <span className={running ? "soc-badge soc-badge-normal" : "soc-badge soc-badge-warning"}>
                        {running ? "SIMULATION ACTIVE" : "PAUSED"}
                    </span>
                </Box>
            </Box>

            {/* Controls Stack */}
            <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.2}
                alignItems="center"
                sx={{ ml: { md: "auto" } }}
            >
                {/* Attack Selector Dropdown */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel id="attack-select-label" sx={{ fontSize: "0.78rem", color: TEXT.muted }}>
                        Select FDIA Variant
                    </InputLabel>
                    <Select
                        labelId="attack-select-label"
                        value={attackType}
                        label="Select FDIA Variant"
                        onChange={(e) => setAttackType(e.target.value)}
                        sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: TEXT.primary,
                            bgcolor: BACKGROUND.hover,
                            borderRadius: `${RADIUS.sm}px`,
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: BACKGROUND.border,
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: BACKGROUND.borderHover,
                            },
                        }}
                    >
                        <MenuItem value="voltage_manipulation" sx={{ fontSize: "0.8rem" }}>
                            ⚡ Voltage Manipulation
                        </MenuItem>
                        <MenuItem value="load_redistribution" sx={{ fontSize: "0.8rem" }}>
                            📊 Load Redistribution Attack
                        </MenuItem>
                        <MenuItem value="topology_replay" sx={{ fontSize: "0.8rem" }}>
                            🔄 Topology / Replay Attack
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* Inject FDIA Attack Button */}
                <Button
                    variant="contained"
                    startIcon={<WarningIcon fontSize="small" />}
                    onClick={handleInject}
                    size="small"
                    sx={{
                        minWidth: 165,
                        height: 38,
                        fontSize: "0.8rem",
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: STATUS.critical,
                        color: "#FFFFFF",
                        fontWeight: 700,
                        transition: "all 0.2s ease",
                        "&:hover": {
                            bgcolor: "rgba(220, 38, 38, 0.85)",
                        },
                    }}
                >
                    Inject FDIA Attack
                </Button>

                {/* Resume Feed */}
                <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon fontSize="small" />}
                    onClick={onResume}
                    disabled={running}
                    size="small"
                    sx={{
                        height: 38,
                        fontSize: "0.8rem",
                        borderRadius: `${RADIUS.sm}px`,
                        bgcolor: ACCENT,
                        color: "var(--bg-app)",
                        fontWeight: 700,
                        "&:hover": { bgcolor: "var(--accent-dark)" },
                        "&.Mui-disabled": { opacity: 0.4, bgcolor: "var(--border)", color: TEXT.muted },
                    }}
                >
                    Resume
                </Button>

                {/* Pause Feed */}
                <Button
                    variant="outlined"
                    startIcon={<PauseIcon fontSize="small" />}
                    onClick={onPause}
                    disabled={!running}
                    size="small"
                    sx={{
                        height: 38,
                        fontSize: "0.8rem",
                        borderRadius: `${RADIUS.sm}px`,
                        borderColor: BACKGROUND.border,
                        color: TEXT.primary,
                        bgcolor: "transparent",
                        "&:hover": { bgcolor: BACKGROUND.hover, borderColor: BACKGROUND.borderHover },
                        "&.Mui-disabled": { opacity: 0.4, borderColor: BACKGROUND.border, color: TEXT.muted },
                    }}
                >
                    Pause
                </Button>

                {/* Model Metrics & ROC Curve Modal Trigger */}
                {onOpenMetrics && (
                    <Button
                        variant="outlined"
                        onClick={onOpenMetrics}
                        size="small"
                        sx={{
                            height: 38,
                            fontSize: "0.8rem",
                            borderRadius: `${RADIUS.sm}px`,
                            borderColor: ACCENT,
                            color: ACCENT,
                            bgcolor: "transparent",
                            fontWeight: 700,
                            "&:hover": { bgcolor: "var(--accent-muted)", borderColor: ACCENT },
                        }}
                    >
                        📊 Model Metrics & ROC
                    </Button>
                )}

                {/* Reset System */}
                <Button
                    variant="outlined"
                    startIcon={<RestartAltIcon fontSize="small" />}
                    onClick={onReset}
                    size="small"
                    sx={{
                        height: 38,
                        fontSize: "0.8rem",
                        borderRadius: `${RADIUS.sm}px`,
                        borderColor: BACKGROUND.border,
                        color: TEXT.muted,
                        bgcolor: "transparent",
                        "&:hover": { bgcolor: BACKGROUND.hover, borderColor: TEXT.muted, color: TEXT.primary },
                    }}
                >
                    Reset
                </Button>
            </Stack>
        </Box>
    );
}

export default SimulationControls;
