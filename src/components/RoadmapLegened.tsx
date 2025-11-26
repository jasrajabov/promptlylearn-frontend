import { Box, Collapsible, Flex, Text } from "@chakra-ui/react";

import { useColorModeValue } from "./ui/color-mode";
import { useState } from "react";
import { BiChevronDown, BiChevronUp } from "react-icons/bi";

// colors.ts
export const TYPE_COLORS = {
    core: "#ffe0b2",
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


export const TYPE_COLORS_DARK = {
    core: "#ffb74d",
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


const LABELS: Record<string, string> = {
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

export function RoadmapLegendFloating() {
    const colors = useColorModeValue(TYPE_COLORS, TYPE_COLORS_DARK);
    const bg = useColorModeValue("whiteAlpha.900", "gray.800");
    const border = useColorModeValue("gray.300", "gray.600");
    const [open, setOpen] = useState(false);

    return (

        <Box
            position="absolute"
            top="150px"
            left="20px"
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            bg={bg}
            borderColor={border}
            zIndex={10}
            boxShadow="lg"
            maxW="280px"
            backdropFilter="blur(4px)"
        >
            <Collapsible.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
                <Collapsible.Trigger asChild>
                    <Text alignItems="center" fontWeight="bold" ml={5} mr={5} mb={1} fontSize="sm">
                        Legend
                        {open ? <BiChevronUp style={{ display: "inline", marginLeft: "4px" }} /> : <BiChevronDown style={{ display: "inline", marginLeft: "4px" }} />}
                    </Text>
                </Collapsible.Trigger>
                <Collapsible.Content>
                    <Flex direction="column" gap={2}>
                        {Object.entries(LABELS).map(([type, label]) => {
                            const key = type as keyof typeof TYPE_COLORS;
                            return (
                                <Flex key={type} align="center" gap={3}>
                                    <Box
                                        w="18px"
                                        h="18px"
                                        borderRadius="md"
                                        bg={colors[key]}
                                        border="1px solid rgba(0,0,0,0.2)"
                                        flexShrink={0}
                                    />
                                    <Text fontSize="xs">{label}</Text>
                                </Flex>
                            );
                        })}
                    </Flex>
                </Collapsible.Content>
            </Collapsible.Root>
        </Box>

    );
}
