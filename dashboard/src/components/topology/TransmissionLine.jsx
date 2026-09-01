import React from "react";
import { STATUS, ACCENT } from "../../theme/theme";

function TransmissionLine({
    x1,
    y1,
    x2,
    y2,
    attack = false
}) {
    return (
        <g>
            {/* Base Transmission Track Line in low-opacity gray/blue */}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(139, 148, 163, 0.12)"
                strokeWidth="4"
                strokeLinecap="round"
            />

            {/* Subtle Animated Flow Line */}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={attack ? STATUS.critical : "rgba(34, 211, 238, 0.25)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="6 6"
            >
                <animate
                    attributeName="stroke-dashoffset"
                    from="12"
                    to="0"
                    dur="1.2s"
                    repeatCount="indefinite"
                />
            </line>

            {/* Micro Power Pulse Packet */}
            <circle
                r="2.5"
                fill={attack ? STATUS.critical : ACCENT}
                opacity={attack ? 0.9 : 0.6}
            >
                <animateMotion
                    dur="3s"
                    repeatCount="indefinite"
                    path={`M ${x1} ${y1} L ${x2} ${y2}`}
                />
            </circle>
        </g>
    );
}

export default TransmissionLine;