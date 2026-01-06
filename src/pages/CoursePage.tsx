import React, { useEffect, useState } from "react";
import {
    Box,
    HStack,
    Heading,
    Text,
    Spinner,
    VStack,
    Card,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import type { Course } from "../types";
import { useUser } from "../contexts/UserContext";
import { Stats } from "../components/Stats";
import CourseRenderer from "../components/CourseRenderer";
import { TOC } from "../components/TOC";
import { BookOpen, GraduationCap } from "lucide-react";
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

    const completedPercentageModules = courseState.modules
        ? Math.round(
            (courseState.modules.filter((m) => m.status === "COMPLETED").length /
                courseState.modules.length) *
            100
        )
        : 0;
    const totalLessons = courseState.modules
        ? courseState.modules.reduce((sum, module) => sum + module.lessons.length, 0)
        : 0;
    const completedLessons = courseState.modules
        ? courseState.modules.reduce(
            (sum, module) =>
                sum + module.lessons.filter((lesson) => lesson.status === "COMPLETED").length,
            0
        )
        : 0;
    const completedPercentagesLessons =
        totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    useEffect(() => {
        if (!user) return;
        const fetchCourse = async () => {
            setLoading(true);
            try {
                console.log("Fetching course details for ID:", id);
                const response = await fetch(`${BACKEND_URL}/course/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.token}`,
                    },
                });
                const data = await response.json();
                console.log("Fetched course data:", data);
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

    const handleLessonChange = (lessonIndex: number, moduleIndex: number) => {
        setCurrentLessonIndex(lessonIndex);
        setActiveModuleIndex(moduleIndex);
    };

    const handleModuleComplete = (nextModuleIndex: number) => {
        setActiveModuleIndex(nextModuleIndex);
        setCurrentLessonIndex(0);
    };

    if (loading) {
        return (
            <Box
                w="100%"
                h="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
            // bg="gray.50"
            // _dark={{ bg: "gray.900" }}
            >
                <VStack gap={4}>
                    <Spinner size="xl" color="teal.500" />
                    <Text color="gray.600" _dark={{ color: "gray.400" }}>Loading course...</Text>
                </VStack>
            </Box>
        );
    }

    if (!courseState || courseState === null) {
        return (
            <Box
                w="100%"
                h="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
            // bg="gray.50"
            // _dark={{ bg: "gray.900" }}
            >
                <Card.Root maxW="md" textAlign="center">
                    <Card.Body>
                        <VStack gap={4}>
                            <Box
                                p={4}
                                borderRadius="full"
                                bg="red.100"
                                _dark={{ bg: "red.900/20" }}
                            >
                                <BookOpen className="w-8 h-8 text-red-500" />
                            </Box>
                            <Heading size="lg" color="red.600" _dark={{ color: "red.400" }}>
                                Course not found
                            </Heading>
                            <Text color="gray.600" _dark={{ color: "gray.400" }}>
                                Please go back and select a course.
                            </Text>
                        </VStack>
                    </Card.Body>
                </Card.Root>
            </Box>
        );
    }

    return (
        <Box
            w="100%"
            display="flex"
            flexDirection="column"
            p={{ base: 2, md: 2 }}
            gap={3}
        >
            {/* ENHANCED HEADER */}
            <Card.Root>
                <Card.Body>
                    <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
                        <HStack gap={3}>
                            <Box
                                p={2}
                                borderRadius="lg"
                            >
                                <GraduationCap size={50} className="w-6 h-6 text-teal-600" />
                            </Box>
                            <VStack align="start" gap={0}>
                                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                                    Course
                                </Text>
                                <Heading size="3xl" letterSpacing="-0.5px">
                                    {courseState.title}
                                </Heading>
                            </VStack>
                        </HStack>
                        <Stats
                            stats={[
                                { label: "Modules", progress: completedPercentageModules },
                                { label: "Lessons", progress: completedPercentagesLessons },
                            ]}
                        />
                    </HStack>
                </Card.Body>
            </Card.Root>

            {/* MAIN CONTENT AREA */}
            <HStack align="stretch" flex="1" minH={0} gap={6}>
                {/* LEFT TOC */}
                <TOC
                    courseState={courseState}
                    setCourseState={setCourseState}
                    activeModuleIndex={activeModuleIndex}
                    setActiveModuleIndex={setActiveModuleIndex}
                    currentLessonIndex={currentLessonIndex}
                    setCurrentLessonIndex={setCurrentLessonIndex}
                />

                {/* RIGHT MODULE CONTENT */}
                <Box
                    flex="1"
                    overflowY="auto"
                    minW={0}
                    minH={0}
                >
                    {activeModuleIndex !== null &&
                        courseState.modules[activeModuleIndex]?.lessons && (
                            <CourseRenderer
                                courseState={courseState}
                                setCourseState={setCourseState}
                                currentModuleIndex={activeModuleIndex}
                                currentLessonIndex={currentLessonIndex}
                                showQuiz={showQuiz}
                                setShowQuiz={setShowQuiz}
                                onLessonChange={handleLessonChange}
                                onModuleComplete={handleModuleComplete}
                            />
                        )}
                </Box>
            </HStack>
        </Box>
    );
}