import React from "react";
import {
    Box, Typography, Divider, Stack
} from "@mui/material";

import BoltIcon from "@mui/icons-material/Bolt";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import SpeedIcon from "@mui/icons-material/Speed";
import { BACKGROUND, ACCENT, STATUS, TEXT, RADIUS } from "../../theme/theme";

function TopologyInfoPanel({
    bus,
    reading
}) {
    if (!bus || !reading) {
        return (
            <Box
                sx={{
                    borderRadius: `${RADIUS.md}px`,
                    bgcolor: BACKGROUND.card,
                    border: `1px solid ${BACKGROUND.border}`,
                    p: 3, // 24px padding
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                }}
            >
                <Typography className="text-eyebrow" sx={{ mb: 1 }}>
                    BUS TELEMETRY
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: TEXT.primary, mb: 1 }}>
                    IEEE 14-Bus SCADA
                </Typography>
                <Divider sx={{ my: 1.5, width: "100%", borderColor: BACKGROUND.border }} />
                <Typography variant="body2" sx={{ color: TEXT.muted, fontSize: "0.82rem" }}>
                    Select any bus node on the topology diagram to inspect real-time electrical telemetry.
                </Typography>
            </Box>
        );
    }

    const voltage = reading[`vm_pu_bus${bus - 1}`];
    const angle = reading[`va_deg_bus${bus - 1}`];
    const active = reading[`p_mw_bus${bus - 1}`];
    const reactive = reading[`q_mvar_bus${bus - 1}`];

    let statusText = "NORMAL";
    let badgeClass = "soc-badge soc-badge-normal";

    if (voltage < 0.95 || voltage > 1.08) {
        statusText = "CRITICAL";
        badgeClass = "soc-badge soc-badge-critical";
    } else if (voltage < 1.00 || voltage > 1.05) {
        statusText = "WARNING";
        badgeClass = "soc-badge soc-badge-warning";
    }

    return (
        <Box
            sx={{
                borderRadius: `${RADIUS.md}px`,
                bgcolor: BACKGROUND.card,
                border: `1px solid ${BACKGROUND.border}`,
                p: 3, // 24px padding
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
            }}
        >
            <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                        <Typography className="text-eyebrow" sx={{ mb: 0.2 }}>
                            SELECTED NODE
                        </Typography>
                        <Typography
                            variant="h5"
                            fontWeight={700}
                            sx={{ color: ACCENT, letterSpacing: "-0.01em" }}
                        >
                            BUS {bus}
                        </Typography>
                    </Box>

                    <span className={badgeClass}>
                        {statusText}
                    </span>
                </Box>

                <Divider sx={{ my: 2, borderColor: BACKGROUND.border }} />

                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5} mb={2.5}>
                    <Box sx={{ bgcolor: BACKGROUND.app, p: 2, borderRadius: `${RADIUS.sm}px`, border: `1px solid ${BACKGROUND.border}` }}>
                        <Typography sx={{ color: TEXT.muted, fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 700, mb: 0.5 }}>
                            Voltage (p.u.)
                        </Typography>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: TEXT.primary, fontSize: "1.1rem" }}>
                            {voltage?.toFixed(4)}
                        </Typography>
                    </Box>

                    <Box sx={{ bgcolor: BACKGROUND.app, p: 2, borderRadius: `${RADIUS.sm}px`, border: `1px solid ${BACKGROUND.border}` }}>
                        <Typography sx={{ color: TEXT.muted, fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 700, mb: 0.5 }}>
                            Angle (deg)
                        </Typography>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: TEXT.primary, fontSize: "1.1rem" }}>
                            {angle?.toFixed(2)}°
                        </Typography>
                    </Box>

                    <Box sx={{ bgcolor: BACKGROUND.app, p: 2, borderRadius: `${RADIUS.sm}px`, border: `1px solid ${BACKGROUND.border}` }}>
                        <Typography sx={{ color: TEXT.muted, fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 700, mb: 0.5 }}>
                            Active P (MW)
                        </Typography>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: ACCENT, fontSize: "1.1rem" }}>
                            {active?.toFixed(2)}
                        </Typography>
                    </Box>

                    <Box sx={{ bgcolor: BACKGROUND.app, p: 2, borderRadius: `${RADIUS.sm}px`, border: `1px solid ${BACKGROUND.border}` }}>
                        <Typography sx={{ color: TEXT.muted, fontSize: "0.68rem", textTransform: "uppercase", fontWeight: 700, mb: 0.5 }}>
                            Reactive Q (MVAR)
                        </Typography>
                        <Typography sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: STATUS.normal, fontSize: "1.1rem" }}>
                            {reactive?.toFixed(2)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box>
                <Divider sx={{ mb: 2, borderColor: BACKGROUND.border }} />
                <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1} sx={{ fontSize: "0.75rem", color: TEXT.muted }}>
                        <BoltIcon sx={{ fontSize: 16, color: ACCENT }} />
                        <span>Live Telemetry Stream Active</span>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} sx={{ fontSize: "0.75rem", color: TEXT.muted }}>
                        <ElectricBoltIcon sx={{ fontSize: 16, color: TEXT.muted }} />
                        <span>IEEE 14 SCADA Standard Grid</span>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} sx={{ fontSize: "0.75rem", color: TEXT.muted }}>
                        <SpeedIcon sx={{ fontSize: 16, color: STATUS.normal }} />
                        <span>FDIA ML Shield Protected</span>
                    </Box>
                </Stack>
            </Box>
        </Box>
    );
}

export default TopologyInfoPanel;