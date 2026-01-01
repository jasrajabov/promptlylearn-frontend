export const TYPE_COLORS: Record<string, string> = {
    core: "#2563EB",          // strong blue
    optional: "#DB2777",      // magenta / pink
    project: "#16A34A",       // green
    prerequisite: "#7C3AED",  // violet
    certification: "#CA8A04", // amber
    tooling: "#0891B2",       // cyan
    "soft-skill": "#C026D3",  // purple-pink
    portfolio: "#65A30D",     // lime green
    specialization: "#EA580C",// orange
    capstone: "#DC2626",      // red
    default: "#475569",       // slate
};

export const TYPE_COLORS_DARK: Record<string, string> = {
    core: "#3B82F6",
    optional: "#EC4899",
    project: "#22C55E",
    prerequisite: "#8B5CF6",
    certification: "#FACC15",
    tooling: "#22D3EE",
    "soft-skill": "#E879F9",
    portfolio: "#A3E635",
    specialization: "#FB923C",
    capstone: "#F87171",
    default: "#CBD5E1",
};

export const TYPE_LABELS: Record<string, string> = {
    core: "Core",
    optional: "Optional",
    project: "Project",
    prerequisite: "Prerequisite",
    certification: "Certification",
    tooling: "Tooling",
    "soft-skill": "Soft Skill",
    portfolio: "Portfolio",
    specialization: "Specialization",
    capstone: "Capstone",
};

// helper
export const getTypeColor = (type?: string, dark = false) =>
    (dark ? TYPE_COLORS_DARK : TYPE_COLORS)[type ?? "default"] ?? (dark ? TYPE_COLORS_DARK.default : TYPE_COLORS.default);