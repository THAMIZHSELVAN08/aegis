import React, { useState } from "react";
import { Grid, Box, Typography } from "@mui/material";

import BusNode from "./BusNode";
import TransmissionLine from "./TransmissionLine";
import TopologyInfoPanel from "./TopologyInfoPanel";
import { BACKGROUND, TEXT, RADIUS } from "../../theme/theme";

const busPositions = [
    { id: 1,  x: 375, y: 50  },
    { id: 2,  x: 260, y: 130 },
    { id: 3,  x: 260, y: 230 },
    { id: 4,  x: 375, y: 230 },
    { id: 5,  x: 490, y: 130 },
    { id: 6,  x: 260, y: 350 },
    { id: 7,  x: 150, y: 430 },
    { id: 8,  x: 260, y: 480 },
    { id: 9,  x: 375, y: 480 },
    { id: 10, x: 490, y: 350 },
    { id: 11, x: 600, y: 230 },
    { id: 12, x: 150, y: 550 },
    { id: 13, x: 375, y: 580 },
    { id: 14, x: 600, y: 480 },
];

const lines = [
    [1, 2], [1, 5],
    [2, 3], [2, 4], [2, 5],
    [3, 4],
    [4, 5], [4, 7], [4, 9],
    [5, 6],
    [6, 11], [6, 12], [6, 13],
    [7, 8],
    [9, 10], [9, 14],
    [10, 11],
    [12, 13],
    [13, 14],
];

function GridTopology({ reading, prediction }) {
    const [selectedBus, setSelectedBus] = useState(4);

    if (!reading) {
        return (
            <Box p={4} textAlign="center">
                <Typography sx={{ color: TEXT.muted, fontSize: "0.85rem" }}>
                    Waiting for IEEE 14 Bus telemetry stream…
                </Typography>
            </Box>
        );
    }

    const isAttack = prediction === "ATTACK DETECTED";

    // Count healthy, warning, critical nodes
    let healthyCount = 0;
    let warningCount = 0;
    let criticalCount = 0;

    for (let i = 0; i < 14; i++) {
        const v = parseFloat(reading[`vm_pu_bus${i}`] ?? 1.0);
        if (v < 0.94 || v > 1.07) criticalCount++;
        else if (v < 1.00 || v > 1.05) warningCount++;
        else healthyCount++;
    }

    return (
        <Grid container spacing={2.5}>
            {/* ── Left: Interactive SVG Diagram (8 Cols) ── */}
            <Grid size={{ xs: 12, lg: 8 }}>
                {/* Node Status Summary Pills */}
                <Box display="flex" gap={1.5} flexWrap="wrap" mb={2}>
                    <span className="soc-badge soc-badge-normal">
                        <span className="pulse-dot" style={{ width: 6, height: 6 }} />
                        {healthyCount} Normal Nodes
                    </span>
                    <span className="soc-badge soc-badge-warning">
                        <span className="pulse-dot warning" style={{ width: 6, height: 6 }} />
                        {warningCount} Warning Nodes
                    </span>
                    <span className="soc-badge soc-badge-critical">
                        <span className="pulse-dot danger" style={{ width: 6, height: 6 }} />
                        {criticalCount} Critical Nodes
                    </span>
                </Box>

                {/* SVG SCADA Topology Diagram Canvas */}
                <Box
                    sx={{
                        width: "100%",
                        borderRadius: `${RADIUS.md}px`,
                        bgcolor: BACKGROUND.app, // Dark canvas background #0A0E14
                        border: `1px solid ${BACKGROUND.border}`,
                        p: 1,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    <svg
                        width="100%"
                        height="600"
                        viewBox="0 0 750 630"
                        style={{ display: "block" }}
                    >
                        {/* ── Transmission Lines ── */}
                        {lines.map(([a, b], index) => {
                            const p1 = busPositions.find((x) => x.id === a);
                            const p2 = busPositions.find((x) => x.id === b);

                            const isLineAttacked =
                                isAttack && (a === 4 || b === 4 || a === 8 || b === 8);

                            return (
                                <TransmissionLine
                                    key={index}
                                    x1={p1.x}
                                    y1={p1.y}
                                    x2={p2.x}
                                    y2={p2.y}
                                    attack={isLineAttacked}
                                />
                            );
                        })}

                        {/* ── Bus Nodes ── */}
                        {busPositions.map((bus) => {
                            const busIndex = bus.id - 1;
                            const v  = parseFloat(reading[`vm_pu_bus${busIndex}`] ?? 1.0);
                            const va = parseFloat(reading[`va_deg_bus${busIndex}`] ?? 0.0);
                            const p  = parseFloat(reading[`p_mw_bus${busIndex}`] ?? 0.0);
                            const q  = parseFloat(reading[`q_mvar_bus${busIndex}`] ?? 0.0);

                            const isNodeAttacked =
                                isAttack && (bus.id === 4 || bus.id === 8);

                            return (
                                <BusNode
                                    key={bus.id}
                                    id={bus.id}
                                    x={bus.x}
                                    y={bus.y}
                                    voltage={v}
                                    angle={va}
                                    activePower={p}
                                    reactivePower={q}
                                    selected={selectedBus === bus.id}
                                    attack={isNodeAttacked}
                                    onClick={() => setSelectedBus(bus.id)}
                                />
                            );
                        })}
                    </svg>
                </Box>
            </Grid>

            {/* ── Right: Node Telemetry Inspection Panel (4 Cols) ── */}
            <Grid size={{ xs: 12, lg: 4 }}>
                <TopologyInfoPanel
                    bus={selectedBus}
                    reading={reading}
                />
            </Grid>
        </Grid>
    );
}

export default GridTopology;
