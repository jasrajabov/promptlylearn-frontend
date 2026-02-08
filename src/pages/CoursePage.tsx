import { useEffect, useState } from "react";
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
import { Stats } from "../components/Stats";
import CourseRenderer from "../components/CourseRenderer";
import { TOC } from "../components/TOC";
import { useGenerationQueue } from "../hooks/useGenerationQueue";
import { BookOpen, GraduationCap, Menu, X } from "lucide-react";
import { useColorModeValue } from "../components/ui/color-mode";

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
  const cardBg = useColorModeValue("white", "gray.950");

  // ---------------------------------------------------------------------------
  // Progress calculations (unchanged)
  // ---------------------------------------------------------------------------
  const completedPercentageModules = courseState.modules
    ? Math.round((courseState.modules.filter((m) => m.status === "COMPLETED").length / courseState.modules.length) * 100)
    : 0;
  const totalLessons = courseState.modules
    ? courseState.modules.reduce((sum, module) => sum + module.lessons.length, 0)
    : 0;
  const completedLessons = courseState.modules
    ? courseState.modules.reduce((sum, module) => sum + module.lessons.filter((l) => l.status === "COMPLETED").length, 0)
    : 0;
  const completedPercentagesLessons = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

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
      <Box w="100%" h="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
          <Text color="gray.600" _dark={{ color: "gray.400" }} fontWeight="medium">Loading course…</Text>
        </VStack>
      </Box>
    );
  }

  if (!courseState || courseState === null) {
    return (
      <Box w="100%" h="100vh" display="flex" alignItems="center" justifyContent="center" p={4}>
        <Card.Root maxW="md" textAlign="center">
          <Card.Body p={{ base: 6, md: 8 }}>
            <VStack gap={4}>
              <Box p={4} borderRadius="full" bg="red.100" _dark={{ bg: "red.900/20" }}>
                <BookOpen className="w-8 h-8 text-red-500" />
              </Box>
              <Heading size="lg" color="red.600" _dark={{ color: "red.400" }}>Course not found</Heading>
              <Text color="gray.600" _dark={{ color: "gray.400" }}>Please go back and select a course.</Text>
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
    <Box w="100%" minH="100vh" position="relative">
      {/* Mobile Header */}
      <Box
        display={{ base: "block", lg: "none" }}
        top={0}
        zIndex={20}
        bg={cardBg}
        borderBottom="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        px={4}
        py={3}
      >
        <HStack justify="space-between">
          <HStack gap={2}>
            <GraduationCap size={24} className="text-teal-600" />
            <Heading fontSize="lg" fontWeight="bold" bgGradient={gradientText} bgClip="text">
              {courseState.title}
            </Heading>
          </HStack>
          <IconButton aria-label="Open course outline" size="sm" variant="ghost" onClick={() => setIsTOCOpen(true)}>
            <Menu size={20} />
          </IconButton>
        </HStack>
      </Box>

      {/* Desktop Header */}
      <Box display={{ base: "none", lg: "block" }} mb={4}>
        <Card.Root bg={cardBg}>
          <Card.Body>
            <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <HStack gap={3}>
                <Box p={3} borderRadius="xl" bg={useColorModeValue("teal.50", "teal.900/30")}>
                  <GraduationCap size={32} className="text-teal-600" />
                </Box>
                <VStack align="start" gap={0}>
                  <Text fontSize="sm" fontWeight="semibold" color={useColorModeValue("gray.600", "gray.400")} letterSpacing="wide" textTransform="uppercase">Course</Text>
                  <Heading fontSize={{ base: "2xl", md: "3xl", lg: "4xl" }} fontWeight="bold" bgGradient={gradientText} bgClip="text" lineHeight="1.2" letterSpacing="-0.02em" maxW="800px">
                    {courseState.title}
                  </Heading>
                </VStack>
              </HStack>
              <Stats stats={[
                { label: "Modules", progress: completedPercentageModules },
                { label: "Lessons", progress: completedPercentagesLessons },
              ]} />
            </HStack>
          </Card.Body>
        </Card.Root>
      </Box>

      {/* Main Content Area */}
      <Box display="flex" flexDirection={{ base: "column", lg: "row" }} gap={{ base: 0, lg: 4 }} px={{ base: 0, lg: 4 }} pb={{ base: "80px", lg: 4 }} minH={{ base: "calc(100vh - 200px)", lg: "calc(100vh - 200px)" }}>
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
        <Drawer.Root open={isTOCOpen} onOpenChange={(e) => setIsTOCOpen(e.open)} size="full">
          <Drawer.Backdrop />
          <Drawer.Content>
            <Drawer.Header>
              <HStack justify="space-between" w="100%">
                <Heading size="md" fontWeight="semibold">Course Outline</Heading>
                <IconButton aria-label="Close" variant="ghost" size="sm" onClick={() => setIsTOCOpen(false)}>
                  <X size={20} />
                </IconButton>
              </HStack>
            </Drawer.Header>
            <Drawer.Body p={0}>
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
        </Drawer.Root>

        {/* Content Area */}
        <Box flex="1" overflowY="auto" px={{ base: 1, lg: 0 }} pt={{ base: 1, lg: 0 }}>
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

      {/* Mobile Bottom Stats Bar */}
      <Box
        display={{ base: "block", lg: "none" }}
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        bg={cardBg}
        borderTop="1px solid"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        p={3}
        zIndex={15}
        boxShadow="lg"
      >
        <HStack justify="space-around" gap={4}>
          <VStack gap={0} flex={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">Modules</Text>
            <Text fontSize="lg" fontWeight="bold" color="teal.600">{completedPercentageModules}%</Text>
          </VStack>
          <Box w="1px" h="40px" bg="gray.200" _dark={{ bg: "gray.700" }} />
          <VStack gap={0} flex={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">Lessons</Text>
            <Text fontSize="lg" fontWeight="bold" color="teal.600">{completedPercentagesLessons}%</Text>
          </VStack>
          <Box w="1px" h="40px" bg="gray.200" _dark={{ bg: "gray.700" }} />
          <VStack gap={0} flex={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">Progress</Text>
            <Text fontSize="lg" fontWeight="bold" color="teal.600">{completedLessons}/{totalLessons}</Text>
          </VStack>
        </HStack>
      </Box>
    </Box>
  );
}