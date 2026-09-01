import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    CircularProgress,
    Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getContingencyAnalysis } from "../services/api";
import { BACKGROUND, STATUS, TEXT, ACCENT } from "../theme/theme";

function ContingencyAnalysis() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const runAnalysis = async () => {
        setLoading(true);
        try {
            const res = await getContingencyAnalysis();
            setData(res);
        } catch (err) {
            console.error("Contingency analysis error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        runAnalysis();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 4 }}>
                <CircularProgress size={28} />
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ p: 2, textAlign: "center" }}>
                <Typography sx={{ color: TEXT.muted, fontSize: "0.85rem" }}>
                    Contingency analysis data unavailable.
                </Typography>
            </Box>
        );
    }

    const isStable = data.overall_status === "STABLE";

    return (
        <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Status Header Banner */}
            <Paper
                sx={{
                    p: 2,
                    bgcolor: isStable ? STATUS.normalBg : STATUS.criticalBg,
                    border: `1px solid ${isStable ? STATUS.normalBorder : STATUS.criticalBorder}`,
                    borderRadius: 2,
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        {isStable ? (
                            <CheckCircleIcon sx={{ color: STATUS.normal, fontSize: 28 }} />
                        ) : (
                            <WarningIcon sx={{ color: STATUS.critical, fontSize: 28 }} />
                        )}

                        <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: TEXT.primary }}>
                                {isStable ? "⚡ N-1 Power Flow Security: Grid Fully Resilient" : "⚠️ N-1 Contingency Failure Detected"}
                            </Typography>
                            <Typography sx={{ fontSize: "0.78rem", color: TEXT.muted, mt: 0.3 }}>
                                {data.summary}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Chip
                            label={`${data.stable_contingencies} / ${data.total_lines_tested} Lines Stable`}
                            size="small"
                            sx={{
                                fontWeight: 700,
                                fontSize: "0.7rem",
                                bgcolor: BACKGROUND.card,
                                color: isStable ? STATUS.normal : STATUS.critical,
                                border: `1px solid ${BACKGROUND.border}`,
                            }}
                        />

                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<RefreshIcon fontSize="small" />}
                            onClick={runAnalysis}
                            sx={{ fontSize: "0.75rem", height: 32 }}
                        >
                            Re-Run Solver
                        </Button>
                    </Stack>
                </Stack>
            </Paper>

            {/* Line Outage Telemetry Table */}
            <TableContainer sx={{ border: `1px solid ${BACKGROUND.border}`, borderRadius: 2, maxHeight: 280 }}>
                <Table size="small" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Line Contingency</TableCell>
                            <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700 }}>From Bus</TableCell>
                            <TableCell sx={{ fontSize: "0.7rem", fontWeight: 700 }}>To Bus</TableCell>
                            <TableCell align="right" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Min Voltage (pu)</TableCell>
                            <TableCell align="right" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Max Voltage (pu)</TableCell>
                            <TableCell align="center" sx={{ fontSize: "0.7rem", fontWeight: 700 }}>Outage Stability Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.contingencies.map((line) => {
                            const lineOk = line.status === "STABLE";
                            return (
                                <TableRow key={line.line_id} sx={{ "&:hover": { bgcolor: BACKGROUND.hover } }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: "0.78rem" }}>{line.line_name}</TableCell>
                                    <TableCell sx={{ fontSize: "0.75rem", color: TEXT.muted }}>Bus {line.from_bus}</TableCell>
                                    <TableCell sx={{ fontSize: "0.75rem", color: TEXT.muted }}>Bus {line.to_bus}</TableCell>
                                    <TableCell align="right" sx={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                                        {line.min_voltage_pu.toFixed(4)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                                        {line.max_voltage_pu.toFixed(4)}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={line.status_label}
                                            size="small"
                                            sx={{
                                                fontWeight: 700,
                                                fontSize: "0.65rem",
                                                bgcolor: lineOk ? STATUS.normalBg : STATUS.criticalBg,
                                                color: lineOk ? STATUS.normal : STATUS.critical,
                                                border: `1px solid ${lineOk ? STATUS.normalBorder : STATUS.criticalBorder}`,
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ContingencyAnalysis;
