import React from "react";
import {
    ResponsiveContainer, AreaChart, Area,
    CartesianGrid, Tooltip, XAxis, YAxis
} from "recharts";
import { BACKGROUND, ACCENT, TEXT } from "../theme/theme";

function VoltageChart({ data = [] }) {
    const gridLine = "rgba(125, 125, 125, 0.1)";

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -15, bottom: 0 }}>
                <defs>
                    <linearGradient id="vSocGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor={ACCENT} stopOpacity={0.10} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0.0} />
                    </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
                <XAxis
                    dataKey="time"
                    tick={{ fill: TEXT.muted, fontSize: 10, fontFamily: "var(--font-mono)" }}
                    stroke="var(--border)"
                    tickLine={false}
                />
                <YAxis
                    domain={["auto", "auto"]}
                    tick={{ fill: TEXT.muted, fontSize: 10, fontFamily: "var(--font-mono)" }}
                    stroke="var(--border)"
                    tickLine={false}
                />

                <Tooltip
                    contentStyle={{
                        backgroundColor: BACKGROUND.card,
                        border: `1px solid ${BACKGROUND.border}`,
                        borderRadius: 8,
                        fontSize: 12,
                        color: TEXT.primary,
                        fontFamily: "var(--font-mono)",
                        boxShadow: "var(--card-shadow)",
                    }}
                    labelStyle={{ color: ACCENT, fontWeight: 700, marginBottom: 4 }}
                    formatter={(value) => [`${value} pu`, "Voltage"]}
                />

                <Area
                    type="monotone"
                    dataKey="voltage"
                    name="Voltage (p.u.)"
                    stroke={ACCENT}
                    strokeWidth={2}
                    fill="url(#vSocGrad)"
                    animationDuration={300}
                    dot={{ r: 2.5, fill: ACCENT, strokeWidth: 1, stroke: BACKGROUND.app }}
                    activeDot={{ r: 5, fill: ACCENT, stroke: "#FFFFFF", strokeWidth: 1.5 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default VoltageChart;