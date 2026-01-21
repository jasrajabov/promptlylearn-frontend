import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
    Alert,
    Link,
    Spinner,
    Card,
    Box,
    Text,
    VStack,
    HStack,
    Checkbox,
    Button,
} from "@chakra-ui/react";
import { Toaster } from "../components/ui/toaster";
import CodeBlock from "./CodeBlock.tsx";
import { useColorModeValue } from "../components/ui/color-mode";
import {
    Sparkles,
    AlertCircle,
    CheckCircle2,
    MessageCircle,
    Lightbulb,
} from "lucide-react";

interface StreamingProps {
    apiUrl: string;
    body: {
        lesson_id: string;
        module_id?: string;
        course_id?: string;
        token?: string;
    };
    content?: string;
    isGenerating: boolean;
    setIsGenerating: (val: boolean) => void;
    shouldStartGeneration?: boolean;
    onGenerationComplete?: () => void;
    onAskAI?: (selectedText: string) => void;
}

const OpenAIStreamingMarkdown: React.FC<StreamingProps> = ({
    apiUrl,
    body,
    content: initialContent,
    isGenerating = false,
    setIsGenerating,
    shouldStartGeneration = false,
    onGenerationComplete,
    onAskAI,
}) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creditInfo, setCreditInfo] = useState<string | null>(null);
    const contentRef = useRef<string>("");

    // Track if streaming is currently in progress to prevent duplicates
    const isStreamingRef = useRef(false);

    // Selection tooltip state
    const [selectedText, setSelectedText] = useState<string>("");
    const [tooltipPosition, setTooltipPosition] = useState<{
        x: number;
        y: number;
    } | null>(null);

    // Theme-aware colors
    const tealTextColor = useColorModeValue("teal.700", "teal.300");
    const cardBg = useColorModeValue("white", "#000000");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const mutedTextColor = useColorModeValue("gray.600", "gray.400");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const emptyStateBg = useColorModeValue("teal.50", "teal.900/20");
    const headingColor = useColorModeValue("gray.900", "white");
    const linkColor = useColorModeValue("teal.600", "teal.400");
    const linkHoverColor = useColorModeValue("teal.700", "teal.300");
    const blockquoteBg = useColorModeValue("gray.50", "gray.800");
    const blockquoteBorder = useColorModeValue("teal.500", "teal.400");
    const tableBorder = useColorModeValue("gray.200", "gray.700");
    const tableHeaderBg = useColorModeValue("gray.50", "gray.800");
    const tableStripeBg = useColorModeValue("gray.50", "gray.900");
    const tableHoverBg = useColorModeValue("gray.100", "gray.800");
    const inlineCodeBg = useColorModeValue("#f7fafc", "#2d3748");
    const inlineCodeColor = useColorModeValue("#e53e3e", "#fc8181");
    const tooltipBg = useColorModeValue("white", "gray.800");
    const tooltipShadow = useColorModeValue(
        "0 4px 12px rgba(0, 0, 0, 0.15)",
        "0 4px 12px rgba(0, 0, 0, 0.5)",
    );

    // Reset content when lesson changes
    useEffect(() => {
        setContent(initialContent ?? null);
        isStreamingRef.current = false;
    }, [initialContent, body.lesson_id]);

    // Handle text selection
    const handleTextSelection = useCallback(() => {
        setTimeout(() => {
            const selection = window.getSelection();
            const text = selection?.toString().trim();

            if (text && text.length > 3) {
                setSelectedText(text);
                const range = selection?.getRangeAt(0);
                const rect = range?.getBoundingClientRect();

                if (rect) {
                    const x = rect.left + rect.width / 2;
                    const y = rect.top - 50;
                    setTooltipPosition({ x, y });
                }
            } else {
                setSelectedText("");
                setTooltipPosition(null);
            }
        }, 10);
    }, []);

    // Handle asking AI about selected text
    const handleAskAI = useCallback(() => {
        if (selectedText && onAskAI) {
            onAskAI(`Can you explain this: "${selectedText}"`);
            window.getSelection()?.removeAllRanges();
            setSelectedText("");
            setTooltipPosition(null);
        }
    }, [selectedText, onAskAI]);

    // Handle clicking outside to close tooltip
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                tooltipPosition &&
                !(e.target as HTMLElement).closest(".selection-tooltip")
            ) {
                setSelectedText("");
                setTooltipPosition(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [tooltipPosition]);

    const startStreaming = useCallback(async () => {
        // Prevent duplicate streaming attempts
        if (isStreamingRef.current) {
            return;
        }

        isStreamingRef.current = true;

        if (initialContent) setContent(null);
        setIsGenerating(true);
        setError(null);
        setCreditInfo(null);
        contentRef.current = "";

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.body) throw new Error("Stream response has no body.");

            if (!response.ok) {
                const respJson = await response.json();
                if (response.status === 402) {
                    console.error("Not enough credits to generate content.");
                    setCreditInfo(respJson.detail || "Not enough credits");
                    setIsGenerating(false);
                    isStreamingRef.current = false;

                    // Call onGenerationComplete to reset the trigger
                    if (onGenerationComplete) onGenerationComplete();
                    return;
                }

                throw new Error(
                    respJson.detail || `Request failed with status: ${response.status}`,
                );
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let buffer = "";

            // Batch updates to reduce re-renders
            const updateInterval = setInterval(() => {
                if (buffer) {
                    contentRef.current += buffer;
                    setContent(contentRef.current);
                    buffer = "";
                }
            }, 100);

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value);
                    buffer += chunk;
                }
            }

            clearInterval(updateInterval);
            if (buffer) {
                contentRef.current += buffer;
                setContent(contentRef.current);
            }

            if (onGenerationComplete) onGenerationComplete();
        } catch (err) {
            console.error("Error during streaming:", err);
            setError(
                err instanceof Error ? err.message : "Failed to stream content.",
            );
        } finally {
            setIsGenerating(false);
            isStreamingRef.current = false;
        }
    }, [apiUrl, body, initialContent, setIsGenerating, onGenerationComplete]);

    useEffect(() => {
        // Start generation if triggered and not already streaming
        if (shouldStartGeneration && !isStreamingRef.current) {
            startStreaming();
        }
    }, [shouldStartGeneration, startStreaming]);

    const components: Components = useMemo(
        () => ({
            code: ({ inline, className, children }: any) => {
                const match = /language-(\w+)/.exec(className || "");
                const lang = match ? match[1] : "";
                const codeText = String(children).replace(/\n$/, "");

                if (!inline && lang) {
                    return <CodeBlock lang={lang} code={codeText} />;
                }

                return (
                    <Box
                        as="code"
                        bg={inlineCodeBg}
                        color={inlineCodeColor}
                        px="0.4em"
                        py="0.2em"
                        borderRadius="3px"
                        fontSize="0.9em"
                        fontFamily="'Fira Code', 'Courier New', monospace"
                    >
                        {children}
                    </Box>
                );
            },

            h1: ({ children }) => (
                <Text
                    as="h1"
                    fontSize={{ base: "2xl", md: "3xl" }}
                    fontWeight="bold"
                    color={headingColor}
                    mt={8}
                    mb={4}
                    pb={2}
                    borderBottom="2px solid"
                    borderColor={borderColor}
                >
                    {children}
                </Text>
            ),
            h2: ({ children }) => (
                <Text
                    as="h2"
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="bold"
                    color={headingColor}
                    mt={6}
                    mb={3}
                >
                    {children}
                </Text>
            ),
            h3: ({ children }) => (
                <Text
                    as="h3"
                    fontSize={{ base: "lg", md: "xl" }}
                    fontWeight="semibold"
                    color={headingColor}
                    mt={5}
                    mb={2}
                >
                    {children}
                </Text>
            ),
            h4: ({ children }) => (
                <Text
                    as="h4"
                    fontSize="lg"
                    fontWeight="semibold"
                    color={headingColor}
                    mt={4}
                    mb={2}
                >
                    {children}
                </Text>
            ),
            h5: ({ children }) => (
                <Text
                    as="h5"
                    fontSize="md"
                    fontWeight="semibold"
                    color={headingColor}
                    mt={3}
                    mb={2}
                >
                    {children}
                </Text>
            ),
            h6: ({ children }) => (
                <Text
                    as="h6"
                    fontSize="sm"
                    fontWeight="semibold"
                    color={headingColor}
                    mt={3}
                    mb={2}
                >
                    {children}
                </Text>
            ),

            p: ({ children }) => (
                <Text color={textColor} lineHeight="1.8" mb={4} fontSize="md">
                    {children}
                </Text>
            ),

            a: ({ href, children }) => (
                <Link
                    href={href}
                    color={linkColor}
                    textDecoration="underline"
                    _hover={{
                        color: linkHoverColor,
                        textDecoration: "none",
                    }}
                    fontWeight="medium"
                >
                    {children}
                </Link>
            ),

            ul: ({ children }) => (
                <Box
                    as="ul"
                    pl={6}
                    mb={4}
                    color={textColor}
                    css={{
                        listStyleType: "disc",
                        "& li": {
                            marginBottom: "0.5rem",
                            lineHeight: "1.7",
                        },
                    }}
                >
                    {children}
                </Box>
            ),
            ol: ({ children }) => (
                <Box
                    as="ol"
                    pl={6}
                    mb={4}
                    color={textColor}
                    css={{
                        listStyleType: "decimal",
                        "& li": {
                            marginBottom: "0.5rem",
                            lineHeight: "1.7",
                        },
                    }}
                >
                    {children}
                </Box>
            ),

            blockquote: ({ children }) => (
                <Box
                    borderLeft="4px solid"
                    borderColor={blockquoteBorder}
                    bg={blockquoteBg}
                    pl={4}
                    py={2}
                    my={4}
                    fontStyle="italic"
                    color={mutedTextColor}
                >
                    {children}
                </Box>
            ),

            table: ({ children }) => (
                <Box overflowX="auto" mb={4}>
                    <Box
                        as="table"
                        width="full"
                        borderWidth="1px"
                        borderColor={tableBorder}
                        borderRadius="md"
                        css={{
                            borderCollapse: "collapse",
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            ),
            thead: ({ children }) => (
                <Box as="thead" bg={tableHeaderBg}>
                    {children}
                </Box>
            ),
            tbody: ({ children }) => <Box as="tbody">{children}</Box>,
            tr: ({ children, node }) => {
                const index = node?.position?.start?.line || 0;
                const isEven = index % 2 === 0;

                return (
                    <Box
                        as="tr"
                        bg={isEven ? tableStripeBg : "transparent"}
                        _hover={{ bg: tableHoverBg }}
                        transition="background 0.2s"
                    >
                        {children}
                    </Box>
                );
            },
            th: ({ children }) => (
                <Box
                    as="th"
                    px={4}
                    py={3}
                    textAlign="left"
                    fontWeight="semibold"
                    color={headingColor}
                    borderBottom="2px solid"
                    borderColor={tableBorder}
                    fontSize="sm"
                >
                    {children}
                </Box>
            ),
            td: ({ children }) => (
                <Box
                    as="td"
                    px={4}
                    py={3}
                    color={textColor}
                    borderBottom="1px solid"
                    borderColor={tableBorder}
                    fontSize="sm"
                >
                    {children}
                </Box>
            ),

            hr: () => (
                <Box as="hr" my={6} borderColor={borderColor} borderWidth="1px" />
            ),

            strong: ({ children }) => (
                <Text as="strong" fontWeight="bold" color={headingColor}>
                    {children}
                </Text>
            ),

            em: ({ children }) => (
                <Text as="em" fontStyle="italic">
                    {children}
                </Text>
            ),

            input: (props: any) => {
                const { checked, disabled, type } = props;

                if (type === "checkbox") {
                    return (
                        <Checkbox.Root
                            defaultChecked={checked}
                            disabled={disabled}
                            mr={2}
                            colorPalette="teal"
                        />
                    );
                }
                return <input {...props} />;
            },
        }),
        [
            inlineCodeBg,
            inlineCodeColor,
            headingColor,
            borderColor,
            textColor,
            linkColor,
            linkHoverColor,
            blockquoteBg,
            blockquoteBorder,
            tableBorder,
            tableHeaderBg,
            tableStripeBg,
            tableHoverBg,
            mutedTextColor,
        ],
    );

    return (
        <VStack align="stretch" gap={4} w="full">
            <Toaster />

            {/* Error Alert */}
            {error && (
                <Alert.Root status="error" borderRadius="lg">
                    <Alert.Indicator />
                    <Box flex="1">
                        <Alert.Title>Generation Failed</Alert.Title>
                        <Alert.Description>{error}</Alert.Description>
                    </Box>
                </Alert.Root>
            )}

            {/* Credit Warning Alert */}
            {creditInfo && (
                <Alert.Root status="warning" borderRadius="lg">
                    <Alert.Indicator />
                    <Box flex="1">
                        <Alert.Title>{creditInfo}</Alert.Title>
                    </Box>
                    <Link
                        href="/upgrade"
                        fontWeight="semibold"
                        color={tealTextColor}
                        _hover={{ textDecoration: "underline" }}
                    >
                        Upgrade Now →
                    </Link>
                </Alert.Root>
            )}

            {/* Empty State */}
            {!content && !isGenerating && !error && (
                <Card.Root
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                >
                    <Card.Body>
                        <VStack gap={4} py={12} textAlign="center">
                            <Box p={4} borderRadius="full" bg={emptyStateBg}>
                                <Sparkles
                                    size={32}
                                    color={useColorModeValue("#319795", "#4fd1c5")}
                                />
                            </Box>
                            <VStack gap={2}>
                                <Text fontSize="lg" fontWeight="semibold" color={headingColor}>
                                    Ready to Learn?
                                </Text>
                                <Text fontSize="sm" color={mutedTextColor} maxW="md">
                                    Click the "Generate Content" button above to create your
                                    personalized lesson content with AI.
                                </Text>
                            </VStack>
                            <HStack gap={2} mt={2}>
                                <AlertCircle
                                    size={16}
                                    color={useColorModeValue("#3182ce", "#63b3ed")}
                                />
                                <Text fontSize="xs" color={mutedTextColor}>
                                    Content generation typically takes 10-30 seconds
                                </Text>
                            </HStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}

            {/* Streaming Indicator */}
            {isGenerating && !content && (
                <Card.Root
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                >
                    <Card.Body>
                        <VStack gap={4} py={8} textAlign="center">
                            <Spinner size="xl" color="teal.500" />
                            <VStack gap={1}>
                                <Text fontWeight="semibold" color={headingColor}>
                                    Generating your lesson...
                                </Text>
                                <Text fontSize="sm" color={mutedTextColor}>
                                    This may take a moment
                                </Text>
                            </VStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}

            {/* Markdown Content */}
            {content && (
                <Card.Root
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                >
                    <Card.Body p={{ base: 4, md: 8 }}>
                        {onAskAI && (
                            <Alert.Root status="info" mb={4} size="sm">
                                <Alert.Indicator>
                                    <Lightbulb size={16} />
                                </Alert.Indicator>
                                <Text fontSize="sm">
                                    💡 <strong>Tip:</strong> Highlight any text to ask AI Buddy
                                    for clarification!
                                </Text>
                            </Alert.Root>
                        )}

                        <Box
                            className="markdown-content"
                            onMouseUp={onAskAI ? handleTextSelection : undefined}
                            css={{
                                "& > *:first-of-type": {
                                    marginTop: 0,
                                },
                                "& > *:last-child": {
                                    marginBottom: 0,
                                },
                                userSelect: "text",
                                cursor: "text",
                            }}
                        >
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                components={components}
                            >
                                {content}
                            </ReactMarkdown>
                        </Box>

                        {/* Streaming indicator */}
                        {isGenerating && (
                            <HStack mt={4} gap={2} color={mutedTextColor} fontSize="sm">
                                <Spinner size="sm" color="teal.500" />
                                <Text>Generating...</Text>
                            </HStack>
                        )}

                        {/* Completion indicator */}
                        {!isGenerating && content && (
                            <HStack mt={4} gap={2} color="green.500" fontSize="sm">
                                <CheckCircle2 size={16} />
                                <Text>Content generated successfully</Text>
                            </HStack>
                        )}
                    </Card.Body>
                </Card.Root>
            )}

            {/* Selection Tooltip - Fixed positioning with smooth animation */}
            {tooltipPosition && selectedText && onAskAI && (
                <Box
                    className="selection-tooltip"
                    position="fixed"
                    left={`${tooltipPosition.x}px`}
                    top={`${tooltipPosition.y}px`}
                    transform="translate(-50%, 0)"
                    zIndex={10000}
                    bg={tooltipBg}
                    borderRadius="lg"
                    boxShadow={tooltipShadow}
                    borderWidth="2px"
                    borderColor="teal.500"
                    p={2}
                    pointerEvents="auto"
                    animation="tooltipFadeIn 0.15s ease-out"
                    css={{
                        "@keyframes tooltipFadeIn": {
                            "0%": {
                                opacity: 0,
                                transform: "translate(-50%, 10px) scale(0.95)",
                            },
                            "100%": {
                                opacity: 1,
                                transform: "translate(-50%, 0) scale(1)",
                            },
                        },
                    }}
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