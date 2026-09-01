import React from "react";
import {
    Table, TableHead, TableRow, TableCell,
    TableBody, TableContainer, Box, Typography
} from "@mui/material";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../theme/theme";

function BusTable({ reading }) {
    if (!reading) {
        return (
            <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography sx={{ fontSize: "0.85rem", color: TEXT.muted }}>
                    Waiting for IEEE 14 Bus live telemetry stream…
                </Typography>
            </Box>
        );
    }

    const rows = [];
    for (let i = 0; i < 14; i++) {
        const voltage  = reading[`vm_pu_bus${i}`]  ?? 0;
        const angle    = reading[`va_deg_bus${i}`] ?? 0;
        const active   = reading[`p_mw_bus${i}`]   ?? 0;
        const reactive = reading[`q_mvar_bus${i}`] ?? 0;

        let status = "NORMAL";
        let badgeClass = "soc-badge soc-badge-normal";
        let vColor = STATUS.normal;

        if (voltage < 0.94 || voltage > 1.07) {
            status = "CRITICAL";
            badgeClass = "soc-badge soc-badge-critical";
            vColor = STATUS.critical;
        } else if (voltage < 1.00 || voltage > 1.05) {
            status = "WARNING";
            badgeClass = "soc-badge soc-badge-warning";
            vColor = STATUS.warning;
        }

        rows.push({ id: i + 1, voltage, angle, active, reactive, status, badgeClass, vColor });
    }

    return (
        <TableContainer
            sx={{
                maxHeight: 520,
                borderRadius: `${RADIUS.sm}px`,
                overflow: "auto",
                background: "transparent",
            }}
        >
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        {["BUS ID", "VOLTAGE (PU)", "ANGLE (°)", "ACTIVE P (MW)", "REACTIVE Q (MVAR)", "SCADA STATUS"].map((h) => (
                            <TableCell
                                key={h}
                                sx={{
                                    bgcolor: BACKGROUND.app,
                                    fontWeight: 700,
                                    fontSize: "0.68rem",
                                    letterSpacing: "0.08em",
                                    textTransform: "uppercase",
                                    color: TEXT.muted,
                                    py: 1.5,
                                    px: 2,
                                    borderBottom: `1px solid ${BACKGROUND.border}`,
                                }}
                            >
                                {h}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>

                <TableBody>
                    {rows.map((row) => (
                        <TableRow
                            key={row.id}
                            sx={{
                                bgcolor: BACKGROUND.card,
                                transition: "background-color 0.15s ease",
                                "&:hover": {
                                    bgcolor: `${BACKGROUND.hover} !important`,
                                },
                                borderBottom: `1px solid ${BACKGROUND.border}`,
                            }}
                        >
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    color: ACCENT,
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "0.82rem",
                                    px: 2,
                                    py: 1.4,
                                }}
                            >
                                BUS {row.id}
                            </TableCell>

                            <TableCell
                                sx={{
                                    fontFamily: "var(--font-mono)",
                                    fontWeight: 700,
                                    color: row.vColor,
                                    fontSize: "0.82rem",
                                    px: 2,
                                }}
                            >
                                {row.voltage.toFixed(4)}
                            </TableCell>

                            <TableCell
                                sx={{
                                    fontFamily: "var(--font-mono)",
                                    color: TEXT.primary,
                                    fontSize: "0.82rem",
                                    px: 2,
                                }}
                            >
                                {row.angle.toFixed(2)}°
                            </TableCell>

                            <TableCell
                                sx={{
                                    fontFamily: "var(--font-mono)",
                                    color: TEXT.primary,
                                    fontSize: "0.82rem",
                                    px: 2,
                                }}
                            >
                                {row.active.toFixed(2)}
                            </TableCell>

                            <TableCell
                                sx={{
                                    fontFamily: "var(--font-mono)",
                                    color: TEXT.primary,
                                    fontSize: "0.82rem",
                                    px: 2,
                                }}
                            >
                                {row.reactive.toFixed(2)}
                            </TableCell>

                            <TableCell sx={{ px: 2 }}>
                                <span className={row.badgeClass}>
                                    {row.status}
                                </span>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export default BusTable;