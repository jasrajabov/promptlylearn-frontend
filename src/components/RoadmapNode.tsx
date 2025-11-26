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
} from "@chakra-ui/react";
import fetchWithTimeout from "../utils/dbUtils";

import TagHandler from "./TagHandler";

import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "./ui/color-mode";

type Course = {
    id: string;
    title: string;
    description: string;
    level: "beginner" | "intermediate" | "advanced";
    modules?: any[];
    status?: string;
};



export const RoadmapNode: React.FC<
    NodeProps<{ roadmapId: string; roadmapNodeId: string; courseId: string; label: string; description?: string; type?: string }>
> = ({ data }) => {
    const navigate = useNavigate();
    const { user } = useUser();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [courses, setCourses] = useState<Array<Course>>([]);
    const [courseLevelInfo, setCourseLevelInfo] = useState([
        { courseId: "", value: "beginner", title: "Beginner", description: "", status: "NOT_GENERATED" },
        { courseId: "", value: "intermediate", title: "Intermediate", description: "", status: "NOT_GENERATED" },
        { courseId: "", value: "advanced", title: "Advanced", description: "", status: "NOT_GENERATED" }
    ]);
    const [currCourseIdx, setCurrCourseIdx] = useState<number>(0);
    // Chakra UI Color Mode hook for background
    const bgColor = useColorModeValue(
        data.type === "core" ? "#ffe0b2" :
            data.type === "optional" ? "#f8bbd0" :
                data.type === "project" ? "#c8e6c9" :
                    data.type === "prerequisite" ? "#d1c4e9" :
                        data.type === "certification" ? "#fff9c4" :
                            data.type === "tooling" ? "#e0f2f1" :
                                data.type === "soft-skill" ? "#f3e5f5" :
                                    data.type === "portfolio" ? "#dcedc8" :
                                        data.type === "specialization" ? "#ffe082" :
                                            data.type === "capstone" ? "#ffccbc" :
                                                "#e0f7fa",

        // Dark mode
        data.type === "core" ? "#ffb74d" :
            data.type === "optional" ? "#f48fb1" :
                data.type === "project" ? "#81c784" :
                    data.type === "prerequisite" ? "#9575cd" :
                        data.type === "certification" ? "#fff176" :
                            data.type === "tooling" ? "#80cbc4" :
                                data.type === "soft-skill" ? "#ba68c8" :
                                    data.type === "portfolio" ? "#aed581" :
                                        data.type === "specialization" ? "#ffca28" :
                                            data.type === "capstone" ? "#ffab91" :
                                                "#80deea"
    );


    const getCourseForNodeId = (roadmapNodeId: string) => {
        fetchWithTimeout(`http://localhost:8000/get_all_courses/${roadmapNodeId}`, {
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

    const handleGenerateCourse = async (topic: string, roadmapNodeId: string, level: string) => {
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
        const endpoint = `http://localhost:8000/generate-course-outline`;
        const body = { topic: topic, level: level, roadmap_node_id: roadmapNodeId }; // Example body, adjust as needed
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

        pollTaskStatus(level, task_id, roadmapNodeId, course_id, "course_outline");
    };
    console.log("Course Level Info:", courseLevelInfo);
    function pollTaskStatus(level: string, taskId: string, roadmapNodeId: string, courseId: string, type: string) {
        const interval = setInterval(async () => {
            console.log("Polling task status for task ID:", taskId);
            const resp = await fetch(`http://localhost:8000/task-status/${type}/${taskId}`);
            console.log("Polled task status:", resp);
            const data = await resp.json();
            console.log("Polled task status:", data);
            if (data.status === "SUCCESS") {
                console.log("hit here")
                clearInterval(interval);
                setIsGenerating(false);
                if (type === "course_outline") {
                    if (roadmapNodeId && courseId) {
                        getCourseForNodeId(roadmapNodeId);
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



    return (
        <>
            {/* 🎯 Target Handle (Incoming Edges) - Position.Top with ID */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                isConnectable={true}
            />

            <Box
                p={4}
                borderRadius="lg"
                border="2px solid #555"
                textAlign="center"
                boxShadow="lg"
                bg={bgColor}
                cursor="pointer"
                _hover={{
                    boxShadow: "2xl",
                    transform: "scale(1.05)",
                    transition: "all 0.2s ease-in-out",
                }} // Placeholder for future click functionality
                onClick={() => {
                    setIsDrawerOpen(true);
                    getCourseForNodeId(data.roadmapNodeId);
                }}
            >
                <Text fontWeight="bold" fontSize="md">
                    {data.label}
                </Text>
            </Box>
            <Drawer.Root open={isDrawerOpen} size="lg">
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Text fontSize="xl" fontWeight="bold">
                                    {data.label}
                                </Text>
                            </Drawer.Header>
                            <Drawer.Body >
                                <Text mb={5}>{data.description || "No description available."}</Text>
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
                                                    </RadioCard.ItemContent>
                                                </RadioCard.ItemControl>
                                            </RadioCard.Item>
                                        ))}
                                    </HStack>

                                </RadioCard.Root>
                                {courseLevelInfo[currCourseIdx].status !== "NOT_GENERATED" && (
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
                                        Click "Generate Course" to create one.
                                    </Text>
                                )}
                            </Drawer.Body>
                            <Drawer.Footer>
                                <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>

                                {/* use the state-backed courseId (not data.courseId) and guard when missing */}
                                {courseLevelInfo[currCourseIdx].courseId ? (
                                    <Button
                                        onClick={() => navigate(`/course/${courseLevelInfo[currCourseIdx].courseId}`)}
                                    >
                                        View Course
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleGenerateCourse(data.label, data.roadmapNodeId, courseLevelInfo[currCourseIdx].value)}
                                    // isLoading={courseLevelInfo[currCourseIdx].status === "GENERATING" || isGenerating}
                                    >
                                        {courseLevelInfo[currCourseIdx].status === "GENERATING" || isGenerating ? "Generating..." : "Generate Course"}
                                    </Button>
                                )}
                            </Drawer.Footer>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>

            {/* 🎯 Source Handle (Outgoing Edges) - Position.Bottom with ID */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                isConnectable={true}
            />
        </>
    );
};