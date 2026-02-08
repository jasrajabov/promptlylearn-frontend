import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
    Link,
    Card,
    Box,
    Text,
    VStack,
    HStack,
    Checkbox,
    Button,
    Spinner
} from "@chakra-ui/react";
import { Toaster } from "./ui/toaster";
import CodeBlock from "./CodeBlock.tsx";
import { useColorModeValue } from "./ui/color-mode";
import { getOrCreateStore } from "../hooks/streamRunner";
import {
    Sparkles,
    AlertCircle,
    CheckCircle2,
    MessageCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface StreamingProps {
    content?: string;
    lessonKey: string;
    isGenerating: boolean;
    onAskAI?: (selectedText: string) => void;
    /** Current font size in px, controlled by parent */
    fontSize: number;
    /** Callback to update font size */
    onFontSizeChange: (size: number) => void;
}

// ---------------------------------------------------------------------------
// Theme — single object, computed once per color-mode flip, not per chunk.
// ---------------------------------------------------------------------------
function useTheme() {
    // We only call useColorModeValue twice: one boolean to know which palette,
    // then derive the whole object from that. This keeps hook count constant and minimal.
    const isDark = useColorModeValue(false, true);

    return useMemo(() => {
        if (isDark) {
            return {
                cardBg: "#000000",
                textColor: "gray.100",
                mutedTextColor: "gray.400",
                borderColor: "gray.700",
                emptyStateBg: "teal.900/20",
                headingColor: "white",
                linkColor: "teal.400",
                linkHoverColor: "teal.300",
                blockquoteBg: "gray.800",
                blockquoteBorder: "teal.400",
                tableBorder: "gray.700",
                tableHeaderBg: "gray.800",
                tableStripeBg: "gray.900",
                tableHoverBg: "gray.800",
                inlineCodeBg: "#2d3748",
                inlineCodeColor: "#fc8181",
                tooltipBg: "gray.950",
                tooltipShadow: "0 4px 12px rgba(0,0,0,0.5)",
                sparkleColor: "#4fd1c5",
                infoIconColor: "#63b3ed",
                tealTextColor: "teal.300",
            } as const;
        }
        return {
            cardBg: "white",
            textColor: "gray.800",
            mutedTextColor: "gray.600",
            borderColor: "gray.200",
            emptyStateBg: "teal.50",
            headingColor: "gray.900",
            linkColor: "teal.600",
            linkHoverColor: "teal.700",
            blockquoteBg: "gray.50",
            blockquoteBorder: "teal.500",
            tableBorder: "gray.200",
            tableHeaderBg: "gray.50",
            tableStripeBg: "gray.50",
            tableHoverBg: "gray.100",
            inlineCodeBg: "#f7fafc",
            inlineCodeColor: "#e53e3e",
            tooltipBg: "white",
            tooltipShadow: "0 4px 12px rgba(0,0,0,0.15)",
            sparkleColor: "#319795",
            infoIconColor: "#3182ce",
            tealTextColor: "teal.700",
        } as const;
    }, [isDark]);
}

// ---------------------------------------------------------------------------
// Markdown components — built once per theme change, never on chunk updates.
// ---------------------------------------------------------------------------
function useMarkdownComponents(t: ReturnType<typeof useTheme>, fontSize: number) {
    return useMemo<Components>(() => {
        // All sizes are multipliers of the user-chosen base fontSize.
        const px = (mult: number) => `${fontSize * mult}px`;

        return {
            code: ({ inline, className, children }: any) => {
                const match = /language-(\w+)/.exec(className || "");
                const lang = match ? match[1] : "";
                const codeText = String(children).replace(/\n$/, "");
                if (!inline && lang) return <CodeBlock lang={lang} code={codeText} />;
                return (
                    <Box as="code" bg={t.inlineCodeBg} color={t.inlineCodeColor} px="0.4em" py="0.2em" borderRadius="3px" style={{ fontSize: px(0.9) }} fontFamily="'Fira Code', 'Courier New', monospace">
                        {children}
                    </Box>
                );
            },
            h1: ({ children }) => (<Text as="h1" style={{ fontSize: px(2) }} fontWeight="bold" color={t.headingColor} mt={8} mb={4} pb={2} borderBottom="2px solid" borderColor={t.borderColor}>{children}</Text>),
            h2: ({ children }) => (<Text as="h2" style={{ fontSize: px(1.75) }} fontWeight="bold" color={t.headingColor} mt={6} mb={3}>{children}</Text>),
            h3: ({ children }) => (<Text as="h3" style={{ fontSize: px(1.5) }} fontWeight="semibold" color={t.headingColor} mt={5} mb={2}>{children}</Text>),
            h4: ({ children }) => (<Text as="h4" style={{ fontSize: px(1.25) }} fontWeight="semibold" color={t.headingColor} mt={4} mb={2}>{children}</Text>),
            h5: ({ children }) => (<Text as="h5" style={{ fontSize: px(1.1) }} fontWeight="semibold" color={t.headingColor} mt={3} mb={2}>{children}</Text>),
            h6: ({ children }) => (<Text as="h6" style={{ fontSize: px(1) }} fontWeight="semibold" color={t.headingColor} mt={3} mb={2}>{children}</Text>),
            p: ({ children }) => (<Text color={t.textColor} lineHeight="1.8" mb={4} style={{ fontSize: px(1) }}>{children}</Text>),
            a: ({ href, children }) => (<Link href={href} color={t.linkColor} textDecoration="underline" _hover={{ color: t.linkHoverColor, textDecoration: "none" }} fontWeight="medium">{children}</Link>),
            ul: ({ children }) => (<Box as="ul" pl={6} mb={4} color={t.textColor} style={{ fontSize: px(1) }} css={{ listStyleType: "disc", "& li": { marginBottom: "0.5rem", lineHeight: "1.7" } }}>{children}</Box>),
            ol: ({ children }) => (<Box as="ol" pl={6} mb={4} color={t.textColor} style={{ fontSize: px(1) }} css={{ listStyleType: "decimal", "& li": { marginBottom: "0.5rem", lineHeight: "1.7" } }}>{children}</Box>),
            blockquote: ({ children }) => (<Box borderLeft="4px solid" borderColor={t.blockquoteBorder} bg={t.blockquoteBg} pl={4} py={2} my={4} fontStyle="italic" color={t.mutedTextColor} style={{ fontSize: px(1) }}>{children}</Box>),
            table: ({ children }) => (<Box overflowX="auto" mb={4}><Box as="table" width="full" borderWidth="1px" borderColor={t.tableBorder} borderRadius="md" css={{ borderCollapse: "collapse" }}>{children}</Box></Box>),
            thead: ({ children }) => (<Box as="thead" bg={t.tableHeaderBg}>{children}</Box>),
            tbody: ({ children }) => <Box as="tbody">{children}</Box>,
            tr: ({ children, node }) => {
                const index = node?.position?.start?.line || 0;
                return (<Box as="tr" bg={index % 2 === 0 ? t.tableStripeBg : "transparent"} _hover={{ bg: t.tableHoverBg }} transition="background 0.2s">{children}</Box>);
            },
            th: ({ children }) => (<Box as="th" px={4} py={3} textAlign="left" fontWeight="semibold" color={t.headingColor} borderBottom="2px solid" borderColor={t.tableBorder} style={{ fontSize: px(0.875) }}>{children}</Box>),
            td: ({ children }) => (<Box as="td" px={4} py={3} color={t.textColor} borderBottom="1px solid" borderColor={t.tableBorder} style={{ fontSize: px(0.875) }}>{children}</Box>),
            hr: () => (<Box as="hr" my={6} borderColor={t.borderColor} borderWidth="1px" />),
            strong: ({ children }) => (<Text as="strong" fontWeight="bold" color={t.headingColor}>{children}</Text>),
            em: ({ children }) => (<Text as="em" fontStyle="italic">{children}</Text>),
            input: (props: any) => {
                if (props.type === "checkbox") return <Checkbox.Root defaultChecked={props.checked} disabled={props.disabled} mr={2} colorPalette="teal" />;
                return <input {...props} />;
            },
            pre: ({ children }) => <>{children}</>,
        };
    }, [t, fontSize]);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const OpenAIStreamingMarkdown: React.FC<StreamingProps> = ({
    content: initialContent,
    lessonKey,
    isGenerating,
    onAskAI,
    fontSize,
    onFontSizeChange,
}) => {
    const t = useTheme();
    const components = useMarkdownComponents(t, fontSize);

    // ---------------------------------------------------------------------------
    // Content state
    // ---------------------------------------------------------------------------
    const [content, setContent] = useState<string | null>(() => {
        const store = getOrCreateStore(lessonKey);
        if (store.content.length > 0) return store.content;
        return initialContent ?? null;
    });

    // Stable ref to setContent so the store listener never changes identity
    const setContentRef = useRef(setContent);
    setContentRef.current = setContent;

    // ---------------------------------------------------------------------------
    // Subscribe to shared store
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const store = getOrCreateStore(lessonKey);

        // Sync current value immediately
        if (store.content.length > 0) {
            setContent(store.content);
        } else if (!isGenerating) {
            setContent(initialContent ?? null);
        }

        // Stable listener — never a new function reference, so add/delete is a no-op
        // on subsequent effect runs for the same lessonKey.
        const listener = (c: string) => {
            setContentRef.current(c.length > 0 ? c : null);
        };
        store.listeners.add(listener);

        return () => {
            store.listeners.delete(listener);
        };
    }, [lessonKey, initialContent, isGenerating]);

    // ---------------------------------------------------------------------------
    // Text selection & AI Buddy tooltip
    // ---------------------------------------------------------------------------
    const [selectedText, setSelectedText] = useState<string>("");
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

    const handleTextSelection = useCallback(() => {
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();
            if (text && text.length > 3) {
                setSelectedText(text);
                const range = selection?.getRangeAt(0);
                const rect = range?.getBoundingClientRect();
                if (rect) {
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 50 });
                }
            } else {
                setSelectedText("");
                setTooltipPosition(null);
            }
        }, 10);
    }, []);

    const handleAskAI = useCallback(() => {
        if (selectedText && onAskAI) {
            onAskAI(`Can you explain this: "${selectedText}"`);
            window.getSelection()?.removeAllRanges();
            setSelectedText("");
            setTooltipPosition(null);
        }
    }, [selectedText, onAskAI]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (tooltipPosition && !(e.target as HTMLElement).closest(".selection-tooltip")) {
                setSelectedText("");
                setTooltipPosition(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [tooltipPosition]);

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <VStack align="stretch" gap={4} w="full">
            <Toaster />

            {/* Empty state */}
            {!content && !isGenerating && (
                <Card.Root bg={t.cardBg} borderRadius="xl" borderWidth="1px" borderColor={t.borderColor}>
                    <Card.Body>
                        <VStack gap={4} py={12} textAlign="center">
                            <Box p={4} borderRadius="full" bg={t.emptyStateBg}><Sparkles size={32} color={t.sparkleColor} /></Box>
                            <VStack gap={2}>
                                <Text fontSize="lg" fontWeight="semibold" color={t.headingColor}>Ready to Learn?</Text>
                                <Text fontSize="sm" color={t.mutedTextColor} maxW="md">Click the "Generate Content" button above to create your personalized lesson content with AI.</Text>
                            </VStack>
                            <HStack gap={2} mt={2}>
                                <AlertCircle size={16} color={t.infoIconColor} />
                                <Text fontSize="xs" color={t.mutedTextColor}>Content generation typically takes 10-30 seconds</Text>
                            </HStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}

            {/* Spinner */}
            {isGenerating && !content && (
                <Card.Root bg={t.cardBg} borderRadius="xl" borderWidth="1px" borderColor={t.borderColor}>
                    <Card.Body>
                        <VStack gap={4} py={8} textAlign="center">
                            <Spinner size="xl" />
                            <VStack gap={1}>
                                <Text fontWeight="semibold" color={t.headingColor}>Generating your lesson…</Text>
                                <Text fontSize="sm" color={t.mutedTextColor}>This may take a moment</Text>
                            </VStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}

            {/* Markdown content */}
            {content && (
                <Box position="relative">
                    <Card.Root bg={t.cardBg} borderRadius="xl" borderWidth="1px" borderColor={t.borderColor}>
                        <Card.Body p={{ base: 4, md: 8 }}>

                            {/* {onAskAI && (
                                <Alert.Root status="info" mb={4} size="sm">
                                    <Alert.Indicator><Lightbulb size={16} /></Alert.Indicator>
                                    <Text fontSize="sm">💡 <strong>Tip:</strong> Highlight any text to ask AI Buddy for clarification!</Text>
                                </Alert.Root>
                            )} */}
                            {/* Font-size pill — pinned bottom-right, compact */}
                            <Box
                                display="flex"
                                alignItems="center"
                                width="80px"
                                gap="20px"
                                bg={t.tooltipBg}
                                boxShadow={t.tooltipShadow}
                                borderRadius="full"
                                border="1px solid"
                                borderColor={t.borderColor}
                                px="6px"
                                py="3px"
                                mb={2}
                                zIndex={10}
                            >
                                <Box
                                    as="button"
                                    onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
                                    // disabled={fontSize <= 12}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    w="22px"
                                    h="22px"
                                    borderRadius="full"
                                    border="none"
                                    bg="transparent"
                                    color={t.mutedTextColor}
                                    cursor={fontSize <= 12 ? "not-allowed" : "pointer"}
                                    opacity={fontSize <= 12 ? 0.35 : 1}
                                    _hover={{ bg: t.blockquoteBg }}
                                    style={{ fontSize: "11px", fontWeight: 700, fontFamily: "sans-serif", transition: "background 0.15s" }}
                                >
                                    A−
                                </Box>
                                <Box
                                    as="button"
                                    onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                                    // disabled={fontSize >= 24}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    w="22px"
                                    h="22px"
                                    borderRadius="full"
                                    border="none"
                                    bg="transparent"
                                    color={t.mutedTextColor}
                                    cursor={fontSize >= 24 ? "not-allowed" : "pointer"}
                                    opacity={fontSize >= 24 ? 0.35 : 1}
                                    _hover={{ bg: t.blockquoteBg }}
                                    style={{ fontSize: "13px", fontWeight: 700, fontFamily: "sans-serif", transition: "background 0.15s" }}
                                >
                                    A+
                                </Box>
                            </Box>
                            <Box
                                className="markdown-content"
                                onMouseUp={onAskAI ? handleTextSelection : undefined}
                                css={{ "& > *:first-of-type": { marginTop: 0 }, "& > *:last-child": { marginBottom: 0 }, userSelect: "text", cursor: "text" }}
                            >
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
                                    {content}
                                </ReactMarkdown>
                            </Box>

                            {isGenerating && (
                                <HStack mt={4} gap={2} color={t.mutedTextColor} fontSize="sm">
                                    <Spinner size="sm" />
                                    <Text>Generating…</Text>
                                </HStack>
                            )}

                            {!isGenerating && content && (
                                <HStack mt={4} gap={2} color="green.500" fontSize="sm">
                                    <CheckCircle2 size={14} />
                                    <Text>Content generated successfully</Text>
                                </HStack>
                            )}
                        </Card.Body>
                    </Card.Root>


                </Box>
            )}

            {/* Selection tooltip */}
            {tooltipPosition && selectedText && onAskAI && (
                <Box
                    className="selection-tooltip"
                    position="fixed"
                    left={`${tooltipPosition.x}px`}
                    top={`${tooltipPosition.y}px`}
                    transform="translate(-50%, 0)"
                    zIndex={10000}
                    bg={t.tooltipBg}
                    borderRadius="lg"
                    boxShadow={t.tooltipShadow}
                    borderWidth="2px"
                    borderColor="teal.500"
                    p={2}
                    pointerEvents="auto"
                    animation="tooltipFadeIn 0.15s ease-out"
                    css={{ "@keyframes tooltipFadeIn": { "0%": { opacity: 0, transform: "translate(-50%, 10px) scale(0.95)" }, "100%": { opacity: 1, transform: "translate(-50%, 0) scale(1)" } } }}
                >
                    <Button size="sm" colorPalette="teal" onClick={handleAskAI}>
                        <MessageCircle size={14} style={{ marginRight: "6px" }} />
                        Ask AI Buddy
                    </Button>
                </Box>
            )}
        </VStack>
    );
};

export default OpenAIStreamingMarkdown;