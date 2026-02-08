import React from "react";
import { Box, HStack, Text, Spinner } from "@chakra-ui/react";
import { useColorModeValue } from "./ui/color-mode";
import { X, AlertCircle } from "lucide-react";
import type { QueueEntry } from "../hooks/useGenerationQueue";

interface GenerationQueueBarProps {
    entries: QueueEntry[];
    onRemove: (lessonKey: string) => void;
    onEntryClick?: (lessonKey: string) => void;
}

// ---------------------------------------------------------------------------
// Single active slot
// ---------------------------------------------------------------------------
const ActiveSlot: React.FC<{
    entry: QueueEntry;
    onRemove: (key: string) => void;
    onClick?: (key: string) => void;
}> = ({ entry, onRemove, onClick }) => {
    const isError = entry.status === "error";

    const slotBg = useColorModeValue(
        isError ? "#fff5f5" : "#f0fdfa",
        isError ? "#2a1010" : "#0d2420",
    );
    const slotBorder = useColorModeValue(
        isError ? "#feb2b2" : "#81e6d9",
        isError ? "#63171b" : "#2c7a7b",
    );
    const titleColor = useColorModeValue("#1a202c", "#e2e8f0");
    const statusColor = useColorModeValue(
        isError ? "#c53030" : "#0d9488",
        isError ? "#fc8181" : "#14b8a6",
    );
    const dismissColor = useColorModeValue("#a0aec0", "#4a5568");

    const statusLabel =
        entry.status === "queued" ? "Waiting…"
            : entry.status === "generating" ? "Generating…"
                : entry.status === "error" ? "Failed"
                    : "Done";

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove(entry.lessonKey);
    };

    return (
        <Box
            flex="1"
            minW={0}
            bg={slotBg}
            borderWidth="1px"
            borderColor={slotBorder}
            borderRadius="lg"
            px={{ base: 2, md: 3 }}
            py={{ base: 2, md: 2.5 }}
            display="flex"
            alignItems="center"
            gap={{ base: 1.5, md: 2.5 }}
            cursor={onClick ? "pointer" : "default"}
            onClick={() => onClick?.(entry.lessonKey)}
            transition="all 0.2s"
            _hover={onClick ? {
                transform: "translateY(-1px)",
                boxShadow: "sm",
                borderColor: isError ? undefined : "teal.400"
            } : undefined}
            position="relative"
        >
            {/* Spinner or error icon */}
            {isError ? (
                <AlertCircle size={16} color={statusColor} style={{ flexShrink: 0 }} />
            ) : (
                <Spinner size="sm" color="teal.500" flexShrink={0} />
            )}

            {/* Title + status */}
            <Box minW={0} flex="1">
                <Text
                    fontSize={{ base: "xs", md: "sm" }}
                    fontWeight="600"
                    color={titleColor}
                    style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}
                    title={entry.lessonTitle}
                >
                    {entry.lessonTitle}
                </Text>
                <Text
                    fontSize={{ base: "2xs", md: "xs" }}
                    color={statusColor}
                    fontWeight="500"
                >
                    {statusLabel}
                </Text>
            </Box>

            {/* Dismiss — only for non-terminal states */}
            {(entry.status === "queued" || entry.status === "generating") && (
                <Box
                    as="button"
                    onClick={handleRemove}
                    color={dismissColor}
                    _hover={{ color: "red.500" }}
                    transition="color 0.15s"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flexShrink={0}
                    p={0.5}
                    aria-label="Remove from queue"
                >
                    <X size={14} />
                </Box>
            )}
        </Box>
    );
};

// ---------------------------------------------------------------------------
// Empty placeholder slot (dashed border)
// ---------------------------------------------------------------------------
const EmptySlot: React.FC = () => {
    const borderColor = useColorModeValue("#cbd5e0", "#2d3748");
    const textColor = useColorModeValue("#a0aec0", "#4a5568");

    return (
        <Box
            flex="1"
            minW={0}
            borderWidth="1px"
            borderStyle="dashed"
            borderColor={borderColor}
            borderRadius="lg"
            px={{ base: 2, md: 3 }}
            py={{ base: 2, md: 2.5 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
        >
            <Text
                fontSize={{ base: "2xs", md: "xs" }}
                color={textColor}
                fontWeight="500"
                display={{ base: "none", sm: "block" }}
            >
                Empty slot
            </Text>
        </Box>
    );
};

// ---------------------------------------------------------------------------
// Queue bar — always 3 slots, full width, responsive layout.
// Only mounts when there is at least one active entry.
// ---------------------------------------------------------------------------
const GenerationQueueBar: React.FC<GenerationQueueBarProps> = ({
    entries,
    onRemove,
    onEntryClick
}) => {
    const barBg = useColorModeValue("#f7fafc", "#1a202c");
    const barBorder = useColorModeValue("#e2e8f0", "#2d3748");
    const labelColor = useColorModeValue("#718096", "#a0aec0");

    if (entries.length === 0) return null;

    const slots = [0, 1, 2].map((i) => {
        const entry = entries[i] ?? null;
        return entry ? (
            <ActiveSlot
                key={entry.lessonKey}
                entry={entry}
                onRemove={onRemove}
                onClick={onEntryClick}
            />
        ) : (
            <EmptySlot key={`empty-${i}`} />
        );
    });

    return (
        <Box
            w="100%"
            bg={barBg}
            borderWidth="1px"
            borderColor={barBorder}
            borderRadius={{ base: "lg", md: "xl" }}
            p={{ base: 2, md: 3 }}
        >
            <Text
                fontSize={{ base: "2xs", md: "xs" }}
                fontWeight="700"
                color={labelColor}
                textTransform="uppercase"
                letterSpacing="wide"
                mb={{ base: 2, md: 2.5 }}
            >
                <Box as="span" display={{ base: "none", sm: "inline" }}>
                    Generation Queue ({entries.length}/3)
                </Box>
                <Box as="span" display={{ base: "inline", sm: "none" }}>
                    Queue ({entries.length}/3)
                </Box>
            </Text>

            {/* 3 equal-width slots - stack on very small screens, row on larger */}
            <HStack
                gap={0}
                w="100%"
                display={{ base: "flex", sm: "flex" }}
                flexDirection={{ base: "column", sm: "row" }}
            >
                {slots[0]}
                <Box
                    w={{ base: "100%", sm: "1px" }}
                    h={{ base: "1px", sm: "100%" }}
                    bg={barBorder}
                    flexShrink={0}
                    my={{ base: 0.5, sm: 0 }}
                />
                {slots[1]}
                <Box
                    w={{ base: "100%", sm: "1px" }}
                    h={{ base: "1px", sm: "100%" }}
                    bg={barBorder}
                    flexShrink={0}
                    my={{ base: 0.5, sm: 0 }}
                />
                {slots[2]}
            </HStack>
        </Box>
    );
};

export default GenerationQueueBar;