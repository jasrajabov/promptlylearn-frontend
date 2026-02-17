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
import { motion } from "framer-motion";

const MotionBox = motion(Box);

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
  const [sortKey, setSortKey] = useState<"created" | "modules" | "progress">(
    "created",
  );

  const cardBg = useColorModeValue("white", "#111111");
  const emptyBg = useColorModeValue("white", "#111111");
  const cardBorderColor = useColorModeValue("#e5e7eb", "#27272a");
  const mutedText = useColorModeValue("#6b7280", "#9ca3af");
  const accentColor = useColorModeValue("#0f766e", "#14b8a6");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");

  const pollersRef = useRef<Record<string, number | null>>({});

  const navigate = useNavigate();

  const sortKeysCollection = createListCollection({
    items: [
      { label: "Created Time", value: "created" },
      { label: "Number of Modules", value: "modules" },
    ],
  });

  const getProgress = (roadmap: any) => {
    if (!roadmap.nodes_json || roadmap.nodes_json.length === 0) return 0;
    const completed = roadmap.nodes_json.filter(
      (m: any) => m.status === "COMPLETED",
    ).length;
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
          },
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
          })) || [],
        );
      } catch (err) {
        console.error("Error fetching user roadmaps:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);


  const refreshRoadmaps = async () => {
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
        },
      );
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
        const res = await fetchWithTimeout(
          `${BACKEND_URL}/tasks/status/roadmap_outline/${taskId}`,
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
      allRoadmaps
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
  }, [user, allRoadmaps]);

  const handleDeleteRoadmap = async (roadmapId: string) => {
    if (!user) return;
    try {
      await fetchWithTimeout(`${BACKEND_URL}/roadmap/${roadmapId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });
      setAllRoadmaps((prev) =>
        prev.filter((roadmap) => roadmap.id !== roadmapId),
      );
    } catch (err) {
      console.error("Error deleting roadmap:", err);
    }
  };

  const filteredRoadmaps = allRoadmaps
    .filter((roadmap) =>
      roadmap.roadmap_name.toLowerCase().includes(searchTerm.toLowerCase()),
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
  const completedRoadmaps = allRoadmaps.filter(
    (r) => getProgress(r) === 100,
  ).length;

  // Check empty states
  const hasRoadmapsButFiltered =
    allRoadmaps.length > 0 && filteredRoadmaps.length === 0;
  const hasNoRoadmaps = allRoadmaps.length === 0;

  if (loading || isLoading) {
    return (
      <Box minH="100vh" py={{ base: 8, md: 12 }}>
        <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }}>
          <VStack gap={6} align="center" py={10}>
            <Spinner size="xl" color="teal.500" />
            <Text fontSize="md" color={mutedText} fontWeight="500">
              Loading your roadmaps...
            </Text>
          </VStack>
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(340px, 1fr))"
            gap={4}
          >
            {[0, 1, 2, 3].map((i) => (
              <MotionBox
                key={i}
                h="260px"
                borderRadius="xl"
                bg={cardBg}
                borderWidth="1px"
                borderColor={cardBorderColor}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box minH="100vh" py={{ base: 8, md: 12 }}>
      <Box maxW="1400px" mx="auto" px={{ base: 4, md: 8 }}>
        {/* Header Section with entrance animation */}
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <VStack gap={6} mb={10} align="stretch">
            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
              <VStack align="start" gap={2}>
                <Heading
                  fontSize={{ base: "3xl", md: "4xl" }}
                  lineHeight={1.1}
                  fontWeight="800"
                  bgGradient={useColorModeValue(
                    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
                    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
                  )}
                  bgClip="text"
                >
                  My Learning Tracks
                </Heading>
                <Text color={mutedText} fontSize="md">
                  Track your learning paths and milestones
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
                  <Text fontWeight="700">Create Learning Track</Text>
                </HStack>
              </Button>
            </HStack>

            {/* Stats Cards */}
            {totalRoadmaps > 0 && (
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
                        {totalRoadmaps}
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
                        {inProgressRoadmaps}
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
                        {completedRoadmaps}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </HStack>
            )}
          </VStack>
        </MotionBox>

        {/* Controls - Show if there are any roadmaps at all */}
        {totalRoadmaps > 0 && (
          <Box mb={8}>
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
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
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
                <Map size={48} color="#14b8a6" />
              </Box>
              <VStack gap={2}>
                <Heading fontSize="2xl" fontWeight="800">
                  No roadmaps yet
                </Heading>
                <Text
                  fontSize="md"
                  color={mutedText}
                  textAlign="center"
                  maxW="400px"
                >
                  Create your first roadmap to get started on your learning
                  journey
                </Text>
              </VStack>
              <Button
                onClick={() => navigate("/")}
                colorPalette="teal"
                size="lg"
                borderRadius="xl"
                bg="linear-gradient(to right, #14b8a6, #06b6d4)"
                color="white"
                _hover={{
                  bg: "linear-gradient(to right, #0d9488, #0891b2)",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                mt={2}
              >
                <HStack gap={2}>
                  <Plus size={18} />
                  <Text fontWeight="700">Create Your First Track</Text>
                </HStack>
              </Button>
            </VStack>
          </MotionBox>
        ) : hasRoadmapsButFiltered ? (
          // Has roadmaps but filtered out
          <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <VStack
              gap={6}
              py={20}
              bg={emptyBg}
              borderRadius="2xl"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor={cardBorderColor}
            >
              <MotionBox
                p={5}
                bg={useColorModeValue("blue.50", "rgba(59, 130, 246, 0.1)")}
                borderRadius="2xl"
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <SearchX size={48} color="#3b82f6" />
              </MotionBox>
              <VStack gap={2}>
                <Heading fontSize="2xl" fontWeight="800">
                  No roadmaps found
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
          </MotionBox>
        ) : (
          // Show roadmaps
          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(340px, 1fr))"
            gap={4}
          >
            {filteredRoadmaps.map((roadmap, index) => {
              const isGenerating = roadmap.status === "GENERATING";
              const progress = getProgress(roadmap);

              return (
                <MotionBox
                  key={roadmap.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card.Root
                    bg={cardBg}
                    borderColor={isGenerating ? "purple.400" : cardBorderColor}
                    borderWidth="1px"
                    borderRadius="xl"
                    cursor={isGenerating ? "wait" : "pointer"}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      borderColor: isGenerating ? "purple.400" : accentColor,
                      boxShadow: isGenerating ? "none" : "0 4px 6px rgba(0,0,0,0.04), 0 12px 28px rgba(0,0,0,0.08)",
                      transform: isGenerating ? "none" : "translateY(-2px)",
                    }}
                    onClick={() =>
                      !isGenerating && navigate(`/roadmap/${roadmap.id}`)
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
                            {roadmap.roadmap_name}
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
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}><Loader2 size={10} /></motion.div>
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
                              {formatDate(roadmap.created_at)}
                            </Text>
                          </HStack>
                          <HStack gap={1.5} pl={3}>
                            <MapPin size={12} />
                            <Text whiteSpace="nowrap">
                              {roadmap.modules || 0} nodes
                            </Text>
                          </HStack>
                        </HStack>

                        {/* Description */}
                        {isGenerating ? (
                          <Box
                            p={3}
                            bg={useColorModeValue(
                              "purple.50",
                              "rgba(139, 92, 246, 0.1)",
                            )}
                            borderRadius="lg"
                            borderWidth="1px"
                            borderColor={useColorModeValue(
                              "purple.200",
                              "purple.800",
                            )}
                          >
                            <HStack gap={2}>
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ display: "flex" }}><Loader2 size={14} color="#8B5CF6" /></motion.div>
                              <Text
                                fontSize="xs"
                                color={useColorModeValue(
                                  "purple.700",
                                  "purple.400",
                                )}
                                fontWeight="600"
                              >
                                AI is building your roadmap structure...
                              </Text>
                            </HStack>
                          </Box>
                        ) : roadmap.description ? (
                          <Text
                            fontSize="sm"
                            color={mutedText}
                            lineHeight="1.6"
                            lineClamp={2}
                          >
                            {roadmap.description}
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
                            size="xs"
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
                            <Progress.Track
                              bg={useColorModeValue("#f1f5f9", "#1e1e1e")}
                            >
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
                                <Map size={12} color="#F59E0B" />
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
                                  bg: useColorModeValue(
                                    "red.50",
                                    "rgba(239, 68, 68, 0.1)",
                                  ),
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
                                      Delete Roadmap
                                    </Dialog.Title>
                                  </Dialog.Header>
                                  <Dialog.Body>
                                    <VStack align="start" gap={4}>
                                      <HStack gap={3}>
                                        <Box
                                          p={2}
                                          borderRadius="lg"
                                          bg={useColorModeValue(
                                            "red.50",
                                            "rgba(239, 68, 68, 0.1)",
                                          )}
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
                                        {roadmap.roadmap_name}" and all its
                                        nodes. This action cannot be undone.
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
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </MotionBox>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default UserRoadmaps;