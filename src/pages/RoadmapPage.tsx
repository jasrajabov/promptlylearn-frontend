import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  type Node as FlowNode,
  type Edge,
  MarkerType,
  type DefaultEdgeOptions,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Box,
  Spinner,
  Center,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  IconButton,
  Drawer,
  Portal,
} from "@chakra-ui/react";
import { Stats } from "../components/Stats";
import dagre from "dagre";
import { useUser } from "../contexts/UserContext";
import { RoadmapNode } from "../components/RoadmapNode";
import { getTypeColor } from "../components/constants";
import { useColorModeValue } from "../components/ui/color-mode";
import {
  Filter,
  CheckCircle,
  X,
  Map as MapIcon,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ListFilter,
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// --- INTERFACE DEFINITIONS ---

interface RoadmapNodeResponse {
  node_id: string;
  label: string;
  description?: string;
  type?: string;
  order_index?: number;
  course_id?: string;
  status?: string;
}

interface RoadmapData {
  roadmap_name: string;
  nodes_json: RoadmapNodeResponse[];
  edges_json: { source: string; target: string }[];
}

// --- CONSTANTS ---

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
  style: { stroke: "#44444", strokeWidth: 2 },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#3182CE",
  },
};

const NODE_WIDTH = 300;
const NODE_HEIGHT = 110;

const getLayoutedElements = (nodes: FlowNode[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: "TB",
    ranksep: 180,
    nodesep: 80,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// --- MAIN COMPONENT ---

export default function TrackRoadmap(): React.ReactElement {
  // 1. All useState hooks first
  const [label, setLabel] = useState<string>("");
  const [roadmapNodeTypes, setRoadmapNodeTypes] = useState<Set<string>>(
    new Set(),
  );
  const [allNodes, setAllNodes] = useState<FlowNode[]>([]);
  const [allEdges, setAllEdges] = useState<Edge[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // 2. All useContext hooks (useParams, useUser)
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();

  // 3. ALL useColorModeValue hooks together (BEFORE any useMemo/useCallback)
  const pageBg = useColorModeValue("#fafbfc", "#0a0b0d");
  const cardBg = useColorModeValue("white", "#1a1b1e");
  const borderColor = useColorModeValue("#e5e7eb", "#27272a");
  const mutedText = useColorModeValue("#6b7280", "#9ca3af");
  const headingColor = useColorModeValue("#111827", "#f9fafb");
  const accentColor = useColorModeValue("#0f766e", "#14b8a6");
  const hoverBg = useColorModeValue("#f3f4f6", "#27272a");
  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );
  const backgroundPatternColor = useColorModeValue("#e5e7eb", "#27272a");
  const drawerBg = useColorModeValue("white", "#1a1b1e");
  const overlayBg = useColorModeValue("blackAlpha.300", "blackAlpha.500");

  // 4. useMemo hooks
  const progressPercentage = useMemo(() => {
    if (allNodes.length === 0) return 0;
    const completedNodes = allNodes.filter(
      (n) => n.data?.status === "COMPLETED",
    ).length;
    return Math.round((completedNodes / allNodes.length) * 100);
  }, [allNodes]);

  const totalNodes = allNodes.length;
  const completedNodes = allNodes.filter(
    (n) => n.data?.status === "COMPLETED",
  ).length;

  // 5. useCallback hooks
  const updateNodeStatus = useCallback((nodeId: string, status: string) => {
    setAllNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, status } } : n,
      ),
    );
  }, []);

  const getEdgeColor = useCallback(
    (edge: Edge, nodesMap: Map<string, FlowNode>) => {
      const sourceNode = nodesMap.get(edge.source);
      if (!sourceNode) return "#CBD5E0";
      return sourceNode.data?.status === "COMPLETED" ? "#14b8a6" : "#d1d5db";
    },
    [],
  );

  // 6. More useMemo hooks that depend on callbacks
  const nodeTypes = useMemo(
    () => ({
      custom: (props: NodeProps<any>) => (
        <RoadmapNode {...props} onStatusChange={updateNodeStatus} />
      ),
    }),
    [updateNodeStatus],
  );

  const visibleNodes = useMemo(() => {
    if (!selectedTypes || selectedTypes.size === 0) return allNodes;
    return allNodes.filter((n) =>
      selectedTypes.has((n.data?.type ?? "").toString()),
    );
  }, [allNodes, selectedTypes]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(() => {
    const nodesMap = new Map(visibleNodes.map((n) => [n.id, n]));
    return allEdges
      .filter(
        (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
      )
      .map((e) => ({
        ...e,
        style: { stroke: getEdgeColor(e, nodesMap), strokeWidth: 3 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(e, nodesMap),
        },
      }));
  }, [allEdges, visibleNodes, visibleNodeIds, getEdgeColor]);

  // 7. useEffect hooks last
  useEffect(() => {
    if (!user) return;

    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BACKEND_URL}/roadmap/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        });
        const data: RoadmapData = await response.json();
        setLabel(data.roadmap_name || "Roadmap");
        setRoadmapNodeTypes(
          new Set(data.nodes_json.map((node) => node.type ?? "")),
        );

        const mappedNodes: FlowNode[] = data.nodes_json.map((node) => ({
          id: node.node_id,
          type: "custom",
          data: {
            roadmapName: data.roadmap_name,
            label: node.label,
            description: node.description,
            type: node.type,
            roadmapId: id || "",
            roadmapNodeId: node.node_id,
            courseId: node.course_id || "",
            status: node.status,
          },
          position: { x: 0, y: 0 },
        }));

        const mappedEdges: Edge[] = data.edges_json.map((edge) => {
          const sourceNode = data.nodes_json.find(
            (n) => n.node_id === edge.source,
          );
          const isSourceCompleted = sourceNode?.status === "COMPLETED";

          return {
            id: `${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            style: {
              stroke: isSourceCompleted ? "#14b8a6" : "#d1d5db",
              strokeWidth: 3,
              strokeDasharray: 0,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isSourceCompleted ? "#14b8a6" : "#d1d5db",
            },
          };
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } =
          getLayoutedElements(mappedNodes, mappedEdges);
        setAllNodes(layoutedNodes);
        setAllEdges(layoutedEdges);
      } catch (err) {
        console.error("Error fetching roadmap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [id, user]);

  // Loading state
  if (loading)
    return (
      <Center h="100vh" bg={pageBg}>
        <VStack gap={4}>
          <Spinner size="xl" color="teal.500" />
          <Text fontSize="md" color={mutedText} fontWeight="500">
            Loading your roadmap...
          </Text>
        </VStack>
      </Center>
    );

  // Helper functions
  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedTypes(new Set());
  };

  const hasActiveFilters = selectedTypes.size > 0;

  return (
    <Box w="100%" h="100vh" display="flex" flexDirection="column" bg={pageBg}>
      {/* Compact Mobile-First Header */}
      <Box
        borderBottomWidth="1px"
        borderColor={borderColor}
        bg={cardBg}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <VStack align="stretch" gap={0} p={{ base: 3, md: 4 }}>
          {/* Top Row: Icon + Title + Stats Toggle (Mobile) / Stats (Desktop) */}
          <HStack justify="space-between" align="center" gap={3}>
            {/* Left: Icon + Title */}
            <HStack gap={2} flex={1} minW={0}>
              <Box
                p={{ base: 1.5, md: 2 }}
                borderRadius="lg"
                bg={useColorModeValue("teal.50", "teal.900/20")}
                flexShrink={0}
              >
                <MapIcon
                  size={window.innerWidth < 768 ? 20 : 24}
                  className="text-teal-600"
                />
              </Box>
              <VStack align="start" gap={0} flex={1} minW={0}>
                <Text
                  fontSize={{ base: "xs", md: "sm" }}
                  fontWeight="medium"
                  color={mutedText}
                  display={{ base: "none", sm: "block" }}
                >
                  Learning Track
                </Text>
                <Heading
                  fontSize={{ base: "lg", sm: "xl", md: "2xl" }}
                  fontWeight="800"
                  bgGradient={gradientText}
                  bgClip="text"
                  lineHeight="1.2"
                  letterSpacing="-0.02em"

                >
                  {label}
                </Heading>
              </VStack>
            </HStack>

            {/* Right: Stats (Desktop) / Stats Toggle Button (Mobile) */}
            <Box display={{ base: "none", lg: "block" }} flexShrink={0}>
              <Stats
                stats={[
                  { label: "Track Progress", progress: progressPercentage },
                ]}
              />
            </Box>

            {/* Mobile: Quick Stats Display */}
            <HStack
              gap={2}
              display={{ base: "flex", lg: "none" }}
              flexShrink={0}
            >
              <VStack gap={0} align="end">
                <HStack gap={1}>
                  <TrendingUp size={14} color={accentColor} />
                  <Text fontSize="lg" fontWeight="bold" color={headingColor}>
                    {progressPercentage}%
                  </Text>
                </HStack>
                <Text fontSize="2xs" color={mutedText}>
                  {completedNodes}/{totalNodes}
                </Text>
              </VStack>
              <IconButton
                aria-label="Toggle stats"
                size="sm"
                variant="ghost"
                onClick={() => setShowMobileStats(!showMobileStats)}
                color={mutedText}
              >
                <ChevronDown
                  size={16}
                  style={{
                    transform: showMobileStats ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.2s",
                  }}
                />
              </IconButton>
            </HStack>
          </HStack>

          {/* Mobile Stats Expansion */}
          {showMobileStats && (
            <Box
              mt={3}
              pt={3}
              borderTopWidth="1px"
              borderColor={borderColor}
              display={{ base: "block", lg: "none" }}
            >
              <Stats
                stats={[
                  { label: "Track Progress", progress: progressPercentage },
                ]}
              />
            </Box>
          )}

          {/* Filter Row */}
          <HStack
            justify="space-between"
            align="center"
            mt={3}
            pt={3}
            borderTopWidth="1px"
            borderColor={borderColor}
          >
            {/* Desktop: Inline Filter Button */}
            <Button
              size={{ base: "sm", md: "md" }}
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              borderRadius="lg"
              px={{ base: 3, md: 4 }}
              fontWeight="600"
              _hover={{ bg: hoverBg }}
              borderColor={borderColor}
              display={{ base: "none", md: "flex" }}
            >
              <Filter size={16} style={{ marginRight: "8px" }} />
              Filter by Type
              {hasActiveFilters && (
                <Badge colorPalette="teal" size="sm" variant="solid" ml={2}>
                  {selectedTypes.size}
                </Badge>
              )}
              <Box
                ml={2}
                transform={showFilters ? "rotate(90deg)" : "rotate(0deg)"}
                transition="transform 0.2s"
              >
                <ChevronRight size={16} />
              </Box>
            </Button>

            {/* Mobile: Drawer Filter Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFilterDrawerOpen(true)}
              borderRadius="lg"
              px={3}
              fontWeight="600"
              _hover={{ bg: hoverBg }}
              borderColor={borderColor}
              display={{ base: "flex", md: "none" }}
              flex={1}
            >
              <ListFilter size={16} style={{ marginRight: "8px" }} />
              Filters
              {hasActiveFilters && (
                <Badge colorPalette="teal" size="sm" variant="solid" ml={2}>
                  {selectedTypes.size}
                </Badge>
              )}
            </Button>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearFilters}
                colorPalette="gray"
                display={{ base: "flex", md: "flex" }}
              >
                <X size={14} style={{ marginRight: "4px" }} />
                <Text display={{ base: "none", sm: "inline" }}>Clear</Text>
              </Button>
            )}
          </HStack>

          {/* Desktop: Collapsible Filter Pills */}
          {showFilters && (
            <Box
              mt={3}
              pt={3}
              borderTopWidth="1px"
              borderColor={borderColor}
              display={{ base: "none", md: "block" }}
            >
              <HStack gap={2} wrap="wrap">
                {Array.from(roadmapNodeTypes).map((type) => {
                  const isSelected = selectedTypes.has(type);
                  const typeCount = allNodes.filter(
                    (n) => n.data?.type === type,
                  ).length;
                  const completedCount = allNodes.filter(
                    (n) =>
                      n.data?.type === type && n.data?.status === "COMPLETED",
                  ).length;

                  return (
                    <Button
                      key={type}
                      size="sm"
                      onClick={() => toggleType(type)}
                      variant={isSelected ? "solid" : "outline"}
                      colorPalette={isSelected ? "teal" : "gray"}
                      bg={isSelected ? getTypeColor(type) : "transparent"}
                      borderRadius="full"
                      px={3}
                      fontWeight="600"
                      fontSize="xs"
                      _hover={{
                        transform: "translateY(-1px)",
                      }}
                      transition="all 0.2s"
                    >
                      {type} ({completedCount}/{typeCount})
                      {isSelected && (
                        <CheckCircle size={12} style={{ marginLeft: "4px" }} />
                      )}
                    </Button>
                  );
                })}
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>

      {/* Canvas Area - Takes remaining space */}
      <Box flex="1" position="relative" overflow="hidden">
        <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color={backgroundPatternColor} gap={16} />
          <Controls />
        </ReactFlow>

        {/* Floating Filter Indicator */}
        {hasActiveFilters && (
          <Box
            position="absolute"
            bottom={{ base: 3, md: 4 }}
            left={{ base: 3, md: 4 }}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            px={{ base: 3, md: 4 }}
            py={2}
            boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
          >
            <HStack gap={2}>
              <Filter size={14} color={accentColor} />
              <Text fontSize="sm" fontWeight="600" color={headingColor}>
                {visibleNodes.length} of {totalNodes} nodes
              </Text>
            </HStack>
          </Box>
        )}
      </Box>

      {/* Mobile Filter Drawer */}
      <Portal>
        <Drawer.Root
          open={isFilterDrawerOpen}
          onOpenChange={(e) => setIsFilterDrawerOpen(e.open)}
          placement="bottom"
        >
          <Drawer.Backdrop bg={overlayBg} />
          <Drawer.Positioner>
            <Drawer.Content
              bg={drawerBg}
              borderTopRadius="xl"
              maxH="80vh"
              pb="env(safe-area-inset-bottom)"
            >
              <Drawer.Header borderBottomWidth="1px" borderColor={borderColor}>
                <HStack justify="space-between" w="full">
                  <Drawer.Title
                    fontSize="lg"
                    fontWeight="bold"
                    color={headingColor}
                  >
                    Filter by Type
                  </Drawer.Title>
                  <Drawer.CloseTrigger asChild>
                    <IconButton
                      aria-label="Close"
                      size="sm"
                      variant="ghost"
                      color={mutedText}
                    >
                      <X size={18} />
                    </IconButton>
                  </Drawer.CloseTrigger>
                </HStack>
              </Drawer.Header>

              <Drawer.Body p={4}>
                <VStack align="stretch" gap={3}>
                  {Array.from(roadmapNodeTypes).map((type) => {
                    const isSelected = selectedTypes.has(type);
                    const typeCount = allNodes.filter(
                      (n) => n.data?.type === type,
                    ).length;
                    const completedCount = allNodes.filter(
                      (n) =>
                        n.data?.type === type && n.data?.status === "COMPLETED",
                    ).length;

                    return (
                      <Button
                        key={type}
                        size="lg"
                        onClick={() => toggleType(type)}
                        variant={isSelected ? "solid" : "outline"}
                        colorPalette={isSelected ? "teal" : "gray"}
                        bg={isSelected ? getTypeColor(type) : "transparent"}
                        borderRadius="xl"
                        px={4}
                        py={6}
                        fontWeight="600"
                        fontSize="md"
                        justifyContent="space-between"
                        _active={{ transform: "scale(0.98)" }}
                        transition="all 0.2s"
                      >
                        <HStack gap={3}>
                          {isSelected && <CheckCircle size={18} />}
                          <Text>{type}</Text>
                        </HStack>
                        <Badge colorPalette="gray" size="md" variant="subtle">
                          {completedCount}/{typeCount}
                        </Badge>
                      </Button>
                    );
                  })}
                </VStack>

                {hasActiveFilters && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      clearFilters();
                      setIsFilterDrawerOpen(false);
                    }}
                    colorPalette="red"
                    mt={4}
                    w="full"
                  >
                    <X size={18} style={{ marginRight: "8px" }} />
                    Clear All Filters
                  </Button>
                )}
              </Drawer.Body>
            </Drawer.Content>
          </Drawer.Positioner>
        </Drawer.Root>
      </Portal>
    </Box>
  );
}