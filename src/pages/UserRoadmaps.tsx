import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Heading,
    Text,
    Card,
    Button,
    Spinner,
    VStack,
    Dialog,
    Portal,
    CloseButton,
    createListCollection,
    Progress,
    HStack
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";
import { FaTrash } from "react-icons/fa";
import TagHandler from "../components/TagHandler";
import FilterControls from "../components/Filters";
import { formatDate } from "../utils/utils";
import { useNavigate } from "react-router-dom";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface Roadmap {
    id: string;
    roadmap_name: string;
    modules: number;
    created_at: string;
    status: string;
    task_id: string;
    description?: string;
    nodes_json: any[];

}

const UserRoadmaps: React.FC = () => {
    const { user, loading } = useUser();
    const [allRoadmaps, setAllRoadmaps] = React.useState<Roadmap[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">("created");


    const cardBg = useColorModeValue("white", "black:900");
    const cardHoverBg = useColorModeValue("gray.50", "gray.700");
    const cardBorderColor = useColorModeValue("teal.200", "teal.700");

    const navigate = useNavigate();

    const sortKeysCollection = createListCollection({
        items: [
            { label: "Created Time", value: "created" },
            { label: "Number of Modules", value: "modules" },
            // { label: "Progress", value: "progress" },
        ],
    });

    const updateRoadmapStatus = async (roadmapId: string, status: string) => {
        try {
            const res = await fetchWithTimeout(`${BACKEND_URL}/roadmap/${roadmapId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.token}`,
                },
                body: JSON.stringify({ status }),
            });
            if (res.ok) {
                console.log(`Roadmap ${roadmapId} status updated to ${status}`);
            }
        } catch (err) {
            console.error("Error updating roadmap status:", err);
        }
    }

    // pure helper — NO side effects
    const getProgress = (roadmap: any) => {
        if (!roadmap.nodes_json || roadmap.nodes_json.length === 0) return 0;
        const completed = roadmap.nodes_json.filter((m: any) => m.status === "COMPLETED").length;
        return Math.round((completed / roadmap.nodes_json.length) * 100);
    };

    useEffect(() => {
        const fetchRoadmaps = async () => {
            if (!user) return;
            try {
                const response = await fetchWithTimeout(
                    `${BACKEND_URL}/roadmap/get_all_roadmaps`,
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
                        created_at: formatDate(item.created_at),
                        status: item.status,
                        task_id: item.task_id,
                        description: item.description,
                        nodes_json: item.nodes_json,

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
            const response = await fetchWithTimeout(`${BACKEND_URL}/roadmap/get_all_roadmaps`, {
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
        console.log("Starting poller for task", taskId);
        const id = window.setInterval(async () => {
            try {
                const res = await fetchWithTimeout(`${BACKEND_URL}/tasks/status/roadmap_outline/${taskId}`, {
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
        console.log("Setting up pollers based on current roadmaps");
        const isGeneratingPresent = allRoadmaps.filter((c) => c.status === "GENERATING");
        console.log("Is any roadmap generating?", isGeneratingPresent);
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
                `${BACKEND_URL}/roadmap/${roadmapId}`,
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

    const filteredRoadmaps = allRoadmaps
        .filter((roadmap) =>
            roadmap.roadmap_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let compareA: any;
            let compareB: any;
            switch (sortKey) {
                case "created":
                    compareA = new Date(a.created_at).getTime();
                    compareB = new Date(b.created_at).getTime();
                    break;
                case "modules":
                    compareA = a.modules;
                    compareB = b.modules;
                    break;
                default:
                    compareA = 0;
                    compareB = 0;
            }
            if (sortAsc) {
                return compareA - compareB;
            } else {
                return compareB - compareA;
            }
        });
    return (
        <Box maxW="7xl" textAlign="center" mx="auto" px={6} py={10}>
            <Heading mb={2} color="brand.fg">
                Your Roadmaps
            </Heading>
            <Text color="brand.fg" mb={10}>
                Explore and continue your learning journeys
            </Text>
            <Button borderRadius={100} variant="subtle" onClick={() => navigate("/")} colorScheme="teal" mb={6}>
                Create a New Roadmap
            </Button>
            <FilterControls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortKey={sortKey}
                setSortKey={setSortKey}
                sortAsc={sortAsc}
                setSortAsc={setSortAsc}
                sortKeysCollection={sortKeysCollection}
            />
            {filteredRoadmaps.length === 0 ? (
                <VStack gap={4} mt={20}>
                    <Text fontSize="lg" color="gray.500">
                        You haven’t created any roadmaps yet.
                    </Text>
                </VStack>
            ) : (

                <Box display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
                    gap={6}
                    alignItems="stretch"
                    mt={8} >
                    {filteredRoadmaps.map((roadmap) => {
                        const isGenerating = roadmap.status === "GENERATING";
                        return (
                            <Box
                                key={roadmap.id}
                                cursor={isGenerating ? "wait" : "pointer"}
                                transition="all 0.2s"
                                _hover={{ transform: "translateY(-4px)" }}
                                onClick={() => !isGenerating && navigate(`/roadmap/${roadmap.id}`)}
                                display="flex"
                            >
                                <Card.Root
                                    key={roadmap.id}
                                    bg={cardBg}
                                    borderColor={isGenerating ? "teal.400" : cardBorderColor}
                                    borderWidth={isGenerating ? "2px" : "1px"}
                                    boxShadow={isGenerating ? "0 0 10px var(--chakra-colors-teal-400)" : "md"}
                                    _hover={{
                                        boxShadow: "0 0 18px var(--chakra-colors-teal-400)",
                                        borderColor: "teal.400",
                                        transform: "translateY(-2px)",
                                    }}
                                    rounded="lg"
                                    p={4}
                                    display="flex"
                                    flexDirection="column"
                                    flex="1"
                                    h="100%"
                                    minH="250px"
                                    borderRadius="xl"
                                >
                                    <Card.Header pb={2}>
                                        <Card.Title lineClamp={2}>{roadmap.roadmap_name}</Card.Title>
                                    </Card.Header>

                                    <Card.Body flex="1" display="flex" flexDirection="column" gap={3}>
                                        {isGenerating ? (
                                            <VStack align="start" justify="center" flex="1" gap={4}>
                                                <TagHandler status={roadmap.status} />
                                                <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                                    AI is currently building your modules and curriculum.
                                                </Text>
                                            </VStack>
                                        ) : (
                                            <VStack align="start" gap={1} flex="1">
                                                <Text fontSize="xs" color="gray.500">
                                                    Created: {formatDate(roadmap.created_at)}
                                                </Text>
                                                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                                    Modules: {roadmap.modules || 0}
                                                </Text>
                                                <TagHandler status={roadmap.status} />
                                                {roadmap.description && (
                                                    <Text fontSize="sm" color="gray.600" lineClamp={4} mt={1}>
                                                        {roadmap.description}
                                                    </Text>
                                                )}
                                            </VStack>
                                        )}
                                        <Box w="100%" mt="auto" pt={4}>
                                            <Progress.Root
                                                value={isGenerating ? null : getProgress(roadmap)}
                                                size="sm"
                                                colorScheme="teal"
                                                borderRadius="md"
                                                striped={isGenerating}
                                                animated={isGenerating}
                                            >
                                                <Progress.Track>
                                                    {(getProgress(roadmap) > 0 || isGenerating) && (
                                                        <Progress.Range bg="teal.500" />
                                                    )}
                                                </Progress.Track>
                                            </Progress.Root>
                                            <HStack justify="space-between" mt={1}>
                                                <Text fontSize="xs" color="gray.500">
                                                    {isGenerating ? "Processing..." : `${getProgress(roadmap)}% completed`}
                                                </Text>
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
                                            </HStack>
                                        </Box>

                                    </Card.Body>
                                </Card.Root>
                            </Box>
                        )
                    })}
                </Box>

            )
            }
        </Box>
    );
};

export default UserRoadmaps;
