import { createTheme } from "@mui/material/styles";

// ─── AEGIS SOC Design Tokens (Single Source of Truth) ──────────────────────────
export const DARK_TOKENS = {
    bgApp: "#0A0E14",
    bgCard: "#131820",
    bgHover: "#1A2029",
    bgElevated: "#1A2029",
    border: "rgba(255, 255, 255, 0.08)",
    borderHover: "rgba(255, 255, 255, 0.16)",
    accent: "#22D3EE",
    accentMuted: "rgba(34, 211, 238, 0.12)",
    accentGlow: "rgba(34, 211, 238, 0.25)",
    statusNormal: "#10B981",
    statusNormalBg: "rgba(16, 185, 129, 0.12)",
    statusNormalBorder: "rgba(16, 185, 129, 0.25)",
    statusWarning: "#F59E0B",
    statusWarningBg: "rgba(245, 158, 11, 0.12)",
    statusWarningBorder: "rgba(245, 158, 11, 0.25)",
    statusCritical: "#EF4444",
    statusCriticalBg: "rgba(239, 68, 68, 0.12)",
    statusCriticalBorder: "rgba(239, 68, 68, 0.25)",
    textPrimary: "#E6E8EB",
    textMuted: "#8B94A3",
    textDisabled: "#555E6D",
};

export const LIGHT_TOKENS = {
    bgApp: "#F8FAFC",
    bgCard: "#FFFFFF",
    bgHover: "#F1F5F9",
    bgElevated: "#F8FAFC",
    border: "rgba(0, 0, 0, 0.08)",
    borderHover: "rgba(0, 0, 0, 0.16)",
    accent: "#0284C7",
    accentMuted: "rgba(2, 132, 199, 0.10)",
    accentGlow: "rgba(2, 132, 199, 0.20)",
    statusNormal: "#059669",
    statusNormalBg: "rgba(5, 150, 105, 0.10)",
    statusNormalBorder: "rgba(5, 150, 105, 0.22)",
    statusWarning: "#D97706",
    statusWarningBg: "rgba(217, 119, 6, 0.10)",
    statusWarningBorder: "rgba(217, 119, 6, 0.22)",
    statusCritical: "#DC2626",
    statusCriticalBg: "rgba(220, 38, 38, 0.10)",
    statusCriticalBorder: "rgba(220, 38, 38, 0.22)",
    textPrimary: "#0F172A",
    textMuted: "#64748B",
    textDisabled: "#94A3B8",
};

// Default export alias constants for CSS variable compatibility
export const BACKGROUND = {
    app: "var(--bg-app)",
    card: "var(--bg-card)",
    hover: "var(--bg-hover)",
    elevated: "var(--bg-elevated)",
    border: "var(--border)",
    borderHover: "var(--border-hover)",
};

export const ACCENT = "var(--accent)";
export const ACCENT_MUTED = "var(--accent-muted)";
export const ACCENT_GLOW = "var(--accent-glow)";

export const STATUS = {
    normal: "var(--status-normal)",
    normalBg: "var(--status-normal-bg)",
    normalBorder: "var(--status-normal-border)",
    warning: "var(--status-warning)",
    warningBg: "var(--status-warning-bg)",
    warningBorder: "var(--status-warning-border)",
    critical: "var(--status-critical)",
    criticalBg: "var(--status-critical-bg)",
    criticalBorder: "var(--status-critical-border)",
};

export const TEXT = {
    primary: "var(--text-primary)",
    muted: "var(--text-muted)",
    disabled: "var(--text-disabled)",
};

export const SPACING = {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    pill: 999,
};

export const FONTS = {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', Consolas, Monaco, monospace",
};

// ─── Token accessor ───────────────────────────────────────────────────────────
export function getDesignTokens(mode = "dark") {
    const isDark = mode !== "light";
    const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;
    return {
        ...tokens,
        spacing: SPACING,
        radius: RADIUS,
        fonts: FONTS,
        isDark,
    };
}

// ─── Material-UI Theme Factory ────────────────────────────────────────────────
export function buildTheme(mode = "dark") {
    const isDark = mode !== "light";
    const t = isDark ? DARK_TOKENS : LIGHT_TOKENS;

    return createTheme({
        palette: {
            mode: isDark ? "dark" : "light",
            primary: {
                main: t.accent,
                light: isDark ? "#67E8F9" : "#38BDF8",
                dark: isDark ? "#0891B2" : "#0369A1",
                contrastText: isDark ? "#0A0E14" : "#FFFFFF",
            },
            secondary: {
                main: t.textMuted,
                light: isDark ? "#CBD5E1" : "#94A3B8",
                dark: isDark ? "#475569" : "#334155",
            },
            success: {
                main: t.statusNormal,
                light: isDark ? "#34D399" : "#10B981",
                dark: isDark ? "#059669" : "#047857",
            },
            warning: {
                main: t.statusWarning,
                light: isDark ? "#FBBF24" : "#F59E0B",
                dark: isDark ? "#D97706" : "#B45309",
            },
            error: {
                main: t.statusCritical,
                light: isDark ? "#F87171" : "#EF4444",
                dark: isDark ? "#DC2626" : "#B91C1C",
            },
            background: {
                default: t.bgApp,
                paper: t.bgCard,
            },
            text: {
                primary: t.textPrimary,
                secondary: t.textMuted,
                disabled: t.textDisabled,
            },
            divider: t.border,
        },

        shape: {
            borderRadius: RADIUS.md, // 12px
        },

        typography: {
            fontFamily: FONTS.sans,
            h1: { fontWeight: 700, letterSpacing: "-0.02em" },
            h2: { fontWeight: 700, letterSpacing: "-0.02em" },
            h3: { fontWeight: 700, letterSpacing: "-0.015em" },
            h4: { fontWeight: 600, letterSpacing: "-0.01em" },
            h5: { fontWeight: 600, letterSpacing: "-0.01em" },
            h6: { fontWeight: 600, letterSpacing: "-0.005em" },
            subtitle1: { fontWeight: 600 },
            subtitle2: { fontWeight: 600 },
            body1: { lineHeight: 1.6 },
            body2: { lineHeight: 1.5 },
            caption: { fontWeight: 500, letterSpacing: "0.02em" },
            button: { textTransform: "none", fontWeight: 600, letterSpacing: "-0.01em" },
            overline: { fontWeight: 700, letterSpacing: "0.08em", fontSize: "0.68rem" },
        },

        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    "*, *::before, *::after": {
                        WebkitFontSmoothing: "antialiased",
                        MozOsxFontSmoothing: "grayscale",
                        boxSizing: "border-box",
                    },
                    body: {
                        backgroundColor: t.bgApp,
                        color: t.textPrimary,
                        fontFamily: FONTS.sans,
                        transition: "background-color 0.2s ease, color 0.2s ease",
                    },
                    "::-webkit-scrollbar": { width: "6px", height: "6px" },
                    "::-webkit-scrollbar-track": { background: "transparent" },
                    "::-webkit-scrollbar-thumb": {
                        background: isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.14)",
                        borderRadius: "8px",
                    },
                    "::-webkit-scrollbar-thumb:hover": {
                        background: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(0, 0, 0, 0.24)",
                    },
                },
            },

            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundColor: t.bgCard,
                        backgroundImage: "none",
                        border: `1px solid ${t.border}`,
                        borderRadius: RADIUS.md,
                        boxShadow: "none",
                        transition: "border-color 0.2s ease, background-color 0.2s ease",
                        "&:hover": {
                            borderColor: t.borderHover,
                        },
                    },
                },
            },

            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: "none",
                        backgroundColor: t.bgCard,
                        border: `1px solid ${t.border}`,
                        borderRadius: RADIUS.md,
                        boxShadow: "none",
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                    },
                },
            },

            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: RADIUS.sm,
                        padding: "8px 16px",
                        fontWeight: 600,
                        letterSpacing: "-0.01em",
                        boxShadow: "none",
                        transition: "all 0.2s ease",
                        "&:hover": {
                            boxShadow: "none",
                        },
                    },
                    containedPrimary: {
                        backgroundColor: t.accent,
                        color: isDark ? "#0A0E14" : "#FFFFFF",
                        "&:hover": { backgroundColor: isDark ? "#67E8F9" : "#0369A1" },
                    },
                    containedError: {
                        backgroundColor: t.statusCritical,
                        color: "#FFFFFF",
                        "&:hover": { backgroundColor: isDark ? "#DC2626" : "#B91C1C" },
                    },
                    outlined: {
                        borderColor: t.border,
                        color: t.textPrimary,
                        "&:hover": {
                            borderColor: t.accent,
                            backgroundColor: t.accentMuted,
                        },
                    },
                    outlinedSecondary: {
                        borderColor: t.border,
                        color: t.textMuted,
                        "&:hover": {
                            borderColor: t.textMuted,
                            backgroundColor: isDark ? "rgba(139, 148, 163, 0.08)" : "rgba(100, 116, 139, 0.08)",
                        },
                    },
                },
            },

            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: RADIUS.sm,
                        fontWeight: 700,
                        fontSize: "0.7rem",
                        letterSpacing: "0.04em",
                    },
                    filledSuccess: {
                        backgroundColor: t.statusNormalBg,
                        color: t.statusNormal,
                        border: `1px solid ${t.statusNormalBorder}`,
                    },
                    filledWarning: {
                        backgroundColor: t.statusWarningBg,
                        color: t.statusWarning,
                        border: `1px solid ${t.statusWarningBorder}`,
                    },
                    filledError: {
                        backgroundColor: t.statusCriticalBg,
                        color: t.statusCritical,
                        border: `1px solid ${t.statusCriticalBorder}`,
                    },
                    filledPrimary: {
                        backgroundColor: t.accentMuted,
                        color: t.accent,
                        border: `1px solid ${isDark ? "rgba(34, 211, 238, 0.25)" : "rgba(2, 132, 199, 0.25)"}`,
                    },
                },
            },

            MuiTableHead: {
                styleOverrides: {
                    root: {
                        "& .MuiTableCell-head": {
                            backgroundColor: t.bgApp,
                            color: t.textMuted,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            fontSize: "0.68rem",
                            letterSpacing: "0.08em",
                            borderBottom: `1px solid ${t.border}`,
                            padding: "12px 16px",
                        },
                    },
                },
            },

            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderBottom: `1px solid ${t.border}`,
                        padding: "12px 16px",
                        color: t.textPrimary,
                    },
                },
            },

            MuiTableRow: {
                styleOverrides: {
                    root: {
                        backgroundColor: "transparent",
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                            backgroundColor: `${t.bgHover} !important`,
                        },
                    },
                },
            },

            MuiLinearProgress: {
                styleOverrides: {
                    root: {
                        borderRadius: RADIUS.pill,
                        backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
                    },
                    bar: {
                        borderRadius: RADIUS.pill,
                    },
                },
            },

            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        backgroundColor: t.bgHover,
                        color: t.textPrimary,
                        border: `1px solid ${t.border}`,
                        borderRadius: RADIUS.sm,
                        fontSize: "0.78rem",
                        fontWeight: 500,
                        padding: "6px 12px",
                        boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.6)" : "0 8px 24px rgba(0,0,0,0.12)",
                    },
                    arrow: { color: t.bgHover },
                },
            },

            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        backgroundColor: t.bgApp,
                        borderRight: `1px solid ${t.border}`,
                        transition: "background-color 0.2s ease, border-color 0.2s ease",
                    },
                },
            },

            MuiDivider: {
                styleOverrides: {
                    root: { borderColor: t.border },
                },
            },

            MuiAlert: {
                styleOverrides: {
                    root: {
                        borderRadius: RADIUS.md,
                        backgroundColor: t.bgCard,
                        border: `1px solid ${t.border}`,
                        boxShadow: "none",
                    },
                },
            },
        },
    });
}

export default buildTheme;