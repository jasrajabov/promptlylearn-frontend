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
    HStack,
    Badge,
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";
import { formatDate } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import {
    Map,
    Plus,
    Trash2,
    Clock,
    MapPin,
    Loader2,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    SearchX,
} from "lucide-react";
import FilterControls from "../components/Filters";

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
    const { user, loading, refreshUser } = useUser();
    const [allRoadmaps, setAllRoadmaps] = React.useState<Roadmap[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">("created");

    const cardBg = useColorModeValue("white", "gray.950");
    const emptyBg = useColorModeValue("gray.50", "gray.900");
    const cardBorderColor = useColorModeValue("gray.200", "gray.700");

    const navigate = useNavigate();

    const sortKeysCollection = createListCollection({
        items: [
            { label: "Created Time", value: "created" },
            { label: "Number of Modules", value: "modules" },
        ],
    });

    const getProgress = (roadmap: any) => {
        if (!roadmap.nodes_json || roadmap.nodes_json.length === 0) return 0;
        const completed = roadmap.nodes_json.filter((m: any) => m.status === "COMPLETED").length;
        return Math.round((completed / roadmap.nodes_json.length) * 100);
    };

    useEffect(() => {
        const init = async () => {
            if (!loading && !user) {
                navigate("/login");
                return;
            }
            await refreshUser();
        };
        init();
    }, []);

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
                            Authorization: `Bearer ${user?.token}`,
                        },
                    }
                );
                const data = await response.json();
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
    }, []);

    const pollersRef = useRef<Record<string, number | null>>({});

    const refreshRoadmaps = async () => {
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
        if (!taskId || pollersRef.current[taskId]) return;
        const id = window.setInterval(async () => {
            try {
                const res = await fetchWithTimeout(`${BACKEND_URL}/tasks/status/roadmap_outline/${taskId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                });
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === "SUCCESS" || data.status === "COMPLETED") {
                    await refreshRoadmaps();
                    if (pollersRef.current[taskId]) {
                        clearInterval(pollersRef.current[taskId] as number);
                        pollersRef.current[taskId] = null;
                    }
                } else if (data.status === "FAILURE") {
                    await refreshRoadmaps();
                    if (pollersRef.current[taskId]) {
                        clearInterval(pollersRef.current[taskId] as number);
                        pollersRef.current[taskId] = null;
                    }
                }
            } catch (err) {
                console.error("Error polling task", taskId, err);
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
        const generatingTasks = new Set(
            allRoadmaps.filter((c) => c.status === "GENERATING" && c.task_id).map((c) => c.task_id)
        );

        generatingTasks.forEach((taskId) => {
            startPollingTask(taskId);
        });

        Object.keys(pollersRef.current).forEach((taskId) => {
            if (!generatingTasks.has(taskId) && pollersRef.current[taskId]) {
                stopPollingTask(taskId);
            }
        });
    }, [user, allRoadmaps]);

    const handleDeleteRoadmap = async (roadmapId: string) => {
        if (!user) return;
        try {
            await fetchWithTimeout(
                `${BACKEND_URL}/roadmap/${roadmapId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                }
            );
            setAllRoadmaps((prev) =>
                prev.filter((roadmap) => roadmap.id !== roadmapId)
            );
        } catch (err) {
            console.error("Error deleting roadmap:", err);
        }
    };

    const filteredRoadmaps = allRoadmaps
        .filter((roadmap) =>
            roadmap.roadmap_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Priority: Generating items always first
            const isAGen = a.status === "GENERATING";
            const isBGen = b.status === "GENERATING";

            if (isAGen && !isBGen) return -1;
            if (!isAGen && isBGen) return 1;

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

    // Stats
    const totalRoadmaps = allRoadmaps.length;
    const inProgressRoadmaps = allRoadmaps.filter((r) => {
        const prog = getProgress(r);
        return prog > 0 && prog < 100;
    }).length;
    const completedRoadmaps = allRoadmaps.filter((r) => getProgress(r) === 100).length;

    // Check empty states
    const hasRoadmapsButFiltered = allRoadmaps.length > 0 && filteredRoadmaps.length === 0;
    const hasNoRoadmaps = allRoadmaps.length === 0;

    if (loading || isLoading) {
        return (
            <VStack py={20}>
                <Spinner size="xl" color="teal.500" />
                <Text fontSize="lg" color="gray.500">
                    Loading your roadmaps...
                </Text>
            </VStack>
        );
    }

    return (
        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} py={8}>
            {/* Header Section */}
            <VStack gap={4} mb={8} align="stretch">
                <HStack justify="space-between" align="center" flexWrap="wrap">
                    <Box>
                        <Heading size="xl" mb={1}>
                            My Tracks
                        </Heading>
                        <Text color="gray.600" _dark={{ color: "gray.400" }} fontSize="sm">
                            Track your learning paths and milestones
                        </Text>
                    </Box>
                    <Button
                        size="sm"
                        colorPalette="teal"
                        onClick={() => navigate("/")}
                    >
                        <Plus size={16} />
                        Create Roadmap
                    </Button>
                </HStack>

                {/* Stats Cards */}
                {totalRoadmaps > 0 && (
                    <HStack gap={3} flexWrap="wrap">
                        <Box
                            flex="1"
                            minW="150px"
                            bg={cardBg}
                            p={3}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={cardBorderColor}
                        >
                            <HStack gap={2}>
                                <Map size={16} color="#14b8a6" />
                                <Box>
                                    <Text fontSize="xs" >Total Tracks</Text>
                                    <Text fontSize="lg" fontWeight="bold">{totalRoadmaps}</Text>
                                </Box>
                            </HStack>
                        </Box>
                        <Box
                            flex="1"
                            minW="150px"
                            bg={cardBg}
                            p={3}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={cardBorderColor}
                        >
                            <HStack gap={2}>
                                <TrendingUp size={16} color="#14b8a6" />
                                <Box>
                                    <Text fontSize="xs" >In Progress</Text>
                                    <Text fontSize="lg" fontWeight="bold">{inProgressRoadmaps}</Text>
                                </Box>
                            </HStack>
                        </Box>
                        <Box
                            flex="1"
                            minW="150px"
                            bg={cardBg}
                            p={3}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={cardBorderColor}
                        >
                            <HStack gap={2}>
                                <CheckCircle size={16} color="#14b8a6" />
                                <Box>
                                    <Text fontSize="xs" >Completed</Text>
                                    <Text fontSize="lg" fontWeight="bold">{completedRoadmaps}</Text>
                                </Box>
                            </HStack>
                        </Box>
                    </HStack>
                )}
            </VStack>

            {/* Controls - Show if there are any roadmaps at all */}
            {totalRoadmaps > 0 && (
                <Box mb={6}>
                    <FilterControls
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortKey={sortKey}
                        setSortKey={setSortKey}
                        sortAsc={sortAsc}
                        setSortAsc={setSortAsc}
                        sortKeysCollection={sortKeysCollection}
                        totalResults={totalRoadmaps}
                        filteredResults={filteredRoadmaps.length}
                    />
                </Box>
            )}

            {/* Roadmaps Grid */}
            {hasNoRoadmaps ? (
                // No roadmaps at all
                <VStack
                    gap={4}
                    py={16}
                    bg={emptyBg}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={cardBorderColor}
                >
                    <Box
                        w={16}
                        h={16}
                        bg="teal.50"
                        _dark={{ bg: "teal.900/20" }}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <Map size={32} color="#14b8a6" />
                    </Box>
                    <VStack gap={1}>
                        <Text fontSize="lg" fontWeight="semibold">
                            No roadmaps yet
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                            Create your first roadmap to get started
                        </Text>
                    </VStack>
                    <Button
                        size="sm"
                        colorPalette="teal"
                        onClick={() => navigate("/")}
                    >
                        <Plus size={16} />
                        Create Roadmap
                    </Button>
                </VStack>
            ) : hasRoadmapsButFiltered ? (
                // Has roadmaps but filtered out
                <VStack
                    gap={4}
                    py={16}
                    bg={emptyBg}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={cardBorderColor}
                >
                    <Box
                        w={16}
                        h={16}
                        bg="blue.50"
                        _dark={{ bg: "blue.900/20" }}
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                    >
                        <SearchX size={32} color="#3b82f6" />
                    </Box>
                    <VStack gap={1}>
                        <Text fontSize="lg" fontWeight="semibold">
                            No roadmaps found
                        </Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                            Try adjusting your search term "{searchTerm}"
                        </Text>
                    </VStack>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSearchTerm("")}
                    >
                        Clear Search
                    </Button>
                </VStack>
            ) : (
                // Show roadmaps
                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                    gap={4}
                >
                    {filteredRoadmaps.map((roadmap) => {
                        const isGenerating = roadmap.status === "GENERATING";
                        const progress = getProgress(roadmap);

                        return (
                            <Card.Root
                                key={roadmap.id}
                                bg={cardBg}
                                borderColor={isGenerating ? "teal.400" : cardBorderColor}
                                borderWidth={isGenerating ? "2px" : "1px"}
                                cursor={isGenerating ? "wait" : "pointer"}
                                transition="all 0.2s"
                                _hover={{
                                    borderColor: "teal.400",
                                    shadow: "lg",
                                    transform: isGenerating ? "none" : "translateY(-2px)",
                                }}
                                onClick={() => !isGenerating && navigate(`/roadmap/${roadmap.id}`)}
                                position="relative"
                                overflow="hidden"
                            >
                                {/* Generating Pulse Effect */}
                                {isGenerating && (
                                    <Box
                                        position="absolute"
                                        top={0}
                                        left={0}
                                        right={0}
                                        h="3px"
                                        bg="teal.400"
                                        animation="pulse 2s ease-in-out infinite"
                                    />
                                )}

                                <Card.Body p={5}>
                                    <VStack align="stretch" gap={3}>
                                        {/* Header */}
                                        <HStack justify="space-between" align="start">
                                            <VStack align="start" gap={1} flex={1}>
                                                <Text
                                                    fontSize="md"
                                                    fontWeight="semibold"
                                                    lineClamp={2}
                                                >
                                                    {roadmap.roadmap_name}
                                                </Text>
                                                <HStack gap={2} fontSize="xs" color="gray.500">
                                                    <HStack gap={1}>
                                                        <Clock size={12} />
                                                        <Text>{formatDate(roadmap.created_at)}</Text>
                                                    </HStack>
                                                    <Text>•</Text>
                                                    <HStack gap={1}>
                                                        <MapPin size={12} />
                                                        <Text>{roadmap.modules || 0} nodes</Text>
                                                    </HStack>
                                                </HStack>
                                            </VStack>

                                            {isGenerating ? (
                                                <Badge colorPalette="teal" fontSize="xs" px={2} py={1}>
                                                    <HStack gap={1}>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        <Text>Building</Text>
                                                    </HStack>
                                                </Badge>
                                            ) : progress === 100 ? (
                                                <Badge colorPalette="green" fontSize="xs" px={2} py={1}>
                                                    <HStack gap={1}>
                                                        <CheckCircle size={12} />
                                                        <Text>Done</Text>
                                                    </HStack>
                                                </Badge>
                                            ) : progress > 0 ? (
                                                <Badge colorPalette="blue" fontSize="xs" px={2} py={1}>
                                                    <HStack gap={1}>
                                                        <TrendingUp size={12} />
                                                        <Text>{progress}%</Text>
                                                    </HStack>
                                                </Badge>
                                            ) : null}
                                        </HStack>

                                        {/* Description */}
                                        {isGenerating ? (
                                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                                                AI is building your roadmap structure...
                                            </Text>
                                        ) : roadmap.description ? (
                                            <Text
                                                fontSize="xs"
                                                color="gray.600"
                                                _dark={{ color: "gray.400" }}
                                                lineClamp={3}
                                            >
                                                {roadmap.description}
                                            </Text>
                                        ) : null}

                                        {/* Progress Bar */}
                                        <Box>
                                            <Progress.Root
                                                value={isGenerating ? null : progress}
                                                size="sm"
                                                colorPalette="teal"
                                                borderRadius="full"
                                                striped={isGenerating}
                                                animated={isGenerating}
                                            >
                                                <Progress.Track>
                                                    <Progress.Range />
                                                </Progress.Track>
                                            </Progress.Root>

                                            <HStack justify="space-between" mt={2}>
                                                <Text fontSize="xs" color="gray.500">
                                                    {isGenerating ? "Processing..." : `${progress}% completed`}
                                                </Text>

                                                {!isGenerating && (
                                                    <Dialog.Root>
                                                        <Dialog.Trigger asChild>
                                                            <Button
                                                                onClick={(e) => e.stopPropagation()}
                                                                variant="ghost"
                                                                size="xs"
                                                                colorPalette="red"
                                                            >
                                                                <Trash2 size={14} />
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
                                                                        <VStack align="start" gap={3}>
                                                                            <HStack gap={2}>
                                                                                <AlertCircle size={20} color="#ef4444" />
                                                                                <Text fontWeight="semibold">
                                                                                    Are you sure?
                                                                                </Text>
                                                                            </HStack>
                                                                            <Text fontSize="sm" color="gray.600">
                                                                                This will permanently delete "{roadmap.roadmap_name}" and all its nodes. This action cannot be undone.
                                                                            </Text>
                                                                        </VStack>
                                                                    </Dialog.Body>
                                                                    <Dialog.Footer>
                                                                        <Dialog.ActionTrigger asChild>
                                                                            <Button
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                variant="outline"
                                                                                size="sm"
                                                                            >
                                                                                Cancel
                                                                            </Button>
                                                                        </Dialog.ActionTrigger>
                                                                        <Button
                                                                            colorPalette="red"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteRoadmap(roadmap.id);
                                                                            }}
                                                                        >
                                                                            Delete Roadmap
                                                                        </Button>
                                                                    </Dialog.Footer>
                                                                    <Dialog.CloseTrigger />
                                                                </Dialog.Content>
                                                            </Dialog.Positioner>
                                                        </Portal>
                                                    </Dialog.Root>
                                                )}
                                            </HStack>
                                        </Box>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default UserRoadmaps;