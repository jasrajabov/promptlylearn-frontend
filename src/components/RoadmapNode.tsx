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
  Checkbox,
  VStack,
  Separator,
} from "@chakra-ui/react";
import fetchWithTimeout from "../utils/dbUtils";
import TagHandler from "./TagHandler";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "./ui/color-mode";
import { getTypeColor } from "../components/constants";
import {
  CheckCircle,
  Circle,
  BookOpen,
  GraduationCap,
  Target,
  Sparkles,
  Eye,
  X,
  ChevronRight,
  Clock,
  Layers,
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

  // Enhanced color system with more sophisticated theming
  const surfaceBg = useColorModeValue("white", "gray.800");
  const surfaceHoverBg = useColorModeValue("gray.50", "gray.750");
  const subtleText = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const activeBorderColor = useColorModeValue("teal.500", "teal.400");
  const hoverBg = useColorModeValue("gray.50", "gray.800");
  const drawerBg = useColorModeValue("white", "gray.900");
  const sectionBg = useColorModeValue("gray.50", "gray.800");

  // Enhanced shadows for depth
  const cardShadow = useColorModeValue(
    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.08)",
    "0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)",
  );
  const hoverShadow = useColorModeValue(
    "0 10px 30px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.08)",
    "0 10px 30px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)",
  );
  const completedGlow = "0 0 0 4px rgba(56, 178, 172, 0.08)";

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

  // Get level icon helper
  const getLevelIcon = (level: string) => {
    switch (level) {
      case "beginner":
        return <Circle size={14} />;
      case "intermediate":
        return <Target size={14} />;
      case "advanced":
        return <Sparkles size={14} />;
      default:
        return null;
    }
  };

  return (
    <VStack gap={0} align="center">
      <Handle type="target" position={Position.Top} />

      {/* Node Card - Enhanced Professional Design */}
      <HoverCard.Root openDelay={300} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <Box
            bg={surfaceBg}
            borderRadius="xl"
            p={4}
            minW="260px"
            maxW="300px"
            border="1px solid"
            borderColor={isCompleted ? activeBorderColor : borderColor}
            position="relative"
            cursor="pointer"
            transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
            boxShadow={isCompleted ? completedGlow : cardShadow}
            _hover={{
              boxShadow: hoverShadow,
              transform: "translateY(-4px) scale(1.02)",
              borderColor: activeBorderColor,
              bg: surfaceHoverBg,
            }}
            onClick={() => {
              setIsDrawerOpen(true);
              getCourseForNodeId(
                roadmapNodeData.roadmapId,
                roadmapNodeData.roadmapNodeId,
              );
            }}
          >
            {/* Completion Indicator - Redesigned */}
            <Box position="absolute" top={3} right={3} zIndex={5}>
              <Checkbox.Root
                checked={isCompleted}
                aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                colorPalette="teal"
                size="md"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    handleMarkAsComplete(
                      roadmapNodeData.status || "",
                      roadmapNodeData.roadmapId,
                      roadmapNodeData.roadmapNodeId,
                    );
                  }}
                  borderRadius="full"
                  transition="all 0.2s"
                  _hover={{
                    transform: "scale(1.1)",
                  }}
                />
              </Checkbox.Root>
            </Box>

            {/* Type Badge - Enhanced */}
            {roadmapNodeData.type && (
              <Badge
                fontSize="xs"
                px={2.5}
                py={1}
                borderRadius="full"
                mb={3}
                bg={getTypeColor(roadmapNodeData.type)}
                color="white"
                fontWeight="600"
                letterSpacing="0.02em"
                textTransform="uppercase"
              >
                {roadmapNodeData.type}
              </Badge>
            )}

            {/* Title - Enhanced Typography */}
            <Text
              fontWeight="600"
              fontSize="md"
              lineClamp={2}
              mb={2}
              letterSpacing="-0.01em"
              lineHeight="1.4"
            >
              {roadmapNodeData.label}
            </Text>

            {/* Description - Improved Hierarchy */}
            {/* <Text
              fontSize="sm"
              color={subtleText}
              lineClamp={2}
              lineHeight="1.5"
              mb={3}
            >
              {roadmapNodeData.description || "No description provided."}
            </Text> */}

            {/* Action Indicator */}
            <HStack
              justify="space-between"
              pt={2}
              borderTopWidth="1px"
              borderColor={borderColor}
            >
              <HStack gap={1} fontSize="xs" color={subtleText}>
                <Layers size={12} />
                <Text fontWeight="500">View Details</Text>
              </HStack>
              <ChevronRight size={14} color="currentColor" />
            </HStack>
          </Box>
        </HoverCard.Trigger>

        {/* Hover Preview - Enhanced */}
        <Portal>
          <HoverCard.Positioner>
            <HoverCard.Content maxW="340px" p={4}>
              <HoverCard.Arrow />
              <VStack align="stretch" gap={3}>
                <HStack justify="space-between" align="start">
                  <Badge
                    fontSize="xs"
                    px={2.5}
                    py={1}
                    borderRadius="full"
                    bg={getTypeColor(roadmapNodeData.type)}
                    color="white"
                    fontWeight="600"
                  >
                    {roadmapNodeData.type}
                  </Badge>
                  <TagHandler status={roadmapNodeData.status || "NOT_STARTED"} />
                </HStack>
                <Text fontWeight="600" fontSize="md" lineHeight="1.4">
                  {roadmapNodeData.label}
                </Text>
                <Text fontSize="sm" color={subtleText} lineHeight="1.6">
                  {roadmapNodeData.description}
                </Text>
                <HStack
                  fontSize="xs"
                  color={subtleText}
                  pt={2}
                  borderTopWidth="1px"
                  borderColor={borderColor}
                >
                  <Clock size={12} />
                  <Text>Click to explore courses</Text>
                </HStack>
              </VStack>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </Portal>
      </HoverCard.Root>

      {/* Drawer - Professional Redesign */}
      <Drawer.Root
        open={isDrawerOpen}
        size="lg"
        onOpenChange={(e) => setIsDrawerOpen(e.open)}
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
          <Drawer.Positioner>
            <Drawer.Content bg={drawerBg}>
              {/* Header - Enhanced */}
              <Drawer.Header borderBottomWidth="1px" borderColor={borderColor} py={5}>
                <VStack align="start" gap={3} flex={1}>
                  <HStack justify="space-between" w="full">
                    <Heading size="lg" fontWeight="600" letterSpacing="-0.02em">
                      {roadmapNodeData.label}
                    </Heading>
                    <Drawer.CloseTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        borderRadius="full"
                        _hover={{ bg: hoverBg }}
                      >
                        <X size={18} />
                      </Button>
                    </Drawer.CloseTrigger>
                  </HStack>
                  <HStack gap={2}>
                    <Badge
                      fontSize="xs"
                      px={3}
                      py={1.5}
                      borderRadius="full"
                      bg={getTypeColor(roadmapNodeData.type)}
                      color="white"
                      fontWeight="600"
                    >
                      {roadmapNodeData.type}
                    </Badge>
                    <TagHandler status={roadmapNodeData.status || "NOT_STARTED"} />
                  </HStack>
                </VStack>
              </Drawer.Header>

              <Drawer.Body py={6}>
                <VStack align="stretch" gap={6}>
                  {/* Description Section */}
                  <Box>
                    <Text
                      fontSize="md"
                      color={subtleText}
                      lineHeight="1.7"
                      fontWeight="400"
                    >
                      {roadmapNodeData.description}
                    </Text>
                  </Box>

                  <Separator />

                  {/* Level Selection - Enhanced Design */}
                  <Box>
                    <HStack mb={4} gap={2}>
                      <Box
                        p={2}
                        borderRadius="lg"
                        bg={sectionBg}
                        display="inline-flex"
                      >
                        <GraduationCap size={18} color="#14b8a6" />
                      </Box>
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="600">
                          Select Course Level
                        </Text>
                        <Text fontSize="xs" color={subtleText}>
                          Choose your starting point
                        </Text>
                      </VStack>
                    </HStack>

                    <RadioCard.Root
                      defaultValue="beginner"
                      colorPalette="teal"
                      size="md"
                    >
                      <VStack gap={3}>
                        {courseLevelInfo.map((c, i) => (
                          <RadioCard.Item
                            key={c.value}
                            value={c.value}
                            onClick={() => setCurrCourseIdx(i)}
                            w="full"
                            borderRadius="lg"
                            transition="all 0.2s"
                            _hover={{
                              transform: "translateX(4px)",
                              boxShadow: "sm",
                            }}
                          >
                            <RadioCard.ItemHiddenInput />
                            <RadioCard.ItemControl>
                              <RadioCard.ItemContent>
                                <HStack justify="space-between" w="full">
                                  <HStack gap={3}>
                                    <Box
                                      p={2}
                                      borderRadius="md"
                                      bg={sectionBg}
                                      color="teal.500"
                                    >
                                      {getLevelIcon(c.value)}
                                    </Box>
                                    <VStack gap={0.5} align="start">
                                      <RadioCard.ItemText
                                        fontSize="sm"
                                        fontWeight="600"
                                      >
                                        {c.title}
                                      </RadioCard.ItemText>
                                      <Text fontSize="xs" color={subtleText}>
                                        {c.value === "beginner" &&
                                          "Start from the basics"}
                                        {c.value === "intermediate" &&
                                          "Build on fundamentals"}
                                        {c.value === "advanced" &&
                                          "Deep dive & mastery"}
                                      </Text>
                                    </VStack>
                                  </HStack>
                                  <HStack gap={2}>
                                    <TagHandler status={c.status} />
                                    {c.status === "GENERATING" && (
                                      <Spinner size="sm" color="teal.500" />
                                    )}
                                  </HStack>
                                </HStack>
                              </RadioCard.ItemContent>
                            </RadioCard.ItemControl>
                          </RadioCard.Item>
                        ))}
                      </VStack>
                    </RadioCard.Root>
                  </Box>

                  {/* Course Content - Enhanced Layout */}
                  {courseLevelInfo[currCourseIdx].status !== "NOT_GENERATED" &&
                    courseLevelInfo[currCourseIdx].status !== "GENERATING" && (
                      <>
                        <Separator />

                        {/* Course Description Section */}
                        <Box
                          p={4}
                          borderRadius="lg"
                          bg={sectionBg}
                          borderWidth="1px"
                          borderColor={borderColor}
                        >
                          <HStack mb={3} gap={2}>
                            <Box
                              p={2}
                              borderRadius="md"
                              bg={drawerBg}
                              display="inline-flex"
                            >
                              <BookOpen size={16} color="#14b8a6" />
                            </Box>
                            <Text fontSize="sm" fontWeight="600">
                              Course Overview
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color={subtleText} lineHeight="1.6">
                            {courseLevelInfo[currCourseIdx].description}
                          </Text>
                        </Box>

                        {/* Modules Section */}
                        <Box>
                          <HStack mb={4} gap={2} justify="space-between">
                            <HStack gap={2}>
                              <Box
                                p={2}
                                borderRadius="lg"
                                bg={sectionBg}
                                display="inline-flex"
                              >
                                <Target size={18} color="#14b8a6" />
                              </Box>
                              <Text fontSize="sm" fontWeight="600">
                                Course Modules
                              </Text>
                            </HStack>
                            <Badge
                              fontSize="xs"
                              px={2.5}
                              py={1}
                              borderRadius="full"
                              colorScheme="teal"
                              fontWeight="600"
                            >
                              {courses
                                .filter(
                                  (c) =>
                                    c.level ===
                                    courseLevelInfo[currCourseIdx].value,
                                )
                                .reduce(
                                  (acc, c) => acc + (c.modules?.length || 0),
                                  0,
                                )}{" "}
                              Modules
                            </Badge>
                          </HStack>

                          {courses.length === 0 ? (
                            <Box
                              textAlign="center"
                              py={8}
                              px={4}
                              bg={sectionBg}
                              borderRadius="lg"
                              borderWidth="1px"
                              borderColor={borderColor}
                            >
                              <Text fontSize="sm" color={subtleText}>
                                No course data available.
                              </Text>
                            </Box>
                          ) : (
                            <VStack align="stretch" gap={2}>
                              {courses
                                .filter(
                                  (course) =>
                                    course.level ===
                                    courseLevelInfo[currCourseIdx].value,
                                )
                                .map((course) =>
                                  (course.modules ?? []).map(
                                    (module: any, idx: number) => (
                                      <Box
                                        key={idx}
                                        p={4}
                                        bg={surfaceBg}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                        transition="all 0.2s"
                                        _hover={{
                                          borderColor: activeBorderColor,
                                          transform: "translateX(4px)",
                                          boxShadow: "sm",
                                        }}
                                      >
                                        <HStack justify="space-between" align="start">
                                          <HStack gap={3} flex={1} align="start">
                                            <Box
                                              minW={8}
                                              h={8}
                                              borderRadius="md"
                                              bg={sectionBg}
                                              display="flex"
                                              alignItems="center"
                                              justifyContent="center"
                                              fontSize="xs"
                                              fontWeight="600"
                                              color="teal.500"
                                            >
                                              {idx + 1}
                                            </Box>
                                            <VStack align="start" gap={1} flex={1}>
                                              <Text
                                                fontSize="sm"
                                                fontWeight="600"
                                                lineHeight="1.4"
                                              >
                                                {module.title}
                                              </Text>
                                              {module.description && (
                                                <Text
                                                  fontSize="xs"
                                                  color={subtleText}
                                                  lineHeight="1.5"
                                                >
                                                  {module.description}
                                                </Text>
                                              )}
                                            </VStack>
                                          </HStack>
                                          <TagHandler status={module.status} />
                                        </HStack>
                                      </Box>
                                    ),
                                  ),
                                )}
                            </VStack>
                          )}
                        </Box>
                      </>
                    )}

                  {/* Empty State - Enhanced */}
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
                          bg="teal.50"
                          _dark={{ bg: "teal.900/20" }}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Sparkles size={28} color="#14b8a6" />
                        </Box>
                        <VStack gap={2}>
                          <Text fontSize="md" fontWeight="600">
                            No course generated yet
                          </Text>
                          <Text
                            fontSize="sm"
                            color={subtleText}
                            maxW="300px"
                            lineHeight="1.6"
                          >
                            Create a personalized course for this level to begin
                            your learning journey
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </Drawer.Body>

              {/* Footer - Enhanced Actions */}
              <Drawer.Footer
                borderTopWidth="1px"
                borderColor={borderColor}
                py={4}
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
                        navigate(
                          `/course/${courseLevelInfo[currCourseIdx].courseId}`,
                        )
                      }
                      colorScheme="teal"
                      flex={1}
                      size="md"
                      borderRadius="lg"
                      fontWeight="600"
                      gap={2}
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
                          courseLevelInfo[currCourseIdx].value,
                        )
                      }
                      colorScheme="teal"
                      flex={1}
                      size="md"
                      borderRadius="lg"
                      fontWeight="600"
                      gap={2}
                      disabled={
                        courseLevelInfo[currCourseIdx].status === "GENERATING" ||
                        isGenerating
                      }
                    >
                      <Sparkles size={18} />
                      {courseLevelInfo[currCourseIdx].status === "GENERATING" ||
                        isGenerating
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
          background: "transparent",
          border: "0",
          boxShadow: "none",
          width: 14,
          height: 14,
        }}
        isConnectable={true}
      />
    </VStack>
  );
};