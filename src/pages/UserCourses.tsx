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
    Button,
    Progress,
    createListCollection,
    Portal,
    Dialog,
    Badge,
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";
import { Loader } from "../components/Loader";
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
    SearchX,
    Map,
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const UserCourses: React.FC = () => {
    const { user, loading, refreshUser } = useUser();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(false);
    const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">(
        "created",
    );

    // UI Colors - ALL useColorModeValue calls at the top (CRITICAL for hooks rules)
    const cardBg = useColorModeValue("white", "gray.950");
    const emptyBg = useColorModeValue("white", "gray.900");
    const cardBorderColor = useColorModeValue("gray.200", "gray.700");
    const mutedText = useColorModeValue("gray.600", "gray.400");
    const accentColor = useColorModeValue("teal.600", "teal.400");
    const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
    const gradientText = useColorModeValue(
        "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
        "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
    );
    const purpleBg = useColorModeValue("purple.50", "rgba(139, 92, 246, 0.1)");
    const purpleBorder = useColorModeValue("purple.200", "purple.800");
    const purpleText = useColorModeValue("purple.700", "purple.400");
    const blueBg = useColorModeValue("blue.50", "rgba(59, 130, 246, 0.1)");
    const redBg = useColorModeValue("red.50", "rgba(239, 68, 68, 0.1)");
    const grayTrack = useColorModeValue("gray.100", "gray.800");

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

        const fetchCourses = async () => {
            setIsLoading(true);
            const response = await fetchWithTimeout(
                `${BACKEND_URL}/course/get_all_courses`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                },
            );
            const data = await response.json();
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
            const response = await fetchWithTimeout(
                `${BACKEND_URL}/course/get_all_courses`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                },
            );
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
                const res = await fetchWithTimeout(
                    `${BACKEND_URL}/tasks/status/course_outline/${taskId}`,
                    {
                        method: "GET",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${user?.token}`,
                        },
                    },
                );
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
            courses
                .filter((c) => c.status === "GENERATING" && c.task_id)
                .map((c) => c.task_id),
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
        const completed = course.modules.filter(
            (m: any) => m.status === "COMPLETED",
        ).length;
        return Math.round((completed / course.modules.length) * 100);
    };

    const handleDeleteCourse = async (courseId: string) => {
        if (!user) return;
        try {
            const response = await fetchWithTimeout(
                `${BACKEND_URL}/course/${courseId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user.token}`,
                    },
                },
            );
            if (response.ok) {
                setCourses((prev) => prev.filter((c) => c.id !== courseId));
            }
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    };

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

            return sortAsc
                ? (valA as number) - (valB as number)
                : (valB as number) - (valA as number);
        });

    // Stats
    const totalCourses = courses.length;
    const inProgressCourses = courses.filter((c) => {
        const prog = getProgress(c);
        return prog > 0 && prog < 100;
    }).length;
    const completedCourses = courses.filter((c) => getProgress(c) === 100).length;

    // Check if we're showing empty state due to filters vs no courses at all
    const hasCoursesButFiltered =
        courses.length > 0 && filteredCourses.length === 0;
    const hasNoCourses = courses.length === 0;

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <Box minH="100vh" py={{ base: 8, md: 12 }}>
                    <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }}>
                        {/* Header Section */}
                        <VStack gap={6} mb={10} align="stretch">
                            <HStack justify="space-between" align="start" flexWrap="wrap">
                                <VStack align="start" gap={2}>
                                    <Heading
                                        fontSize={{ base: "3xl", md: "4xl" }}
                                        lineHeight={1.1}
                                        fontWeight="800"
                                        bgGradient={gradientText}
                                        bgClip="text"
                                    >
                                        My Courses
                                    </Heading>
                                    <Text color={mutedText} fontSize="md">
                                        Continue your learning journey
                                    </Text>
                                </VStack>
                                <Button
                                    size="md"
                                    colorPalette="teal"
                                    onClick={() => navigate("/")}
                                    borderRadius="xl"
                                    px={6}
                                    height="48px"
                                    bg="linear-gradient(to right, #14b8a6, #06b6d4)"
                                    color="white"
                                    _hover={{
                                        bg: "linear-gradient(to right, #0d9488, #0891b2)",
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 8px 24px rgba(20, 184, 166, 0.25)",
                                    }}
                                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                >
                                    <HStack gap={2}>
                                        <Plus size={18} />
                                        <Text fontWeight="700">Create Course</Text>
                                    </HStack>
                                </Button>
                            </HStack>

                            {/* Stats Cards */}
                            {totalCourses > 0 && (
                                <HStack gap={3} flexWrap="wrap">
                                    <Box
                                        flex="1"
                                        minW="160px"
                                        bg={cardBg}
                                        p={3.5}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={cardBorderColor}
                                        borderTop="2px solid"
                                        borderTopColor="#14b8a6"
                                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                        _hover={{ borderColor: accentColor }}
                                    >
                                        <HStack gap={2.5}>
                                            <Box p={2} borderRadius="lg" bg={highlightBg}>
                                                <Map size={20} color="#14b8a6" />
                                            </Box>
                                            <VStack align="start" gap={0}>
                                                <Text
                                                    fontSize="2xs"
                                                    color={mutedText}
                                                    fontWeight="600"
                                                    textTransform="uppercase"
                                                    letterSpacing="wide"
                                                >
                                                    Total
                                                </Text>
                                                <Text fontSize="lg" fontWeight="800">
                                                    {totalCourses}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                    <Box
                                        flex="1"
                                        minW="160px"
                                        bg={cardBg}
                                        p={3.5}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={cardBorderColor}
                                        borderTop="2px solid"
                                        borderTopColor="#3b82f6"
                                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                        _hover={{ borderColor: accentColor }}
                                    >
                                        <HStack gap={2.5}>
                                            <Box p={2} borderRadius="lg" bg={highlightBg}>
                                                <TrendingUp size={20} color="#3B82F6" />
                                            </Box>
                                            <VStack align="start" gap={0}>
                                                <Text
                                                    fontSize="2xs"
                                                    color={mutedText}
                                                    fontWeight="600"
                                                    textTransform="uppercase"
                                                    letterSpacing="wide"
                                                >
                                                    In Progress
                                                </Text>
                                                <Text fontSize="lg" fontWeight="800">
                                                    {inProgressCourses}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                    <Box
                                        flex="1"
                                        minW="160px"
                                        bg={cardBg}
                                        p={3.5}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={cardBorderColor}
                                        borderTop="2px solid"
                                        borderTopColor="#10b981"
                                        transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                                        _hover={{ borderColor: accentColor }}
                                    >
                                        <HStack gap={2.5}>
                                            <Box p={2} borderRadius="lg" bg={highlightBg}>
                                                <CheckCircle size={20} color="#10B981" />
                                            </Box>
                                            <VStack align="start" gap={0}>
                                                <Text
                                                    fontSize="2xs"
                                                    color={mutedText}
                                                    fontWeight="600"
                                                    textTransform="uppercase"
                                                    letterSpacing="wide"
                                                >
                                                    Completed
                                                </Text>
                                                <Text fontSize="lg" fontWeight="800">
                                                    {completedCourses}
                                                </Text>
                                            </VStack>
                                        </HStack>
                                    </Box>
                                </HStack>
                            )}
                        </VStack>

                        {/* Controls - Show if there are any courses at all */}
                        {totalCourses > 0 && (
                            <Box mb={8}>
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
                                gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))"
                                gap={4}
                            >
                                {[...Array(4)].map((_, idx) => (
                                    <Card.Root
                                        key={idx}
                                        bg={cardBg}
                                        borderWidth="1px"
                                        borderColor={cardBorderColor}
                                        borderRadius="xl"
                                        p={5}
                                    >
                                        <Skeleton
                                            height="20px"
                                            width="70%"
                                            mb={3}
                                            borderRadius="md"
                                        />
                                        <SkeletonText mt="2" noOfLines={3} gap="2" />
                                    </Card.Root>
                                ))}
                            </Box>
                        ) : hasNoCourses ? (
                            // No courses at all
                            <VStack
                                gap={6}
                                py={20}
                                bg={emptyBg}
                                borderRadius="2xl"
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor={cardBorderColor}
                            >
                                <Box p={5} bg={highlightBg} borderRadius="2xl">
                                    <BookOpen size={48} color="#14b8a6" />
                                </Box>
                                <VStack gap={2}>
                                    <Heading fontSize="2xl" fontWeight="800">
                                        No courses yet
                                    </Heading>
                                    <Text
                                        fontSize="md"
                                        color={mutedText}
                                        textAlign="center"
                                        maxW="400px"
                                    >
                                        Create your first course to get started on your learning
                                        journey
                                    </Text>
                                </VStack>
                            </VStack>
                        ) : hasCoursesButFiltered ? (
                            // Has courses but filtered out
                            <VStack
                                gap={6}
                                py={20}
                                bg={emptyBg}
                                borderRadius="2xl"
                                borderWidth="1px"
                                borderStyle="dashed"
                                borderColor={cardBorderColor}
                            >
                                <Box
                                    p={5}
                                    bg={blueBg}
                                    borderRadius="2xl"
                                >
                                    <SearchX size={48} color="#3b82f6" />
                                </Box>
                                <VStack gap={2}>
                                    <Heading fontSize="2xl" fontWeight="800">
                                        No courses found
                                    </Heading>
                                    <Text fontSize="md" color={mutedText}>
                                        Try adjusting your search term "{searchTerm}"
                                    </Text>
                                </VStack>
                                <Button
                                    size="md"
                                    variant="outline"
                                    onClick={() => setSearchTerm("")}
                                    borderRadius="xl"
                                    borderWidth="1.5px"
                                >
                                    Clear Search
                                </Button>
                            </VStack>
                        ) : (
                            // Show courses
                            <Box
                                display="grid"
                                gridTemplateColumns="repeat(auto-fill, minmax(340px, 1fr))"
                                gap={4}
                            >
                                {filteredCourses.map((course) => {
                                    const isGenerating = course.status === "GENERATING";
                                    const progress = getProgress(course);

                                    return (
                                        <Card.Root
                                            key={course.id}
                                            bg={cardBg}
                                            borderColor={
                                                isGenerating ? "purple.400" : cardBorderColor
                                            }
                                            borderWidth="1px"
                                            borderRadius="xl"
                                            cursor={isGenerating ? "wait" : "pointer"}
                                            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                                            _hover={{
                                                borderColor: isGenerating ? "purple.400" : accentColor,
                                                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                                                transform: isGenerating ? "none" : "translateY(-4px)",
                                            }}
                                            onClick={() =>
                                                !isGenerating && navigate(`/course/${course.id}`)
                                            }
                                            position="relative"
                                            overflow="hidden"
                                        >
                                            {/* Top colored bar for status */}
                                            <Box
                                                h="3px"
                                                bg={
                                                    isGenerating
                                                        ? "linear-gradient(to right, #a855f7, #ec4899)"
                                                        : progress === 100
                                                            ? "linear-gradient(to right, #22c55e, #10b981)"
                                                            : progress > 0
                                                                ? "linear-gradient(to right, #3b82f6, #06b6d4)"
                                                                : "linear-gradient(to right, #f97316, #f59e0b)"
                                                }
                                                boxShadow={
                                                    isGenerating
                                                        ? "0 1px 8px rgba(168, 85, 247, 0.4)"
                                                        : progress === 100
                                                            ? "0 1px 8px rgba(16, 185, 129, 0.3)"
                                                            : progress > 0
                                                                ? "0 1px 8px rgba(59, 130, 246, 0.3)"
                                                                : "0 1px 8px rgba(249, 115, 22, 0.3)"
                                                }
                                            />

                                            <Card.Body p={6}>
                                                <VStack align="stretch" gap={4}>
                                                    {/* Header with title and badge */}
                                                    <HStack justify="space-between" align="start" gap={3}>
                                                        <Heading
                                                            fontSize="lg"
                                                            fontWeight="700"
                                                            lineHeight="1.4"
                                                            lineClamp={2}
                                                            flex={1}
                                                        >
                                                            {course.title}
                                                        </Heading>

                                                        {/* Status Badge */}
                                                        {isGenerating ? (
                                                            <Badge
                                                                colorPalette="purple"
                                                                fontSize="2xs"
                                                                px={2.5}
                                                                py={1}
                                                                borderRadius="md"
                                                                textTransform="uppercase"
                                                                letterSpacing="wide"
                                                                fontWeight="700"
                                                                flexShrink={0}
                                                            >
                                                                <HStack gap={1}>
                                                                    <Loader2 size={10} className="animate-spin" />
                                                                    <Text>Building</Text>
                                                                </HStack>
                                                            </Badge>
                                                        ) : progress === 100 ? (
                                                            <Badge
                                                                colorPalette="green"
                                                                fontSize="2xs"
                                                                px={2.5}
                                                                py={1}
                                                                borderRadius="md"
                                                                textTransform="uppercase"
                                                                letterSpacing="wide"
                                                                fontWeight="700"
                                                                flexShrink={0}
                                                                variant="solid"
                                                            >
                                                                <HStack gap={1}>
                                                                    <CheckCircle size={10} />
                                                                    <Text>Done</Text>
                                                                </HStack>
                                                            </Badge>
                                                        ) : progress > 0 ? (
                                                            <Badge
                                                                colorPalette="blue"
                                                                fontSize="2xs"
                                                                px={2.5}
                                                                py={1}
                                                                borderRadius="md"
                                                                fontWeight="700"
                                                                flexShrink={0}
                                                                variant="solid"
                                                            >
                                                                In Progress
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                colorPalette="orange"
                                                                fontSize="2xs"
                                                                px={2.5}
                                                                py={1}
                                                                borderRadius="md"
                                                                textTransform="uppercase"
                                                                letterSpacing="wide"
                                                                fontWeight="700"
                                                                flexShrink={0}
                                                                variant="solid"
                                                            >
                                                                New
                                                            </Badge>
                                                        )}
                                                    </HStack>

                                                    {/* Metadata */}
                                                    <HStack
                                                        gap={3}
                                                        fontSize="xs"
                                                        color={mutedText}
                                                        fontWeight="500"
                                                        divideX="1px"
                                                        divideColor={cardBorderColor}
                                                    >
                                                        <HStack gap={1.5}>
                                                            <Clock size={12} />
                                                            <Text whiteSpace="nowrap">
                                                                {formatDate(course.created_at)}
                                                            </Text>
                                                        </HStack>
                                                        <HStack gap={1.5} pl={3}>
                                                            <BookMarked size={12} />
                                                            <Text whiteSpace="nowrap">
                                                                {course.modules?.length || 0} modules
                                                            </Text>
                                                        </HStack>
                                                    </HStack>

                                                    {/* Description */}
                                                    {isGenerating ? (
                                                        <Box
                                                            p={3}
                                                            bg={purpleBg}
                                                            borderRadius="lg"
                                                            borderWidth="1px"
                                                            borderColor={purpleBorder}
                                                        >
                                                            <HStack gap={2}>
                                                                <Loader2
                                                                    size={14}
                                                                    className="animate-spin"
                                                                    color="#8B5CF6"
                                                                />
                                                                <Text
                                                                    fontSize="xs"
                                                                    color={purpleText}
                                                                    fontWeight="600"
                                                                >
                                                                    AI is building your curriculum...
                                                                </Text>
                                                            </HStack>
                                                        </Box>
                                                    ) : course.description ? (
                                                        <Text
                                                            fontSize="sm"
                                                            color={mutedText}
                                                            lineHeight="1.6"
                                                            lineClamp={2}
                                                        >
                                                            {course.description}
                                                        </Text>
                                                    ) : (
                                                        <Text
                                                            fontSize="sm"
                                                            color={mutedText}
                                                            fontStyle="italic"
                                                            lineHeight="1.6"
                                                        >
                                                            No description available
                                                        </Text>
                                                    )}

                                                    {/* Progress Section */}
                                                    <Box pt={2}>
                                                        <HStack justify="space-between" mb={2}>
                                                            <Text
                                                                fontSize="2xs"
                                                                color={mutedText}
                                                                fontWeight="600"
                                                                textTransform="uppercase"
                                                                letterSpacing="wide"
                                                            >
                                                                {isGenerating ? "Processing" : "Progress"}
                                                            </Text>
                                                            <Text
                                                                fontSize="xs"
                                                                fontWeight="700"
                                                                color={
                                                                    isGenerating
                                                                        ? "purple.500"
                                                                        : progress === 100
                                                                            ? "green.500"
                                                                            : progress > 0
                                                                                ? "blue.500"
                                                                                : "orange.500"
                                                                }
                                                            >
                                                                {isGenerating ? "..." : `${progress}%`}
                                                            </Text>
                                                        </HStack>

                                                        <Progress.Root
                                                            value={isGenerating ? null : progress}
                                                            size="sm"
                                                            colorPalette={
                                                                isGenerating
                                                                    ? "purple"
                                                                    : progress === 100
                                                                        ? "green"
                                                                        : progress > 0
                                                                            ? "blue"
                                                                            : "orange"
                                                            }
                                                            borderRadius="full"
                                                            striped={isGenerating}
                                                            animated={isGenerating}
                                                        >
                                                            <Progress.Track bg={grayTrack}>
                                                                <Progress.Range />
                                                            </Progress.Track>
                                                        </Progress.Root>
                                                    </Box>

                                                    {/* Footer Actions */}
                                                    <HStack
                                                        justify="space-between"
                                                        pt={2}
                                                        borderTop="1px"
                                                        borderColor={cardBorderColor}
                                                    >
                                                        <HStack gap={2} fontSize="xs" color={mutedText}>
                                                            {progress === 100 ? (
                                                                <HStack gap={1}>
                                                                    <CheckCircle size={12} color="#10B981" />
                                                                    <Text fontWeight="600">Complete</Text>
                                                                </HStack>
                                                            ) : progress > 0 ? (
                                                                <HStack gap={1}>
                                                                    <TrendingUp size={12} color="#3B82F6" />
                                                                    <Text fontWeight="600">In Progress</Text>
                                                                </HStack>
                                                            ) : (
                                                                <HStack gap={1}>
                                                                    <BookOpen size={12} color="#F59E0B" />
                                                                    <Text fontWeight="600">Not Started</Text>
                                                                </HStack>
                                                            )}
                                                        </HStack>

                                                        <Dialog.Root>
                                                            <Dialog.Trigger asChild>
                                                                <Button
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    variant="ghost"
                                                                    size="xs"
                                                                    colorPalette="red"
                                                                    borderRadius="lg"
                                                                    px={2}
                                                                    _hover={{
                                                                        bg: redBg,
                                                                    }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </Button>
                                                            </Dialog.Trigger>
                                                            <Portal>
                                                                <Dialog.Backdrop />
                                                                <Dialog.Positioner>
                                                                    <Dialog.Content
                                                                        borderRadius="2xl"
                                                                        maxW="500px"
                                                                    >
                                                                        <Dialog.Header>
                                                                            <Dialog.Title fontWeight="800">
                                                                                Delete Course
                                                                            </Dialog.Title>
                                                                        </Dialog.Header>
                                                                        <Dialog.Body>
                                                                            <VStack align="start" gap={4}>
                                                                                <HStack gap={3}>
                                                                                    <Box
                                                                                        p={2}
                                                                                        borderRadius="lg"
                                                                                        bg={redBg}
                                                                                    >
                                                                                        <AlertCircle
                                                                                            size={24}
                                                                                            color="#ef4444"
                                                                                        />
                                                                                    </Box>
                                                                                    <Text fontWeight="700" fontSize="lg">
                                                                                        Are you sure?
                                                                                    </Text>
                                                                                </HStack>
                                                                                <Text
                                                                                    fontSize="sm"
                                                                                    color={mutedText}
                                                                                    lineHeight="1.6"
                                                                                >
                                                                                    This will permanently delete "
                                                                                    {course.title}" and all its modules.
                                                                                    This action cannot be undone.
                                                                                </Text>
                                                                            </VStack>
                                                                        </Dialog.Body>
                                                                        <Dialog.Footer gap={3}>
                                                                            <Dialog.ActionTrigger asChild>
                                                                                <Button
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                    variant="outline"
                                                                                    size="md"
                                                                                    borderRadius="xl"
                                                                                    borderWidth="1.5px"
                                                                                >
                                                                                    Cancel
                                                                                </Button>
                                                                            </Dialog.ActionTrigger>
                                                                            <Button
                                                                                colorPalette="red"
                                                                                size="md"
                                                                                borderRadius="xl"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
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
                                                </VStack>
                                            </Card.Body>
                                        </Card.Root>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </Box>
            )}
        </>
    );
};

export default UserCourses;