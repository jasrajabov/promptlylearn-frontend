import { useEffect, useState, useMemo } from "react";
import {
  Box,
  HStack,
  Heading,
  Text,
  Spinner,
  VStack,
  Card,
  IconButton,
  Drawer,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import type { Course } from "../types";
import { useUser } from "../contexts/UserContext";
import CourseRenderer from "../components/CourseRenderer";
import { TOC } from "../components/TOC";
import { useGenerationQueue } from "../hooks/useGenerationQueue";
import { BookOpen, GraduationCap, Menu, X } from "lucide-react";
import { useColorModeValue } from "../components/ui/color-mode";
import { ProgressCircleComponent } from "../components/ProgressCircle";


export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function CourseTimeline() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();

  const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [courseState, setCourseState] = useState<Course>({} as Course);
  const [loading, setLoading] = useState(true);
  const [isTOCOpen, setIsTOCOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // The single source of truth for all lesson generation state.
  // Lives here so it survives lesson navigation within the course.
  // ---------------------------------------------------------------------------
  const generationQueue = useGenerationQueue();

  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );
  const cardBg = useColorModeValue("white", "#111111");
  const cardBorderColor = useColorModeValue("#e5e7eb", "#27272a");
  const mutedText = useColorModeValue("#6b7280", "#9ca3af");
  const accentColor = useColorModeValue("#0f766e", "#14b8a6");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");

  // ---------------------------------------------------------------------------
  // Progress calculations (memoized for performance)
  // ---------------------------------------------------------------------------
  const { completedPercentageModules, totalLessons, completedLessons, completedPercentagesLessons, totalModules, completedModules, inProgressModules } = useMemo(() => {
    if (!courseState.modules) {
      return {
        completedPercentageModules: 0,
        totalLessons: 0,
        completedLessons: 0,
        completedPercentagesLessons: 0,
        totalModules: 0,
        completedModules: 0,
        inProgressModules: 0
      };
    }

    const modules = courseState.modules;
    const totalModules = modules.length;
    const completedModules = modules.filter((m) => m.status === "COMPLETED").length;
    const inProgressModules = modules.filter((m) => {
      const hasCompletedLessons = m.lessons?.some((l) => l.status === "COMPLETED");
      const hasIncompleteLessons = m.lessons?.some((l) => l.status !== "COMPLETED");
      return hasCompletedLessons && hasIncompleteLessons;
    }).length;
    const completedPercentageModules = Math.round((completedModules / modules.length) * 100);

    const totalLessons = modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
    const completedLessons = modules.reduce(
      (sum, module) => sum + (module.lessons?.filter((l) => l.status === "COMPLETED").length || 0),
      0
    );
    const completedPercentagesLessons = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return {
      completedPercentageModules,
      totalLessons,
      completedLessons,
      completedPercentagesLessons,
      totalModules,
      completedModules,
      inProgressModules
    };
  }, [courseState.modules]);

  // ---------------------------------------------------------------------------
  // Fetch course on mount (unchanged)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/course/${id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        });
        const data = await response.json();
        const modulesWithStatus = data.modules.map((module: any) => ({
          ...module,
          status: module.status || "not-generated",
        }));
        setCourseState({ ...data, modules: modulesWithStatus });
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchCourse();
  }, [id, user]);

  const handleQueueEntryClick = (lessonKey: string) => {

    // lessonKey format is now: "moduleIndex-lessonIndex" (e.g., "0-0", "2-5")
    const parts = lessonKey.split('-');

    if (parts.length === 2) {
      const moduleIdx = parseInt(parts[0], 10);
      const lessonIdx = parseInt(parts[1], 10);

      if (!isNaN(moduleIdx) && !isNaN(lessonIdx)) {

        // Close TOC drawer if open (mobile)
        setIsTOCOpen(false);

        // Update the active module and lesson - this is what TOC does
        setActiveModuleIndex(moduleIdx);
        setCurrentLessonIndex(lessonIdx);

        // Scroll to top for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        console.error('Invalid indices in lessonKey:', lessonKey, { moduleIdx, lessonIdx });
      }
    } else {
      console.error('Invalid lessonKey format:', lessonKey, 'Expected format: "moduleIndex-lessonIndex"');
    }
  };

  // ---------------------------------------------------------------------------
  // Navigation handlers (unchanged)
  // ---------------------------------------------------------------------------
  const handleLessonChange = (lessonIndex: number, moduleIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    setActiveModuleIndex(moduleIndex);
    setIsTOCOpen(false);
  };

  const handleModuleComplete = (nextModuleIndex: number) => {
    setActiveModuleIndex(nextModuleIndex);
    setCurrentLessonIndex(0);
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <Box w="100%" minH="100vh" py={{ base: 8, md: 12 }}>
        <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }}>
          <VStack gap={6} align="center" py={10}>
            <Spinner size="xl" color="teal.500" />
            <Text fontSize="md" color={mutedText} fontWeight="600">
              Loading your course...
            </Text>
          </VStack>
        </Box>
      </Box>
    );
  }

  if (!courseState || courseState === null) {
    return (
      <Box w="100%" minH="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Card.Root
          maxW="md"
          textAlign="center"
          bg={cardBg}
          borderWidth="1px"
          borderColor={cardBorderColor}
          borderRadius="2xl"
        >
          <Card.Body p={{ base: 6, md: 8 }}>
            <VStack gap={4}>
              <Box
                p={5}
                borderRadius="2xl"
                bg={useColorModeValue("red.50", "rgba(239, 68, 68, 0.1)")}
              >
                <BookOpen size={48} color="#ef4444" />
              </Box>
              <VStack gap={2}>
                <Heading fontSize="2xl" fontWeight="800">
                  Course not found
                </Heading>
                <Text fontSize="md" color={mutedText}>
                  Please go back and select a course.
                </Text>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <Box minH="100vh">
      {/* Header */}
      <Box
        borderBottomWidth="1px"
        borderColor={cardBorderColor}
        bg={useColorModeValue("rgba(255, 255, 255, 0.85)", "rgba(10, 10, 10, 0.85)")}
        backdropFilter="blur(12px)"
        position="sticky"
        top={0}
        zIndex={20}
      >
          <VStack align="stretch" gap={0} p={{ base: 3, md: 4 }}>
            <HStack justify="space-between" align="center" gap={3}>
              {/* Left: Icon + Title */}
              <HStack gap={2} flex={1} minW={0}>
                <Box
                  w={{ base: "32px", md: "36px" }}
                  h={{ base: "32px", md: "36px" }}
                  borderRadius="lg"
                  bg={highlightBg}
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <GraduationCap size={20} color={accentColor} />
                </Box>
                <Heading
                  fontSize={{ base: "xl", sm: "2xl", md: "3xl" }}
                  fontWeight="800"
                  bgGradient={gradientText}
                  bgClip="text"
                  lineHeight="1.2"
                  letterSpacing="-0.02em"
                  flex={1}
                  minW={0}
                  truncate
                >
                  {courseState.title}
                </Heading>
              </HStack>

              {/* Desktop: Inline Progress */}
              <HStack gap={3} display={{ base: "none", md: "flex" }} flexShrink={0}>
                <HStack gap={2.5} pl={2} borderLeftWidth="1px" borderColor={cardBorderColor}>
                  <VStack gap={0} align="center">
                    <Text fontSize="2xs" color={mutedText} fontWeight="600" textTransform="uppercase" letterSpacing="wide">Modules</Text>
                    <ProgressCircleComponent size="xl" value={completedPercentageModules} />
                  </VStack>
                  <VStack gap={0} align="center">
                    <Text fontSize="2xs" color={mutedText} fontWeight="600" textTransform="uppercase" letterSpacing="wide">Lessons</Text>
                    <ProgressCircleComponent size="xl" value={completedPercentagesLessons} />
                  </VStack>
                </HStack>
              </HStack>

              {/* Mobile: Progress + TOC button */}
              <HStack gap={2} display={{ base: "flex", md: "none" }} flexShrink={0}>
                <ProgressCircleComponent size="xl" value={completedPercentagesLessons} />
                <IconButton
                  aria-label="Open course outline"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsTOCOpen(true)}
                  borderRadius="lg"
                  _hover={{ bg: highlightBg }}
                >
                  <Menu size={20} />
                </IconButton>
              </HStack>
            </HStack>
          </VStack>
        </Box>

      {/* Main Content Area */}
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 4, md: 6 }}>
        <Box
          display="flex"
          flexDirection={{ base: "column", lg: "row" }}
          gap={{ base: 6, lg: 4 }}
          minH={{ base: "auto", lg: "calc(100vh - 200px)" }}
        >
          {/* Desktop TOC */}
          <Box display={{ base: "none", lg: "block" }}>
            <TOC
              courseState={courseState}
              setCourseState={setCourseState}
              activeModuleIndex={activeModuleIndex}
              setActiveModuleIndex={setActiveModuleIndex}
              currentLessonIndex={currentLessonIndex}
              setCurrentLessonIndex={setCurrentLessonIndex}
              onLessonChange={handleLessonChange}
            />
          </Box>

          {/* Mobile TOC Drawer */}
          <Drawer.Root open={isTOCOpen} onOpenChange={(e) => setIsTOCOpen(e.open)} placement="bottom" size="full">
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content borderTopRadius="2xl" maxH="85vh" h="85vh">
                <Drawer.Header
                  borderBottom="1px solid"
                  borderColor={cardBorderColor}
                  bg={cardBg}
                >
                  <HStack justify="space-between" w="100%">
                    <HStack gap={2}>
                      <Box p={1.5} borderRadius="lg" bg={highlightBg}>
                        <BookOpen size={18} color="#14b8a6" />
                      </Box>
                      <Heading fontSize="lg" fontWeight="800">
                        Course Outline
                      </Heading>
                    </HStack>
                    <IconButton
                      aria-label="Close"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTOCOpen(false)}
                      borderRadius="lg"
                      _hover={{ bg: highlightBg }}
                    >
                      <X size={20} />
                    </IconButton>
                  </HStack>
                </Drawer.Header>
                <Drawer.Body p={0} overflow="auto" display="flex" flexDirection="column" bg={cardBg} flex={1}>
                  <TOC
                    courseState={courseState}
                    setCourseState={setCourseState}
                    activeModuleIndex={activeModuleIndex}
                    setActiveModuleIndex={setActiveModuleIndex}
                    currentLessonIndex={currentLessonIndex}
                    setCurrentLessonIndex={setCurrentLessonIndex}
                    onLessonChange={handleLessonChange}
                    isMobileDrawer
                  />
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Drawer.Root>

          {/* Content Area */}
          <Box
            flex="1"
            overflowY="auto"
          >
            {activeModuleIndex !== null && courseState.modules[activeModuleIndex]?.lessons && (
              <CourseRenderer
                courseState={courseState}
                setCourseState={setCourseState}
                currentModuleIndex={activeModuleIndex}
                currentLessonIndex={currentLessonIndex}
                setShowQuiz={setShowQuiz}
                onLessonChange={handleLessonChange}
                onModuleComplete={handleModuleComplete}
                generationQueue={generationQueue}
                onQueueEntryClick={handleQueueEntryClick}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}