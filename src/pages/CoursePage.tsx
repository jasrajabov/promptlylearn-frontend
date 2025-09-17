import { useEffect, useState, useRef } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Spinner,
} from "@chakra-ui/react";
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
} from "@chakra-ui/react";
import { BiCheckCircle, BiChevronLeft, BiChevronRight } from "react-icons/bi";
import { TiTime } from "react-icons/ti";
import { MdInfo } from "react-icons/md";
import { FaRobot } from "react-icons/fa";
import { SlideFade } from "@chakra-ui/transition";
import { useLocation } from "react-router-dom";
import type { Course } from "../types";
import { useUser } from "../contexts/UserContext";
import fetchWithTimeout from "../utils/fetcherWithTimeout";
import { Stats } from "../components/Stats";
import CourseRenderer from "../components/CourseRenderer";
import { useColorModeValue } from "../components/ui/color-mode";

// --- FancyHeading wrapper ---
const FancyHeading = (props: any) => (
    <Heading fontWeight="semibold" letterSpacing="-0.5px" color="teal.600" {...props} />
);

interface LocationState {
    course: Course;
}

export default function CourseTimeline() {
    const location = useLocation();
    const { user } = useUser();
    const course = (location?.state as LocationState)?.course ?? null;

    const [activeModuleIndex, setActiveModuleIndex] = useState<number | null>(null);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [showQuiz, setShowQuiz] = useState(false);
    const [courseState, setCourseState] = useState<Course>(course);
    const [timelineOpen, setTimelineOpen] = useState(true);

    const connectorColor = useColorModeValue("gray.300", "gray.600");

    const tocRef = useRef<HTMLDivElement>(null); // Ref for TOC scroll container

    useEffect(() => {
        if (!course) return;
        const modulesWithStatus = course.modules.map((module) => ({
            ...module,
            status: module.status || "not-generated",
        }));
        setCourseState({ ...course, modules: modulesWithStatus });
    }, [course]);

    const loadModule = async (id: number) => {
        setCourseState((prev) => {
            const updated = [...prev.modules];
            updated[id].status = "loading";
            return { ...prev, modules: updated };
        });

        if (!user) return console.log("User not logged in");

        try {
            const response = await fetchWithTimeout(
                "http://localhost:8000/generate-module-details",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        course_title: courseState.title,
                        module: courseState.modules[id],
                    }),
                },
                600000
            );

            if (!response.ok) throw new Error("Failed to fetch module");

            const data = await response.json();
            if (data && data.lessons) {
                setCourseState((prev) => {
                    const updated = [...prev.modules];
                    updated[id] = {
                        ...updated[id],
                        lessons: data.lessons,
                        quiz: data.quiz,
                        status: "not-started",
                        estimatedTime: data.estimatedTime || 15,
                    };
                    return { ...prev, modules: updated };
                });
            }
        } catch (err) {
            console.error(err);
            setCourseState((prev) => {
                const updated = [...prev.modules];
                updated[id].status = "not-generated";
                return { ...prev, modules: updated };
            });
        }
    };

    const handleModuleOpen = (id: number) => {
        setActiveModuleIndex(id);
        setCurrentLessonIndex(0);

        if (courseState.modules[id].status !== "complete") {
            setCourseState((prev) => {
                const updated = [...prev.modules];
                updated[id].status = "in-progress";
                return { ...prev, modules: updated };
            });
        }
    };

    const handleLessonChange = (lessonIndex: number, moduleIndex: number) => {
        setCurrentLessonIndex(lessonIndex);
        setActiveModuleIndex(moduleIndex);
    };

    const handleModuleComplete = (nextModuleIndex: number) => {
        setActiveModuleIndex(nextModuleIndex);
        setCurrentLessonIndex(0);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "complete":
                return <BiCheckCircle color="green.500" />;
            case "in-progress":
                return <TiTime color="blue.500" />;
            case "loading":
                return <MdInfo color="cyan.500" />;
            default:
                return <MdInfo color="gray.400" />;
        }
    };

    if (!course) {
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
        <Box w="100%">
            {/* STATS */}
            <Box
                top={0}
                zIndex={50}
                bg="gray.50"
                _dark={{ bg: "gray.800" }}
                p={4}
                boxShadow="md"
                borderBottom="1px solid"
                borderColor="gray.200"
            >
                <FancyHeading mb={2}>{course.title}</FancyHeading>
                <Stats courseState={courseState} />

            </Box>

            {<Button size="sm" mt={2} onClick={() => setTimelineOpen((prev) => !prev)}>
                {timelineOpen ? <BiChevronLeft /> : <BiChevronRight />}
            </Button>}
            <HStack align="flex-start" gap={6} p={6}>
                {/* LEFT TOC */}

                <SlideFade in={timelineOpen} offsetY="10px">
                    <VStack
                        align="stretch"
                        gap={4}
                        minW="250px"
                        maxH="80vh"          // fixed height
                        overflowY="auto"     // scroll independently
                        ref={tocRef}
                        position="sticky"
                        top="120px"
                        p={2}
                        borderRight="1px solid"
                        borderColor={useColorModeValue("gray.200", "gray.600")}
                    >
                        <FancyHeading size="md" mb={2}>Course Outline</FancyHeading>

                        <Timeline.Root>
                            {courseState.modules.map((module, idx) => (
                                <Timeline.Item key={idx}>
                                    <Timeline.Connector borderColor={connectorColor}>
                                        <Timeline.Separator />
                                        <Timeline.Indicator>{getStatusIcon(module.status)}</Timeline.Indicator>
                                        {/* {idx < courseState.modules.length - 1 && (
                                                <TimelineConnector borderColor={connectorColor} />
                                            )} */}
                                    </Timeline.Connector>
                                    <Timeline.Content>
                                        <HStack justify="space-between" align="center" mb={2}>
                                            <Heading size="sm">{module.title}</Heading>
                                            {module.status === "not-generated" ? (
                                                <Button size="xs" onClick={() => loadModule(idx)}>
                                                    <FaRobot /> Generate
                                                </Button>
                                            ) : (
                                                <Button size="xs" onClick={() => handleModuleOpen(idx)}>
                                                    Open
                                                </Button>
                                            )}
                                            {module.status === "loading" && <Spinner size="sm" />}
                                        </HStack>

                                        {/* Lessons TOC */}
                                        {module.lessons && (
                                            <VStack align="start" gap={1} pl={6}>
                                                {module.lessons.map((lesson, i) => (
                                                    <Text
                                                        key={i}
                                                        fontSize="sm"
                                                        color={
                                                            activeModuleIndex === idx && currentLessonIndex === i
                                                                ? "teal.500"
                                                                : "gray.500"
                                                        }
                                                        cursor="pointer"
                                                        onClick={() => handleLessonChange(i, idx)}
                                                        _hover={{ color: "teal.600" }}
                                                    >
                                                        {lesson.title}
                                                    </Text>
                                                ))}
                                            </VStack>
                                        )}
                                    </Timeline.Content>
                                </Timeline.Item>
                            ))}
                        </Timeline.Root>
                    </VStack>
                </SlideFade>

                {/* RIGHT MODULE CONTENT */}
                <Box flex="1" maxH="80vh" overflowY="auto">
                    {activeModuleIndex !== null &&
                        courseState.modules[activeModuleIndex]?.lessons && (
                            <CourseRenderer
                                course={courseState}
                                module={courseState.modules[activeModuleIndex]}
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
