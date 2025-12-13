export const TYPE_COLORS: Record<string, string> = {
    core: "#51ADF5",
    optional: "#f8bbd0",
    project: "#c8e6c9",
    prerequisite: "#d1c4e9",
    certification: "#fff9c4",
    tooling: "#e0f2f1",
    "soft-skill": "#f3e5f5",
    portfolio: "#dcedc8",
    specialization: "#ffe082",
    capstone: "#ffccbc",
    default: "#e0f7fa",
};

export const TYPE_COLORS_DARK: Record<string, string> = {
    core: "#279CF5",
    optional: "#f48fb1",
    project: "#81c784",
    prerequisite: "#9575cd",
    certification: "#fff176",
    tooling: "#80cbc4",
    "soft-skill": "#ba68c8",
    portfolio: "#aed581",
    specialization: "#ffca28",
    capstone: "#ffab91",
    default: "#80deea",
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