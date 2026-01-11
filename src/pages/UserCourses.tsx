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
    Badge,
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { Loader } from "../components/Loader";
import TagHandler from "../components/TagHandler";
import FilterControls from "../components/Filters.tsx";
import { formatDate } from "../utils/utils";
import { type Course } from "../types";
import {
    BookOpen,
    Plus,
    Trash2,
    Clock,
    BookMarked,
    Loader2,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    SearchX
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const UserCourses: React.FC = () => {
    const { user, loading, refreshUser } = useUser();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">("created");

    // UI Colors
    const cardBg = useColorModeValue("gray.50", "gray.950");
    const emptyBg = useColorModeValue("gray.50", "gray.900");
    const cardBorderColor = useColorModeValue("gray.200", "gray.700");

    const navigate = useNavigate();

    const sortKeysCollection = createListCollection({
        items: [
            { label: "Created Time", value: "created" },
            { label: "Number of Modules", value: "modules" },
            { label: "Progress", value: "progress" },
        ],
    });

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
    }, []);

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
                console.log("Polled task", taskId, data);

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

    // 4. Filter & Sort Logic
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
            } else if (sortKey === "modules") {
                valA = a.modules?.length || 0;
                valB = b.modules?.length || 0;
            } else {
                valA = getProgress(a);
                valB = getProgress(b);
            }

            return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
        });

    // Stats
    const totalCourses = courses.length;
    const inProgressCourses = courses.filter(c => {
        const prog = getProgress(c);
        return prog > 0 && prog < 100;
    }).length;
    const completedCourses = courses.filter(c => getProgress(c) === 100).length;

    // Check if we're showing empty state due to filters vs no courses at all
    const hasCoursesButFiltered = courses.length > 0 && filteredCourses.length === 0;
    const hasNoCourses = courses.length === 0;

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <Box maxW="7xl" mx="auto" px={{ base: 4, md: 6 }} py={8}>
                    {/* Header Section */}
                    <VStack gap={4} mb={8} align="stretch">
                        <HStack justify="space-between" align="center" flexWrap="wrap">
                            <Box>
                                <Heading size="xl" mb={1}>
                                    My Courses
                                </Heading>
                                <Text color="gray.600" _dark={{ color: "gray.400" }} fontSize="sm">
                                    Explore and continue your learning journeys
                                </Text>
                            </Box>
                            <Button
                                size="sm"
                                colorPalette="teal"
                                onClick={() => navigate("/")}
                            >
                                <Plus size={16} />
                                Create Course
                            </Button>
                        </HStack>

                        {/* Stats Cards */}
                        {totalCourses > 0 && (
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
                                        <BookMarked size={16} color="#14b8a6" />
                                        <Box>
                                            <Text fontSize="xs">Total Courses</Text>
                                            <Text fontSize="lg" fontWeight="bold">{totalCourses}</Text>
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
                                            <Text fontSize="lg" fontWeight="bold">{inProgressCourses}</Text>
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
                                            <Text fontSize="lg" fontWeight="bold">{completedCourses}</Text>
                                        </Box>
                                    </HStack>
                                </Box>
                            </HStack>
                        )}
                    </VStack>

                    {/* Controls - Show if there are any courses at all */}
                    {totalCourses > 0 && (
                        <Box mb={6}>
                            <FilterControls
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                sortKey={sortKey}
                                setSortKey={setSortKey}
                                sortAsc={sortAsc}
                                setSortAsc={setSortAsc}
                                sortKeysCollection={sortKeysCollection}
                                totalResults={totalCourses}
                                filteredResults={filteredCourses.length}
                            />
                        </Box>
                    )}

                    {/* Course Grid */}
                    {isLoading ? (
                        <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
                            gap={4}
                        >
                            {[...Array(4)].map((_, idx) => (
                                <Card.Root
                                    key={idx}
                                    bg={cardBg}
                                    borderWidth="1px"
                                    borderColor={cardBorderColor}
                                    p={4}
                                >
                                    <Skeleton height="20px" width="70%" mb={3} />
                                    <SkeletonText mt="2" noOfLines={3} gap="2" />
                                </Card.Root>
                            ))}
                        </Box>
                    ) : hasNoCourses ? (
                        // No courses at all
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
                                <BookOpen size={32} color="#14b8a6" />
                            </Box>
                            <VStack gap={1}>
                                <Text fontSize="lg" fontWeight="semibold">
                                    No courses yet
                                </Text>
                                <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.400" }}>
                                    Create your first course to get started
                                </Text>
                            </VStack>
                            <Button
                                size="sm"
                                colorPalette="teal"
                                onClick={() => navigate("/")}
                            >
                                <Plus size={16} />
                                Create Course
                            </Button>
                        </VStack>
                    ) : hasCoursesButFiltered ? (
                        // Has courses but filtered out
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
                                    No courses found
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
                        // Show courses
                        <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
                            gap={4}
                        >
                            {filteredCourses.map((course) => {
                                const isGenerating = course.status === "GENERATING";
                                const progress = getProgress(course);

                                return (
                                    <Card.Root
                                        key={course.id}
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
                                        onClick={() => !isGenerating && navigate(`/course/${course.id}`)}
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
                                                            {course.title}
                                                        </Text>
                                                        <HStack gap={2} fontSize="xs" color="gray.500">
                                                            <HStack gap={1}>
                                                                <Clock size={12} />
                                                                <Text>{formatDate(course.created_at)}</Text>
                                                            </HStack>
                                                            <Text>•</Text>
                                                            <HStack gap={1}>
                                                                <BookMarked size={12} />
                                                                <Text>{course.modules?.length || 0} modules</Text>
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
                                                    <Text fontSize="xs" color={useColorModeValue("purple.800", "purple.400")} fontStyle="italic">
                                                        AI is building your modules and curriculum...
                                                    </Text>
                                                ) : course.description ? (
                                                    <Text
                                                        fontSize="xs"
                                                        color="gray.600"
                                                        _dark={{ color: "gray.400" }}
                                                        lineClamp={3}
                                                    >
                                                        {course.description}
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
                                                                            <Dialog.Title>Delete Course</Dialog.Title>
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
                                                                                    This will permanently delete "{course.title}" and all its modules. This action cannot be undone.
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
                                                                                    e.stopPropagation()
                                                                                    handleDeleteCourse(course.id);
                                                                                }}
                                                                            >
                                                                                Delete Course
                                                                            </Button>
                                                                        </Dialog.Footer>
                                                                        <Dialog.CloseTrigger />
                                                                    </Dialog.Content>
                                                                </Dialog.Positioner>
                                                            </Portal>
                                                        </Dialog.Root>
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
            )}
        </>
    );
};

export default UserCourses;