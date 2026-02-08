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
  Dialog,
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
import GenerationQueueBar from "./GenerationQueueBar";
import type { GenerationQueue } from "../hooks/useGenerationQueue";
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
  X,
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface CourseRendererProps {
  courseState: Course;
  currentModuleIndex: number;
  currentLessonIndex: number;
  onLessonChange: (lessonIndex: number, moduleIndex: number) => void;
  setShowQuiz: (show: boolean) => void;
  onModuleComplete?: (nextModuleIndex: number) => void;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
  generationQueue: GenerationQueue;
  onQueueEntryClick?: (lessonKey: string) => void; // Add this line
}

const CourseRenderer: React.FC<CourseRendererProps> = ({
  courseState,
  currentModuleIndex,
  currentLessonIndex,
  onLessonChange,
  setShowQuiz,
  setCourseState,
  generationQueue,
  onQueueEntryClick,
}) => {
  const { user } = useUser();
  const module = courseState.modules[currentModuleIndex];
  const lesson = module.lessons[currentLessonIndex];
  const nextLesson = module.lessons[currentLessonIndex + 1];
  const contentRef = useRef<HTMLDivElement>(null);
  const moduleComplete = module.status === "COMPLETED";

  // ---------------------------------------------------------------------------
  // Quiz state
  // ---------------------------------------------------------------------------
  const [quizzes, setQuizzes] = useState<Record<string, Quiz>>({});
  const [loadingQuizForLesson, setLoadingQuizForLesson] = useState<string | null>(null);
  const [quizTaskIds, setQuizTaskIds] = useState<Record<string, string>>({});
  const pollersRef = useRef<{ [key: string]: number | null }>({});

  // ---------------------------------------------------------------------------
  // Chat / credit / dialog
  // ---------------------------------------------------------------------------
  const [openChatBox, setOpenChatBox] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [creditInfo, setCreditInfo] = useState<string | null>(null);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [queueFullAlert, setQueueFullAlert] = useState(false);
  const queueAlertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chatBoxRef = useRef<ChatBoxRef>(null);

  // ---------------------------------------------------------------------------
  // Derived state for current lesson
  // ---------------------------------------------------------------------------
  const currentLessonKey = `${currentModuleIndex}-${currentLessonIndex}`;
  const currentLessonQuiz = quizzes[lesson.id] ?? null;
  const isLoadingCurrentQuiz = loadingQuizForLesson === lesson.id;

  // Read queue state — the queue re-renders us via tick whenever status changes
  const queueStatus = generationQueue.getStatus(currentLessonKey);
  const isCurrentLessonGenerating = queueStatus === "queued" || queueStatus === "generating";

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------
  const tealTextColor = useColorModeValue("teal.700", "teal.300");
  const cardBg = useColorModeValue("white", "gray.950");
  const cardBorderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const headingColor = useColorModeValue("gray.900", "white");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
  const nextHoverBg = useColorModeValue("teal.100", "teal.900/30");

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => { setShowQuiz(!!currentLessonQuiz); }, [currentLessonQuiz, setShowQuiz]);
  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [currentLessonIndex, module.id]);
  useEffect(() => { setChatSessionId(`course-${courseState.id}-module-${module.id}-lesson-${lesson.id}`); }, [courseState.id, module.id, lesson.id]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) onLessonChange(currentLessonIndex - 1, currentModuleIndex);
  };

  const handleAskAI = useCallback((selectedText: string) => {
    const question = `Can you explain this from "${lesson.title}": "${selectedText}"`;
    setOpenChatBox(true);
    setTimeout(() => { chatBoxRef.current?.sendMessage(question); }, 100);
  }, [lesson.title]);

  const handleGenerateLesson = () => {
    if (lesson.content) {
      setShowRegenerateDialog(true);
      return;
    }
    startLessonGeneration();
  };

  const startLessonGeneration = () => {
    setShowRegenerateDialog(false);

    const accepted = generationQueue.enqueue(
      currentLessonKey,
      lesson.title,
      `${BACKEND_URL}/course/generate-lesson-stream`,
      {
        course_id: courseState.id,
        module_id: module.id,
        lesson_id: lesson.id,
        token: user?.token,
      },
    );

    // enqueue returns false for two reasons:
    //   1. This lesson is already queued/generating → no alert needed.
    //   2. Queue is full (3 active) → show alert.
    if (!accepted) {
      const alreadyActive = generationQueue.getStatus(currentLessonKey) === "queued"
        || generationQueue.getStatus(currentLessonKey) === "generating";
      if (!alreadyActive) {
        setQueueFullAlert(true);
        if (queueAlertTimerRef.current) clearTimeout(queueAlertTimerRef.current);
        queueAlertTimerRef.current = setTimeout(() => setQueueFullAlert(false), 3000);
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Quiz logic
  // ---------------------------------------------------------------------------
  const handleGenerateQuiz = () => {
    setLoadingQuizForLesson(lesson.id);
    fetchWithTimeout(`${BACKEND_URL}/quiz/generate-quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
      body: JSON.stringify({ lesson_name: lesson.title, content: [] }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.error_message && data.error_type === "NotEnoughCreditsException") {
            setCreditInfo(data.error_message);
            setLoadingQuizForLesson(null);
            return;
          }
          setQuizTaskIds((prev) => ({ ...prev, [lesson.id]: data.task_id }));
        }
      })
      .catch((err) => { console.error("Error generating quiz:", err); setLoadingQuizForLesson(null); });
  };



  useEffect(() => {
    Object.entries(quizTaskIds).forEach(([lessonId, taskId]) => {
      if (taskId && !pollersRef.current[taskId]) startPollingTask(taskId, lessonId);
    });
  }, [quizTaskIds]);

  const startPollingTask = (taskId: string, lessonId: string) => {
    if (!taskId || pollersRef.current[taskId]) return;
    const id = window.setInterval(async () => {
      try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/tasks/status/quiz_generation/${taskId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === "SUCCESS" || data.status === "COMPLETED" || data.status === "done") {
          if (pollersRef.current[taskId]) {
            clearInterval(pollersRef.current[taskId] as number);
            pollersRef.current[taskId] = null;
            setQuizzes((prev) => ({ ...prev, [lessonId]: data.quiz as Quiz }));
            setLoadingQuizForLesson(null);
            setQuizTaskIds((prev) => { const u = { ...prev }; delete u[lessonId]; return u; });
          }
        } else if (data.status === "FAILURE") {
          if (pollersRef.current[taskId]) {
            clearInterval(pollersRef.current[taskId] as number);
            pollersRef.current[taskId] = null;
            setLoadingQuizForLesson(null);
            setQuizTaskIds((prev) => { const u = { ...prev }; delete u[lessonId]; return u; });
          }
        }
      } catch (err) { console.error("Error polling task", taskId, err); }
    }, 3000);
    pollersRef.current[taskId] = id;
  };

  useEffect(() => {
    return () => { Object.values(pollersRef.current).forEach((id) => { if (id) clearInterval(id); }); };
  }, []);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const isLastLesson = currentLessonIndex === module.lessons.length - 1;
  const nextModule = currentModuleIndex < courseState.modules.length - 1 ? courseState.modules[currentModuleIndex + 1] : null;
  const showNextModule = isLastLesson && moduleComplete && nextModule;
  const showNextLesson = !isLastLesson && lesson.status === "COMPLETED" && nextLesson;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Box ref={contentRef} w="100%" overflowY="auto" minH="100vh" py={{ base: 1, md: 1 }}>
      <Box mx="auto" px={{ base: 1, md: 1 }}>
        <VStack align="stretch" gap={2}>

          {/* Queue bar — visible whenever there are non-done entries */}
          <GenerationQueueBar
            entries={generationQueue.entries}
            onRemove={(key) => generationQueue.remove(key)}
            onEntryClick={onQueueEntryClick}  // ADD THIS LINE
          />

          {/* Queue-full alert — auto-dismisses after 3 s */}
          {queueFullAlert && (
            <Alert.Root status="warning" borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("orange.200", "orange.800")} animation="slideDown 0.2s ease-out">
              <Alert.Indicator />
              <Box flex="1">
                <Alert.Title fontWeight="700" fontSize="sm">You can only generate 3 lessons at a time.</Alert.Title>
                <Text fontSize="xs" color={mutedText}>Wait for a current generation to finish, or remove one from the queue above.</Text>
              </Box>
              <Box
                as="button"
                onClick={() => setQueueFullAlert(false)}
                color={mutedText}
                _hover={{ color: headingColor }}
                display="flex"
                alignItems="center"
                p={1}
              >
                <X size={14} />
              </Box>
            </Alert.Root>
          )}

          {/* Header Card */}
          <Card.Root bg={cardBg} borderWidth="1px" borderColor={cardBorderColor} boxShadow="sm">
            <Card.Body p={6}>
              <VStack align="stretch" gap={5}>
                <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                  <VStack align="start" gap={2} flex="1" minW="250px">
                    <HStack gap={2}>
                      <Box p={2} borderRadius="lg" bg={highlightBg}><BookOpen size={18} color="#14b8a6" /></Box>
                      <Text fontSize="xs" color={mutedText} fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                        Module {currentModuleIndex + 1} of {courseState.modules.length}
                      </Text>
                    </HStack>
                    <Heading fontSize={{ base: "2xl", md: "3xl" }} fontWeight="800" color={headingColor} lineHeight="1.2">
                      {module.title}
                    </Heading>
                    <Text fontSize="sm" color={mutedText} fontWeight="500">
                      Lesson {currentLessonIndex + 1} of {module.lessons.length}
                    </Text>
                  </VStack>
                  {moduleComplete && (
                    <Badge colorPalette="green" fontSize="xs" px={3} py={1.5} borderRadius="lg" textTransform="uppercase" letterSpacing="wide" fontWeight="700">
                      <HStack gap={1.5}><Trophy size={14} /><Text>Completed</Text></HStack>
                    </Badge>
                  )}
                </HStack>

                <Box h="1px" bg={cardBorderColor} />

                {/* Action Row */}
                <HStack justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack gap={3} flexWrap="wrap" flex={{ base: "1", md: "auto" }} w={{ base: "100%", md: "auto" }}>
                    {/* Generate button — never disabled by queue. Always clickable. */}
                    {isCurrentLessonGenerating ? (
                      <Button disabled size="md" colorPalette="teal" variant="solid" borderRadius="xl" px={5} opacity={0.7} w={{ base: "100%", sm: "auto" }}>
                        <Spinner size="sm" mr={2} />
                        <Text fontWeight="600">
                          {queueStatus === "queued" ? "Waiting in queue…" : "Generating Content…"}
                        </Text>
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
                        _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                        transition="all 0.2s"
                        w={{ base: "100%", sm: "auto" }}
                      >
                        <Sparkles size={16} style={{ marginRight: "8px" }} />
                        <Text fontWeight="600">{lesson.content ? "Regenerate Content" : "Generate Content"}</Text>
                      </Button>
                    )}

                    {/* Quiz button */}
                    {isLoadingCurrentQuiz ? (
                      <Button disabled size="md" colorPalette="purple" variant="solid" borderRadius="xl" px={5} opacity={0.7} w={{ base: "100%", sm: "auto" }}>
                        <Spinner size="sm" mr={2} />
                        <Text fontWeight="600">Generating Quiz…</Text>
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
                        _hover={{ transform: !lesson.content ? "none" : "translateY(-2px)", boxShadow: !lesson.content ? "none" : "md" }}
                        transition="all 0.2s"
                        w={{ base: "100%", sm: "auto" }}
                        disabled={!lesson.content}
                        opacity={!lesson.content ? 0.5 : 1}
                        cursor={!lesson.content ? "not-allowed" : "pointer"}
                      >
                        <Brain size={16} style={{ marginRight: "8px" }} />
                        <Text fontWeight="600">{currentLessonQuiz ? "Regenerate Quiz" : "Generate Quiz"}</Text>
                      </Button>
                    )}

                    {/* AI Buddy button */}
                    <Button
                      onClick={(e) => { e.preventDefault(); setOpenChatBox(true); }}
                      size="md"
                      colorPalette="blue"
                      variant="outline"
                      borderRadius="xl"
                      borderWidth="1.5px"
                      px={5}
                      _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                      transition="all 0.2s"
                      w={{ base: "100%", sm: "auto" }}
                    >
                      <MessageCircle size={16} style={{ marginRight: "8px" }} />
                      <Text fontWeight="600">Ask AI Buddy</Text>
                    </Button>
                  </HStack>

                  {lesson.status === "COMPLETED" && (
                    <Badge colorPalette="green" fontSize="xs" px={3} py={1.5} borderRadius="lg" textTransform="uppercase" letterSpacing="wide" fontWeight="700">
                      <HStack gap={1.5}><CheckCircle2 size={14} /><Text>Lesson Complete</Text></HStack>
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* Credit alert */}
          {creditInfo && (
            <Alert.Root status="warning" borderRadius="xl" borderWidth="1px" borderColor={useColorModeValue("orange.200", "orange.800")}>
              <Alert.Indicator />
              <Box flex="1"><Alert.Title fontWeight="700">{creditInfo}</Alert.Title></Box>
              <Link href="/upgrade" fontWeight="700" color={tealTextColor} _hover={{ textDecoration: "underline" }}>Upgrade Now →</Link>
            </Alert.Root>
          )}

          {/* Chat */}
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

          {/* Regenerate dialog */}
          <Dialog.Root open={showRegenerateDialog} onOpenChange={(e) => setShowRegenerateDialog(e.open)}>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content borderRadius="xl" maxW="md">
                <Dialog.Header><Dialog.Title fontSize="xl" fontWeight="bold">Regenerate Lesson Content?</Dialog.Title></Dialog.Header>
                <Dialog.Body pb={4}>
                  <Text color={mutedText}>This will replace the current lesson content. Your existing content will be lost. Are you sure you want to continue?</Text>
                </Dialog.Body>
                <Dialog.Footer gap={3}>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline" borderRadius="lg" onClick={() => setShowRegenerateDialog(false)}>Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button colorPalette="teal" borderRadius="lg" onClick={startLessonGeneration}>Yes, Regenerate</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger />
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>

          {/* Lesson or Quiz */}
          {!currentLessonQuiz && (
            <LessonCard
              courseState={courseState}
              setCourseState={setCourseState}
              lessonIndex={currentLessonIndex}
              moduleIndex={currentModuleIndex}
              lessonKey={currentLessonKey}
              isGenerating={isCurrentLessonGenerating}
              onAskAI={handleAskAI}
            />
          )}

          {currentLessonQuiz && (
            <ModuleQuiz
              quiz={currentLessonQuiz}
              setShowQuiz={(show) => {
                if (!show) setQuizzes((prev) => { const u = { ...prev }; delete u[lesson.id]; return u; });
                setShowQuiz(show);
              }}
            />
          )}

          {/* Navigation */}
          {!currentLessonQuiz && (currentLessonIndex > 0 || showNextLesson || showNextModule) && (
            <Card.Root bg={cardBg} borderRadius="2xl" borderWidth="1px" borderColor={cardBorderColor} boxShadow="sm">
              <Card.Body p={5}>
                <HStack justify="space-between" gap={4} flexWrap="wrap" w="100%">
                  {currentLessonIndex > 0 && (
                    <Button onClick={handlePrevLesson} variant="outline" size={{ base: "md", md: "lg" }} borderRadius="xl" borderWidth="1.5px" px={5} _hover={{ transform: "translateY(-2px)", boxShadow: "md" }} transition="all 0.2s" w={{ base: "100%", sm: "auto" }}>
                      <ChevronLeft size={18} style={{ marginRight: "8px" }} />
                      <Text fontWeight="600">Previous Lesson</Text>
                    </Button>
                  )}
                  {(showNextLesson || showNextModule) && (
                    <Box
                      as="button"
                      onClick={() => {
                        if (showNextLesson) onLessonChange(currentLessonIndex + 1, currentModuleIndex);
                        else if (showNextModule) onLessonChange(0, currentModuleIndex + 1);
                      }}
                      flex="1"
                      minW={{ base: "100%", sm: "280px" }}
                      p={5}
                      bg={highlightBg}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor="transparent"
                      borderLeftColor="teal.500"
                      _hover={{ bg: nextHoverBg, transform: "translateX(4px)", boxShadow: "md" }}
                      transition="all 0.2s"
                      textAlign="left"
                    >
                      <VStack align="start" gap={2}>
                        <HStack gap={2}>
                          {showNextModule ? <Sparkles size={16} color="#14b8a6" /> : <ArrowRight size={16} color="#14b8a6" />}
                          <Text fontSize="xs" color={mutedText} fontWeight="700" textTransform="uppercase" letterSpacing="wide">
                            {showNextModule ? "Upcoming Module" : "Next Lesson"}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="700" fontSize="md" color={headingColor}>
                            {showNextModule ? nextModule.title : nextLesson.title}
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