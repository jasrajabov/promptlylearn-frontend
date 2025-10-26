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
    Spinner,
    Skeleton,
    Collapsible
} from "@chakra-ui/react";
// if you used Radix earlier; keep consistent with your project
import { FaRobot } from "react-icons/fa";
import { BiCollapse } from "react-icons/bi";
import { useUser } from "../contexts/UserContext";
import ReactMarkdown from "react-markdown";
import { useColorModeValue } from "./ui/color-mode";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark, materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { motion, AnimatePresence } from "framer-motion";
import type { Lesson, ContentBlock, ClarifyLessonRequest, Course } from "../types";

interface LessonCardProps {
    courseState: Course;
    setCourseState: React.Dispatch<React.SetStateAction<Course>>;
    lessonIndex: number;
    moduleIndex: number;
    // lesson: Lesson;
    // setLesson?: React.Dispatch<React.SetStateAction<Lesson>>;
}

const LessonCard: React.FC<LessonCardProps> = ({ courseState, setCourseState, lessonIndex, moduleIndex }) => {
    const lesson = courseState.modules[moduleIndex].lessons[lessonIndex];
    if (!lesson) return <Text>No lesson selected</Text>;

    const { user } = useUser();
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [question, setQuestion] = useState("");
    const [loading, setLoading] = useState(false);
    const [contents, setContents] = useState<ContentBlock[]>(lesson.content_blocks || []);
    const [showClarifications, setShowClarifications] = useState<boolean[]>(
        lesson.content_blocks?.map(() => false) || []
    );
    const [highlighted, setHighlighted] = useState<{ block: number; clar: number } | null>(null);
    const clarificationRefs = useRef<(HTMLDivElement | null)[]>([]);
    const codeStyle = useColorModeValue(materialLight, materialDark);

    // Sync when lesson changes
    useEffect(() => {
        setContents(lesson.content_blocks || []);
        setShowClarifications(lesson.content_blocks?.map(() => false) || []);
        setActiveIndex(null);
        setQuestion("");
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
                    wordWrap: "break-word",
                }}
            >
                {formatCode(code)}
            </SyntaxHighlighter>
        );
    };

    // Ask AI for clarification about a specific content block
    const handleAsk = async (contentText: string, idx: number) => {
        if (!question.trim()) return;
        setLoading(true);
        try {
            const response = await fetch("http://localhost:8000/clarify-lesson-content", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question,
                    content: contentText,
                    content_block_id: contents[idx]?.id ?? null,
                } as ClarifyLessonRequest),
            });

            if (!response.ok) {
                const text = await response.text().catch(() => "");
                throw new Error(`Failed to fetch clarification: ${text}`);
            }

            const data = await response.json();

            let newClarIdx = 0;
            setContents((prev) => {
                const updated = [...prev];
                const existing = updated[idx] || { clarifications: [] };
                const clarifications = existing.clarifications || [];
                newClarIdx = clarifications.length;
                updated[idx] = {
                    ...updated[idx],
                    clarifications: [...clarifications, { question, answers: data.answers }],
                };
                return updated;
            });

            setShowClarifications((prev) => {
                const updated = [...prev];
                // ensure array length
                while (updated.length <= idx) updated.push(false);
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

    // Stream lesson content with per-block placeholders and keep clarifications state aligned
    const handleGenerateLessonStream = () => {
        const source = new EventSource(
            `http://localhost:8000/generate-lesson-details-stream?course_id=${courseState.id}&module_id=${courseState.modules[moduleIndex].id}&lesson_id=${lesson.id}&token=${user?.token}`
        );

        // clear and start with a placeholder
        setContents([
            { id: "placeholder-0", title: "", content: "", loading: true } as unknown as ContentBlock,
        ]);
        setShowClarifications([false]);
        setCourseState(prev => {
            const updatedModules = [...prev.modules];
            const updatedLessons = [...updatedModules[moduleIndex].lessons];

            // Update lesson status
            updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], status: "IN_PROGRESS" };

            // Determine new module status
            let newModuleStatus = updatedModules[moduleIndex].status;
            if (newModuleStatus === "NOT_GENERATED") {
                newModuleStatus = "IN_PROGRESS";
            }
            updatedModules[moduleIndex] = {
                ...updatedModules[moduleIndex],
                lessons: updatedLessons,
                status: newModuleStatus,
            };

            return { ...prev, modules: updatedModules };
        });


        source.onmessage = (event) => {
            if (!event.data) return;
            try {
                const incomingBlock: ContentBlock = JSON.parse(event.data);

                setContents((prev) => {
                    const updated = [...prev];
                    // find first placeholder
                    const placeholderIndex = updated.findIndex((b) => (b as any).loading);
                    if (placeholderIndex !== -1) {
                        // replace placeholder with real block
                        updated[placeholderIndex] = { ...incomingBlock, loading: false };
                    } else {
                        updated.push({ ...incomingBlock, loading: false });
                    }

                    // push a new placeholder anticipating the next block
                    updated.push({
                        id: `placeholder-${Date.now()}`,
                        title: "",
                        content: "",
                        loading: true,
                    } as unknown as ContentBlock);

                    // update courseState with the non-placeholder content blocks
                    const contentBlocksForCourse = updated.filter((b) => !(b as any).loading);
                    setCourseState((coursePrev) => {
                        const updatedModules = [...coursePrev.modules];
                        const updatedLessons = [...updatedModules[moduleIndex].lessons];
                        updatedLessons[lessonIndex] = {
                            ...updatedLessons[lessonIndex],
                            content_blocks: contentBlocksForCourse,
                        };
                        updatedModules[moduleIndex] = {
                            ...updatedModules[moduleIndex],
                            lessons: updatedLessons,
                        };
                        return { ...coursePrev, modules: updatedModules };
                    });

                    return updated;
                });

                // keep showClarifications aligned: replace placeholder slot with false and add a new false for new placeholder
                setShowClarifications((prev) => {
                    const updated = [...prev];
                    const placeholderIdx = updated.findIndex((v, i) => {
                        // placeholder corresponds to content with loading === true at same index
                        return contents[i]?.loading;
                    });

                    // Instead of relying on contents which is stale here, we'll align by index logic:
                    // If there is a false/true mismatch lengthwise, expand as needed.
                    // Simpler: ensure length matches contents after the setContents update (race-safe-ish).
                    // We'll attempt to mirror the above changes conservatively:
                    // Replace first occurrence that is undefined / false with false, else push a false.
                    if (updated.length === 0) {
                        updated.push(false);
                    } else {
                        // push false for incoming new placeholder
                        updated.push(false);
                    }
                    return updated;
                });
            } catch (err) {
                console.error("Failed to parse block", err);
            }
        };

        source.addEventListener("error", (err) => {
            console.error("Stream error:", err);
            // remove any placeholders
            setContents((prev) => {
                const final = prev.filter((b) => !(b as any).loading);
                // persist final blocks to courseState
                setCourseState((coursePrev) => {
                    const updatedModules = [...coursePrev.modules];
                    const updatedLessons = [...updatedModules[moduleIndex].lessons];
                    updatedLessons[lessonIndex] = {
                        ...updatedLessons[lessonIndex],
                        content_blocks: final,
                    };
                    updatedModules[moduleIndex] = {
                        ...updatedModules[moduleIndex],
                        lessons: updatedLessons,
                    };
                    return { ...coursePrev, modules: updatedModules };
                });
                return final;
            });
            setShowClarifications((prev) => prev.slice(0, contents.filter((b) => !(b as any).loading).length));
            source.close();
        });

        source.addEventListener("complete", () => {
            console.log("Stream completed");
            setContents((prev) => {
                const final = prev.filter((b) => !(b as any).loading);
                // persist final blocks to courseState
                setCourseState((coursePrev) => {
                    const updatedModules = [...coursePrev.modules];
                    const updatedLessons = [...updatedModules[moduleIndex].lessons];
                    updatedLessons[lessonIndex] = {
                        ...updatedLessons[lessonIndex],
                        content_blocks: final,
                    };
                    updatedModules[moduleIndex] = {
                        ...updatedModules[moduleIndex],
                        lessons: updatedLessons,
                    };
                    return { ...coursePrev, modules: updatedModules };
                });
                return final;
            });
            setShowClarifications((prev) => prev.slice(0, contents.filter((b) => !(b as any).loading).length));
            source.close();
        });
    };

    return (
        <Box overflowX="hidden" overflow="hidden">
            {lesson?.title && (
                <Heading size="md" color="teal.600" _dark={{ color: "teal.300" }} mb={4}>
                    {lesson.title}
                </Heading>
            )}

            <Button mb={4} colorScheme="teal" onClick={handleGenerateLessonStream}>
                Generate Lesson
            </Button>

            <AnimatePresence>
                {contents.map((content: ContentBlock, index: number) => (
                    <motion.div
                        key={content.id || index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {(content as any).loading ? (
                            // Placeholder skeleton for currently generating block
                            <Box
                                mb={8}
                                p={5}
                                borderRadius="lg"
                                boxShadow="sm"
                                bg={useColorModeValue("gray.50", "gray.700")}
                            >
                                <HStack gap={3} mb={4}>
                                    <Spinner size="sm" color="teal.500" />
                                    <Text color="teal.600" _dark={{ color: "teal.300" }} fontWeight="semibold">
                                        Generating content block...
                                    </Text>
                                </HStack>
                                <Skeleton height="20px" mb={3} />
                                <Skeleton height="16px" mb={3} />
                                <Skeleton height="16px" width="80%" mb={3} />
                                <Skeleton height="120px" borderRadius="md" />
                            </Box>
                        ) : (
                            // Real content block with clarifications UI
                            <Box
                                mb={8}
                                p={5}
                                pt={8}
                                borderRadius="lg"
                                boxShadow="sm"
                                position="relative"
                                transition="all 0.2s"
                                _hover={{ boxShadow: "md" }}
                                ref={(el: HTMLDivElement | null) => {
                                    clarificationRefs.current[index] = el;
                                }}
                            >
                                {/* Title / content / code / expected output */}
                                {content.title && (
                                    <Heading color="teal.600" _dark={{ color: "teal.300" }} size="lg" mb={3}>
                                        {content.title}
                                    </Heading>
                                )}
                                {content.content && (
                                    <Box mb={3}>
                                        <ReactMarkdown>{content.content}</ReactMarkdown>
                                    </Box>
                                )}
                                {content.code && (
                                    <Box mt={4}>
                                        {renderSyntaxHighlighter(content.code, (content as any).code_language?.toLowerCase() || "javascript")}
                                    </Box>
                                )}
                                {content.expected_output && (
                                    <Box mt={2}>
                                        {renderSyntaxHighlighter(content.expected_output, (content as any).output_language || "text")}
                                    </Box>
                                )}

                                {/* Toggle clarifications */}
                                <Icon
                                    as={BiCollapse}
                                    boxSize={6}
                                    color={showClarifications[index] ? "teal.500" : "gray.400"}
                                    opacity={showClarifications[index] ? 1 : 0.2}
                                    cursor="pointer"
                                    position="absolute"
                                    top="44px"
                                    right="12px"
                                    zIndex={1}
                                    transform="translateY(-5px)"
                                    onClick={() => {
                                        setShowClarifications((prev) => {
                                            const updated = [...prev];
                                            while (updated.length <= index) updated.push(false);
                                            updated[index] = !updated[index];
                                            return updated;
                                        });
                                    }}
                                    _hover={{ opacity: 1, transform: "translateY(-2px) scale(1.15)", color: "teal.500" }}
                                    transition="all 0.3s ease"
                                />

                                {/* AI icon to open clarifier */}
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

                                {/* Clarifications list */}
                                {content.clarifications && content.clarifications.length > 0 && (
                                    <Collapsible.Root open={!!showClarifications[index]}>
                                        <Collapsible.Content>
                                            <Box mt={4} p={4} borderRadius="lg" boxShadow="sm" border="1px solid gray.200">
                                                {content.clarifications.map((clar: any, clarIdx: number) => {
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
                                                            <Box p={2} mb={2} borderRadius="md">
                                                                <Text color="teal.700" fontWeight="bold" fontSize="sm">Question</Text>
                                                                <Text color="teal.600" _dark={{ color: "teal.300" }} whiteSpace="pre-wrap">{clar.question}</Text>
                                                            </Box>
                                                            <Box p={2} borderRadius="md">
                                                                <Text color="teal.600" _dark={{ color: "teal.300" }} fontWeight="bold" fontSize="sm">Clarification</Text>
                                                                {clar.answers.map((ansPart: any, idx2: number) => (
                                                                    <React.Fragment key={idx2}>
                                                                        {ansPart.code && <Box mt={2}>{renderSyntaxHighlighter(ansPart.code, (ansPart as any).code_language?.toLowerCase() || "javascript")}</Box>}
                                                                        {ansPart.text && <ReactMarkdown>{ansPart.text}</ReactMarkdown>}
                                                                        {ansPart.output && <Box mt={2}><Text fontWeight="bold" mt={2} mb={1}>Output:</Text>{renderSyntaxHighlighter(ansPart.output, "text")}</Box>}
                                                                    </React.Fragment>
                                                                ))}
                                                            </Box>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        </Collapsible.Content>
                                    </Collapsible.Root>
                                )}

                                {/* Clarification input (collapsible) */}
                                <Collapsible.Root open={activeIndex === index}>
                                    <Collapsible.Content>
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
                                    </Collapsible.Content>
                                </Collapsible.Root>
                            </Box>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </Box>
    );
};

export default LessonCard;
