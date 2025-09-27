
import { useEffect, useState } from "react";
import {
    Box,
    VStack,
    HStack,
    Heading,
    Text,
    Button,
    Spinner,
    Circle
} from "@chakra-ui/react";
import { Timeline } from "@chakra-ui/react";
import { BiCheck, BiChevronLeft, BiChevronRight, BiTime } from "react-icons/bi";
import { MdInfo } from "react-icons/md";
import { FaRobot } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import type { Course, Status } from "../types";
import { useUser } from "../contexts/UserContext";
import fetchWithTimeout from "../utils/fetcherWithTimeout";
import { useColorModeValue } from "../components/ui/color-mode";
import { Tooltip } from "../components/ui/tooltip";
import type { Module } from "../types";



type TOCProps = {
    courseState: Course;
    setCourseState: React.Dispatch<React.SetStateAction<Course>>;
    activeModuleIndex: number | null;
    setActiveModuleIndex: (index: number | null) => void;
    currentLessonIndex: number;
    setCurrentLessonIndex: (index: number) => void;
};

const FancyHeading = (props: any) => (
    <Heading fontWeight="semibold" letterSpacing="-0.5px" color="teal.600" {...props} />
);

interface LocationState {
    course: Course;
}

export const TOC = ({
    courseState,
    setCourseState,
    activeModuleIndex,
    setActiveModuleIndex,
    currentLessonIndex,
    setCurrentLessonIndex
}: TOCProps) => {

    const location = useLocation();
    const { user } = useUser();
    const course = (location?.state as LocationState)?.course ?? null;


    const [tocCollapsed, setTocCollapsed] = useState(false);

    const connectorColor = useColorModeValue("gray.300", "gray.600");

    useEffect(() => {
        if (!course) return;
        const modulesWithStatus = course.modules.map((module: Module) => ({
            ...module,
            status: module.status || "not-generated",
        }));
        setCourseState({ ...course, modules: modulesWithStatus });
    }, [course]);



    const generateModule = async (id: number) => {
        setCourseState((prev: Course) => {
            const updated = [...prev.modules];
            updated[id].status = "loading";
            return { ...prev, modules: updated };
        });

        if (!user) return console.log("User not logged in");

        try {
            console.log("module:", courseState.modules[id]);
            const response = await fetchWithTimeout(
                "http://localhost:8000/generate-module-details",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user.token}`
                    },
                    body: JSON.stringify({
                        course_id: courseState.id,
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
                        status: "in_progress",
                        estimatedTime: data.estimatedTime || 15,
                    };
                    return { ...prev, modules: updated };
                });
            }
        } catch (err) {
            console.error(err);
            setCourseState((prev) => {
                const updated = [...prev.modules];
                updated[id].status = "not_generated";
                return { ...prev, modules: updated };
            });
        }
    };

    const handleModuleOpen = (id: number) => {
        setActiveModuleIndex(id);
        setCurrentLessonIndex(0);

        if (courseState.modules[id].status !== "completed") {
            setCourseState((prev: Course) => {
                const updated = [...prev.modules];
                updated[id].status = "in_progress";
                return { ...prev, modules: updated };
            });
        }
    };

    const handleLessonChange = (lessonIndex: number, moduleIndex: number) => {
        setCurrentLessonIndex(lessonIndex);
        setActiveModuleIndex(moduleIndex);
    };


    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <Circle bg={useColorModeValue("green.100", "green.900")}>
                        <BiCheck size={30} color="green" />
                    </Circle>
                );
            case "in_progress":
                return (
                    <Circle bg={useColorModeValue("teal.100", "teal.900")}>
                        <BiTime size={30} color="teal" />
                    </Circle>
                );
            case "not_generated":
                return (
                    <Circle bg={useColorModeValue("gray.100", "gray.400")}>
                        <MdInfo size={30} color="gray.500" />
                    </Circle>
                );
            case "loading":
                return (
                    <Circle bg={useColorModeValue("cyan.100", "cyan.900")}>
                        <Spinner size="lg" color="cyan.500" />
                    </Circle>
                );
            default:
                return (
                    <Circle bg={useColorModeValue("gray.100", "gray.400")}>
                        <MdInfo size={30} color="gray.400" />
                    </Circle>
                );
        }
    };

    return (
        <Box
            minW={tocCollapsed ? "70px" : "400px"}
            maxW={tocCollapsed ? "70px" : "400px"}
            // flex="none"           // ✅ instead of h="100%"
            overflowY="auto"   // independent scrolling
            borderRight="1px solid"
            borderColor={useColorModeValue("gray.200", "gray.600")}
            position="relative"
            transition="all 0.3s"
            minH={0}
            flexShrink={0}
        >
            {/* Collapse/Expand Button */}
            <Button
                size="xs"
                position="absolute"
                variant="ghost"
                top={2}
                right={tocCollapsed ? "-20px" : "4px"}
                onClick={() => setTocCollapsed(!tocCollapsed)}
            >
                {tocCollapsed ? <BiChevronRight /> : <BiChevronLeft />}
            </Button>

            {!tocCollapsed ? (
                <VStack align="stretch" gap={2} p={2}>
                    <FancyHeading size="md" mb={2}>
                        Course Outline
                    </FancyHeading>

                    <Timeline.Root>
                        {courseState.modules.map((module, idx) => (
                            <Timeline.Item key={idx}>
                                <Timeline.Connector borderColor={connectorColor}>
                                    <Timeline.Separator />
                                    <Timeline.Indicator>{getStatusIcon(module.status)}</Timeline.Indicator>
                                </Timeline.Connector>
                                <Timeline.Content>
                                    <HStack justify="space-between" align="center" mb={2}>
                                        <Heading size="sm">{module.title}</Heading>
                                        {module.status === "not_generated" ? (
                                            <Button size="xs" onClick={() => generateModule(idx)}>
                                                <FaRobot /> Generate
                                            </Button>
                                        ) : (module.status !== "loading" &&
                                            <Button size="xs" onClick={() => handleModuleOpen(idx)}>
                                                Open
                                            </Button>
                                        )}

                                    </HStack>

                                    {module.lessons && (
                                        <VStack align="start" gap={1} pl={6}>
                                            {module.lessons.map((lesson, i) => (
                                                <HStack>
                                                    {lesson.status === "completed" && (
                                                        <Circle size={4} bg="green.500">
                                                            <BiCheck size={16} color="green" />
                                                        </Circle>
                                                    )}
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

                                                </HStack>

                                            ))}
                                        </VStack>
                                    )}
                                </Timeline.Content>
                            </Timeline.Item>
                        ))}
                    </Timeline.Root>
                </VStack>
            ) : (
                <VStack align="center" gap={4} mt={12}>
                    {courseState.modules.map((module, idx) => (
                        <Tooltip
                            key={idx}
                            content={
                                <VStack align="start" gap={1}>
                                    <Box fontWeight="bold">{module.title}</Box>
                                    {module.lessons?.map((lesson, i) => (
                                        <Text key={i} fontSize="sm">
                                            {lesson.title}
                                        </Text>
                                    ))}
                                </VStack>
                            }

                            showArrow
                        // bg={useColorModeValue("gray.50", "gray.700")}
                        // color={useColorModeValue("black", "white")}
                        >
                            <Box cursor="pointer" onClick={() => handleModuleOpen(idx)}>
                                {getStatusIcon(module.status)}
                            </Box>
                        </Tooltip>
                    ))}
                </VStack>
            )}
        </Box>
    )
}