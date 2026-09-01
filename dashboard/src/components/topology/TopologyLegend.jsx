import React from "react";
import { Box } from "@mui/material";
import { STATUS, RADIUS } from "../../theme/theme";

function TopologyLegend() {
    return (
        <Box
            sx={{
                display: "flex",
                gap: 1.5,
                mb: 2,
            }}
        >
            <span className="soc-badge soc-badge-normal">
                Normal
            </span>
            <span className="soc-badge soc-badge-warning">
                Warning
            </span>
            <span className="soc-badge soc-badge-critical">
                Critical
            </span>
        </Box>
    );
}

export default TopologyLegend;