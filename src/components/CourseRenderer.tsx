import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Text,
  Spinner,
  Alert,
  Link,
  Badge,
  Card,
} from "@chakra-ui/react";
import type { Course } from "../types";
import LessonCard from "./LessonCard";
import ModuleQuiz from "./Quiz";
import fetchWithTimeout from "../utils/dbUtils";
import type { Quiz } from "../types";
import { useUser } from "../contexts/UserContext";
import ChatBox, { type ChatBoxRef } from "./ChatBox";
import { type ChatMessage } from "../types";
import { useColorModeValue } from "./ui/color-mode";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  MessageCircle,
  CheckCircle2,
  Trophy,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface CourseRendererProps {
  courseState: Course;
  currentModuleIndex: number;
  currentLessonIndex: number;
  showQuiz: boolean;
  onLessonChange: (lessonIndex: number, moduleIndex: number) => void;
  setShowQuiz: (show: boolean) => void;
  onModuleComplete?: (nextModuleIndex: number) => void;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
}

const CourseRenderer: React.FC<CourseRendererProps> = ({
  courseState,
  currentModuleIndex,
  currentLessonIndex,
  onLessonChange,
  showQuiz,
  setShowQuiz,
  setCourseState,
}) => {
  const { user } = useUser();
  const module = courseState.modules[currentModuleIndex];
  const lesson = module.lessons[currentLessonIndex];
  const nextLesson = module.lessons[currentLessonIndex + 1];
  const contentRef = useRef<HTMLDivElement>(null);

  const moduleComplete = module.status === "COMPLETED";

  // Per-lesson quiz state - maps lesson ID to quiz data
  const [loadingQuizForLesson, setLoadingQuizForLesson] = useState<string | null>(null);
  const [quizTaskIds, setQuizTaskIds] = useState<Record<string, string>>({});

  const [openChatBox, setOpenChatBox] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [creditInfo, setCreditInfo] = useState<string | null>(null);

  // Track generation state per lesson using a unique key
  const [generatingLessonKey, setGeneratingLessonKey] = useState<string | null>(null);
  const [triggerGenerationKey, setTriggerGenerationKey] = useState<string | null>(null);

  const [chatSessionId, setChatSessionId] = useState<string | null>(null);

  const chatBoxRef = useRef<ChatBoxRef>(null);

  // Theme colors matching modern pages
  const tealTextColor = useColorModeValue("teal.700", "teal.300");
  const cardBg = useColorModeValue("white", "gray.950");
  const cardBorderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("gray.900", "white");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");

  const pollersRef = useRef<{ [key: string]: number | null }>({});

  // Persist quiz state across re-mounts using refs
  const quizzesRef = useRef<Record<string, Quiz>>({});

  // Use state for triggering re-renders
  const [, forceUpdate] = useState({});
  const triggerRerender = () => forceUpdate({});

  // Current lesson's quiz state - read from refs
  const currentLessonQuiz = quizzesRef.current[lesson.id];
  const isLoadingCurrentQuiz = loadingQuizForLesson === lesson.id;
  const showCurrentQuiz = !!currentLessonQuiz; // Show quiz whenever it exists

  // Debug logging
  useEffect(() => {
  }, [lesson.id, currentLessonQuiz, showCurrentQuiz, showQuiz]);

  // Keep parent showQuiz in sync with our internal state
  useEffect(() => {
    setShowQuiz(showCurrentQuiz);
  }, [showCurrentQuiz, setShowQuiz]);

  useEffect(() => {
    // Poll for any active quiz tasks
    Object.entries(quizTaskIds).forEach(([lessonId, taskId]) => {
      if (taskId && !pollersRef.current[taskId]) {
        startPollingTask(taskId, lessonId);
      }
    });
  }, [quizTaskIds]);

  const nextModule =
    currentModuleIndex < courseState.modules.length - 1
      ? courseState.modules[currentModuleIndex + 1]
      : null;

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentLessonIndex, module.id]);

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      onLessonChange(currentLessonIndex - 1, currentModuleIndex);
    }
  };

  useEffect(() => {
    setChatSessionId(
      `course-${courseState.id}-module-${module.id}-lesson-${lesson.id}`,
    );
  }, [courseState.id, module.id, lesson.id]);

  const handleAskAI = useCallback(
    (selectedText: string) => {
      const question = `Can you explain this from "${lesson.title}": "${selectedText}"`;

      // Open the chat first
      setOpenChatBox(true);

      // Use a small delay to ensure the chat is open and ref is available
      setTimeout(() => {
        chatBoxRef.current?.sendMessage(question);
      }, 100);
    },
    [lesson.title],
  );

  const handleGenerateQuiz = () => {
    setLoadingQuizForLesson(lesson.id);
    fetchWithTimeout(`${BACKEND_URL}/quiz/generate-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
      body: JSON.stringify({
        lesson_name: lesson.title,
        content: [],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (
            data.error_message &&
            data.error_type === "NotEnoughCreditsException"
          ) {
            console.error("Not enough credits to generate quiz.");
            setCreditInfo(data.error_message);
            setLoadingQuizForLesson(null);
            return;
          }
          // Store task ID mapped to lesson ID
          setQuizTaskIds((prev) => ({
            ...prev,
            [lesson.id]: data.task_id,
          }));
        }
      })
      .catch((err) => {
        console.error("Error generating quiz:", err);
        setLoadingQuizForLesson(null);
      });
  };

  const handleGenerateLesson = () => {
    // Create a unique key for this specific lesson
    const lessonKey = `${module.id}-${lesson.id}`;
    setTriggerGenerationKey(lessonKey);
    setGeneratingLessonKey(lessonKey);
  };

  const startPollingTask = (taskId: string, lessonId: string) => {
    if (!taskId || pollersRef.current[taskId]) return;
    const id = window.setInterval(async () => {
      try {
        const res = await fetchWithTimeout(
          `${BACKEND_URL}/tasks/status/quiz_generation/${taskId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
          },
        );
        if (!res.ok) return;
        const data = await res.json();

        if (
          data.status === "SUCCESS" ||
          data.status === "COMPLETED" ||
          data.status === "done"
        ) {
          if (pollersRef.current[taskId]) {
            clearInterval(pollersRef.current[taskId] as number);
            pollersRef.current[taskId] = null;

            // Store quiz for this specific lesson in ref
            quizzesRef.current[lessonId] = data.quiz as Quiz;

            setLoadingQuizForLesson(null);

            // Remove task ID
            setQuizTaskIds((prev) => {
              const updated = { ...prev };
              delete updated[lessonId];
              return updated;
            });

            // Force re-render to show the quiz
            triggerRerender();
          }
        } else if (data.status === "FAILURE") {
          if (pollersRef.current[taskId]) {
            clearInterval(pollersRef.current[taskId] as number);
            pollersRef.current[taskId] = null;
            setLoadingQuizForLesson(null);

            // Remove task ID
            setQuizTaskIds((prev) => {
              const updated = { ...prev };
              delete updated[lessonId];
              return updated;
            });
          }
        }
      } catch (err) {
        console.error("Error polling task", taskId, err);
      }
    }, 3000);
    pollersRef.current[taskId] = id;
  };

  // Cleanup pollers on unmount
  useEffect(() => {
    return () => {
      Object.values(pollersRef.current).forEach((id) => {
        if (id) clearInterval(id);
      });
    };
  }, []);

  // Determine what to show next: lesson or module
  const isLastLesson = currentLessonIndex === module.lessons.length - 1;
  const showNextModule = isLastLesson && moduleComplete && nextModule;
  const showNextLesson =
    !isLastLesson && lesson.status === "COMPLETED" && nextLesson;

  // Check if the current lesson is generating
  const currentLessonKey = `${module.id}-${lesson.id}`;
  const isCurrentLessonGenerating = generatingLessonKey === currentLessonKey;
  const shouldTriggerGeneration = triggerGenerationKey === currentLessonKey;

  return (
    <Box ref={contentRef} w="100%" overflowY="auto" minH="100vh" py={{ base: 1, md: 1 }}>
      <Box maxW="1400px" mx="auto" px={{ base: 1, md: 1 }}>
        <VStack align="stretch" gap={3}>
          {/* Modern Header Card */}
          <Card.Root
            bg={cardBg}
            borderWidth="1px"
            borderColor={cardBorderColor}
            boxShadow="sm"
          >
            <Card.Body p={6}>
              <VStack align="stretch" gap={5}>
                {/* Top Row: Title & Badge */}
                <HStack
                  justify="space-between"
                  align="start"
                  flexWrap="wrap"
                  gap={4}
                >
                  <VStack align="start" gap={2} flex="1" minW="250px">
                    <HStack gap={2}>
                      <Box p={2} borderRadius="lg" bg={highlightBg}>
                        <BookOpen size={18} color="#14b8a6" />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text
                          fontSize="xs"
                          color={mutedText}
                          fontWeight="600"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          Module {currentModuleIndex + 1} of {courseState.modules.length}
                        </Text>
                      </VStack>
                    </HStack>
                    <Heading
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="800"
                      color={headingColor}
                      lineHeight="1.2"
                    >
                      {module.title}
                    </Heading>
                    <Text fontSize="sm" color={mutedText} fontWeight="500">
                      Lesson {currentLessonIndex + 1} of {module.lessons.length}
                    </Text>
                  </VStack>

                  {moduleComplete && (
                    <Badge
                      colorPalette="green"
                      fontSize="xs"
                      px={3}
                      py={1.5}
                      borderRadius="lg"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      fontWeight="700"
                    >
                      <HStack gap={1.5}>
                        <Trophy size={14} />
                        <Text>Completed</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>

                {/* Divider */}
                <Box h="1px" bg={cardBorderColor} />

                {/* Action Row */}
                <HStack justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack gap={3} flexWrap="wrap">
                    {isCurrentLessonGenerating ? (
                      <Button
                        disabled
                        size="md"
                        colorPalette="teal"
                        variant="solid"
                        borderRadius="xl"
                        px={5}
                        opacity={0.7}
                      >
                        <Spinner size="sm" mr={2} />
                        <Text fontWeight="600">Generating Content...</Text>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGenerateLesson}
                        size="md"
                        colorPalette="teal"
                        variant="outline"
                        borderRadius="xl"
                        borderWidth="1.5px"
                        px={5}
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "md",
                        }}
                        transition="all 0.2s"
                      >
                        <Sparkles size={16} style={{ marginRight: "8px" }} />
                        <Text fontWeight="600">
                          {lesson.content ? "Regenerate Content" : "Generate Content"}
                        </Text>
                      </Button>
                    )}

                    {isLoadingCurrentQuiz ? (
                      <Button
                        disabled
                        size="md"
                        colorPalette="purple"
                        variant="solid"
                        borderRadius="xl"
                        px={5}
                        opacity={0.7}
                      >
                        <Spinner size="sm" mr={2} />
                        <Text fontWeight="600">Generating Quiz...</Text>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGenerateQuiz}
                        size="md"
                        colorPalette="purple"
                        variant="outline"
                        borderRadius="xl"
                        borderWidth="1.5px"
                        px={5}
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "md",
                        }}
                        transition="all 0.2s"
                      >
                        <Brain size={16} style={{ marginRight: "8px" }} />
                        <Text fontWeight="600">
                          {currentLessonQuiz ? "Regenerate Quiz" : "Generate Quiz"}
                        </Text>
                      </Button>
                    )}

                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenChatBox(true);
                      }}
                      size="md"
                      colorPalette="blue"
                      variant="outline"
                      borderRadius="xl"
                      borderWidth="1.5px"
                      px={5}
                      _hover={{
                        transform: "translateY(-2px)",
                        boxShadow: "md",
                      }}
                      transition="all 0.2s"
                    >
                      <MessageCircle size={16} style={{ marginRight: "8px" }} />
                      <Text fontWeight="600">Ask AI Buddy</Text>
                    </Button>
                  </HStack>

                  {lesson.status === "COMPLETED" && (
                    <Badge
                      colorPalette="green"
                      fontSize="xs"
                      px={3}
                      py={1.5}
                      borderRadius="lg"
                      textTransform="uppercase"
                      letterSpacing="wide"
                      fontWeight="700"
                    >
                      <HStack gap={1.5}>
                        <CheckCircle2 size={14} />
                        <Text>Lesson Complete</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Credit Info Alert */}
          {creditInfo && (
            <Alert.Root
              status="warning"
              borderRadius="xl"
              borderWidth="1px"
              borderColor={useColorModeValue("orange.200", "orange.800")}
            >
              <Alert.Indicator />
              <Box flex="1">
                <Alert.Title fontWeight="700">{creditInfo}</Alert.Title>
              </Box>
              <Link
                href="/upgrade"
                fontWeight="700"
                color={tealTextColor}
                _hover={{ textDecoration: "underline" }}
              >
                Upgrade Now →
              </Link>
            </Alert.Root>
          )}

          {/* Chat Box */}
          {openChatBox && (
            <ChatBox
              ref={chatBoxRef}
              open={openChatBox}
              setOpenChatBox={setOpenChatBox}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              sessionId={chatSessionId}
            />
          )}

          {/* Main Content */}
          {!showCurrentQuiz && (
            <LessonCard
              courseState={courseState}
              setCourseState={setCourseState}
              lessonIndex={currentLessonIndex}
              moduleIndex={currentModuleIndex}
              isGeneratingLesson={isCurrentLessonGenerating}
              setIsGeneratingLesson={(isGenerating) => {
                if (isGenerating) {
                  setGeneratingLessonKey(currentLessonKey);
                } else {
                  setGeneratingLessonKey(null);
                }
              }}
              lessonGenerationTriggered={shouldTriggerGeneration}
              setLessonGenerationTriggered={(triggered) => {
                if (!triggered) {
                  setTriggerGenerationKey(null);
                }
              }}
              onAskAI={handleAskAI}
            />
          )}

          {showCurrentQuiz && currentLessonQuiz && (
            <ModuleQuiz
              quiz={currentLessonQuiz}
              setShowQuiz={(show) => {
                if (!show) {
                  // When closing quiz, remove it from memory
                  delete quizzesRef.current[lesson.id];
                  triggerRerender();
                }
                setShowQuiz(show);
              }}
            />
          )}

          {/* Navigation Card */}
          {!showCurrentQuiz &&
            (currentLessonIndex > 0 || showNextLesson || showNextModule) && (
              <Card.Root
                bg={cardBg}
                borderRadius="2xl"
                borderWidth="1px"
                borderColor={cardBorderColor}
                boxShadow="sm"
              >
                <Card.Body p={5}>
                  <HStack justify="space-between" gap={4} flexWrap="wrap">
                    {/* Previous Lesson Button */}
                    {currentLessonIndex > 0 && (
                      <Button
                        onClick={handlePrevLesson}
                        variant="outline"
                        size="lg"
                        borderRadius="xl"
                        borderWidth="1.5px"
                        px={5}
                        _hover={{
                          transform: "translateY(-2px)",
                          boxShadow: "md",
                        }}
                        transition="all 0.2s"
                      >
                        <ChevronLeft size={18} style={{ marginRight: "8px" }} />
                        <Text fontWeight="600">Previous Lesson</Text>
                      </Button>
                    )}

                    {/* Next Content (Lesson or Module) */}
                    {(showNextLesson || showNextModule) && (
                      <Box
                        as="button"
                        onClick={() => {
                          if (showNextLesson) {
                            onLessonChange(
                              currentLessonIndex + 1,
                              currentModuleIndex,
                            );
                          } else if (showNextModule) {
                            onLessonChange(0, currentModuleIndex + 1);
                          }
                        }}
                        flex="1"
                        minW="280px"
                        p={5}
                        bg={highlightBg}
                        borderRadius="xl"
                        borderWidth="2px"
                        borderColor="transparent"
                        borderLeftColor="teal.500"
                        _hover={{
                          bg: useColorModeValue("teal.100", "teal.900/30"),
                          transform: "translateX(4px)",
                          boxShadow: "md",
                        }}
                        transition="all 0.2s"
                        textAlign="left"
                      >
                        <VStack align="start" gap={2}>
                          <HStack gap={2}>
                            {showNextModule ? (
                              <Sparkles size={16} color="#14b8a6" />
                            ) : (
                              <ArrowRight size={16} color="#14b8a6" />
                            )}
                            <Text
                              fontSize="xs"
                              color={mutedText}
                              fontWeight="700"
                              textTransform="uppercase"
                              letterSpacing="wide"
                            >
                              {showNextModule ? "Upcoming Module" : "Next Lesson"}
                            </Text>
                          </HStack>
                          <HStack justify="space-between" w="full">
                            <Text
                              fontWeight="700"
                              fontSize="md"
                              color={headingColor}
                            >
                              {showNextModule
                                ? nextModule.title
                                : nextLesson.title}
                            </Text>
                            <ChevronRight size={20} color="#14b8a6" style={{ flexShrink: 0 }} />
                          </HStack>
                        </VStack>
                      </Box>
                    )}
                  </HStack>
                </Card.Body>
              </Card.Root>
            )}
        </VStack>
      </Box>
    </Box>
  );
};

export default CourseRenderer;