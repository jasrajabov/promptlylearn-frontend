import React, { useEffect, useRef } from "react";
import {
    Box,
    Heading,
    Text,
    SimpleGrid,
    Card,
    Button,
    Spinner,
    VStack,
    Dialog,
    Portal,
    CloseButton
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";
import { FaBookOpen, FaTrash } from "react-icons/fa";
import TagHandler from "../components/TagHandler";

interface Roadmap {
    id: string;
    roadmap_name: string;
    modules: number;
    created_at: string;
    status: string;
    task_id: string;

}

const UserRoadmaps: React.FC = () => {
    const { user, loading } = useUser();
    const [allRoadmaps, setAllRoadmaps] = React.useState<Roadmap[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const cardBg = useColorModeValue("white", "gray.900");
    const cardHoverBg = useColorModeValue("gray.50", "gray.700");

    useEffect(() => {
        const fetchRoadmaps = async () => {
            if (!user) return;
            try {
                const response = await fetchWithTimeout(
                    `http://localhost:8000/get_all_roadmaps`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${user?.token}`,
                        },
                    }
                );
                const data = await response.json();
                console.log("Fetched roadmaps:", data);
                setAllRoadmaps(
                    data.map((item: any) => ({
                        id: item.id,
                        roadmap_name: item.roadmap_name,
                        modules: item.nodes_json.length,
                        created_at: item.nodes_json[0]?.created_at,
                        status: item.status,
                        task_id: item.task_id,
                    })) || []
                );
            } catch (err) {
                console.error("Error fetching user roadmaps:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRoadmaps();
    }, [user]);

    // Poll backend for updates while any course is in GENERATING state
    // Poll each generating course by its task_id (one interval per task)
    const pollersRef = useRef<Record<string, number | null>>({});

    // helper to refresh the full course list (reuse existing fetch logic)
    const refreshCourses = async () => {
        if (!user) return;
        try {
            const response = await fetchWithTimeout("http://localhost:8000/get_all_roadmaps", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
            });
            if (!response.ok) return;
            const data = await response.json();
            setAllRoadmaps(data);
        } catch (err) {
            console.error("Failed to refresh roadmaps:", err);
        }
    };

    const startPollingTask = (taskId: string) => {
        if (!taskId || pollersRef.current[taskId]) return; // already polling
        const id = window.setInterval(async () => {
            try {
                const res = await fetchWithTimeout(`http://localhost:8000/task-status/roadmap_outline/${taskId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                });
                if (!res.ok) {
                    console.warn("task-status returned non-ok for", taskId);
                    return;
                }
                const data = await res.json();
                console.log("data", data)
                // data expected to include status (and possibly course_id)
                if (data.status === "SUCCESS" || data.status === "COMPLETED") {
                    // refresh course list so UI shows completed/generated course
                    await refreshCourses();
                    // stop polling this task
                    if (pollersRef.current[taskId]) {
                        clearInterval(pollersRef.current[taskId] as number);
                        pollersRef.current[taskId] = null;
                    }
                } else if (data.status === "FAILURE") {
                    console.error("Task failed:", taskId, data);
                    // refresh to reflect failure state as well
                    await refreshCourses();
                    if (pollersRef.current[taskId]) {
                        clearInterval(pollersRef.current[taskId] as number);
                        pollersRef.current[taskId] = null;
                    }
                }
                // else keep polling
            } catch (err) {
                console.error("Error polling task", taskId, err);
                // on repeated errors you might clear the interval — optional
            }
        }, 3000);
        pollersRef.current[taskId] = id;
    };

    const stopPollingTask = (taskId: string) => {
        const id = pollersRef.current[taskId];
        if (id) {
            clearInterval(id);
            pollersRef.current[taskId] = null;
        }
    };

    useEffect(() => {
        if (!user) return;
        // start polling for each generating roadmap that has a task_id
        const generatingTasks = new Set(
            allRoadmaps.filter((c) => c.status === "GENERATING" && c.task_id).map((c) => c.task_id)
        );
        console.log("Generating tasks", generatingTasks)
        // start new pollers
        generatingTasks.forEach((taskId) => {
            startPollingTask(taskId);
        });

        // stop pollers for tasks that are no longer generating
        Object.keys(pollersRef.current).forEach((taskId) => {
            if (!generatingTasks.has(taskId) && pollersRef.current[taskId]) {
                stopPollingTask(taskId);
            }
        });

        return () => {
            // cleanup: clear any intervals created during this effect run
            // (we don't fully teardown all pollers here because other renders may restart them)
        };
    }, [user, allRoadmaps]);

    console.log("All roadmaps:", allRoadmaps);
    if (loading || isLoading) {
        return (
            <VStack py={20}>
                <Spinner size="xl" />
                <Text fontSize="lg" color="gray.500">
                    Loading your roadmaps...
                </Text>
            </VStack>
        );
    }

    const handleDeleteRoadmap = async (roadmapId: string) => {
        if (!user) return;
        try {
            await fetchWithTimeout(
                `http://localhost:8000/delete_roadmap/${roadmapId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${user?.token}`,
                    },
                }
            );
            setAllRoadmaps((prev) =>
                prev.filter((roadmap) => roadmap.id !== roadmapId)
            );
        } catch (err) {
            console.error("Error deleting roadmap:", err);
        }
    }
    return (
        <Box maxW="7xl" mx="auto" px={6} py={10}>
            <Heading mb={2} textAlign="center" color="brand.fg">
                Your Roadmaps
            </Heading>
            <Text textAlign="center" color="brand.fg" mb={10}>
                Explore and continue your learning journeys
            </Text>

            {allRoadmaps.length === 0 ? (
                <VStack gap={4} mt={20}>
                    <Text fontSize="lg" color="gray.500">
                        You haven’t created any roadmaps yet.
                    </Text>
                    <Button colorScheme="blue" onClick={() => (window.location.href = "/create-roadmap")}>
                        Create New Roadmap
                    </Button>
                </VStack>
            ) : (
                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6}>
                    {allRoadmaps.map((roadmap) => (
                        <Card.Root
                            key={roadmap.id}
                            bg={cardBg}
                            _hover={{ bg: cardHoverBg }}
                            shadow="md"
                            rounded="lg"
                            p={1}
                            display="flex"
                            flexDirection="column"
                            flex="1"
                            // w="100%"
                            // h="100%"
                            minH="350px"
                            borderRadius="xl"
                            onClick={() => (window.location.href = `/roadmap/${roadmap.id}`)}
                        >
                            <Card.Header>
                                <Card.Title>{roadmap.roadmap_name}</Card.Title>
                                <Card.Description>
                                    Created: {roadmap.created_at}
                                </Card.Description>
                                <Card.Description>
                                    Modules: {roadmap.modules}
                                </Card.Description>
                                <TagHandler status={roadmap.status} />

                            </Card.Header>

                            <Card.Body>

                            </Card.Body>
                            <Card.Footer>
                                <Dialog.Root>
                                    <Dialog.Trigger asChild>
                                        <Button onClick={(e) => e.stopPropagation()} variant="ghost" size="sm">
                                            <FaTrash />
                                        </Button>
                                    </Dialog.Trigger>
                                    <Portal>
                                        <Dialog.Backdrop />
                                        <Dialog.Positioner>
                                            <Dialog.Content>
                                                <Dialog.Header>
                                                    <Dialog.Title>Delete Roadmap</Dialog.Title>
                                                </Dialog.Header>
                                                <Dialog.Body>
                                                    <p>
                                                        Do you want to delete this roadmap?
                                                    </p>
                                                </Dialog.Body>
                                                <Dialog.Footer>
                                                    <Dialog.ActionTrigger asChild>
                                                        <Button onClick={(e) => { e.stopPropagation() }} variant="outline">Cancel</Button>
                                                    </Dialog.ActionTrigger>
                                                    <Button onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteRoadmap(roadmap.id);
                                                    }}>Delete</Button>
                                                </Dialog.Footer>
                                                <Dialog.CloseTrigger asChild>
                                                    <CloseButton size="sm" />
                                                </Dialog.CloseTrigger>
                                            </Dialog.Content>
                                        </Dialog.Positioner>
                                    </Portal>
                                </Dialog.Root>
                            </Card.Footer>
                        </Card.Root>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default UserRoadmaps;
