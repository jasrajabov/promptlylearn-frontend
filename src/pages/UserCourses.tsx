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
    Input,
    Progress,
    createListCollection,
    Select,
    Portal,
    Dialog,
    CloseButton,
    Tag,
    Collapsible,
    Stack,
    Badge
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FaBookOpen, FaTrash } from "react-icons/fa";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { MdFilterList, MdFilterListOff } from "react-icons/md";
import { Loader } from "../components/Loader";
import TagHandler from "../components/TagHandler";


const UserCourses = () => {
    const { user, loading } = useUser();
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortAsc, setSortAsc] = useState(true);
    const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">("created");
    const [showFilters, setShowFilters] = useState(false);
    const headerColor = useColorModeValue("teal.700", "teal.300");
    const cardBg = useColorModeValue("white", "gray.900");
    const cardHoverBg = useColorModeValue("gray.50", "gray.700");
    const emptyTextColor = useColorModeValue("gray.600", "gray.400");

    const navigate = useNavigate();

    const sortKeys = createListCollection({
        items: [
            { label: "Created Time", value: "created" },
            { label: "Number of Modules", value: "modules" },
            { label: "Progress", value: "progress" },
        ],
    });

    useEffect(() => {
        if (!user) return;
        const fetchCourses = async () => {
            setIsLoading(true);
            const response = await fetchWithTimeout("http://localhost:8000/get_all_courses", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
            });
            const data = await response.json();
            console.log("Fetched user courses:", data);
            setCourses(data);
            setIsLoading(false);
        };
        fetchCourses();
    }, [user]);

    // Poll backend for updates while any course is in GENERATING state
    // Poll each generating course by its task_id (one interval per task)
    const pollersRef = useRef<Record<string, number | null>>({});

    // helper to refresh the full course list (reuse existing fetch logic)
    const refreshCourses = async () => {
        if (!user) return;
        try {
            const response = await fetchWithTimeout("http://localhost:8000/get_all_courses", {
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
        if (!taskId || pollersRef.current[taskId]) return; // already polling
        const id = window.setInterval(async () => {
            try {
                const res = await fetchWithTimeout(`http://localhost:8000/task-status/course_outline/${taskId}`, {
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
        // start polling for each generating course that has a task_id
        const generatingTasks = new Set(
            courses.filter((c) => c.status === "GENERATING" && c.task_id).map((c) => c.task_id)
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
    }, [user, courses]);

    // clear all pollers on unmount
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

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });


    const getProgress = (course: any) => {
        if (!course.modules || course.modules.length === 0) return 0;
        const completed = course.modules.filter((m: any) => m.status === "COMPLETED").length;
        return Math.round((completed / course.modules.length) * 100);
    };

    const filteredCourses = courses
        .filter((c) => c.title?.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
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

    const handleDeleteCourse = async (courseId: string) => {
        if (!user) return;
        try {
            const response = await fetchWithTimeout(`http://localhost:8000/courses/${courseId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            });
            if (response.ok) {
                setCourses((prev) => prev.filter((c) => c.id !== courseId));
            } else {
                console.error("Failed to delete course");
            }
        } catch (error) {
            console.error("Error deleting course:", error);
        }
    }

    return (
        <>
            {loading ? (
                <Loader />
            ) : (<Box maxW="7xl" mx="auto" px={6} py={10}>
                {/* Header + Controls */}
                <Heading mb={2} textAlign="center" color="brand.fg">
                    My Courses
                </Heading>
                <Text textAlign="center" color="brand.fg" mb={10}>
                    Explore and continue your learning journeys
                </Text>
                {/* <Button textAlign="center" variant="ghost" onClick={() => navigate("/")}>
                    <IoAddOutline />
                    Create Course
                </Button> */}


                {/* Search + Sort */}
                <Collapsible.Root>
                    <Collapsible.Trigger paddingY="3">
                        <HStack gap={2} align="center" justify="space-between" w="100%">

                            <Button variant="ghost" onClick={() => setShowFilters(!showFilters)}>
                                {showFilters ? <MdFilterListOff /> : <MdFilterList />}
                            </Button>
                        </HStack>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                        <HStack gap={2} mb={2} flexWrap="wrap">

                            <Button variant="ghost" size="sm" onClick={() => setSortAsc(!sortAsc)} colorScheme="teal">
                                {sortAsc ? <FaSortAmountUp /> : <FaSortAmountDown />}
                            </Button>
                            <Select.Root collection={sortKeys} onValueChange={(val: any) => setSortKey(val as any)} maxW="200px">
                                <Select.Trigger>
                                    <Select.ValueText placeholder="Sort by..." />
                                </Select.Trigger>
                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {sortKeys.items.map((sk) => (
                                                <Select.Item item={sk} key={sk.value}>
                                                    {sk.label}
                                                    <Select.ItemIndicator />
                                                </Select.Item>
                                            ))}
                                        </Select.Content>
                                    </Select.Positioner>
                                </Portal>
                            </Select.Root>
                            <Input
                                placeholder="Search by course title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                maxW="70%"
                            />
                        </HStack>

                    </Collapsible.Content>
                </Collapsible.Root>

                {/* Loading */}
                {
                    isLoading ? (
                        <Box
                            display="grid"
                            gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))"
                            gap={6}
                            alignItems="stretch"
                        >
                            {[...Array(4)].map((_, idx) => (
                                <Card.Root
                                    key={idx}
                                    bg={cardBg}
                                    shadow="md"
                                    rounded="lg"
                                    p={4}
                                    display="flex"
                                    flexDirection="column"
                                    minH="250px"
                                >
                                    <Skeleton height="20px" width="70%" mb={3} />
                                    <SkeletonText mt="2" noOfLines={3} gap="2" />
                                    <Skeleton height="16px" width="50%" mt={3} />
                                    <Skeleton height="10px" width="100%" mt={4} />
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
                        >
                            {filteredCourses.map((course) => (
                                <Box
                                    key={course.id}
                                    cursor="pointer"
                                    transition="all 0.2s"
                                    _hover={{ transform: "translateY(-4px)" }}
                                    onClick={() => navigate(`/course/${course.id}`)}
                                    display="flex"
                                    marginTop={10}
                                >
                                    <Card.Root
                                        bg={cardBg}
                                        _hover={{ bg: cardHoverBg }}
                                        shadow="md"
                                        rounded="lg"
                                        p={4}
                                        display="flex"
                                        flexDirection="column"
                                        flex="1"
                                        minH="250px"
                                        minW="300px"
                                        borderRadius="xl"
                                    >
                                        <Card.Header>
                                            <Card.Title>{course.title}</Card.Title>
                                        </Card.Header>
                                        <Card.Body flex="1" display="flex" flexDirection="column">
                                            <VStack align="start" gap={2} flex="1">
                                                <Text fontSize="sm" color="gray.500">
                                                    Created: {formatDate(course.created_at)}
                                                </Text>
                                                <Text fontSize="sm" color="gray.500">
                                                    Modules: {course.modules?.length || 0}
                                                </Text>
                                                <TagHandler status={course.status} />
                                                {course.description && (
                                                    <Text fontSize="sm" color="gray.600" lineClamp={2}>
                                                        {course.description}
                                                    </Text>
                                                )}
                                                <Box w="100%" mt="auto">
                                                    <Progress.Root
                                                        value={getProgress(course)}
                                                        size="sm"
                                                        colorScheme="teal"
                                                        borderRadius="md"
                                                    >
                                                        <Progress.Track>
                                                            {getProgress(course) > 0 && (
                                                                <Progress.Range bg="teal.500" />
                                                            )}
                                                        </Progress.Track>
                                                    </Progress.Root>
                                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                                        {getProgress(course)}% completed
                                                    </Text>
                                                </Box>
                                                <Dialog.Root>
                                                    <Dialog.Trigger asChild>
                                                        <Button onClick={(e) => e.stopPropagation()} variant="outline" size="sm">
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
                                                                    <p>
                                                                        Do you want to delete this course?
                                                                    </p>
                                                                </Dialog.Body>
                                                                <Dialog.Footer>
                                                                    <Dialog.ActionTrigger asChild>
                                                                        <Button onClick={(e) => { e.stopPropagation() }} variant="outline">Cancel</Button>
                                                                    </Dialog.ActionTrigger>
                                                                    <Button onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDeleteCourse(course.id);
                                                                    }}>Delete</Button>
                                                                </Dialog.Footer>
                                                                <Dialog.CloseTrigger asChild>
                                                                    <CloseButton size="sm" />
                                                                </Dialog.CloseTrigger>
                                                            </Dialog.Content>
                                                        </Dialog.Positioner>
                                                    </Portal>
                                                </Dialog.Root>
                                            </VStack>
                                        </Card.Body>
                                    </Card.Root>
                                </Box>
                            ))}

                        </Box>
                    )
                }
            </Box >)}
        </>
    );
};

export default UserCourses;
