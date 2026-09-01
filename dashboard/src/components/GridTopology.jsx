import React from "react";
import { Box, Typography } from "@mui/material";
import { BACKGROUND, STATUS, TEXT, RADIUS } from "../theme/theme";

const busPositions = [
    { id: 1,  x: 400, y: 50  },
    { id: 2,  x: 280, y: 140 },
    { id: 3,  x: 280, y: 250 },
    { id: 4,  x: 400, y: 250 },
    { id: 5,  x: 520, y: 140 },
    { id: 6,  x: 280, y: 380 },
    { id: 7,  x: 170, y: 470 },
    { id: 8,  x: 280, y: 520 },
    { id: 9,  x: 400, y: 520 },
    { id: 10, x: 520, y: 380 },
    { id: 11, x: 640, y: 250 },
    { id: 12, x: 170, y: 600 },
    { id: 13, x: 400, y: 640 },
    { id: 14, x: 640, y: 520 },
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

function getBusStatus(voltage) {
    if (voltage < 0.94 || voltage > 1.07) return "critical";
    if (voltage < 1.00 || voltage > 1.05) return "warning";
    return "normal";
}

const STATUS_COLORS = {
    normal: STATUS.normal,
    warning: STATUS.warning,
    critical: STATUS.critical,
};

function GridTopology({ reading }) {
    if (!reading) return null;

    const lineStroke = "rgba(139, 148, 163, 0.15)";
    const labelStroke = BACKGROUND.app;
    const textColor = "#0A0E14";

    const getBusColor = (busId) => {
        const v = reading[`vm_pu_bus${busId - 1}`] ?? 1.0;
        return STATUS_COLORS[getBusStatus(v)];
    };

    return (
        <Box>
            {/* Legend */}
            <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
                <span className="soc-badge soc-badge-normal">Normal</span>
                <span className="soc-badge soc-badge-warning">Warning</span>
                <span className="soc-badge soc-badge-critical">Critical</span>
            </Box>

            <Box
                sx={{
                    bgcolor: BACKGROUND.app,
                    border: `1px solid ${BACKGROUND.border}`,
                    borderRadius: `${RADIUS.md}px`,
                    p: 1,
                    overflow: "hidden",
                }}
            >
                <svg width="100%" height="650" viewBox="0 0 800 700">
                    {lines.map(([a, b], index) => {
                        const p1 = busPositions.find((x) => x.id === a);
                        const p2 = busPositions.find((x) => x.id === b);

                        return (
                            <line
                                key={index}
                                x1={p1.x} y1={p1.y}
                                x2={p2.x} y2={p2.y}
                                stroke={lineStroke}
                                strokeWidth="2"
                            />
                        );
                    })}

                    {busPositions.map((bus) => {
                        const color = getBusColor(bus.id);
                        return (
                            <g key={bus.id}>
                                <circle
                                    cx={bus.x} cy={bus.y} r="18"
                                    fill={color}
                                    stroke={labelStroke}
                                    strokeWidth="2"
                                />
                                <text
                                    x={bus.x} y={bus.y + 4.5}
                                    textAnchor="middle"
                                    fill={textColor}
                                    fontWeight="800"
                                    fontSize="11"
                                    fontFamily="var(--font-mono)"
                                >
                                    {bus.id}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </Box>
        </Box>
    );
}

export default GridTopology;