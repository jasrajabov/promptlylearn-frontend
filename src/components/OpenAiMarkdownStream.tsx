import React, { useEffect, useState, useCallback, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import type { Element } from "hast";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Alert, Link, Spinner, Card, Box, Text, VStack, HStack, Checkbox } from "@chakra-ui/react";
import CodeBlock from "./CodeBlock.tsx";
import { useColorModeValue } from "../components/ui/color-mode";
import { Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";

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
}

const OpenAIStreamingMarkdown: React.FC<StreamingProps> = ({
    apiUrl,
    body,
    content: initialContent,
    isGenerating = false,
    setIsGenerating,
    shouldStartGeneration = false,
    onGenerationComplete,
}) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creditInfo, setCreditInfo] = useState<string | null>(null);
    const contentRef = React.useRef<string>("");

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

    useEffect(() => {
        setContent(initialContent ?? null);
    }, [initialContent]);

    const startStreaming = useCallback(async () => {
        if (initialContent) setContent(null);
        setIsGenerating(true);
        setError(null);
        setCreditInfo(null);
        contentRef.current = "";

        try {
            console.log("Starting streaming request to:", apiUrl, "with body:", body);
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.body) throw new Error("Stream response has no body.");

            if (!response.ok) {
                const respJson = await response.json();
                console.log("Error response:", respJson);

                if (response.status === 402) {
                    console.error("Not enough credits to generate content.");
                    setCreditInfo(respJson.detail || "Not enough credits");
                    return;
                }

                throw new Error(respJson.detail || `Request failed with status: ${response.status}`);
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
            }, 100); // Update every 100ms instead of on every chunk

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value);
                    buffer += chunk;
                }
            }

            // Final update with any remaining buffer
            clearInterval(updateInterval);
            if (buffer) {
                contentRef.current += buffer;
                setContent(contentRef.current);
            }

            if (onGenerationComplete) onGenerationComplete();
        } catch (err) {
            console.error("Error during streaming:", err);
            setError(err instanceof Error ? err.message : "Failed to stream content.");
        } finally {
            if (setIsGenerating) setIsGenerating(false);
        }
    }, [apiUrl, body, initialContent, setIsGenerating, onGenerationComplete]);

    useEffect(() => {
        console.log("shouldStartGeneration changed:", shouldStartGeneration, isGenerating);
        if (shouldStartGeneration && !isGenerating) {
            console.log("Initiating streaming generation...");
            startStreaming();
        }
    }, [shouldStartGeneration, isGenerating, startStreaming]);

    const components: Components = useMemo(() => ({
        // Code blocks with syntax highlighting
        code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
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

        // Headings with proper sizing and spacing
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

        // Paragraphs
        p: ({ children }) => (
            <Text
                color={textColor}
                lineHeight="1.8"
                mb={4}
                fontSize="md"
            >
                {children}
            </Text>
        ),

        // Links
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

        // Lists
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

        // Blockquotes
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

        // Tables
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
        tbody: ({ children }) => (
            <Box as="tbody">
                {children}
            </Box>
        ),
        tr: ({ children, node }) => {
            // Determine if row is even based on its index
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

        // Horizontal rule
        hr: () => (
            <Box
                as="hr"
                my={6}
                borderColor={borderColor}
                borderWidth="1px"
            />
        ),

        // Strong/Bold
        strong: ({ children }) => (
            <Text as="strong" fontWeight="bold" color={headingColor}>
                {children}
            </Text>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
            <Text as="em" fontStyle="italic">
                {children}
            </Text>
        ),

        // Task list items (GitHub flavored markdown)
        input: (props: any) => {
            const { checked, disabled, type } = props;

            if (type === 'checkbox') {
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
    }), [
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
    ]);

    return (
        <VStack align="stretch" gap={4} w="full">
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
                <Card.Root bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                    <Card.Body>
                        <VStack gap={4} py={12} textAlign="center">
                            <Box
                                p={4}
                                borderRadius="full"
                                bg={emptyStateBg}
                            >
                                <Sparkles size={32} color={useColorModeValue("#319795", "#4fd1c5")} />
                            </Box>
                            <VStack gap={2}>
                                <Text fontSize="lg" fontWeight="semibold" color={headingColor}>
                                    Ready to Learn?
                                </Text>
                                <Text fontSize="sm" color={mutedTextColor} maxW="md">
                                    Click the "Generate Content" button above to create your personalized lesson content with AI.
                                </Text>
                            </VStack>
                            <HStack gap={2} mt={2}>
                                <AlertCircle size={16} color={useColorModeValue("#3182ce", "#63b3ed")} />
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
                <Card.Root bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
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
                <Card.Root bg={cardBg} borderRadius="xl" borderWidth="1px" borderColor={borderColor}>
                    <Card.Body p={{ base: 4, md: 8 }}>
                        <Box
                            className="markdown-content"
                            css={{
                                "& > *:first-of-type": {
                                    marginTop: 0,
                                },
                                "& > *:last-child": {
                                    marginBottom: 0,
                                },
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

                        {/* Streaming indicator while content is being generated */}
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
        </VStack>
    );
};

export default OpenAIStreamingMarkdown;