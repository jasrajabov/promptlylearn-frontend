// LessonCard.tsx
import React, { useState, useRef, useEffect } from "react";
import {
    Box,
    Heading,
    Textarea,
    Button,
    Text,
    HStack,
    Icon,
    Collapsible
} from "@chakra-ui/react";
import { FaRobot } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { Spinner } from '@chakra-ui/react';
import { useColorMode, useColorModeValue } from "./ui/color-mode";


// Correct Prism import for Vite + ESM
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

import type { Lesson, ContentBlock, ClarifyLessonRequest } from "../types";

interface LessonCardProps {
    lesson: Lesson;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson }) => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [contents, setContents] = useState<ContentBlock[]>(lesson.content || []);
    const [showClarifications, setShowClarifications] = useState<boolean[]>(
        lesson.content?.map(() => false) || []
    );
    const [highlighted, setHighlighted] = useState<{ block: number; clar: number } | null>(null);
    const clarificationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const codeStyle = useColorModeValue(materialLight, materialDark);

    useEffect(() => {
        setContents(lesson.content || []);
        setShowClarifications(lesson.content?.map(() => false) || []);
    }, [lesson]);
    const formatCode = (value: any) => {
        if (typeof value === "string") return value;
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return String(value);
        }
    };

    const renderSyntaxHighlighter = (code: any, language?: string) => {
        const safeLanguage = language || (typeof code === "object" ? "json" : "text");
        return (
            <SyntaxHighlighter
                style={codeStyle}
                language={safeLanguage}
                showLineNumbers
                customStyle={{
                    fontSize: "0.9rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
            >
                {formatCode(code)}
            </SyntaxHighlighter>
        );
    };

    const handleAsk = async (content: string, idx: number) => {
        if (!question.trim()) return;
        setLoading(true);

        try {
            const response = await fetch("http://localhost:8000/clarify-lesson-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, content, lessonName: lesson.title } as ClarifyLessonRequest),
            });

            if (!response.ok) throw new Error("Failed to fetch clarification");
            const data = await response.json();

            let newClarIdx = 0;
            setContents((prev) => {
                const updated = [...prev];
                const clarifications = updated[idx].clarifications || [];
                newClarIdx = clarifications.length;
                updated[idx] = {
                    ...updated[idx],
                    clarifications: [...clarifications, { question, answer: data.answer }],
                };
                return updated;
            });

            setShowClarifications((prev) => {
                const updated = [...prev];
                updated[idx] = true;
                return updated;
            });

            setQuestion("");
            setHighlighted({ block: idx, clar: newClarIdx });
            setTimeout(() => setHighlighted(null), 1500);

            setTimeout(() => {
                clarificationRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box overflowX="hidden">
            {lesson?.title && (
                <Heading size="md" mb={4}>
                    {lesson.title}
                </Heading>
            )}

            {contents.map((content: ContentBlock, index: number) => (
                <Box
                    key={index}
                    mb={8}
                    p={5}
                    pt={8}
                    borderRadius="lg"
                    boxShadow="sm"
                    position="relative"
                    transition="all 0.2s"
                    _hover={{ boxShadow: "md" }}
                    ref={(el: HTMLDivElement | null) => { clarificationRefs.current[index] = el; }}
                >
                    {/* AI icon */}
                    <Icon
                        as={FaRobot}
                        boxSize={5}
                        color="gray.400"
                        opacity={0.2}
                        cursor="pointer"
                        position="absolute"
                        top="12px"
                        right="12px"
                        zIndex={1}
                        transform="translateY(-5px)"
                        onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                        _hover={{ opacity: 1, transform: "translateY(-2px) scale(1.15)", color: "teal.500" }}
                        transition="all 0.3s ease"
                    />

                    {/* Lesson content */}
                    {content.content && <Box mb={3}><ReactMarkdown>{content.content}</ReactMarkdown></Box>}
                    {content.code && (
                        <Box mt={4} overflowX="hidden">
                            {renderSyntaxHighlighter(content.code, content.codeLanguage?.toLowerCase() || "javascript")}
                        </Box>
                    )}
                    {content.expectedOutput && (
                        <Box mt={2} overflowX="hidden">
                            {renderSyntaxHighlighter(content.expectedOutput, content.outputLanguage || "text")}
                        </Box>
                    )}

                    {/* Show/Hide clarifications */}
                    <Button
                        mt={4}
                        variant="outline"
                        size="sm"
                        borderRadius="md"
                        fontWeight="medium"
                        transition="all 0.2s ease"
                        _hover={{ transform: "scale(1.03)" }}
                        onClick={() => {
                            setShowClarifications((prev) => {
                                const updated = [...prev];
                                updated[index] = !updated[index];
                                return updated;
                            });
                        }}
                    >
                        {showClarifications[index] ? "Hide Clarifications" : "Show Clarifications"}
                    </Button>

                    {/* Clarifications container */}
                    {content.clarifications && content.clarifications.length > 0 && (
                        <Collapsible.Root open={showClarifications[index]}>
                            <Box mt={4} p={4} borderRadius="lg" bg="gray.50" boxShadow="sm" border="1px solid gray.200">
                                {content.clarifications?.map((clar, clarIdx) => {
                                    const isHighlighted = highlighted?.block === index && highlighted?.clar === clarIdx;
                                    return (
                                        <Box
                                            key={clarIdx}
                                            mb={3}
                                            p={3}
                                            borderRadius="md"
                                            border={isHighlighted ? "1px solid teal" : "1px solid transparent"}
                                            shadow="sm"
                                        >
                                            {/* Question */}
                                            <Box p={2} mb={2} borderRadius="md">
                                                <Text fontWeight="bold" fontSize="sm">Question</Text>
                                                <Text whiteSpace="pre-wrap">{clar.question}</Text>
                                            </Box>
                                            {/* Clarification */}
                                            <Box p={2} borderRadius="md" bg="blue.50">
                                                <Text fontWeight="bold" fontSize="sm">Clarification</Text>
                                                <ReactMarkdown>{clar.answer}</ReactMarkdown>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Collapsible.Root>
                    )}

                    {/* Clarification input */}
                    <Collapsible.Root open={activeIndex === index}>
                        <Box mt={4} p={4} borderRadius="lg" border="1px solid gray.200">
                            <Textarea
                                placeholder="Ask a question about this section..."
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                size="md"
                                mb={3}
                                borderRadius="lg"
                                p={4}
                            />
                            <HStack justify="flex-end">
                                <Button
                                    size="md"
                                    onClick={() => handleAsk(content.content || "", index)}
                                    disabled={loading || !question}
                                    _hover={{ transform: "scale(1.05)" }}
                                    transition="all 0.2s ease"
                                >
                                    {loading ? <Spinner size="sm" /> : "Ask AI"}
                                </Button>
                                <Button
                                    size="md"
                                    onClick={() => setActiveIndex(null)}
                                    _hover={{ transform: "scale(1.05)" }}
                                    transition="all 0.2s ease"
                                >
                                    Close
                                </Button>
                            </HStack>
                        </Box>
                    </Collapsible.Root>
                </Box>
            ))}
        </Box>
    );
};

export default LessonCard;
