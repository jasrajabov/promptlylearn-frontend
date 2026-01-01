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
} from "@chakra-ui/react";
import fetchWithTimeout from "../utils/dbUtils";
import TagHandler from "./TagHandler";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "./ui/color-mode";
import { MdOutlineDoneAll } from "react-icons/md";
import { getTypeColor } from "../components/constants";
import { FaCheckCircle } from "react-icons/fa";


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
        { courseId: "", value: "beginner", title: "Beginner", description: "", status: "NOT_GENERATED" },
        { courseId: "", value: "intermediate", title: "Intermediate", description: "", status: "NOT_GENERATED" },
        { courseId: "", value: "advanced", title: "Advanced", description: "", status: "NOT_GENERATED" },
    ]);
    const [currCourseIdx, setCurrCourseIdx] = useState(0);

    const isCompleted = roadmapNodeData.status === "COMPLETED";

    const surfaceBg = useColorModeValue("white", "gray.800");
    const subtleText = useColorModeValue("black", "white");
    const borderColor = isCompleted ? "teal.400" : "gray.300";

    const hoverShadow = useColorModeValue(
        "0 12px 30px rgba(0,0,0,0.08)",
        "0 12px 30px rgba(0,0,0,0.45)"
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
                console.log("Fetched courses for roadmap node:", data);
                setCourses(data);
                console.log("Courses for roadmap node:", data);
                if (data.length > 0) {
                    setCourseLevelInfo(prevLevels => {
                        const next = prevLevels.map(level => {
                            const found = data.find((c: Course) => c.level === level.value);
                            if (!found) return level;
                            return {
                                ...level,
                                courseId: found.id,
                                status: (found.status ?? "NOT_GENERATED"),
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

    const handleGenerateCourse = async (topic: string, roadmapId: string, roadmapNodeId: string, level: string) => {
        if (!user) {
            console.log("User not logged in");
            return;
        }
        // setIsGenerating(true);
        setCourseLevelInfo((prevLevels) =>
            prevLevels.map((levelInfo) =>
                levelInfo.value === level
                    ? { ...levelInfo, status: "GENERATING" }
                    : levelInfo
            )
        );
        const endpoint = `${BACKEND_URL}/course/generate-course-outline`;
        const body = { topic: topic, level: level, roadmap_id: roadmapId, roadmap_node_id: roadmapNodeId }; // Example body, adjust as needed
        const response = await fetchWithTimeout(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}`
                },
                body: JSON.stringify(body),
            },
            600000
        );
        const { task_id, course_id } = await response.json();
        console.log("Course generation started, task ID:", task_id);

        pollTaskStatus(task_id, roadmapId, roadmapNodeId, course_id, "course_outline");
    };

    function pollTaskStatus(taskId: string, roadmapId: string, roadmapNodeId: string, courseId: string, type: string) {
        const interval = setInterval(async () => {
            const resp = await fetch(`${BACKEND_URL}/tasks/status/${type}/${taskId}`);
            const data = await resp.json();
            console.log("Polled task status:", data);
            if (data.status === "SUCCESS") {
                clearInterval(interval);
                setIsGenerating(false);
                if (type === "course_outline") {
                    if (roadmapNodeId && courseId) {
                        getCourseForNodeId(roadmapId, roadmapNodeId);
                    }

                }
            }

            if (data.status === "FAILED") {
                clearInterval(interval);
                setIsGenerating(false);
                alert("Course generation failed.");
            }
        }, 2000);
    }

    const handleMarkAsComplete = async (status: string, roadmapId: string, roadmapNodeId: string) => {
        if (!user) {
            console.log("User not logged in");
            return;
        }

        status = status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED";

        try {
            const response = await fetch(`${BACKEND_URL}/roadmap/${roadmapId}/${roadmapNodeId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
                body: JSON.stringify({
                    status,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to mark node as complete");
            }
            setRoadmapNodeData((prevData) => ({
                ...prevData,
                status: status,
            }));
            console.log("Node marked as complete:", roadmapNodeId);
            onStatusChange(roadmapNodeId, status);
            // Optionally, you can add some UI feedback here
        } catch (error) {
            console.error("Error marking node as complete:", error);
        }
    }


    return (
        <VStack gap={2} align="center">

            <Handle type="target" position={Position.Top} />

            {/* removed external status row — checkbox moved into node card */}

            {/* Node Card */}
            <HoverCard.Root>
                <HoverCard.Trigger asChild>
                    <Box
                        bg={surfaceBg}
                        borderRadius="xl"
                        p={4}
                        minW="240px"
                        maxW="300px"
                        border="1px solid"
                        borderColor={borderColor}
                        position="relative"
                        cursor="pointer"
                        transition="all 0.2s ease"
                        boxShadow="sm"
                        _hover={{
                            boxShadow: hoverShadow,
                            transform: "translateY(-2px)",
                        }}
                        onClick={() => {
                            setIsDrawerOpen(true);
                            getCourseForNodeId(
                                roadmapNodeData.roadmapId,
                                roadmapNodeData.roadmapNodeId
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
                                            roadmapNodeData.roadmapNodeId
                                        );
                                    }}
                                />
                            </Checkbox.Root>
                        </Box>

                        {/* Type accent */}
                        {roadmapNodeData.type && (
                            <Box
                                position="absolute"
                                left={0}
                                top={0}
                                bottom={0}
                                w="10px"
                                borderLeftRadius="xl"
                                bg={getTypeColor(roadmapNodeData.type)}
                            />
                        )}

                        <HStack justify="space-between" mb={2}>
                            {roadmapNodeData.type && (
                                <Badge fontSize="xs" variant="subtle" color="white" backgroundColor={getTypeColor(roadmapNodeData.type)}>
                                    {roadmapNodeData.type}
                                </Badge>
                            )}
                            {/* {isCompleted && <FaCheckCircle color="teal" />} */}
                        </HStack>

                        <Text fontWeight="bold" fontSize="lg" lineClamp={2}>
                            {roadmapNodeData.label}
                        </Text>

                        <Text fontSize="xs" color={subtleText} lineClamp={2}>
                            {roadmapNodeData.description || "No description provided."}
                        </Text>
                    </Box>
                </HoverCard.Trigger>

                {/* Hover Preview */}
                <Portal>
                    <HoverCard.Positioner>
                        <HoverCard.Content>
                            <HoverCard.Arrow />
                            <Box p={3} maxW="260px">
                                <Text fontWeight="bold" color={getTypeColor(roadmapNodeData.type)}>{roadmapNodeData.label}</Text>
                                <Text fontSize="sm" mt={1} mb={4}>
                                    {roadmapNodeData.description}
                                </Text>
                                <TagHandler status={roadmapNodeData.status || "NOT_STARTED"} />
                            </Box>
                        </HoverCard.Content>
                    </HoverCard.Positioner>
                </Portal>
            </HoverCard.Root>

            {/* Drawer (unchanged behavior) */}
            <Drawer.Root open={isDrawerOpen} size="lg" onInteractOutside={() => setIsDrawerOpen(false)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Heading size="md">{roadmapNodeData.label}</Heading>
                                <Badge size="xs" color="white" backgroundColor={getTypeColor(roadmapNodeData.type)}>{roadmapNodeData.type}</Badge>
                            </Drawer.Header>

                            <Drawer.Body>
                                <Text mb={4}>{roadmapNodeData.description}</Text>

                                <RadioCard.Root defaultValue="beginner" colorPalette="teal">
                                    <RadioCard.Label>Select level</RadioCard.Label>
                                    <HStack>
                                        {courseLevelInfo.map((c, i) => (
                                            <RadioCard.Item
                                                key={c.value}
                                                value={c.value}
                                                onClick={() => setCurrCourseIdx(i)}
                                            >
                                                <RadioCard.ItemHiddenInput />
                                                <RadioCard.ItemControl>
                                                    <RadioCard.ItemContent>
                                                        <RadioCard.ItemText>{c.title}</RadioCard.ItemText>
                                                        <TagHandler status={c.status} />
                                                        {c.status === "GENERATING" && <Spinner size="sm" />}
                                                    </RadioCard.ItemContent>
                                                </RadioCard.ItemControl>
                                            </RadioCard.Item>
                                        ))}
                                    </HStack>
                                </RadioCard.Root>
                                {courseLevelInfo[currCourseIdx].status !== "NOT_GENERATED" && courseLevelInfo[currCourseIdx].status !== "GENERATING" && (
                                    <>
                                        <Heading>Course Description</Heading>
                                        <Text mb={5} fontSize="sm" color="gray.500">
                                            {courseLevelInfo[currCourseIdx].description}
                                        </Text>
                                        <Heading>Modules</Heading>
                                        {courses.length === 0 ? (
                                            <Text>No course data available.</Text>
                                        ) : (
                                            courses
                                                .filter((course) => course.level === courseLevelInfo[currCourseIdx].value)
                                                .map((course) =>
                                                    (course.modules ?? []).map((module: any, idx: number) => (
                                                        <Box key={idx} mb={1} p={1} border="1px solid" borderColor="gray.200" borderRadius="md">
                                                            <HStack justify="space-between" mb={2}>
                                                                <Text fontWeight="bold">{module.title}</Text>
                                                                <TagHandler status={module.status} />
                                                            </HStack>
                                                        </Box>
                                                    ))
                                                )
                                        )}
                                    </>
                                )}
                                {courseLevelInfo[currCourseIdx].status === "NOT_GENERATED" && (
                                    <Text color="gray.500">
                                        No course generated for this level yet.
                                        Click &quot;Generate Course&quot; to create one.
                                    </Text>
                                )}
                            </Drawer.Body>

                            <Drawer.Footer>
                                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                                    Close
                                </Button>
                                {courseLevelInfo[currCourseIdx].courseId ? (
                                    <Button onClick={() => navigate(`/course/${courseLevelInfo[currCourseIdx].courseId}`)}>
                                        View Course
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleGenerateCourse(roadmapNodeData.label, roadmapNodeData.roadmapId, roadmapNodeData.roadmapNodeId, courseLevelInfo[currCourseIdx].value)}
                                    >
                                        {courseLevelInfo[currCourseIdx].status === "GENERATING" || isGenerating ? "Generating..." : "Generate Course"}
                                    </Button>
                                )}
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
