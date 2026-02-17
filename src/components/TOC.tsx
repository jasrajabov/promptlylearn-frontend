import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Progress,
  IconButton,
} from "@chakra-ui/react";
import {
  BiCheck,
  BiChevronLeft,
  BiChevronRight,
} from "react-icons/bi";
import { useLocation } from "react-router-dom";
import type { Course, Status, Module } from "../types";
import { useColorModeValue } from "../components/ui/color-mode";
import { useUser } from "../contexts/UserContext";
import { ChevronDown, ChevronRight, BookOpen, PlayCircle, CheckCircle2 } from "lucide-react";
import { Tooltip } from "../components/ui/tooltip";

type TOCProps = {
  courseState: Course;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
  activeModuleIndex: number | null;
  setActiveModuleIndex: (index: number | null) => void;
  currentLessonIndex: number;
  setCurrentLessonIndex: (index: number) => void;
  onLessonChange?: (lessonIndex: number, moduleIndex: number) => void;
  isMobileDrawer?: boolean;
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
  onLessonChange,
  isMobileDrawer = false,
}: TOCProps) => {
  const location = useLocation();
  const course = (location?.state as LocationState)?.course ?? null;
  const { user } = useUser();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

  const bgColor = useColorModeValue("white", "#0a0a0a");
  const borderColor = useColorModeValue("#e5e7eb", "#27272a");
  const hoverBg = useColorModeValue("gray.300", "gray.900");
  const activeBg = useColorModeValue("#f0fdfa", "#042f2e");
  const textColor = useColorModeValue("#111827", "#f9fafb");
  const mutedTextColor = useColorModeValue("#6b7280", "#9ca3af");
  const lessonActiveBg = useColorModeValue("#ccfbf1", "#0f766e");
  const accentColor = useColorModeValue("#14b8a6", "#2dd4bf");
  const scrollbarThumb = useColorModeValue("#d1d5db", "#374151");
  const scrollbarTrack = useColorModeValue("#f3f4f6", "#1f2937");
  const moduleNumberBg = useColorModeValue("gray.200", "gray.800");

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
    }
  };

  const handleLessonToggle = useCallback((
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

      updateCourseInDB(updatedCourse);
      return updatedCourse;
    });
  }, [setCourseState]);

  const handleModuleClick = useCallback((idx: number) => {
    // Set as active and expand
    setActiveModuleIndex(idx);
    setCurrentLessonIndex(0);

    setExpandedModules(prev => {
      const newSet = new Set(prev);
      newSet.add(idx);
      return newSet;
    });

    if (courseState.modules[idx].status !== "COMPLETED") {
      setCourseState((prev: Course) => {
        const updated = [...prev.modules];
        updated[idx].status = "IN_PROGRESS" as Status;
        return { ...prev, modules: updated };
      });
    }

    // Trigger lesson change if callback exists
    if (onLessonChange) {
      onLessonChange(0, idx);
    }
  }, [courseState.modules, onLessonChange, setCourseState, setActiveModuleIndex, setCurrentLessonIndex]);

  const toggleModuleExpansion = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const handleLessonClick = useCallback((lessonIndex: number, moduleIndex: number) => {
    setCurrentLessonIndex(lessonIndex);
    setActiveModuleIndex(moduleIndex);
    if (onLessonChange) {
      onLessonChange(lessonIndex, moduleIndex);
    }
  }, [onLessonChange, setCurrentLessonIndex, setActiveModuleIndex]);

  const getCompletedLessons = (module: Module) => {
    if (!module.lessons) return 0;
    return module.lessons.filter((l) => l.status === "COMPLETED").length;
  };

  const totalCourseProgress = useMemo(() => {
    const totalLessons = courseState.modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
    const completedLessons = courseState.modules.reduce((sum, m) => sum + getCompletedLessons(m), 0);
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  }, [courseState.modules]);

  return (
    <Box
      w={{
        base: "100%",
        lg: isCollapsed ? "80px" : "340px"
      }}
      h={{ base: isMobileDrawer ? "auto" : "auto", lg: "calc(100vh - 32px)" }}
      maxH={{ base: isMobileDrawer ? "none" : "none", lg: "calc(100vh - 32px)" }}
      bg={isMobileDrawer ? "transparent" : bgColor}
      borderWidth={{ base: "0", lg: "1px" }}
      borderColor={borderColor}
      borderRadius={{ base: "0", lg: "12px" }}
      position={{ base: "relative", lg: "sticky" }}
      top={{ base: 0, lg: 4 }}
      left={0}
      flexShrink={0}
      display="flex"
      flexDirection="column"
      transition="width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
      overflow="hidden"
    >
      {/* Header */}
      {!isMobileDrawer && (
        <Box
          borderBottom="1px solid"
          borderColor={borderColor}
          p={4}
          bg={bgColor}
          flexShrink={0}
        >
          <HStack justify="space-between">
            {!isCollapsed && (
              <VStack align="start" gap={1} flex={1}>
                <HStack gap={2}>
                  <BookOpen size={20} color={accentColor} />
                  <Heading size="sm" fontWeight="700" color={textColor} letterSpacing="-0.01em">
                    Course Content
                  </Heading>
                </HStack>
                <HStack gap={2} w="full">
                  <Progress.Root
                    value={totalCourseProgress}
                    size="xs"
                    colorPalette="teal"
                    borderRadius="full"
                    flex={1}
                  >
                    <Progress.Track bg={useColorModeValue("#e5e7eb", "#27272a")}>
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                  <Text fontSize="xs" fontWeight="700" color={accentColor} minW="38px">
                    {totalCourseProgress}%
                  </Text>
                </HStack>
              </VStack>
            )}
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              ml={isCollapsed ? "auto" : 0}
              borderRadius="6px"
              _hover={{ bg: hoverBg }}
            >
              {isCollapsed ? (
                <BiChevronRight size={20} />
              ) : (
                <BiChevronLeft size={20} />
              )}
            </IconButton>
          </HStack>
        </Box>
      )}

      {/* Content */}
      <Box
        flex={1}
        overflowY="auto"
        overflowX="hidden"
        minH={0}
        pb={{ base: isMobileDrawer ? 6 : 0, lg: 0 }}
        css={{
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: scrollbarTrack,
          },
          '&::-webkit-scrollbar-thumb': {
            background: scrollbarThumb,
            borderRadius: '3px',
            '&:hover': {
              background: useColorModeValue('#9ca3af', '#6b7280'),
            },
          },
        }}
      >
        {!isCollapsed ? (
          // Expanded View
          <VStack align="stretch" gap={1.5} p={3}>
            {courseState.modules.map((module, idx) => {
              const isActive = activeModuleIndex === idx;
              const isExpanded = expandedModules.has(idx);
              const completedLessons = getCompletedLessons(module);
              const totalLessons = module.lessons?.length || 0;
              const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
              const isCompleted = module.status === "COMPLETED";

              return (
                <Box key={idx}>
                  {/* Module Card */}
                  <Box
                    p={3}
                    borderRadius="10px"
                    borderWidth="2px"
                    borderColor={isActive ? accentColor : "transparent"}
                    bg={isActive ? activeBg : "transparent"}
                    cursor="pointer"
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      bg: isActive ? activeBg : hoverBg,
                      borderColor: isActive ? accentColor : borderColor,
                    }}
                    onClick={() => handleModuleClick(idx)}
                  >
                    <HStack gap={3} align="start">
                      {/* Module Number Badge */}
                      <Box
                        minW="32px"
                        h="32px"
                        borderRadius="8px"
                        bg={isCompleted ? "#10b981" : moduleNumberBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                        borderWidth="1px"
                        borderColor={isCompleted ? "#10b981" : borderColor}
                        position="relative"
                      >
                        {isCompleted ? (
                          <CheckCircle2 size={18} color="white" strokeWidth={2.5} />
                        ) : (
                          <Text fontSize="sm" fontWeight="700" color="teal.600">
                            {idx + 1}
                          </Text>
                        )}
                      </Box>

                      {/* Module Info */}
                      <VStack align="start" gap={1.5} flex={1} minW={0}>
                        <HStack gap={2} w="full">
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color={textColor}
                            lineHeight="1.4"
                            flex={1}

                          >
                            {module.title}
                          </Text>

                          <Box
                            onClick={(e) => toggleModuleExpansion(idx, e)}
                            p={1}
                            borderRadius="6px"
                            _hover={{ bg: useColorModeValue("#e5e7eb", "#374151") }}
                            transition="all 0.15s"
                            flexShrink={0}
                          >
                            {isExpanded ? (
                              <ChevronDown size={16} color={mutedTextColor} />
                            ) : (
                              <ChevronRight size={16} color={mutedTextColor} />
                            )}
                          </Box>
                        </HStack>

                        {/* Progress */}
                        {totalLessons > 0 && (
                          <HStack w="full" gap={2}>
                            <Progress.Root
                              value={progressPercent}
                              size="xs"
                              colorPalette={isCompleted ? "green" : "teal"}
                              borderRadius="full"
                              flex={1}
                            >
                              <Progress.Track bg={useColorModeValue("#e5e7eb", "#27272a")}>
                                <Progress.Range />
                              </Progress.Track>
                            </Progress.Root>
                            <Text fontSize="xs" fontWeight="600" color={mutedTextColor} minW="fit-content">
                              {completedLessons}/{totalLessons}
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Lessons */}
                  {module.lessons && isExpanded && (
                    <VStack
                      align="stretch"
                      gap={0.5}
                      mt={1}
                      pl={3}
                      ml={5}
                      borderLeft="2px solid"
                      borderLeftColor={useColorModeValue("#e5e7eb", "#27272a")}
                    >
                      {module.lessons.map((lesson, i) => {
                        const isActiveLesson = activeModuleIndex === idx && currentLessonIndex === i;
                        const isLessonCompleted = lesson.status === "COMPLETED";

                        return (
                          <HStack
                            key={i}
                            p={2.5}
                            pl={3}
                            borderRadius="8px"
                            bg={isActiveLesson ? lessonActiveBg : "transparent"}
                            cursor="pointer"
                            transition="all 0.15s ease"
                            _hover={{
                              bg: isActiveLesson ? lessonActiveBg : hoverBg,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLessonClick(i, idx);
                            }}
                            gap={2.5}
                            position="relative"
                            borderLeftWidth="3px"
                            borderLeftColor={isActiveLesson ? accentColor : "transparent"}
                          >
                            {/* Lesson Checkbox */}
                            <Box
                              onClick={(e) => e.stopPropagation()}
                              flexShrink={0}
                            >
                              {isLessonCompleted ? (
                                <Box
                                  w="16px"
                                  h="16px"
                                  borderRadius="full"
                                  bg="#10b981"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  onClick={() => handleLessonToggle(i, idx, false)}
                                >
                                  <BiCheck size={14} color="white" />
                                </Box>
                              ) : (
                                <Box
                                  w="16px"
                                  h="16px"
                                  borderRadius="full"
                                  borderWidth="2px"
                                  borderColor={useColorModeValue("#d1d5db", "#4b5563")}
                                  _hover={{
                                    borderColor: accentColor,
                                  }}
                                  transition="all 0.15s"
                                  onClick={() => handleLessonToggle(i, idx, true)}
                                />
                              )}
                            </Box>

                            {/* Lesson Title */}
                            <Text
                              fontSize="sm"
                              fontWeight={isActiveLesson ? "600" : "500"}
                              // color={isActiveLesson ? accentColor : textColor}
                              flex={1}
                              lineHeight="1.5"
                              textDecoration={isLessonCompleted ? "line-through" : "none"}
                              opacity={isLessonCompleted ? 0.7 : 1}
                            >
                              {lesson.title}
                            </Text>

                            {/* Active Indicator */}
                            {isActiveLesson && (
                              <PlayCircle size={14} color={accentColor} fill={accentColor} />
                            )}
                          </HStack>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
              );
            })}
          </VStack>
        ) : (
          // Collapsed View
          <VStack align="stretch" gap={2} p={3} pt={4}>
            {courseState.modules.map((module, idx) => {
              const isActive = activeModuleIndex === idx;
              const completedLessons = getCompletedLessons(module);
              const totalLessons = module.lessons?.length || 0;
              const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
              const isCompleted = module.status === "COMPLETED";

              return (
                <Tooltip
                  key={idx}
                  content={
                    <VStack align="start" gap={2} p={2} maxW="220px">
                      <Text fontWeight="600" fontSize="sm" lineHeight="1.3">
                        {module.title}
                      </Text>
                      {totalLessons > 0 && (
                        <Box w="100%">
                          <Text fontSize="xs" color={mutedTextColor} mb={1.5}>
                            {completedLessons} / {totalLessons} lessons
                          </Text>
                          <Progress.Root
                            value={progressPercent}
                            size="xs"
                            colorPalette={isCompleted ? "green" : "teal"}
                          >
                            <Progress.Track>
                              <Progress.Range />
                            </Progress.Track>
                          </Progress.Root>
                        </Box>
                      )}
                    </VStack>
                  }
                  showArrow
                  positioning={{ placement: "right" }}
                >
                  <Box
                    w="56px"
                    h="56px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="full"
                    bg={isActive ? activeBg : "transparent"}
                    borderWidth="0"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{
                      bg: isActive ? activeBg : hoverBg,
                    }}
                    onClick={() => handleModuleClick(idx)}
                    position="relative"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={24} color="#10b981" strokeWidth={2.5} />
                    ) : (
                      <Text
                        fontSize="xl"
                        fontWeight="700"
                        color={isActive ? accentColor : "teal.600"}
                      >
                        {idx + 1}
                      </Text>
                    )}

                    {/* Progress Ring */}
                    {!isCompleted && totalLessons > 0 && (
                      <svg
                        width="60"
                        height="60"
                        style={{
                          position: "absolute",
                          top: "-2px",
                          left: "-2px",
                          transform: "rotate(-90deg)",
                        }}
                      >
                        <circle
                          cx="30"
                          cy="30"
                          r="27"
                          fill="none"
                          stroke={useColorModeValue("#e5e7eb", "#27272a")}
                          strokeWidth="3"
                        />
                        <circle
                          cx="30"
                          cy="30"
                          r="27"
                          fill="none"
                          stroke={accentColor}
                          strokeWidth="3"
                          strokeDasharray={`${2 * Math.PI * 27}`}
                          strokeDashoffset={`${2 * Math.PI * 27 * (1 - progressPercent / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </Box>
                </Tooltip>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
};