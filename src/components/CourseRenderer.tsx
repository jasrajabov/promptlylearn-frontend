import React, { useState, useEffect, useRef } from "react";
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
import ChatBox from "./ChatBox";
import { type ChatMessage } from "../types";
import { useColorModeValue } from "./ui/color-mode";
import { Stats } from "./Stats";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  MessageCircle,
  CheckCircle2,
  Trophy,
  Sparkles,
  ArrowRight
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

  const [quizTaskId, setQuizTaskId] = useState<string | null>(null);

  const { user } = useUser();
  const module = courseState.modules[currentModuleIndex];
  const lesson = module.lessons[currentLessonIndex];
  const nextLesson = module.lessons[currentLessonIndex + 1];
  const contentRef = useRef<HTMLDivElement>(null);

  const moduleComplete = module.status === "COMPLETED";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [openChatBox, setOpenChatBox] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: "Hello! I'm your AI learning buddy. Feel free to ask me any questions about the course material or request further explanations on topics you're curious about.",
    timestamp: new Date(),
  }]);
  const [error, setError] = useState<string | null>(null);
  const [creditInfo, setCreditInfo] = useState<string | null>(null);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [lessonGenerationTriggered, setLessonGenerationTriggered] = useState(false);

  const tealTextColor = useColorModeValue("teal.700", "teal.300");

  const pollersRef = useRef<{ [key: string]: number | null }>({});

  useEffect(() => {
    if (quizTaskId) {
      startPollingTask(quizTaskId);
    }
  }, [quizTaskId]);

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

  const handleGenerateQuiz = () => {
    setLoadingQuiz(true);
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
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.error_message && data.error_type === "NotEnoughCreditsException") {
            console.error("Not enough credits to generate quiz.");
            setCreditInfo(data.error_message);
            setLoadingQuiz(false);
            return;
          }
          setQuizTaskId(data.task_id);
        }
      });
  };

  const handleGenerateLesson = () => {
    setLessonGenerationTriggered(true);
  };

  const startPollingTask = (taskId: string) => {
    if (!taskId || pollersRef.current[taskId]) return;
    const id = window.setInterval(async () => {
      try {
        const res = await fetchWithTimeout(`${BACKEND_URL}/tasks/status/quiz_generation/${taskId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        console.log("Polled task data:", data);

        if (data.status === "SUCCESS" || data.status === "COMPLETED" || data.status === "done") {
          if (pollersRef.current[taskId]) {
            clearInterval(pollersRef.current[taskId] as number);
            pollersRef.current[taskId] = null;
            setLoadingQuiz(false);
            setQuiz(data.quiz as Quiz);
            setShowQuiz(true);
          }
        } else if (data.status === "FAILURE") {
          if (pollersRef.current[taskId]) {
            clearInterval(pollersRef.current[taskId] as number);
            pollersRef.current[taskId] = null;
          }
        }
      } catch (err) {
        console.error("Error polling task", taskId, err);
      }
    }, 3000);
    pollersRef.current[taskId] = id;
  };

  // Determine what to show next: lesson or module
  const isLastLesson = currentLessonIndex === module.lessons.length - 1;
  const showNextModule = isLastLesson && moduleComplete && nextModule;
  const showNextLesson = !isLastLesson && lesson.status === "COMPLETED" && nextLesson;

  return (
    <Box
      ref={contentRef}
      w="100%"
      overflowY="auto"
      p={{ base: 4, md: 1 }}
    >
      <Box maxW="10xl" mx="auto">
        <VStack align="stretch" gap={3}>
          {/* Combined Header Card with Stats and Actions */}
          <Card.Root>
            <Card.Body>
              <VStack align="stretch" gap={4}>
                {/* Top Row: Title, Stats, Badge */}
                <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
                  <VStack align="start" gap={1} flex="1" minW="200px">
                    <HStack>
                      <BookOpen className="w-5 h-5 text-teal-500" />
                      <Text fontSize="sm" fontWeight="medium" color="gray.500">
                        Module {currentModuleIndex + 1} of {courseState.modules.length}
                      </Text>
                    </HStack>
                    <Heading size="xl" color="gray.800" _dark={{ color: "white" }}>
                      {module.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.500">
                      Lesson {currentLessonIndex + 1} of {module.lessons.length}
                    </Text>
                  </VStack>

                  {moduleComplete && (
                    <Badge colorPalette="green" size="lg" px={3} py={1} alignSelf="center">
                      <HStack gap={1}>
                        <Trophy className="w-4 h-4" />
                        <Text>Completed</Text>
                      </HStack>
                    </Badge>
                  )}
                </HStack>

                {/* Divider */}
                <Box h="1px" bg="gray.200" _dark={{ bg: "gray.700" }} />

                {/* Action Row */}
                <HStack justify="space-between" flexWrap="wrap" gap={3}>
                  <HStack gap={2} flexWrap="wrap">
                    {isGeneratingLesson ? (
                      <Button
                        disabled
                        size="md"
                        colorScheme="teal"
                        variant="surface"
                      >
                        <Spinner size="sm" mr={2} />
                        Generating Content...
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGenerateLesson}
                        size="md"
                        colorPalette="teal"
                        variant="outline"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {lesson.content ? "Regenerate Content" : "Generate Content"}
                      </Button>
                    )}

                    {loadingQuiz ? (
                      <Button
                        disabled
                        size="md"
                        colorPalette="purple"
                        variant="outline"
                      >
                        <Spinner size="sm" mr={2} />
                        Generating Quiz...
                      </Button>
                    ) : (
                      <Button
                        onClick={handleGenerateQuiz}
                        size="md"
                        colorPalette="purple"
                        variant="outline"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        Generate Quiz
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
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Ask AI Buddy
                    </Button>
                  </HStack>

                  {lesson.status === "COMPLETED" && (
                    <Badge colorPalette="green" size="lg" px={3}>
                      <HStack gap={1}>
                        <CheckCircle2 className="w-4 h-4" />
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
            <Alert.Root status="info">
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

          {/* Chat Box */}
          {openChatBox && (
            <ChatBox
              open={openChatBox}
              setOpenChatBox={setOpenChatBox}
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
            />
          )}

          {/* Main Content */}
          {!showQuiz && (
            <LessonCard
              courseState={courseState}
              setCourseState={setCourseState}
              lessonIndex={currentLessonIndex}
              moduleIndex={currentModuleIndex}
              isGeneratingLesson={isGeneratingLesson}
              setIsGeneratingLesson={setIsGeneratingLesson}
              lessonGenerationTriggered={lessonGenerationTriggered}
              setLessonGenerationTriggered={setLessonGenerationTriggered}
            />
          )}

          {showQuiz && quiz && (
            <ModuleQuiz quiz={quiz} setShowQuiz={setShowQuiz} />
          )}

          {/* Unified Navigation Card (Previous & Next) */}
          {!showQuiz && (currentLessonIndex > 0 || showNextLesson || showNextModule) && (
            <Card.Root>
              <Card.Body>
                <HStack justify="space-between" gap={4} flexWrap="wrap">
                  {/* Previous Lesson Button */}
                  {currentLessonIndex > 0 && (
                    <Button
                      onClick={handlePrevLesson}
                      variant="outline"
                      size="lg"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous Lesson
                    </Button>
                  )}

                  {/* Next Content (Lesson or Module) */}
                  {(showNextLesson || showNextModule) && (
                    <Box
                      as="button"
                      onClick={() => {
                        if (showNextLesson) {
                          onLessonChange(currentLessonIndex + 1, currentModuleIndex);
                        } else if (showNextModule) {
                          onLessonChange(0, currentModuleIndex + 1);
                        }
                      }}
                      flex="1"
                      minW="250px"
                      p={4}
                      bg="teal.50"
                      _dark={{ bg: "teal.900/20" }}
                      borderRadius="md"
                      borderLeftWidth="3px"
                      borderLeftColor="teal.500"
                      _hover={{
                        bg: "teal.100",
                        _dark: { bg: "teal.900/30" },
                        transform: "translateX(4px)"
                      }}
                      transition="all 0.2s"
                      textAlign="left"
                    >
                      <VStack align="start" gap={1}>
                        <HStack>
                          {showNextModule ? (
                            <Sparkles className="w-4 h-4 text-teal-500" />
                          ) : (
                            <ArrowRight className="w-4 h-4 text-teal-500" />
                          )}
                          <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }}>
                            {showNextModule ? "Upcoming Module" : "Next Lesson"}
                          </Text>
                        </HStack>
                        <HStack justify="space-between" w="full">
                          <Text fontWeight="semibold" color="gray.800" _dark={{ color: "white" }}>
                            {showNextModule ? nextModule.title : nextLesson.title}
                          </Text>
                          <ChevronRight className="w-5 h-5 text-teal-500 flex-shrink-0" />
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