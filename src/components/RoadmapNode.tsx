import React, { useState } from "react";
import {
    Position,
    type NodeProps,
    Handle,
} from "reactflow";
import { useNavigate } from "react-router-dom";
import "reactflow/dist/style.css";
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
} from "@chakra-ui/react";
import fetchWithTimeout from "../utils/dbUtils";

import TagHandler from "./TagHandler";

import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "./ui/color-mode";
import { MdOutlineDoneAll, MdOutlineRemoveDone } from "react-icons/md";
import { getTypeColor } from "../components/constants";

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
    NodeProps<{ roadmapId: string; roadmapNodeId: string; courseId: string; label: string; description?: string; type?: string, status?: string }>
> = ({ data }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [courses, setCourses] = useState<Array<Course>>([]);
    const [roadmapNodeData, setRoadmapNodeData] = useState(data);
    const [courseLevelInfo, setCourseLevelInfo] = useState([
        { courseId: "", value: "beginner", title: "Beginner", description: "", status: "NOT_GENERATED" },
        { courseId: "", value: "intermediate", title: "Intermediate", description: "", status: "NOT_GENERATED" },
        { courseId: "", value: "advanced", title: "Advanced", description: "", status: "NOT_GENERATED" }
    ]);
    const [currCourseIdx, setCurrCourseIdx] = useState<number>(0);
    // Chakra UI Color Mode hook for background
    const bgColor = useColorModeValue(getTypeColor(roadmapNodeData.type), getTypeColor(roadmapNodeData.type, true));

    const getCourseForNodeId = (roadmapId: string, roadmapNodeId: string) => {
        fetchWithTimeout(`${BACKEND_URL}/get_all_courses/${roadmapId}/${roadmapNodeId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user?.token}`,
            },
        })
            .then((response) => response.json())
            .then((data) => {
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
        const endpoint = `${BACKEND_URL}/generate-course-outline`;
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
            const resp = await fetch(`${BACKEND_URL}/task-status/${type}/${taskId}`);
            const data = await resp.json();
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

        try {
            const response = await fetch(`${BACKEND_URL}/roadmaps/${roadmapId}/${roadmapNodeId}/status`, {
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
            // Optionally, you can add some UI feedback here
        } catch (error) {
            console.error("Error marking node as complete:", error);
        }
    }


    return (
        <>
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                isConnectable={true}
            />
            <HoverCard.Root>
                <HoverCard.Trigger asChild>

                    <Box
                        p={4}
                        borderRadius="lg"
                        border="2px solid #555"
                        textAlign="center"
                        boxShadow="lg"
                        bg={bgColor}
                        borderWidth={8}
                        borderColor={
                            roadmapNodeData.status === "COMPLETED" ? "green.600" : "transparent"
                        }
                        cursor="pointer"
                        color="black"
                        _hover={{
                            boxShadow: "2xl",
                            transform: "scale(1.05)",
                            transition: "all 0.2s ease-in-out",
                        }} // Placeholder for future click functionality
                        onClick={() => {
                            setIsDrawerOpen(true);
                            getCourseForNodeId(roadmapNodeData.roadmapId, roadmapNodeData.roadmapNodeId);
                        }}
                    >
                        <Text fontWeight="bold" fontSize="md">
                            {roadmapNodeData.label}
                        </Text>

                    </Box>
                </HoverCard.Trigger>
                <Portal>
                    <HoverCard.Positioner>
                        <HoverCard.Content>
                            <HoverCard.Arrow />
                            <Box p={3} maxWidth="250px">
                                <Text fontWeight="bold" mb={2}>
                                    {roadmapNodeData.label}
                                </Text>
                                {roadmapNodeData.type && (
                                    <Badge mb={4} color={bgColor}>{roadmapNodeData.type}</Badge>
                                )}
                                <Text fontSize="sm" >
                                    {roadmapNodeData.description ? roadmapNodeData.description : "No description available."}
                                </Text>
                                <Text fontSize="sm" mt={2} fontStyle="italic" color="gray.600">
                                    {courses.length} course
                                    {courses.length !== 1 ? "s" : ""} available.
                                </Text>
                                <Text fontSize="xs" color="gray.500" mt={2} mb={2}>
                                    Click to view courses and generate new ones.
                                </Text>
                                <TagHandler status={roadmapNodeData.status || "NOT_STARTED"} />
                            </Box>
                        </HoverCard.Content>
                    </HoverCard.Positioner>

                </Portal>


            </HoverCard.Root>

            <Drawer.Root open={isDrawerOpen} size="lg" closeOnInteractOutside={true} onInteractOutside={() => setIsDrawerOpen(false)}>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Text fontSize="xl" fontWeight="bold">
                                    {roadmapNodeData.label}
                                </Text>
                                <Badge color={bgColor}>{roadmapNodeData.type}</Badge>
                                <Button
                                    size="xs"
                                    ml="auto"
                                    px={2}
                                    py={1}
                                    fontSize="xs"
                                    minW="0"
                                    variant="ghost"
                                    onClick={() => {
                                        handleMarkAsComplete(roadmapNodeData.status === "COMPLETED" ? "NOT_STARTED" : "COMPLETED", roadmapNodeData.roadmapId, roadmapNodeData.roadmapNodeId);
                                    }}
                                >
                                    {roadmapNodeData.status === "COMPLETED" ? <MdOutlineRemoveDone /> : <MdOutlineDoneAll />}
                                    {roadmapNodeData.status === "COMPLETED" ? "Incomplete" : "Complete"}
                                </Button>
                            </Drawer.Header>
                            <Drawer.Body >
                                <Text mb={5}>{roadmapNodeData.description || "No description available."}</Text>

                                <RadioCard.Root variant={"subtle"} defaultValue="beginner" mb={5}>
                                    <RadioCard.Label>Select Course Level</RadioCard.Label>
                                    <HStack align="stretch">
                                        {courseLevelInfo.map((course, index) => (
                                            <RadioCard.Item key={course.value} value={course.value} onClick={() => setCurrCourseIdx(index)}>
                                                <RadioCard.ItemHiddenInput />
                                                <RadioCard.ItemControl>
                                                    <RadioCard.ItemContent>
                                                        <RadioCard.ItemText>{course.title}</RadioCard.ItemText>
                                                        <RadioCard.ItemDescription>
                                                            {course.status === "IN_PROGRESS" ? "Continue learning" : "Start learning"}
                                                        </RadioCard.ItemDescription>
                                                        <TagHandler status={course.status} />
                                                        {course.status === "GENERATING" && (
                                                            <Spinner mt={2} size="sm" />
                                                        )}
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
                                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
                                {courseLevelInfo[currCourseIdx].courseId ? (
                                    <Button
                                        onClick={() => navigate(`/course/${courseLevelInfo[currCourseIdx].courseId}`)}
                                    >
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
                id="bottom-source"
                isConnectable={true}
            />
        </>
    );
};