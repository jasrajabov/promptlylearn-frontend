import React, { useState } from "react";
import { Position, type NodeProps, Handle } from "reactflow";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Text,
  Drawer,
  Portal,
  Button,
  RadioCard,
  HStack,
  Heading,
  HoverCard,
  Badge,
  Spinner,
  VStack,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import fetchWithTimeout from "../utils/dbUtils";
import TagHandler from "./TagHandler";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "./ui/color-mode";
import { getTypeColor } from "../components/constants";
import {
  Circle,
  BookOpen,
  GraduationCap,
  Sparkles,
  Eye,
  X,
  ChevronRight,
  Layers,
  CheckCircle2,
  Play,
  Award,
  TrendingUp,
  Zap,
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type Course = {
  id: string;
  title: string;
  description: string;
  level: "beginner" | "intermediate" | "advanced";
  modules?: any[];
  status?: string;
};

export const RoadmapNode: React.FC<
  NodeProps<{
    roadmapName: string;
    roadmapId: string;
    roadmapNodeId: string;
    courseId: string;
    label: string;
    description?: string;
    type?: string;
    status?: string;
  }> & {
    onStatusChange: (nodeId: string, status: string) => void;
  }
> = ({ data, onStatusChange }) => {
  const navigate = useNavigate();
  const { user } = useUser();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [courses, setCourses] = useState<Array<Course>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmapNodeData, setRoadmapNodeData] = useState(data);
  const [courseLevelInfo, setCourseLevelInfo] = useState([
    {
      courseId: "",
      value: "beginner",
      title: "Beginner",
      description: "",
      status: "NOT_GENERATED",
    },
    {
      courseId: "",
      value: "intermediate",
      title: "Intermediate",
      description: "",
      status: "NOT_GENERATED",
    },
    {
      courseId: "",
      value: "advanced",
      title: "Advanced",
      description: "",
      status: "NOT_GENERATED",
    },
  ]);
  const [currCourseIdx, setCurrCourseIdx] = useState(0);

  const isCompleted = roadmapNodeData.status === "COMPLETED";

  // Modern minimal theme
  const cardBg = useColorModeValue("#ffffff", "#111111");
  const borderColor = useColorModeValue("#e5e7eb", "#27272a");
  const mutedText = useColorModeValue("#71717a", "#a1a1aa");
  const headingColor = useColorModeValue("#09090b", "#fafafa");
  const hoverBg = useColorModeValue("#f9fafb", "#1a1a1a");
  const sectionBg = useColorModeValue("#f4f4f5", "#0a0a0a");
  const drawerBg = useColorModeValue("#ffffff", "#000000");
  const completedBg = useColorModeValue("#f0fdf4", "#022c22");
  const accentColor = useColorModeValue("#14b8a6", "#14b8a6");

  const lineColor = getTypeColor(roadmapNodeData.type);

  const getCourseForNodeId = (roadmapId: string, roadmapNodeId: string) => {
    fetchWithTimeout(`${BACKEND_URL}/course/${roadmapId}/${roadmapNodeId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setCourses(data);
        if (data.length > 0) {
          setCourseLevelInfo((prevLevels) => {
            const next = prevLevels.map((level) => {
              const found = data.find((c: Course) => c.level === level.value);
              if (!found) return level;
              return {
                ...level,
                courseId: found.id,
                status: found.status ?? "NOT_GENERATED",
                description: found.description ?? level.description,
              };
            });
            return next;
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching courses for roadmap node:", error);
      });
  };

  const handleGenerateCourse = async (
    topic: string,
    roadmapId: string,
    roadmapNodeId: string,
    roadmapName: string,
    level: string,
  ) => {
    if (!user) return;

    setCourseLevelInfo((prevLevels) =>
      prevLevels.map((levelInfo) =>
        levelInfo.value === level
          ? { ...levelInfo, status: "GENERATING" }
          : levelInfo,
      ),
    );

    const endpoint = `${BACKEND_URL}/course/generate-course-outline`;
    const body = {
      topic: topic,
      level: level,
      roadmap_id: roadmapId,
      roadmap_node_id: roadmapNodeId,
      roadmap_name: roadmapName
    };
    const response = await fetchWithTimeout(
      endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(body),
      },
      600000,
    );
    const { task_id, course_id } = await response.json();
    pollTaskStatus(
      task_id,
      roadmapId,
      roadmapNodeId,
      course_id,
      "course_outline",
    );
  };

  function pollTaskStatus(
    taskId: string,
    roadmapId: string,
    roadmapNodeId: string,
    courseId: string,
    type: string,
  ) {
    const interval = setInterval(async () => {
      const resp = await fetch(`${BACKEND_URL}/tasks/status/${type}/${taskId}`);
      const data = await resp.json();
      if (data.status === "SUCCESS") {
        clearInterval(interval);
        setIsGenerating(false);
        if (type === "course_outline" && roadmapNodeId && courseId) {
          getCourseForNodeId(roadmapId, roadmapNodeId);
        }
      }
      if (data.status === "FAILED") {
        clearInterval(interval);
        setIsGenerating(false);
        alert("Course generation failed.");
      }
    }, 2000);
  }

  const handleMarkAsComplete = async (
    status: string,
    roadmapId: string,
    roadmapNodeId: string,
  ) => {
    if (!user) return;

    status = status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";

    try {
      const response = await fetch(
        `${BACKEND_URL}/roadmap/${roadmapId}/${roadmapNodeId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) throw new Error("Failed to mark node as complete");

      setRoadmapNodeData((prevData) => ({ ...prevData, status }));
      onStatusChange(roadmapNodeId, status);
    } catch (error) {
      console.error("Error marking node as complete:", error);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "beginner":
        return <Circle size={16} />;
      case "intermediate":
        return <TrendingUp size={16} />;
      case "advanced":
        return <Award size={16} />;
      default:
        return null;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "#10b981";
      case "intermediate":
        return "#3b82f6";
      case "advanced":
        return "#8b5cf6";
      default:
        return "#64748b";
    }
  };

  return (
    <VStack gap={0} align="center" position="relative">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: isCompleted ? "#10b981" : lineColor,
          border: `3px solid ${cardBg}`,
          width: 14,
          height: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
      />

      {/* Metro Ticket Style Node */}
      <HoverCard.Root openDelay={200} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <Box
            bg={isCompleted ? completedBg : cardBg}
            borderRadius="12px"
            p={4}
            minW="280px"
            maxW="320px"
            borderWidth="2px"
            borderColor={isCompleted ? "#10b981" : borderColor}
            borderLeftWidth="6px"
            borderLeftColor={isCompleted ? "#10b981" : lineColor}
            position="relative"
            cursor="pointer"
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            boxShadow="0 2px 8px rgba(0,0,0,0.08)"
            _hover={{
              borderColor: isCompleted ? "#10b981" : lineColor,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              transform: "translateY(-4px)",
            }}
            onClick={() => {
              setIsDrawerOpen(true);
              getCourseForNodeId(
                roadmapNodeData.roadmapId,
                roadmapNodeData.roadmapNodeId,
              );
            }}
          >
            <VStack align="stretch" gap={3}>
              {/* Header Row */}
              <HStack justify="space-between" align="start">
                <Badge
                  size="sm"
                  bg={isCompleted ? "#10b98120" : `${lineColor}20`}
                  color={isCompleted ? "#10b981" : lineColor}
                  fontSize="10px"
                  fontWeight="700"
                  px={2.5}
                  py={1}
                  borderRadius="6px"
                  letterSpacing="0.5px"
                  textTransform="uppercase"
                >
                  {roadmapNodeData.type || "Module"}
                </Badge>

                {isCompleted && (
                  <HStack gap={1.5}>
                    <CheckCircle2 size={16} color="#10b981" strokeWidth={2.5} />
                    <Text fontSize="xs" color="#10b981" fontWeight="700" letterSpacing="0.3px">
                      DONE
                    </Text>
                  </HStack>
                )}
              </HStack>

              {/* Title */}
              <Heading
                fontSize="md"
                fontWeight="700"
                color={headingColor}
                lineHeight="1.4"
                letterSpacing="-0.01em"
              >
                {roadmapNodeData.label}
              </Heading>

              {/* Footer Action */}
              <HStack
                justify="space-between"
                pt={2}
                borderTopWidth="1px"
                borderColor={borderColor}
                fontSize="xs"
                color={mutedText}
              >
                <HStack gap={1.5}>
                  <Play size={12} />
                  <Text fontWeight="600">Explore Course</Text>
                </HStack>
                <ChevronRight size={14} />
              </HStack>
            </VStack>

            {/* Completion indicator line */}
            {isCompleted && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                h="3px"
                bg="#10b981"
                borderBottomRadius="10px"
              />
            )}
          </Box>
        </HoverCard.Trigger>

        {/* Hover Preview */}
        <Portal>
          <HoverCard.Positioner>
            <HoverCard.Content maxW="340px" p={4}>
              <HoverCard.Arrow />
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <Badge
                    size="sm"
                    bg={`${lineColor}20`}
                    color={lineColor}
                    fontSize="10px"
                    fontWeight="700"
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    letterSpacing="0.5px"
                    textTransform="uppercase"
                  >
                    {roadmapNodeData.type}
                  </Badge>
                  <TagHandler status={roadmapNodeData.status || "NOT_STARTED"} />
                </HStack>

                <Heading size="sm" fontWeight="700" lineHeight="1.4">
                  {roadmapNodeData.label}
                </Heading>

                {roadmapNodeData.description && (
                  <Text fontSize="sm" color={mutedText} lineHeight="1.6">
                    {roadmapNodeData.description}
                  </Text>
                )}

                <HStack
                  fontSize="xs"
                  color={mutedText}
                  pt={2}
                  borderTopWidth="1px"
                  borderColor={borderColor}
                  gap={2}
                >
                  <Zap size={12} />
                  <Text fontWeight="500">Click to start learning</Text>
                </HStack>
              </VStack>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </Portal>
      </HoverCard.Root>

      {/* Enhanced Drawer - Same as before */}
      <Drawer.Root
        open={isDrawerOpen}
        size="lg"
        onOpenChange={(e) => setIsDrawerOpen(e.open)}
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
          <Drawer.Positioner>
            <Drawer.Content bg={drawerBg}>
              {/* Header */}
              <Box
                borderBottom="3px solid"
                borderColor={isCompleted ? "#10b981" : lineColor}
                bg={sectionBg}
              >
                <Drawer.Header py={5} px={6}>
                  <HStack justify="space-between" w="full" align="start">
                    <VStack align="start" gap={2} flex={1}>
                      <HStack gap={3}>
                        <Box
                          w="6px"
                          h="40px"
                          bg={isCompleted ? "#10b981" : lineColor}
                          borderRadius="full"
                        />
                        <Heading
                          size="xl"
                          fontWeight="700"
                          letterSpacing="-0.02em"
                        >
                          {roadmapNodeData.label}
                        </Heading>
                      </HStack>

                      <HStack gap={2} pl={5}>
                        <Badge
                          fontSize="10px"
                          px={2.5}
                          py={1}
                          borderRadius="full"
                          bg={isCompleted ? "#10b98120" : `${lineColor}20`}
                          color={isCompleted ? "#10b981" : lineColor}
                          fontWeight="700"
                          letterSpacing="0.5px"
                          textTransform="uppercase"
                        >
                          {roadmapNodeData.type}
                        </Badge>
                        <TagHandler status={roadmapNodeData.status || "NOT_STARTED"} />
                      </HStack>
                    </VStack>

                    <Drawer.CloseTrigger asChild>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label="Close"
                        borderRadius="full"
                        _hover={{ bg: hoverBg }}
                      >
                        <X size={20} />
                      </IconButton>
                    </Drawer.CloseTrigger>
                  </HStack>
                </Drawer.Header>
              </Box>

              <Drawer.Body py={6} px={6}>
                <VStack align="stretch" gap={6}>
                  {/* Description */}
                  {roadmapNodeData.description && (
                    <Box>
                      <Text fontSize="md" color={mutedText} lineHeight="1.7">
                        {roadmapNodeData.description}
                      </Text>
                    </Box>
                  )}

                  <Separator />

                  {/* Mark as Complete Button */}
                  <Button
                    onClick={() =>
                      handleMarkAsComplete(
                        roadmapNodeData.status || "",
                        roadmapNodeData.roadmapId,
                        roadmapNodeData.roadmapNodeId,
                      )
                    }
                    variant="outline"
                    borderWidth="2px"
                    borderColor={isCompleted ? "#10b981" : borderColor}
                    color={isCompleted ? "#10b981" : headingColor}
                    bg={isCompleted ? completedBg : "transparent"}
                    _hover={{
                      bg: isCompleted ? completedBg : hoverBg,
                      borderColor: isCompleted ? "#10b981" : accentColor,
                    }}
                    gap={2}
                    fontWeight="700"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 size={18} />
                        Mark as Incomplete
                      </>
                    ) : (
                      <>
                        <Circle size={18} />
                        Mark as Complete
                      </>
                    )}
                  </Button>

                  <Separator />

                  {/* Level Selection */}
                  <Box>
                    <HStack mb={4} gap={3}>
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="lg"
                        bg={`${accentColor}15`}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <GraduationCap size={20} color={accentColor} />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="700" color={headingColor}>
                          Choose Your Level
                        </Text>
                        <Text fontSize="xs" color={mutedText}>
                          Select difficulty
                        </Text>
                      </VStack>
                    </HStack>

                    <RadioCard.Root
                      defaultValue="beginner"
                      colorPalette="teal"
                      size="md"
                    >
                      <VStack gap={2.5}>
                        {courseLevelInfo.map((c, i) => {
                          const levelColor = getLevelColor(c.value);
                          return (
                            <RadioCard.Item
                              key={c.value}
                              value={c.value}
                              onClick={() => setCurrCourseIdx(i)}
                              w="full"
                              borderRadius="lg"
                              borderWidth="2px"
                              borderLeftWidth="5px"
                              borderLeftColor={levelColor}
                              transition="all 0.2s"
                              _hover={{
                                borderColor: levelColor,
                                transform: "translateX(4px)",
                              }}
                            >
                              <RadioCard.ItemHiddenInput />
                              <RadioCard.ItemControl>
                                <RadioCard.ItemContent>
                                  <HStack justify="space-between" w="full" gap={3}>
                                    <HStack gap={3} flex={1}>
                                      <Box
                                        w="36px"
                                        h="36px"
                                        borderRadius="md"
                                        bg={`${levelColor}15`}
                                        color={levelColor}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                      >
                                        {getLevelIcon(c.value)}
                                      </Box>

                                      <VStack gap={0.5} align="start" flex={1}>
                                        <Text fontSize="sm" fontWeight="700">
                                          {c.title}
                                        </Text>
                                        <Text fontSize="xs" color={mutedText}>
                                          {c.value === "beginner" && "Perfect for starters"}
                                          {c.value === "intermediate" && "Build core skills"}
                                          {c.value === "advanced" && "Master the topic"}
                                        </Text>
                                      </VStack>
                                    </HStack>

                                    <HStack gap={2}>
                                      <TagHandler status={c.status} />
                                      {c.status === "GENERATING" && (
                                        <Spinner size="sm" color={levelColor} />
                                      )}
                                    </HStack>
                                  </HStack>
                                </RadioCard.ItemContent>
                              </RadioCard.ItemControl>
                            </RadioCard.Item>
                          );
                        })}
                      </VStack>
                    </RadioCard.Root>
                  </Box>

                  {/* Course Content */}
                  {courseLevelInfo[currCourseIdx].status !== "NOT_GENERATED" &&
                    courseLevelInfo[currCourseIdx].status !== "GENERATING" && (
                      <>
                        <Separator />

                        {/* Course Overview */}
                        <Box
                          p={4}
                          borderRadius="lg"
                          bg={sectionBg}
                          borderWidth="1px"
                          borderColor={borderColor}
                          borderLeft="4px solid"
                          borderLeftColor={getLevelColor(courseLevelInfo[currCourseIdx].value)}
                        >
                          <HStack mb={3} gap={2}>
                            <BookOpen size={18} color={getLevelColor(courseLevelInfo[currCourseIdx].value)} />
                            <Text fontSize="sm" fontWeight="700">
                              Course Overview
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={mutedText} lineHeight="1.6">
                            {courseLevelInfo[currCourseIdx].description}
                          </Text>
                        </Box>

                        {/* Modules */}
                        <Box>
                          <HStack mb={4} justify="space-between">
                            <HStack gap={2}>
                              <Box
                                w="36px"
                                h="36px"
                                borderRadius="lg"
                                bg={`${getLevelColor(courseLevelInfo[currCourseIdx].value)}15`}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <Layers size={18} color={getLevelColor(courseLevelInfo[currCourseIdx].value)} />
                              </Box>
                              <Text fontSize="sm" fontWeight="700">
                                Learning Modules
                              </Text>
                            </HStack>

                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={1}
                              borderRadius="full"
                              bg={`${getLevelColor(courseLevelInfo[currCourseIdx].value)}20`}
                              color={getLevelColor(courseLevelInfo[currCourseIdx].value)}
                              fontWeight="700"
                            >
                              {courses
                                .filter(c => c.level === courseLevelInfo[currCourseIdx].value)
                                .reduce((acc, c) => acc + (c.modules?.length || 0), 0)}{" "}
                              modules
                            </Badge>
                          </HStack>

                          {courses.length === 0 ? (
                            <Box
                              textAlign="center"
                              py={8}
                              px={4}
                              bg={sectionBg}
                              borderRadius="lg"
                              borderWidth="2px"
                              borderStyle="dashed"
                              borderColor={borderColor}
                            >
                              <Text fontSize="sm" color={mutedText}>
                                No modules available
                              </Text>
                            </Box>
                          ) : (
                            <VStack align="stretch" gap={2}>
                              {courses
                                .filter(course => course.level === courseLevelInfo[currCourseIdx].value)
                                .map(course =>
                                  (course.modules ?? []).map((module: any, idx: number) => (
                                    <Box
                                      key={idx}
                                      p={3.5}
                                      bg={cardBg}
                                      borderRadius="lg"
                                      borderWidth="1px"
                                      borderColor={borderColor}
                                      borderLeft="4px solid"
                                      borderLeftColor={getLevelColor(courseLevelInfo[currCourseIdx].value)}
                                      transition="all 0.2s"
                                      _hover={{
                                        transform: "translateX(4px)",
                                        boxShadow: "sm",
                                      }}
                                    >
                                      <HStack gap={3} align="start">
                                        <Box
                                          minW={7}
                                          h={7}
                                          borderRadius="md"
                                          bg={`${getLevelColor(courseLevelInfo[currCourseIdx].value)}15`}
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                          fontSize="xs"
                                          fontWeight="700"
                                          color={getLevelColor(courseLevelInfo[currCourseIdx].value)}
                                        >
                                          {idx + 1}
                                        </Box>

                                        <VStack align="start" gap={1} flex={1}>
                                          <Text fontSize="sm" fontWeight="600" lineHeight="1.4">
                                            {module.title}
                                          </Text>
                                          {module.description && (
                                            <Text fontSize="xs" color={mutedText} lineHeight="1.5">
                                              {module.description}
                                            </Text>
                                          )}
                                        </VStack>

                                        <TagHandler status={module.status} />
                                      </HStack>
                                    </Box>
                                  ))
                                )}
                            </VStack>
                          )}
                        </Box>
                      </>
                    )}

                  {/* Empty State */}
                  {courseLevelInfo[currCourseIdx].status === "NOT_GENERATED" && (
                    <Box
                      textAlign="center"
                      py={12}
                      px={6}
                      bg={sectionBg}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderStyle="dashed"
                      borderColor={borderColor}
                    >
                      <VStack gap={4}>
                        <Box
                          w={16}
                          h={16}
                          borderRadius="full"
                          bg={`${accentColor}15`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Sparkles size={32} color={accentColor} />
                        </Box>
                        <VStack gap={2}>
                          <Text fontSize="md" fontWeight="700">
                            Ready to Begin?
                          </Text>
                          <Text fontSize="sm" color={mutedText} maxW="300px" lineHeight="1.6">
                            Generate a personalized course to start your learning journey
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Drawer.Body>

              {/* Footer */}
              <Drawer.Footer
                borderTopWidth="1px"
                borderColor={borderColor}
                py={4}
                px={6}
              >
                <HStack w="full" gap={3}>
                  <Button
                    variant="outline"
                    onClick={() => setIsDrawerOpen(false)}
                    flex={1}
                    size="md"
                    borderRadius="lg"
                    fontWeight="600"
                  >
                    Close
                  </Button>
                  {courseLevelInfo[currCourseIdx].courseId ? (
                    <Button
                      onClick={() =>
                        navigate(`/course/${courseLevelInfo[currCourseIdx].courseId}`)
                      }
                      bg={getLevelColor(courseLevelInfo[currCourseIdx].value)}
                      color="white"
                      flex={1}
                      size="md"
                      borderRadius="lg"
                      fontWeight="600"
                      gap={2}
                      _hover={{
                        bg: getLevelColor(courseLevelInfo[currCourseIdx].value),
                        opacity: 0.9,
                      }}
                    >
                      <Eye size={18} />
                      View Course
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        handleGenerateCourse(
                          roadmapNodeData.label,
                          roadmapNodeData.roadmapId,
                          roadmapNodeData.roadmapNodeId,
                          roadmapNodeData.roadmapName,
                          courseLevelInfo[currCourseIdx].value,
                        )
                      }
                      bg={getLevelColor(courseLevelInfo[currCourseIdx].value)}
                      color="white"
                      flex={1}
                      size="md"
                      borderRadius="lg"
                      fontWeight="600"
                      gap={2}
                      disabled={
                        courseLevelInfo[currCourseIdx].status === "GENERATING" ||
                        isGenerating
                      }
                      _hover={{
                        bg: getLevelColor(courseLevelInfo[currCourseIdx].value),
                        opacity: 0.9,
                      }}
                    >
                      <Sparkles size={18} />
                      {courseLevelInfo[currCourseIdx].status === "GENERATING" || isGenerating
                        ? "Generating..."
                        : "Generate Course"}
                    </Button>
                  )}
                </HStack>
              </Drawer.Footer>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: isCompleted ? "#10b981" : lineColor,
          border: `3px solid ${cardBg}`,
          width: 14,
          height: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}
        isConnectable={true}
      />
    </VStack>
  );
};