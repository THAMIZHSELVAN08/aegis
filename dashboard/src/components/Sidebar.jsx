import React, { useState, useMemo, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    Drawer,
    Toolbar,
    Typography,
    Box,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Tooltip,
    IconButton,
} from "@mui/material";

import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";

import { ColorModeContext } from "../context/ColorModeContext";
import {
    BACKGROUND,
    ACCENT,
    STATUS,
    TEXT,
} from "../theme/theme";


/* ============================================================
   SIDEBAR DIMENSIONS
============================================================ */

const EXPANDED = 248;
const COLLAPSED = 68;


/* ============================================================
   FONT
============================================================ */

const FONT_FAMILY =
    '"Inter", "Roboto", "Helvetica", "Arial", sans-serif';


/* ============================================================
   SIDEBAR COMPONENT
============================================================ */

export default function Sidebar() {

    const [collapsed, setCollapsed] = useState(false);

    const { mode, toggleColorMode } =
        useContext(ColorModeContext);

    const location = useLocation();
    const navigate = useNavigate();

    const isDark = mode === "dark";


    /* ========================================================
       NAVIGATION ITEMS
       
       Icons intentionally removed to create a cleaner,
       professional SCADA/SOC navigation layout.
    ======================================================== */

    const menuItems = useMemo(
        () => [
            {
                text: "Dashboard",
                path: "/dashboard",
                id: "dashboard",
                section: true,
            },
            {
                text: "Topology",
                path: "/topology",
                id: "topology",
                section: true,
            },
            {
                text: "Analytics",
                path: "/analytics",
                id: "analytics",
                section: true,
            },
            {
                text: "Bus Monitor",
                path: "/monitor",
                id: "bus-monitor",
                section: true,
            },
            {
                text: "Machine Learning",
                path: "/ml",
                id: "machine-learning",
                section: true,
            },
            {
                text: "Security",
                path: "/security",
                id: "security",
                section: true,
            },
            {
                text: "Notifications",
                path: "/notifications",
                id: "notifications",
                section: false,
            },
            {
                text: "Settings",
                path: "/settings",
                id: "settings",
                section: false,
            },
        ],
        []
    );


    /* ========================================================
       SCROLL TO DASHBOARD SECTION
    ======================================================== */

    const scrollToSection = (id) => {

        const el = document.getElementById(id);

        if (el) {
            el.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };


    /* ========================================================
       NAVIGATION HANDLER
    ======================================================== */

    const handleNav = (item) => {

        // Normal route
        if (!item.section) {
            navigate(item.path);
            return;
        }

        // Navigate to dashboard section
        if (location.pathname !== "/dashboard") {
            navigate(`/dashboard#${item.id}`);
            return;
        }

        // Update URL hash without page reload
        window.history.replaceState(
            null,
            "",
            `#${item.id}`
        );

        scrollToSection(item.id);
    };


    /* ========================================================
       ACTIVE NAVIGATION ITEM
    ======================================================== */

    const isItemActive = (item) => {

        // Normal pages
        if (!item.section) {
            return location.pathname === item.path;
        }

        // Dashboard sections
        if (location.pathname !== "/dashboard") {
            return false;
        }

        const hash =
            location.hash.replace("#", "");

        // Dashboard default state
        if (item.id === "dashboard") {
            return (
                !hash ||
                hash === "dashboard"
            );
        }

        return hash === item.id;
    };


    /* ========================================================
       RENDER
    ======================================================== */

    return (
        <Drawer
            variant="permanent"

            sx={{
                width: collapsed
                    ? COLLAPSED
                    : EXPANDED,

                flexShrink: 0,

                fontFamily: FONT_FAMILY,

                transition:
                    "width 0.25s cubic-bezier(.4,0,.2,1)",

                "& .MuiDrawer-paper": {

                    width: collapsed
                        ? COLLAPSED
                        : EXPANDED,

                    boxSizing: "border-box",

                    overflowX: "hidden",

                    backgroundColor:
                        BACKGROUND.app,

                    borderRight:
                        `1px solid ${BACKGROUND.border}`,

                    display: "flex",

                    flexDirection:
                        "column",

                    fontFamily:
                        FONT_FAMILY,

                    boxShadow:
                        "4px 0 24px rgba(15, 23, 42, 0.035)",

                    transition:
                        "width 0.25s cubic-bezier(.4,0,.2,1), background-color 0.2s ease",

                    zIndex: 10,
                },
            }}
        >

            {/* ==================================================
                BRAND HEADER
            ================================================== */}

            <Toolbar
                disableGutters

                sx={{
                    display: "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        collapsed
                            ? "center"
                            : "space-between",

                    px:
                        collapsed
                            ? 1
                            : 2,

                    minHeight:
                        "78px !important",

                    borderBottom:
                        `1px solid ${BACKGROUND.border}`,

                    fontFamily:
                        FONT_FAMILY,
                }}
            >

                {/* BRAND */}

                {!collapsed && (

                    <Box>

                        <Typography
                            sx={{
                                fontFamily:
                                    FONT_FAMILY,

                                fontWeight: 800,

                                fontSize:
                                    "1.05rem",

                                lineHeight:
                                    1,

                                color:
                                    TEXT.primary,

                                letterSpacing:
                                    "-0.025em",
                            }}
                        >
                            AEGIS
                        </Typography>


                        <Typography
                            sx={{
                                mt: 0.55,

                                fontFamily:
                                    FONT_FAMILY,

                                fontSize:
                                    "0.59rem",

                                color:
                                    TEXT.muted,

                                fontWeight: 650,

                                letterSpacing:
                                    "0.12em",

                                textTransform:
                                    "uppercase",

                                lineHeight:
                                    1.2,
                            }}
                        >
                            GRID SCADA AI
                        </Typography>

                    </Box>
                )}


                {/* COLLAPSE BUTTON */}

                <IconButton
                    onClick={() =>
                        setCollapsed(
                            (c) => !c
                        )
                    }

                    size="small"

                    aria-label={
                        collapsed
                            ? "Expand sidebar"
                            : "Collapse sidebar"
                    }

                    sx={{
                        width: 34,
                        height: 34,

                        color:
                            TEXT.muted,

                        p: 0,

                        borderRadius:
                            "9px",

                        bgcolor:
                            BACKGROUND.app,

                        border:
                            `1px solid ${BACKGROUND.border}`,

                        transition:
                            "all 0.15s ease",

                        "&:hover": {

                            color:
                                ACCENT,

                            borderColor:
                                ACCENT,

                            bgcolor:
                                "var(--accent-muted)",
                        },
                    }}
                >

                    {collapsed ? (

                        <MenuIcon
                            sx={{
                                fontSize: 19,
                            }}
                        />

                    ) : (

                        <MenuOpenIcon
                            sx={{
                                fontSize: 19,
                            }}
                        />

                    )}

                </IconButton>

            </Toolbar>


            {/* ==================================================
                NAVIGATION
            ================================================== */}

            <List
                sx={{
                    mt: 1.6,

                    px:
                        collapsed
                            ? 1
                            : 1.25,

                    flexGrow: 1,

                    fontFamily:
                        FONT_FAMILY,
                }}
            >

                {menuItems.map((item) => {

                    const active =
                        isItemActive(item);

                    return (

                        <Tooltip
                            key={item.text}

                            title={
                                collapsed
                                    ? item.text
                                    : ""
                            }

                            placement="right"
                        >

                            <ListItemButton

                                onClick={() =>
                                    handleNav(item)
                                }

                                sx={{
                                    position:
                                        "relative",

                                    minHeight:
                                        46,

                                    mb:
                                        0.55,

                                    px:
                                        collapsed
                                            ? 1
                                            : 2,

                                    borderRadius:
                                        "10px",

                                    justifyContent:
                                        collapsed
                                            ? "center"
                                            : "flex-start",

                                    backgroundColor:
                                        active
                                            ? "rgba(14, 165, 233, 0.09)"
                                            : "transparent",

                                    border:
                                        active
                                            ? "1px solid rgba(14, 165, 233, 0.20)"
                                            : "1px solid transparent",

                                    fontFamily:
                                        FONT_FAMILY,

                                    transition:
                                        "background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease",

                                    "&:hover": {

                                        backgroundColor:
                                            "rgba(14, 165, 233, 0.055)",

                                        transform:
                                            collapsed
                                                ? "none"
                                                : "translateX(2px)",
                                    },

                                    "&:active": {
                                        transform:
                                            "translateX(1px)",
                                    },
                                }}
                            >

                                {/* ACTIVE BAR */}

                                {active &&
                                    !collapsed && (

                                        <Box
                                            sx={{
                                                position:
                                                    "absolute",

                                                left: 0,

                                                top: 8,

                                                bottom: 8,

                                                width: 3,

                                                borderRadius:
                                                    "0 4px 4px 0",

                                                background:
                                                    "linear-gradient(180deg, #0284C7, #22D3EE)",
                                            }}
                                        />

                                    )}


                                {/* NAVIGATION LABEL */}

                                {!collapsed && (

                                    <ListItemText

                                        primary={
                                            item.text
                                        }

                                        sx={{
                                            m: 0,
                                        }}

                                        primaryTypographyProps={{
                                            fontFamily:
                                                FONT_FAMILY,

                                            fontSize:
                                                "0.86rem",

                                            fontWeight:
                                                active
                                                    ? 650
                                                    : 500,

                                            color:
                                                active
                                                    ? TEXT.primary
                                                    : TEXT.muted,

                                            letterSpacing:
                                                "-0.012em",

                                            lineHeight:
                                                1.2,
                                        }}
                                    />

                                )}

                            </ListItemButton>

                        </Tooltip>
                    );
                })}

            </List>


            {/* ==================================================
                FOOTER DIVIDER
            ================================================== */}

            <Divider
                sx={{
                    borderColor:
                        BACKGROUND.border,
                }}
            />


            {/* ==================================================
                FOOTER
            ================================================== */}

            <Box
                sx={{
                    p: 1.5,

                    display:
                        "flex",

                    flexDirection:
                        "column",

                    gap: 1,

                    fontFamily:
                        FONT_FAMILY,
                }}
            >

                {/* ==================================================
                    THEME TOGGLE
                ================================================== */}

                {collapsed ? (

                    <Tooltip
                        title={
                            isDark
                                ? "Switch to Light Mode"
                                : "Switch to Dark Mode"
                        }

                        placement="right"
                    >

                        <IconButton
                            onClick={
                                toggleColorMode
                            }

                            size="small"

                            aria-label={
                                isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                            }

                            sx={{
                                width: 36,
                                height: 36,

                                mx: "auto",

                                borderRadius:
                                    "9px",

                                bgcolor:
                                    BACKGROUND.hover,

                                border:
                                    `1px solid ${BACKGROUND.border}`,

                                color:
                                    isDark
                                        ? "#FBBF24"
                                        : "#0284C7",

                                transition:
                                    "all 0.2s ease",

                                "&:hover": {

                                    borderColor:
                                        ACCENT,

                                    bgcolor:
                                        "var(--accent-muted)",
                                },
                            }}
                        >

                            {isDark ? (

                                <LightModeRoundedIcon
                                    sx={{
                                        fontSize: 18,
                                    }}
                                />

                            ) : (

                                <DarkModeRoundedIcon
                                    sx={{
                                        fontSize: 18,
                                    }}
                                />

                            )}

                        </IconButton>

                    </Tooltip>

                ) : (

                    <Box
                        onClick={
                            toggleColorMode
                        }

                        title={
                            isDark
                                ? "Switch to Light Mode"
                                : "Switch to Dark Mode"
                        }

                        sx={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "space-between",

                            px: 1.4,

                            py: 1.05,

                            borderRadius:
                                "10px",

                            bgcolor:
                                BACKGROUND.card,

                            border:
                                `1px solid ${BACKGROUND.border}`,

                            cursor:
                                "pointer",

                            fontFamily:
                                FONT_FAMILY,

                            transition:
                                "all 0.2s ease",

                            "&:hover": {

                                borderColor:
                                    "rgba(14,165,233,0.25)",

                                bgcolor:
                                    "var(--accent-muted)",
                            },
                        }}
                    >

                        {/* MODE LABEL */}

                        <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                        >

                            {isDark ? (

                                <DarkModeRoundedIcon
                                    sx={{
                                        fontSize: 17,
                                        color: ACCENT,
                                    }}
                                />

                            ) : (

                                <LightModeRoundedIcon
                                    sx={{
                                        fontSize: 17,
                                        color: "#F59E0B",
                                    }}
                                />

                            )}

                            <Typography
                                sx={{
                                    fontFamily:
                                        FONT_FAMILY,

                                    fontSize:
                                        "0.76rem",

                                    fontWeight:
                                        600,

                                    color:
                                        TEXT.primary,
                                }}
                            >
                                {isDark
                                    ? "Dark Mode"
                                    : "Light Mode"}
                            </Typography>

                        </Box>


                        {/* SWITCH */}

                        <Box
                            sx={{
                                width: 42,
                                height: 23,

                                borderRadius:
                                    "20px",

                                backgroundColor:
                                    isDark
                                        ? "#64748B"
                                        : "#0284C7",

                                position:
                                    "relative",

                                transition:
                                    "background-color 0.2s ease",
                            }}
                        >

                            <Box
                                sx={{
                                    position:
                                        "absolute",

                                    top: 3,

                                    left:
                                        isDark
                                            ? 3
                                            : 22,

                                    width: 17,
                                    height: 17,

                                    borderRadius:
                                        "50%",

                                    backgroundColor:
                                        "#FFFFFF",

                                    boxShadow:
                                        "0 1px 4px rgba(0,0,0,0.18)",

                                    transition:
                                        "left 0.2s ease",

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    justifyContent:
                                        "center",

                                    fontSize:
                                        "9px",
                                }}
                            >
                                {isDark
                                    ? "🌙"
                                    : "☀️"}
                            </Box>

                        </Box>

                    </Box>
                )}


                {/* ==================================================
                    SYSTEM STATUS - COLLAPSED
                ================================================== */}

                {collapsed ? (

                    <Tooltip
                        title="SCADA Online"
                        placement="right"
                    >

                        <Box
                            sx={{
                                width: 36,
                                height: 36,

                                mx: "auto",

                                borderRadius:
                                    "9px",

                                bgcolor:
                                    STATUS.normalBg,

                                border:
                                    `1px solid ${STATUS.normalBorder}`,

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",
                            }}
                        >

                            <span
                                className="pulse-dot"

                                style={{
                                    width: 7,
                                    height: 7,
                                }}
                            />

                        </Box>

                    </Tooltip>

                ) : (

                    /* ==================================================
                       SYSTEM STATUS - EXPANDED
                    ================================================== */

                    <Box
                        sx={{
                            display:
                                "flex",

                            alignItems:
                                "center",

                            gap: 1.2,

                            px: 1.4,

                            py: 1.05,

                            borderRadius:
                                "10px",

                            bgcolor:
                                BACKGROUND.card,

                            border:
                                `1px solid ${BACKGROUND.border}`,

                            fontFamily:
                                FONT_FAMILY,

                            transition:
                                "all 0.2s ease",

                            "&:hover": {

                                borderColor:
                                    STATUS.normalBorder,
                            },
                        }}
                    >

                        {/* STATUS INDICATOR */}

                        <Box
                            sx={{
                                width: 28,
                                height: 28,

                                borderRadius:
                                    "50%",

                                background:
                                    STATUS.normalBg,

                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                justifyContent:
                                    "center",

                                flexShrink: 0,
                            }}
                        >

                            <span
                                className="pulse-dot"
                            />

                        </Box>


                        {/* STATUS TEXT */}

                        <Box
                            sx={{
                                minWidth: 0,
                            }}
                        >

                            <Typography
                                sx={{
                                    fontFamily:
                                        FONT_FAMILY,

                                    fontSize:
                                        "0.67rem",

                                    fontWeight:
                                        750,

                                    color:
                                        STATUS.normal,

                                    lineHeight:
                                        1.15,

                                    letterSpacing:
                                        "0.01em",
                                }}
                            >
                                SYSTEM ONLINE
                            </Typography>


                            <Typography
                                sx={{
                                    mt: 0.25,

                                    fontFamily:
                                        FONT_FAMILY,

                                    fontSize:
                                        "0.61rem",

                                    color:
                                        TEXT.muted,

                                    lineHeight:
                                        1.2,
                                }}
                            >
                                SCADA Connected
                            </Typography>

                        </Box>

                    </Box>
                )}

            </Box>

        </Drawer>
    );
}