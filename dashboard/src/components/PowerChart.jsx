import React, { useId } from "react";
import {
    ResponsiveContainer, AreaChart, Area,
    CartesianGrid, Tooltip, XAxis, YAxis, Legend
} from "recharts";
import { BACKGROUND, ACCENT, TEXT } from "../theme/theme";

function PowerChart({ data = [], type, title, color: customColor }) {
    const rawId = useId();
    const cleanId = rawId.replace(/:/g, "");

    const isActive = type === "active" || (title && title.toLowerCase().includes("active"));
    const mainColor = customColor || ACCENT;
    const gradientId = `pSocGrad_${cleanId}_${isActive ? "act" : "react"}`;
    const gridLine = "rgba(125, 125, 125, 0.1)";

    // Dynamic key detection: check if data objects use 'value', 'p', 'q', 'active', etc.
    let dataKey = "value";
    if (data.length > 0) {
        const item = data[0];
        if ("value" in item) dataKey = "value";
        else if ("p" in item) dataKey = "p";
        else if ("q" in item) dataKey = "q";
        else if ("active" in item) dataKey = "active";
        else if ("reactive" in item) dataKey = "reactive";
    }

    const label = title || (isActive ? "Active Power (MW)" : "Reactive Power (MVAr)");

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -15, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"  stopColor={mainColor} stopOpacity={0.10} />
                        <stop offset="100%" stopColor={mainColor} stopOpacity={0.0} />
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
                    labelStyle={{ color: mainColor, fontWeight: 700, marginBottom: 4 }}
                />

                <Legend
                    wrapperStyle={{
                        fontSize: "0.72rem",
                        paddingTop: 8,
                        color: TEXT.muted,
                        fontFamily: "var(--font-mono)",
                    }}
                />

                <Area
                    type="monotone"
                    dataKey={dataKey}
                    name={label}
                    stroke={mainColor}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    animationDuration={300}
                    dot={{ r: 2.5, fill: mainColor, strokeWidth: 1, stroke: BACKGROUND.app }}
                    activeDot={{ r: 5, fill: mainColor, stroke: "#FFFFFF", strokeWidth: 1.5 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}

export default PowerChart;