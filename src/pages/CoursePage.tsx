import React, { useEffect, useState } from "react";
import {
    Box,
    HStack,
    Heading,
    Text,
    Spinner,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import type { Course } from "../types";
import { useUser } from "../contexts/UserContext";
import { Stats } from "../components/Stats";
import CourseRenderer from "../components/CourseRenderer";
import { TOC } from "../components/TOC";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FancyHeading = (props: any) => (
    <Heading fontWeight="semibold" letterSpacing="-0.5px" color="teal.600" {...props} />
);

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
            <Box p={8} textAlign="center">
                <Spinner size="xl" />
            </Box>
        );
    }

    if (!courseState || courseState === null) {
        return (
            <Box p={8} textAlign="center">
                <FancyHeading size="md" mb={4} color="red.400">
                    Course not found
                </FancyHeading>
                <Text color="gray.400">Please go back and select a course.</Text>
            </Box>
        );
    }



    return (
        <Box w="100%" display="flex" flexDirection="column">
            {/* HEADER */}
            <HStack justify="space-between" mb={6} align="center">
                <Heading size="lg">
                    {courseState.title}
                </Heading>
                <Stats
                    stats={[
                        { label: "Modules", progress: completedPercentageModules },
                        { label: "Lessons", progress: completedPercentagesLessons },
                    ]}
                />
            </HStack>

            <HStack align="stretch" flex="1" minH={0} gap={0}>
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
