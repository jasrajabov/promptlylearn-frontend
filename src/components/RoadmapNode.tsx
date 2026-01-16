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

  const surfaceBg = useColorModeValue("white", "gray.900");
  const subtleText = useColorModeValue("gray.600", "gray.400");
  const borderColor = isCompleted
    ? "teal.400"
    : useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.900");

  const hoverShadow = useColorModeValue(
    "0 8px 20px rgba(0,0,0,0.1)",
    "0 8px 20px rgba(0,0,0,0.5)",
  );

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

  return (
    <VStack gap={0} align="center">
      <Handle type="target" position={Position.Top} />

      {/* Node Card */}
      <HoverCard.Root openDelay={300} closeDelay={100}>
        <HoverCard.Trigger asChild>
          <Box
            bg={surfaceBg}
            borderRadius="lg"
            p={3}
            minW="240px"
            maxW="280px"
            border="2px solid"
            borderColor={borderColor}
            position="relative"
            cursor="pointer"
            transition="all 0.2s ease"
            boxShadow={isCompleted ? "0 0 0 3px rgba(56, 178, 172, 0.1)" : "sm"}
            _hover={{
              boxShadow: hoverShadow,
              transform: "translateY(-2px)",
              borderColor: "teal.400",
            }}
            onClick={() => {
              setIsDrawerOpen(true);
              getCourseForNodeId(
                roadmapNodeData.roadmapId,
                roadmapNodeData.roadmapNodeId,
              );
            }}
          >
            {/* Inline completion checkbox (top-right) */}
            <Box position="absolute" top={2} right={2} zIndex={5}>
              <Checkbox.Root
                checked={isCompleted}
                aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                colorPalette={"teal"}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation(); // prevent opening drawer
                    handleMarkAsComplete(
                      roadmapNodeData.status || "",
                      roadmapNodeData.roadmapId,
                      roadmapNodeData.roadmapNodeId,
                    );
                  }}
                />
              </Checkbox.Root>
            </Box>

            {/* Type Badge */}
            {roadmapNodeData.type && (
              <Badge
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="md"
                mb={2}
                bg={getTypeColor(roadmapNodeData.type)}
                color="white"
              >
                {roadmapNodeData.type}
              </Badge>
            )}

            {/* Title */}
            <Text fontWeight="semibold" fontSize="lg" lineClamp={2} mb={1}>
              {roadmapNodeData.label}
            </Text>

            {/* Description */}
            <Text fontSize="xs" color={subtleText} lineClamp={2}>
              {roadmapNodeData.description || "No description provided."}
            </Text>
          </Box>
        </HoverCard.Trigger>

        {/* Hover Preview */}
        <Portal>
          <HoverCard.Positioner>
            <HoverCard.Content maxW="300px">
              <HoverCard.Arrow />
              <VStack align="stretch" gap={2} p={1}>
                <HStack justify="space-between">
                  <Badge
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="md"
                    bg={getTypeColor(roadmapNodeData.type)}
                    color="white"
                  >
                    {roadmapNodeData.type}
                  </Badge>
                  <TagHandler
                    status={roadmapNodeData.status || "NOT_STARTED"}
                  />
                </HStack>
                <Text fontWeight="semibold" fontSize="sm">
                  {roadmapNodeData.label}
                </Text>
                <Text fontSize="xs" color={subtleText}>
                  {roadmapNodeData.description}
                </Text>
              </VStack>
            </HoverCard.Content>
          </HoverCard.Positioner>
        </Portal>
      </HoverCard.Root>

      {/* Drawer */}
      <Drawer.Root
        open={isDrawerOpen}
        size="lg"
        onOpenChange={(e) => setIsDrawerOpen(e.open)}
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content>
              <Drawer.Header borderBottomWidth="1px">
                <VStack align="start" gap={2} flex={1}>
                  <HStack justify="space-between" w="full">
                    <Heading size="md">{roadmapNodeData.label}</Heading>
                    <Drawer.CloseTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <X size={18} />
                      </Button>
                    </Drawer.CloseTrigger>
                  </HStack>
                  <HStack gap={2}>
                    <Badge
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="md"
                      bg={getTypeColor(roadmapNodeData.type)}
                      color="white"
                    >
                      {roadmapNodeData.type}
                    </Badge>
                    <TagHandler
                      status={roadmapNodeData.status || "NOT_STARTED"}
                    />
                  </HStack>
                </VStack>
              </Drawer.Header>

              <Drawer.Body>
                <VStack align="stretch" gap={4}>
                  {/* Description */}
                  <Box>
                    <Text fontSize="sm" color={subtleText}>
                      {roadmapNodeData.description}
                    </Text>
                  </Box>

                  <Separator />

                  {/* Level Selection */}
                  <Box>
                    <HStack mb={3} gap={2}>
                      <GraduationCap size={16} color="#14b8a6" />
                      <Text fontSize="sm" fontWeight="semibold">
                        Select Course Level
                      </Text>
                    </HStack>

                    <RadioCard.Root
                      defaultValue="beginner"
                      colorPalette="teal"
                      size="sm"
                    >
                      <HStack gap={2}>
                        {courseLevelInfo.map((c, i) => (
                          <RadioCard.Item
                            key={c.value}
                            value={c.value}
                            onClick={() => setCurrCourseIdx(i)}
                            flex="1"
                          >
                            <RadioCard.ItemHiddenInput />
                            <RadioCard.ItemControl>
                              <RadioCard.ItemContent>
                                <VStack gap={1} align="start">
                                  <RadioCard.ItemText
                                    fontSize="xs"
                                    fontWeight="medium"
                                  >
                                    {c.title}
                                  </RadioCard.ItemText>
                                  <HStack gap={1}>
                                    <TagHandler status={c.status} />
                                    {c.status === "GENERATING" && (
                                      <Spinner size="xs" color="teal.500" />
                                    )}
                                  </HStack>
                                </VStack>
                              </RadioCard.ItemContent>
                            </RadioCard.ItemControl>
                          </RadioCard.Item>
                        ))}
                      </HStack>
                    </RadioCard.Root>
                  </Box>

                  {/* Course Content */}
                  {courseLevelInfo[currCourseIdx].status !== "NOT_GENERATED" &&
                    courseLevelInfo[currCourseIdx].status !== "GENERATING" && (
                      <>
                        <Separator />

                        {/* Course Description */}
                        <Box>
                          <HStack mb={2} gap={2}>
                            <BookOpen size={16} color="#14b8a6" />
                            <Text fontSize="sm" fontWeight="semibold">
                              Course Description
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color={subtleText}>
                            {courseLevelInfo[currCourseIdx].description}
                          </Text>
                        </Box>

                        {/* Modules */}
                        <Box>
                          <HStack mb={2} gap={2}>
                            <Target size={16} color="#14b8a6" />
                            <Text fontSize="sm" fontWeight="semibold">
                              Modules (
                              {courses
                                .filter(
                                  (c) =>
                                    c.level ===
                                    courseLevelInfo[currCourseIdx].value,
                                )
                                .reduce(
                                  (acc, c) => acc + (c.modules?.length || 0),
                                  0,
                                )}
                              )
                            </Text>
                          </HStack>

                          {courses.length === 0 ? (
                            <Text fontSize="xs" color={subtleText}>
                              No course data available.
                            </Text>
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
                                        p={3}
                                        bg={hoverBg}
                                        borderRadius="md"
                                        borderWidth="1px"
                                        borderColor={borderColor}
                                      >
                                        <HStack justify="space-between">
                                          <HStack gap={2} flex={1}>
                                            <Text
                                              fontSize="xs"
                                              fontWeight="medium"
                                              color="gray.500"
                                            >
                                              {idx + 1}
                                            </Text>
                                            <Text
                                              fontSize="sm"
                                              fontWeight="medium"
                                            >
                                              {module.title}
                                            </Text>
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

                  {/* Empty State */}
                  {courseLevelInfo[currCourseIdx].status ===
                    "NOT_GENERATED" && (
                      <Box
                        textAlign="center"
                        py={8}
                        px={4}
                        bg={hoverBg}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderStyle="dashed"
                        borderColor={borderColor}
                      >
                        <VStack gap={2}>
                          <Box
                            w={12}
                            h={12}
                            borderRadius="full"
                            bg="teal.50"
                            _dark={{ bg: "teal.900/20" }}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Sparkles size={24} color="#14b8a6" />
                          </Box>
                          <Text fontSize="sm" fontWeight="medium">
                            No course yet
                          </Text>
                          <Text fontSize="xs" color={subtleText}>
                            Generate a course for this level to get started
                          </Text>
                        </VStack>
                      </Box>
                    )}
                </VStack>
              </Drawer.Body>

              <Drawer.Footer borderTopWidth="1px">
                <HStack w="full" gap={2}>
                  <Button
                    variant="outline"
                    onClick={() => setIsDrawerOpen(false)}
                    flex={1}
                    size="sm"
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
                      size="sm"
                    >
                      <Eye size={16} />
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
                      size="sm"
                      disabled={
                        courseLevelInfo[currCourseIdx].status ===
                        "GENERATING" || isGenerating
                      }
                    >
                      <Sparkles size={16} />
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
