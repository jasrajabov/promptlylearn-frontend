import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import "./tutorialMarkdown.css";
import { Alert, Link, Spinner, Card, Box, Text, VStack, HStack } from "@chakra-ui/react";
import CodeBlock from "./CodeBlock.tsx";
import { useColorModeValue } from "../components/ui/color-mode";
import "./LessonCard.css";
import { Sparkles, AlertCircle } from "lucide-react";

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

    const tealTextColor = useColorModeValue("teal.700", "teal.300");

    useEffect(() => {
        setContent(initialContent ?? null);
    }, [initialContent]);

    const startStreaming = useCallback(async () => {
        if (initialContent) setContent(null);
        setIsGenerating(true);
        setError(null);
        setCreditInfo(null);

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

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value);
                    setContent((prev) => (prev || "") + chunk);
                }
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

    const components: Components = {
        code: ({ inline, className, children, ...props }: any) => {
            const lang = className?.replace("language-", "");
            const codeText = String(children).replace(/\n$/, "");

            if (!inline && lang) {
                return <CodeBlock lang={lang} code={codeText} />;
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
    };

    return (
        <VStack align="stretch" gap={4} w="full">
            {/* Alerts */}
            {error && (
                <Alert.Root status="error">
                    <Alert.Indicator />
                    <Box flex="1">
                        <Alert.Title>Generation Failed</Alert.Title>
                        <Alert.Description>{error}</Alert.Description>
                    </Box>
                </Alert.Root>
            )}

            {creditInfo && (
                <Alert.Root status="warning">
                    <Alert.Indicator />
                    <Box flex="1">
                        <Alert.Title>{creditInfo}</Alert.Title>
                    </Box>
                    <Link
                        href="/upgrade"
                        fontWeight="semibold"
                        color={tealTextColor}
                    >
                        Upgrade Now →
                    </Link>
                </Alert.Root>
            )}

            {/* Empty State */}
            {!content && !isGenerating && !error && (
                <Card.Root>
                    <Card.Body>
                        <VStack gap={4} py={12} textAlign="center">
                            <Box
                                p={4}
                                borderRadius="full"
                                bg="teal.100"
                                _dark={{ bg: "teal.900/30" }}
                            >
                                <Sparkles className="w-8 h-8 text-teal-600" />
                            </Box>
                            <VStack gap={2}>
                                <Text fontSize="lg" fontWeight="semibold" color="gray.800" _dark={{ color: "white" }}>
                                    Ready to Learn?
                                </Text>
                                <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }} maxW="md">
                                    Click the "Generate Content" button above to create your personalized lesson content with AI.
                                </Text>
                            </VStack>
                            <HStack gap={2} mt={2}>
                                <AlertCircle className="w-4 h-4 text-blue-500" />
                                <Text fontSize="xs" color="gray.500">
                                    Content generation typically takes 10-30 seconds
                                </Text>
                            </HStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}

            {/* Streaming Indicator */}
            {isGenerating && !content && (
                <Card.Root>
                    <Card.Body>
                        <VStack gap={4} py={8} textAlign="center">
                            <Spinner size="xl" color="teal.500" />
                            <VStack gap={1}>
                                <Text fontWeight="semibold" color="gray.800" _dark={{ color: "white" }}>
                                    Generating your lesson...
                                </Text>
                                <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                                    This may take a moment
                                </Text>
                            </VStack>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            )}

            {/* Markdown Content */}
            {content && (
                <Card.Root>
                    <Card.Body>
                        <div className="tutorial-md">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={components}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    </Card.Body>
                </Card.Root>
            )}
        </VStack>
    );
};

export default OpenAIStreamingMarkdown;