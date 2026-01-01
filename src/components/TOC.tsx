
import React, { useEffect, useState } from "react";
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
import { useLocation } from "react-router-dom";
import type { Course, Status } from "../types";
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



    const handleModuleOpen = (id: number) => {
        setActiveModuleIndex(id);
        setCurrentLessonIndex(0);

        if (courseState.modules[id].status !== "COMPLETED") {
            setCourseState((prev: Course) => {
                const updated = [...prev.modules];
                updated[id].status = "IN_PROGRESS" as Status;
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
            case "COMPLETED":
                return (
                    <Circle bg={useColorModeValue("green.100", "green.900")}>
                        <BiCheck size={30} color="green" />
                    </Circle>
                );
            case "IN_PROGRESS":
                return (
                    <Circle bg={useColorModeValue("teal.100", "teal.900")}>
                        <BiTime size={30} color="teal" />
                    </Circle>
                );
            case "NOT_GENERATED":
                return (
                    <Circle bg={useColorModeValue("gray.100", "gray.400")}>
                        <MdInfo size={30} color="gray.500" />
                    </Circle>
                );
            case "LOADING":
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
    console.log("TOC Rendered with courseState:", courseState);
    return (
        <Box
            minW={tocCollapsed ? "70px" : "400px"}
            maxW={tocCollapsed ? "70px" : "400px"}
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
                right={tocCollapsed ? "10px" : "4px"}
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
                                    </HStack>

                                    {module.lessons && (
                                        <VStack align="start" gap={1} pl={6}>
                                            {module.lessons.map((lesson, i) => (
                                                <HStack>
                                                    {lesson.status === "COMPLETED" && (
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
