import React from "react";
import Tooltip from "@mui/material/Tooltip";
import { BACKGROUND, ACCENT, STATUS, TEXT } from "../../theme/theme";

function BusNode({
    id,
    x,
    y,
    voltage,
    angle,
    activePower,
    reactivePower,
    selected,
    attack = false,
    onClick
}) {
    let color = STATUS.normal; // #10B981
    let status = "Normal";
    let glowColor = "rgba(16, 185, 129, 0.35)";

    if (voltage < 0.95 || voltage > 1.08) {
        color = STATUS.critical; // #EF4444
        status = "Critical";
        glowColor = "rgba(239, 68, 68, 0.4)";
    } else if (voltage < 1.0 || voltage > 1.05) {
        color = STATUS.warning; // #F59E0B
        status = "Warning";
        glowColor = "rgba(245, 158, 11, 0.35)";
    }

    const nodeColor = attack ? STATUS.critical : color;

    return (
        <Tooltip
            arrow
            placement="top"
            title={
                <div style={{ minWidth: 180, padding: "4px 2px", fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                    <div style={{ color: ACCENT, fontWeight: 700, fontSize: "0.85rem", marginBottom: 4 }}>
                        IEEE BUS {id}
                    </div>
                    <div style={{ borderBottom: `1px solid ${BACKGROUND.border}`, marginBottom: 6 }} />
                    <div style={{ color: TEXT.muted }}>Voltage: <strong style={{ color: nodeColor }}>{voltage?.toFixed(4)} pu</strong></div>
                    <div style={{ color: TEXT.muted }}>Angle: <span style={{ color: TEXT.primary }}>{angle?.toFixed(2)}°</span></div>
                    <div style={{ color: TEXT.muted }}>Active P: <span style={{ color: TEXT.primary }}>{activePower?.toFixed(2)} MW</span></div>
                    <div style={{ color: TEXT.muted }}>Reactive Q: <span style={{ color: TEXT.primary }}>{reactivePower?.toFixed(2)} MVAR</span></div>
                    <div style={{ borderBottom: `1px solid ${BACKGROUND.border}`, margin: "6px 0" }} />
                    <div style={{ color: TEXT.muted }}>State: <strong style={{ color: nodeColor }}>{status}</strong></div>
                </div>
            }
        >
            <g
                onClick={onClick}
                style={{
                    cursor: "pointer"
                }}
            >
                {/* Attack Pulsing Outer Ring */}
                {attack && (
                    <circle
                        cx={x}
                        cy={y}
                        r="32"
                        fill={STATUS.critical}
                        opacity="0.15"
                    >
                        <animate
                            attributeName="r"
                            values="24;34;24"
                            dur="1.2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.4;0.05;0.4"
                            dur="1.2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                )}

                {/* Selected Cyan Halo (Minimal SOC Style) */}
                {selected && (
                    <circle
                        cx={x}
                        cy={y}
                        r="26"
                        fill="none"
                        stroke={ACCENT}
                        strokeWidth="1.5"
                        strokeDasharray="4 3"
                        opacity="0.9"
                    >
                        <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from={`0 ${x} ${y}`}
                            to={`360 ${x} ${y}`}
                            dur="8s"
                            repeatCount="indefinite"
                        />
                    </circle>
                )}

                {/* Outer Glow Halo */}
                <circle
                    cx={x}
                    cy={y}
                    r={selected ? 22 : 18}
                    fill={glowColor}
                    opacity="0.25"
                />

                {/* Main Node Circle */}
                <circle
                    cx={x}
                    cy={y}
                    r={selected ? 18 : 16}
                    fill={nodeColor}
                    stroke={selected ? ACCENT : BACKGROUND.app}
                    strokeWidth={selected ? 3 : 2}
                    style={{
                        transition: "all 0.2s ease",
                    }}
                />

                {/* Bus Number */}
                <text
                    x={x}
                    y={y + 4.5}
                    textAnchor="middle"
                    fill="#0A0E14"
                    fontWeight="800"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    style={{ pointerEvents: "none" }}
                >
                    {id}
                </text>

                {/* Bus Label Badge */}
                <text
                    x={x}
                    y={y + 32}
                    textAnchor="middle"
                    fill={TEXT.muted}
                    fontWeight="700"
                    fontSize="9.5"
                    letterSpacing="0.06em"
                    fontFamily="var(--font-sans)"
                    style={{ pointerEvents: "none" }}
                >
                    BUS {id}
                </text>
            </g>
        </Tooltip>
    );
}

export default BusNode;