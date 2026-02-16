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
  Badge,
  Spinner,
  VStack,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
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
  Award,
  TrendingUp,
} from "lucide-react";

const MotionBox = motion(Box);

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
          border: `2px solid ${cardBg}`,
          width: 12,
          height: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          transition: "all 0.2s",
        }}
      />

      {/* SaaS-Grade Node Card */}
      <MotionBox
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        bg={isCompleted ? completedBg : cardBg}
        borderRadius="14px"
        p={4}
        minW="280px"
        maxW="320px"
        borderWidth="1px"
        borderColor={isCompleted ? "#10b981" : borderColor}
        position="relative"
        cursor="pointer"
        overflow="hidden"
        css={{ transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        boxShadow={
          isCompleted
            ? "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(16,185,129,0.08)"
            : "0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)"
        }
        _hover={{
          borderColor: isCompleted ? "#10b981" : lineColor,
          boxShadow: isCompleted
            ? "0 0 0 1px #10b98140, 0 8px 24px rgba(16,185,129,0.12)"
            : "0 4px 8px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)",
          transform: "translateY(-3px)",
        }}
        onClick={() => {
          setIsDrawerOpen(true);
          getCourseForNodeId(
            roadmapNodeData.roadmapId,
            roadmapNodeData.roadmapNodeId,
          );
        }}
      >
        {/* Left accent gradient strip */}
        <Box
          position="absolute"
          left={0}
          top={0}
          bottom={0}
          w="4px"
          bg={
            isCompleted
              ? "linear-gradient(to bottom, #10b981, #06d6a0)"
              : `linear-gradient(to bottom, ${lineColor}, ${lineColor}80)`
          }
          borderLeftRadius="14px"
        />

        <VStack align="stretch" gap={3} pl={1}>
          {/* Header Row */}
          <HStack justify="space-between" align="center">
            <Badge
              size="sm"
              bg={isCompleted ? "#10b98115" : `${lineColor}15`}
              color={isCompleted ? "#10b981" : lineColor}
              fontSize="2xs"
              fontWeight="700"
              px={2}
              py={0.5}
              borderRadius="full"
              letterSpacing="0.5px"
              textTransform="uppercase"
            >
              {roadmapNodeData.type || "Module"}
            </Badge>

            {isCompleted && (
              <Badge
                bg="#10b98115"
                color="#10b981"
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="2xs"
                fontWeight="700"
              >
                <HStack gap={1}>
                  <CheckCircle2 size={12} strokeWidth={2.5} />
                  <Text>Done</Text>
                </HStack>
              </Badge>
            )}
          </HStack>

          {/* Title */}
          <Heading
            fontSize="sm"
            fontWeight="800"
            color={headingColor}
            lineHeight="1.4"
            letterSpacing="-0.01em"
            lineClamp={2}
          >
            {roadmapNodeData.label}
          </Heading>

          {/* Footer Action */}
          <HStack
            justify="space-between"
            align="center"
            pt={1.5}
            borderTopWidth="1px"
            borderColor={borderColor}
            fontSize="xs"
            color={mutedText}
          >
            <HStack gap={1.5}>
              <Box w="5px" h="5px" borderRadius="full" bg={lineColor} />
              <Text fontWeight="700">Explore</Text>
            </HStack>
            <Box
              bg={hoverBg}
              borderRadius="full"
              p={0.5}
              display="flex"
              alignItems="center"
              justifyContent="center"
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              css={{
                ".chakra-box:hover > .chakra-stack > .chakra-stack > &, *:hover > &": {
                  transform: "translateX(2px)",
                },
              }}
            >
              <ChevronRight size={13} />
            </Box>
          </HStack>
        </VStack>
      </MotionBox>

      {/* Polished Drawer */}
      <Drawer.Root
        open={isDrawerOpen}
        size="lg"
        onOpenChange={(e) => setIsDrawerOpen(e.open)}
      >
        <Portal>
          <Drawer.Backdrop bg="blackAlpha.700" backdropFilter="blur(10px)" />
          <Drawer.Positioner>
            <Drawer.Content bg={drawerBg}>
              {/* Header with gradient background */}
              <Box
                borderBottom="2px solid"
                borderColor={isCompleted ? "#10b981" : lineColor}
                bg={useColorModeValue(
                  "linear-gradient(to right, #f8fafc, #f1f5f9)",
                  "linear-gradient(to right, #0a0a0a, #111111)"
                )}
              >
                <Drawer.Header py={5} px={6}>
                  <HStack justify="space-between" w="full" align="start">
                    <VStack align="start" gap={2} flex={1}>
                      <HStack gap={3}>
                        <Box
                          w="44px"
                          h="44px"
                          borderRadius="xl"
                          bg={isCompleted ? "#10b98115" : `${lineColor}15`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                        >
                          <BookOpen size={22} color={isCompleted ? "#10b981" : lineColor} />
                        </Box>
                        <Heading
                          size="xl"
                          fontWeight="800"
                          letterSpacing="-0.02em"
                        >
                          {roadmapNodeData.label}
                        </Heading>
                      </HStack>

                      <HStack gap={2} pl="56px">
                        <Badge
                          fontSize="2xs"
                          px={2.5}
                          py={0.5}
                          borderRadius="full"
                          bg={isCompleted ? "#10b98115" : `${lineColor}15`}
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
                  {/* Description as styled callout */}
                  {roadmapNodeData.description && (
                    <Box
                      p={4}
                      bg={sectionBg}
                      borderRadius="lg"
                      borderLeft="3px solid"
                      borderLeftColor={isCompleted ? "#10b981" : lineColor}
                    >
                      <Text fontSize="md" color={mutedText} lineHeight="1.7">
                        {roadmapNodeData.description}
                      </Text>
                    </Box>
                  )}

                  <Separator />

                  {/* Mark as Complete Button with tap animation */}
                  <MotionBox whileTap={{ scale: 0.97 }}>
                    <Button
                      onClick={() =>
                        handleMarkAsComplete(
                          roadmapNodeData.status || "",
                          roadmapNodeData.roadmapId,
                          roadmapNodeData.roadmapNodeId,
                        )
                      }
                      w="full"
                      variant={isCompleted ? "solid" : "outline"}
                      borderWidth={isCompleted ? "0" : "1px"}
                      borderColor={borderColor}
                      color={isCompleted ? "white" : headingColor}
                      bg={isCompleted ? "#10b981" : "transparent"}
                      _hover={{
                        bg: isCompleted ? "#0d9668" : hoverBg,
                        borderColor: isCompleted ? "transparent" : accentColor,
                      }}
                      gap={2}
                      fontWeight="700"
                      borderRadius="lg"
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
                  </MotionBox>

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
                              borderWidth="1px"
                              borderLeftWidth="4px"
                              borderLeftColor={levelColor}
                              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                              boxShadow="0 1px 2px rgba(0,0,0,0.04)"
                              _hover={{
                                borderColor: levelColor,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                              }}
                              _checked={{
                                borderColor: levelColor,
                                boxShadow: `0 0 0 1px ${levelColor}`,
                                bg: `${levelColor}08`,
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
                                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                      _hover={{
                                        bg: hoverBg,
                                        borderColor: getLevelColor(courseLevelInfo[currCourseIdx].value),
                                      }}
                                    >
                                      <HStack gap={3} align="start">
                                        <Box
                                          minW="28px"
                                          h="28px"
                                          borderRadius="md"
                                          bg={`${getLevelColor(courseLevelInfo[currCourseIdx].value)}15`}
                                          display="flex"
                                          alignItems="center"
                                          justifyContent="center"
                                          fontSize="2xs"
                                          fontWeight="800"
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

                  {/* Empty State with breathing animation */}
                  {courseLevelInfo[currCourseIdx].status === "NOT_GENERATED" && (
                    <Box
                      textAlign="center"
                      py={12}
                      px={6}
                      bg={sectionBg}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderStyle="dashed"
                      borderColor={borderColor}
                    >
                      <VStack gap={4}>
                        <MotionBox
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          w={16}
                          h={16}
                          borderRadius="full"
                          bg={`${accentColor}15`}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Sparkles size={32} color={accentColor} />
                        </MotionBox>
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
                    borderColor={borderColor}
                  >
                    Close
                  </Button>
                  {courseLevelInfo[currCourseIdx].courseId ? (
                    <Button
                      onClick={() =>
                        navigate(`/course/${courseLevelInfo[currCourseIdx].courseId}`)
                      }
                      bg={`linear-gradient(135deg, ${getLevelColor(courseLevelInfo[currCourseIdx].value)}, ${getLevelColor(courseLevelInfo[currCourseIdx].value)}cc)`}
                      color="white"
                      flex={1}
                      size="md"
                      borderRadius="lg"
                      fontWeight="700"
                      gap={2}
                      boxShadow={`0 4px 14px ${getLevelColor(courseLevelInfo[currCourseIdx].value)}30`}
                      _hover={{
                        opacity: 0.9,
                        boxShadow: `0 6px 20px ${getLevelColor(courseLevelInfo[currCourseIdx].value)}40`,
                      }}
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
                      bg={`linear-gradient(135deg, ${getLevelColor(courseLevelInfo[currCourseIdx].value)}, ${getLevelColor(courseLevelInfo[currCourseIdx].value)}cc)`}
                      color="white"
                      flex={1}
                      size="md"
                      borderRadius="lg"
                      fontWeight="700"
                      gap={2}
                      disabled={
                        courseLevelInfo[currCourseIdx].status === "GENERATING" ||
                        isGenerating
                      }
                      boxShadow={`0 4px 14px ${getLevelColor(courseLevelInfo[currCourseIdx].value)}30`}
                      _hover={{
                        opacity: 0.9,
                        boxShadow: `0 6px 20px ${getLevelColor(courseLevelInfo[currCourseIdx].value)}40`,
                      }}
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
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
          border: `2px solid ${cardBg}`,
          width: 12,
          height: 12,
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
          transition: "all 0.2s",
        }}
        isConnectable={true}
      />
    </VStack>
  );
};