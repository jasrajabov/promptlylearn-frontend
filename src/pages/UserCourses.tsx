import { useUser } from "../contexts/UserContext";
import fetchWithTimeout from "../utils/dbUtils";
import {
    Card,
    HStack,
    VStack,
    Heading,
    Text,
    Box,
    Skeleton,
    SkeletonText,
    Icon,
    Button,
    Progress,
    createListCollection,
    Portal,
    Dialog,
    CloseButton,
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { FaBookOpen, FaTrash } from "react-icons/fa";
import { Loader } from "../components/Loader";
import TagHandler from "../components/TagHandler";
import FilterControls from "../components/Filters.tsx";
import { formatDate } from "../utils/utils";
import { type Course } from "../types";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const UserCourses: React.FC = () => {
    const { user, loading } = useUser();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">("created");

    // UI Colors
    const headerColor = useColorModeValue("teal.700", "teal.300");
    const cardBg = useColorModeValue("white", "black:900");
    const emptyTextColor = useColorModeValue("gray.600", "gray.400");
    const cardBorderColor = useColorModeValue("teal.200", "teal.700");

    const navigate = useNavigate();

    const sortKeysCollection = createListCollection({
        items: [
            { label: "Created Time", value: "created" },
            { label: "Number of Modules", value: "modules" },
            { label: "Progress", value: "progress" },
        ],
    });

    // 1. Fetch Courses
    useEffect(() => {
        if (!user) return;
        console.log("Fetching user courses for user:", user);
        const fetchCourses = async () => {
            setIsLoading(true);
            const response = await fetchWithTimeout(`${BACKEND_URL}/course/get_all_courses`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
            });
            console.log("token", user?.token);
            const data = await response.json();
            console.log("Fetched user courses:", data);
            setCourses(data);
            setIsLoading(false);
        };
        fetchCourses();
    }, [user]);

    // 2. Polling Logic
    const pollersRef = useRef<Record<string, number | null>>({});

    const refreshCourses = async () => {
        if (!user) return;
        try {
            const response = await fetchWithTimeout(`${BACKEND_URL}/course/get_all_courses`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
            });
            if (!response.ok) return;
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            console.error("Failed to refresh courses:", err);
        }
    };

    const startPollingTask = (taskId: string) => {
        if (!taskId || pollersRef.current[taskId]) return;
        const id = window.setInterval(async () => {
            try {
                const res = await fetchWithTimeout(`${BACKEND_URL}/tasks/status/course_outline/${taskId}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                });
                if (!res.ok) return;
                const data = await res.json();

                if (data.status === "SUCCESS" || data.status === "COMPLETED") {
                    await refreshCourses();
                    if (pollersRef.current[taskId]) {
                        clearInterval(pollersRef.current[taskId] as number);
                        pollersRef.current[taskId] = null;
                    }
                } else if (data.status === "FAILURE") {
                    await refreshCourses();
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
            courses.filter((c) => c.status === "GENERATING" && c.task_id).map((c) => c.task_id)
        );

        generatingTasks.forEach((taskId) => {
            startPollingTask(taskId);
        });

        Object.keys(pollersRef.current).forEach((taskId) => {
            if (!generatingTasks.has(taskId) && pollersRef.current[taskId]) {
                stopPollingTask(taskId);
            }
        });
    }, [user, courses]);

    useEffect(() => {
        return () => {
            Object.keys(pollersRef.current).forEach((taskId) => {
                if (pollersRef.current[taskId]) {
                    clearInterval(pollersRef.current[taskId] as number);
                    pollersRef.current[taskId] = null;
                }
            });
        };
    }, []);

    const getProgress = (course: any) => {
        if (!course.modules || course.modules.length === 0) return 0;
        const completed = course.modules.filter((m: any) => m.status === "COMPLETED").length;
        return Math.round((completed / course.modules.length) * 100);
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!user) return;
        try {
            const response = await fetchWithTimeout(`${BACKEND_URL}/course/${courseId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (response.ok) {
                setCourses((prev) => prev.filter((c) => c.id !== courseId));
            }
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    }
    console.log("sortKey", sortKey, "sortAsc", sortAsc);

    // 4. Filter & Sort Logic (UPDATED)
    const filteredCourses = courses
        .filter((c) => c.title?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            // Priority: Generating items always first
            const isAGen = a.status === "GENERATING";
            const isBGen = b.status === "GENERATING";

            if (isAGen && !isBGen) return -1;
            if (!isAGen && isBGen) return 1;

            // Standard Sorting
            let valA: number | Date;
            let valB: number | Date;

            if (sortKey === "created") {
                valA = new Date(a.created_at).getTime();
                valB = new Date(b.created_at).getTime();
                console.log("Sorting by created:", valA, valB);
            } else if (sortKey === "modules") {
                valA = a.modules?.length || 0;
                valB = b.modules?.length || 0;
            } else {
                valA = getProgress(a);
                valB = getProgress(b);
            }

            return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        });

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <Box maxW="7xl" textAlign="center" mx="auto" px={6} py={10}>
                    {/* Header */}
                    <Heading mb={2} color="brand.fg">
                        My Courses
                    </Heading>
                    <Text color="brand.fg" mb={10}>
                        Explore and continue your learning journeys
                    </Text>
                    <Button borderRadius={100} variant="subtle" onClick={() => navigate("/")} colorScheme="teal" mb={6}>
                        Create New Course
                    </Button>

                    {/* Controls */}
                    <FilterControls
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortKey={sortKey}
                        setSortKey={setSortKey}
                        sortAsc={sortAsc}
                        setSortAsc={setSortAsc}
                        sortKeysCollection={sortKeysCollection}
                    />

                    {/* Course Grid */}
                    {isLoading ? (
                        <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
                            gap={6}
                            alignItems="stretch"
                            mt={8}
                        >
                            {[...Array(4)].map((_, idx) => (
                                <Card.Root
                                    key={idx}
                                    bg={cardBg}
                                    shadow="md"
                                    rounded="lg"
                                    p={4}
                                    minH="250px"
                                >
                                    <Skeleton height="20px" width="70%" mb={3} />
                                    <SkeletonText mt="2" noOfLines={3} gap="2" />
                                </Card.Root>
                            ))}
                        </Box>
                    ) : filteredCourses.length === 0 ? (
                        <VStack gap={4} py={20}>
                            <Icon as={FaBookOpen} boxSize={12} color={headerColor} />
                            <Text fontSize="lg" fontWeight="medium" color={emptyTextColor}>
                                No courses found.
                            </Text>
                        </VStack>
                    ) : (
                        <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
                            gap={6}
                            alignItems="stretch"
                            mt={8} // Added Top Margin to separate from controls
                        >
                            {filteredCourses.map((course) => {
                                const isGenerating = course.status === "GENERATING";

                                return (
                                    <Box
                                        key={course.id}
                                        cursor={isGenerating ? "wait" : "pointer"}
                                        transition="all 0.2s"
                                        _hover={{ transform: "translateY(-4px)" }}
                                        onClick={() => !isGenerating && navigate(`/course/${course.id}`)}
                                        display="flex"
                                    >
                                        <Card.Root
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
                                                <Card.Title lineClamp={2}>{course.title}</Card.Title>
                                            </Card.Header>

                                            <Card.Body flex="1" display="flex" flexDirection="column" gap={3}>
                                                {/* Logic to show simplified content if Generating */}
                                                {isGenerating ? (
                                                    <VStack align="start" justify="center" flex="1" gap={4}>
                                                        <TagHandler status={course.status} />
                                                        <Text fontSize="sm" color="gray.500" fontStyle="italic">
                                                            AI is currently building your modules and curriculum.
                                                        </Text>
                                                    </VStack>
                                                ) : (
                                                    <VStack align="start" gap={1} flex="1">
                                                        <Text fontSize="xs" color="gray.500">
                                                            Created: {formatDate(course.created_at)}
                                                        </Text>
                                                        <Text fontSize="sm" fontWeight="medium" color="gray.600">
                                                            Modules: {course.modules?.length || 0}
                                                        </Text>
                                                        <TagHandler status={course.status} />
                                                        {course.description && (
                                                            <Text fontSize="sm" color="gray.600" lineClamp={4} mt={1}>
                                                                {course.description}
                                                            </Text>
                                                        )}
                                                    </VStack>
                                                )}

                                                <Box w="100%" mt="auto" pt={4}>
                                                    <Progress.Root
                                                        value={isGenerating ? null : getProgress(course)}
                                                        size="sm"
                                                        colorScheme="teal"
                                                        borderRadius="md"
                                                        striped={isGenerating}
                                                        animated={isGenerating}
                                                    >
                                                        <Progress.Track>
                                                            {(getProgress(course) > 0 || isGenerating) && (
                                                                <Progress.Range bg="teal.500" />
                                                            )}
                                                        </Progress.Track>
                                                    </Progress.Root>
                                                    <HStack justify="space-between" mt={1}>
                                                        <Text fontSize="xs" color="gray.500">
                                                            {isGenerating ? "Processing..." : `${getProgress(course)}% completed`}
                                                        </Text>

                                                        {/* Hide Delete Button if Generating */}
                                                        {!isGenerating && (
                                                            <Dialog.Root>
                                                                <Dialog.Trigger asChild>
                                                                    <Button
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        h="24px"
                                                                    >
                                                                        <FaTrash />
                                                                    </Button>
                                                                </Dialog.Trigger>
                                                                <Portal>
                                                                    <Dialog.Backdrop />
                                                                    <Dialog.Positioner>
                                                                        <Dialog.Content>
                                                                            <Dialog.Header>
                                                                                <Dialog.Title>Delete Course</Dialog.Title>
                                                                            </Dialog.Header>
                                                                            <Dialog.Body>
                                                                                <Text>Do you want to delete this course?</Text>
                                                                            </Dialog.Body>
                                                                            <Dialog.Footer>
                                                                                <Dialog.ActionTrigger asChild>
                                                                                    <Button onClick={(e) => e.stopPropagation()} variant="outline">Cancel</Button>
                                                                                </Dialog.ActionTrigger>
                                                                                <Button
                                                                                    colorPalette="red"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        handleDeleteCourse(course.id);
                                                                                    }}
                                                                                >
                                                                                    Delete
                                                                                </Button>
                                                                            </Dialog.Footer>
                                                                            <Dialog.CloseTrigger asChild>
                                                                                <CloseButton size="sm" />
                                                                            </Dialog.CloseTrigger>
                                                                        </Dialog.Content>
                                                                    </Dialog.Positioner>
                                                                </Portal>
                                                            </Dialog.Root>
                                                        )}
                                                    </HStack>
                                                </Box>
                                            </Card.Body>
                                        </Card.Root>
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </Box >
            )}
        </>
    );
};

export default UserCourses;