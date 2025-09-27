import { useEffect, useState } from "react";
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

const FancyHeading = (props: any) => (
    <Heading fontWeight="semibold" letterSpacing="-0.5px" color="teal.600" {...props} />
);

export default function CourseTimeline() {
    const { id } = useParams<{ id: string }>();
    console.log("Course ID from params:", id);
    const { user } = useUser();

    const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);
    const [courseState, setCourseState] = useState<Course>({} as Course);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                console.log("Fetching course details for ID:", id);
                const response = await fetch(`http://localhost:8000/get_course/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.token}`,
                    },
                });
                console.log("Fetch response:", response);
                const data = await response.json();
                console.log("Course details response data:", data);
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
            <Box
                top={0}
                zIndex={50}
                p={1}
                boxShadow="md"
                borderBottom="1px solid"
                borderColor="gray.200"
            >
                <Stats courseState={courseState} />
            </Box>

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
