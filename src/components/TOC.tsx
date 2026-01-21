import React, { useEffect, useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Progress,
  Checkbox,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Timeline } from "@chakra-ui/react";
import {
  BiCheck,
  BiChevronLeft,
  BiChevronRight,
} from "react-icons/bi";
import { useLocation } from "react-router-dom";
import type { Course, Status, Module } from "../types";
import { useColorModeValue } from "../components/ui/color-mode";
import { Tooltip } from "../components/ui/tooltip";
import { useUser } from "../contexts/UserContext";

type TOCProps = {
  courseState: Course;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
  activeModuleIndex: number | null;
  setActiveModuleIndex: (index: number | null) => void;
  currentLessonIndex: number;
  setCurrentLessonIndex: (index: number) => void;
};

interface LocationState {
  course: Course;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const TOC = ({
  courseState,
  setCourseState,
  activeModuleIndex,
  setActiveModuleIndex,
  currentLessonIndex,
  setCurrentLessonIndex,
}: TOCProps) => {
  const location = useLocation();

  const course = (location?.state as LocationState)?.course ?? null;

  // Default to collapsed on mobile, expanded on desktop
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const [tocCollapsed, setTocCollapsed] = useState(false);

  const bgColor = useColorModeValue("gray.200", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.900");
  const activeBg = useColorModeValue("teal.50", "teal.950");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const mutedTextColor = useColorModeValue("gray.500", "gray.400");
  const checkboxColor = useColorModeValue("white", "black");
  const mutedTealTextColor = useColorModeValue("teal.600", "teal.400");

  const { user } = useUser();

  // Set initial collapsed state based on screen size
  useEffect(() => {
    if (isMobile !== undefined) {
      setTocCollapsed(isMobile);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!course) return;
    const modulesWithStatus = course.modules.map((module: Module) => ({
      ...module,
      status: module.status || "NOT_GENERATED",
    }));
    setCourseState({ ...course, modules: modulesWithStatus });
  }, [course]);

  const updateCourseInDB = async (updatedCourse: Course) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/course/${updatedCourse.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(updatedCourse),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update course");
      }

    } catch (error) {
      console.error("Error updating course:", error);
      // Optionally show an error toast/notification to the user
    }
  };

  const handleModuleToggle = (moduleIndex: number, checked: boolean) => {
    setCourseState((prev: Course) => {
      const updated = [...prev.modules];
      updated[moduleIndex].status = checked ? "COMPLETED" : "IN_PROGRESS";
      const updatedCourse = { ...prev, modules: updated };
      updatedCourse.modules[moduleIndex].lessons = updatedCourse.modules[
        moduleIndex
      ].lessons.map((lesson) => ({
        ...lesson,
        status: checked ? "COMPLETED" : "IN_PROGRESS",
      }));

      // Update database
      updateCourseInDB(updatedCourse);

      return updatedCourse;
    });
  };

  const handleLessonToggle = (
    lessonIndex: number,
    moduleIndex: number,
    checked: boolean,
  ) => {
    setCourseState((prev: Course) => {
      const updated = [...prev.modules];
      if (updated[moduleIndex].lessons) {
        updated[moduleIndex].lessons[lessonIndex].status = checked
          ? "COMPLETED"
          : "IN_PROGRESS";
      }
      const updatedCourse = { ...prev, modules: updated };
      if (updatedCourse.modules[moduleIndex].lessons) {
        const allLessonsCompleted = updatedCourse.modules[
          moduleIndex
        ].lessons.every((lesson) => lesson.status === "COMPLETED");
        updatedCourse.modules[moduleIndex].status = allLessonsCompleted
          ? "COMPLETED"
          : "IN_PROGRESS";
      } else {
        updatedCourse.modules[moduleIndex].status = "IN_PROGRESS";
      }

      // Update database
      updateCourseInDB(updatedCourse);

      return updatedCourse;
    });
  };

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

  const getCompletedLessons = (module: Module) => {
    if (!module.lessons) return 0;
    return module.lessons.filter((l) => l.status === "COMPLETED").length;
  };

  return (
    <Box
      minW={tocCollapsed ? { base: "60px", md: "70px" } : { base: "90%", sm: "350px", md: "400px" }}
      maxW={tocCollapsed ? { base: "60px", md: "70px" } : { base: "90%", sm: "350px", md: "400px" }}
      h="100%"
      overflowY="auto"
      borderRight={{ base: "none", lg: "1px solid" }}
      borderColor={borderColor}
      position="relative"
      transition="all 0.3s ease"
      flexShrink={0}
      boxShadow={useColorModeValue("sm", "dark-lg")}
    >
      {/* Header with collapse button */}
      <Box
        position="sticky"
        top={0}
        bg={bgColor}
        zIndex={10}
        borderBottom="1px solid"
        borderColor={borderColor}
        p={{ base: 3, md: 4 }}
      >
        <HStack justify="space-between">
          {!tocCollapsed && (
            <Heading size={{ base: "sm", md: "md" }} fontWeight="semibold">
              Course Outline
            </Heading>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTocCollapsed(!tocCollapsed)}
            aria-label={tocCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {tocCollapsed ? (
              <BiChevronRight size={20} />
            ) : (
              <BiChevronLeft size={20} />
            )}
          </Button>
        </HStack>
      </Box>

      {/* Content */}
      {!tocCollapsed ? (
        <VStack align="stretch" gap={0} p={{ base: 3, md: 4 }} pt={2}>
          <Timeline.Root>
            {courseState.modules.map((module, idx) => {
              const isActive = activeModuleIndex === idx;
              const completedLessons = getCompletedLessons(module);
              const totalLessons = module.lessons?.length || 0;

              return (
                <Timeline.Item key={idx}>
                  <Timeline.Connector>
                    <Timeline.Separator />
                    <Timeline.Indicator
                      background={checkboxColor}
                      border="none"
                    >
                      <Checkbox.Root
                        size="sm"
                        colorPalette="green"
                        checked={module.status === "COMPLETED"}
                        onCheckedChange={(details) =>
                          handleModuleToggle(idx, details.checked === true)
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    </Timeline.Indicator>
                  </Timeline.Connector>
                  <Timeline.Content pb={6}>
                    <Box
                      p={{ base: 2.5, md: 3 }}
                      borderRadius="lg"
                      border="0.1px solid"
                      bg={isActive ? activeBg : "transparent"}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ bg: hoverBg }}
                      onClick={() => handleModuleOpen(idx)}
                    >
                      <HStack justify="space-between" align="start" mb={2}>
                        <VStack align="start" gap={1} flex={1}>
                          <HStack>
                            <Text
                              fontSize="xs"
                              fontWeight="bold"
                              color={mutedTextColor}
                            >
                              Module {idx + 1}
                            </Text>
                          </HStack>
                          <Heading size={{ base: "md", md: "lg" }} color={textColor}>
                            {module.title}
                          </Heading>
                        </VStack>
                      </HStack>

                      {/* Module progress */}
                      {totalLessons > 0 && (
                        <Box mt={2}>
                          <Text fontSize="xs" color={mutedTealTextColor} mb={1}>
                            {completedLessons} of {totalLessons} Lessons
                            Completed
                          </Text>
                          <Progress.Root
                            value={(completedLessons / totalLessons) * 100}
                            size="xs"
                            colorScheme={
                              module.status === "COMPLETED" ? "green" : "teal"
                            }
                            borderRadius="full"
                          />
                        </Box>
                      )}

                      {/* Lessons */}
                      {module.lessons && isActive && (
                        <VStack align="stretch" gap={1} mt={3} pl={{ base: 1, md: 2 }}>
                          {module.lessons.map((lesson, i) => {
                            const isActiveLesson = currentLessonIndex === i;
                            return (
                              <HStack
                                key={i}
                                p={2}
                                borderRadius="md"
                                bg={
                                  isActiveLesson
                                    ? useColorModeValue("teal.100", "teal.800")
                                    : "transparent"
                                }
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{
                                  bg: isActiveLesson
                                    ? useColorModeValue("teal.100", "teal.800")
                                    : useColorModeValue("gray.100", "gray.600"),
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLessonChange(i, idx);
                                }}
                              >
                                <Checkbox.Root
                                  size="sm"
                                  colorPalette="green"
                                  checked={lesson.status === "COMPLETED"}
                                  onCheckedChange={(details) =>
                                    handleLessonToggle(
                                      i,
                                      idx,
                                      details.checked === true,
                                    )
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                </Checkbox.Root>
                                <Text
                                  fontSize={{ base: "xs", md: "sm" }}
                                  fontWeight={
                                    isActiveLesson ? "medium" : "normal"
                                  }
                                  flex={1}
                                >
                                  {lesson.title}
                                </Text>
                              </HStack>
                            );
                          })}
                        </VStack>
                      )}
                    </Box>
                  </Timeline.Content>
                </Timeline.Item>
              );
            })}
          </Timeline.Root>
        </VStack>
      ) : (
        <VStack align="center" gap={4} mt={4} p={2}>
          {courseState.modules.map((module, idx) => (
            <Tooltip
              key={idx}
              content={
                <VStack align="start" gap={1} p={2}>
                  <Text fontWeight="bold" fontSize="sm">
                    {module.title}
                  </Text>
                  <Text fontSize="xs" color={mutedTextColor}>
                    Module {idx + 1}
                  </Text>
                  {module.lessons && (
                    <>
                      <Box
                        borderTop="1px solid"
                        borderColor={borderColor}
                        w="100%"
                        my={1}
                      />
                      {module.lessons.map((lesson, i) => (
                        <HStack key={i} gap={2}>
                          {lesson.status === "COMPLETED" && (
                            <BiCheck size={14} color="green" />
                          )}
                          <Text fontSize="sm">{lesson.title}</Text>
                        </HStack>
                      ))}
                    </>
                  )}
                </VStack>
              }
              showArrow
              positioning={{ placement: "right" }}
            >
              <Box
                cursor="pointer"
                onClick={() => handleModuleOpen(idx)}
                p={2}
                borderRadius="md"
                bg={activeModuleIndex === idx ? activeBg : "transparent"}
                _hover={{ bg: hoverBg }}
                transition="all 0.2s"
              >
                <Checkbox.Root
                  size="sm"
                  colorPalette="teal"
                  checked={module.status === "COMPLETED"}
                  onCheckedChange={(details) =>
                    handleModuleToggle(idx, details.checked === true)
                  }
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                </Checkbox.Root>
              </Box>
            </Tooltip>
          ))}
        </VStack>
      )}
    </Box>
  );
};