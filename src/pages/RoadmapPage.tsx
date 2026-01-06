import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
    Background,
    Controls,
    type Node,
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
    Card,
    Button,
    IconButton,
} from "@chakra-ui/react";
import { Stats } from "../components/Stats";
import dagre from "dagre";
import { useUser } from "../contexts/UserContext";
import { RoadmapNode } from "../components/RoadmapNode";
import { getTypeColor } from "../components/constants";
import { useColorModeValue } from "../components/ui/color-mode";
import {
    ArrowLeft,
    Filter,
    CheckCircle,
    MapPin,
    Target,
    X,
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

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
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
    const [label, setLabel] = useState<string>("");
    const [roadmapNodeTypes, setRoadmapNodeTypes] = useState<Set<string>>(new Set());
    const [allNodes, setAllNodes] = useState<Node[]>([]);
    const [allEdges, setAllEdges] = useState<Edge[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(true);
    const [loading, setLoading] = useState(true);
    const { id } = useParams<{ id: string }>();
    const { user } = useUser();
    const navigate = useNavigate();

    const cardBg = useColorModeValue("gray.50", "gray.900");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const selectedBg = useColorModeValue("teal.100", "teal.700");

    const progressPercentage = useMemo(() => {
        if (allNodes.length === 0) return 0;
        const completedNodes = allNodes.filter((n) => n.data?.status === "COMPLETED").length;
        return Math.round((completedNodes / allNodes.length) * 100);
    }, [allNodes]);

    const totalNodes = allNodes.length;
    const completedNodes = allNodes.filter((n) => n.data?.status === "COMPLETED").length;
    const remainingNodes = totalNodes - completedNodes;

    const updateNodeStatus = useCallback(
        (nodeId: string, status: string) => {
            setAllNodes((prev) =>
                prev.map((n) =>
                    n.id === nodeId
                        ? { ...n, data: { ...n.data, status } }
                        : n
                )
            );
        },
        []
    );

    const nodeTypes = useMemo(
        () => ({
            custom: (props: NodeProps<any>) => (
                <RoadmapNode
                    {...props}
                    onStatusChange={updateNodeStatus}
                />
            ),
        }),
        [updateNodeStatus]
    );

    const visibleNodes = useMemo(() => {
        if (!selectedTypes || selectedTypes.size === 0) return allNodes;
        return allNodes.filter((n) => selectedTypes.has((n.data?.type ?? "").toString()));
    }, [allNodes, selectedTypes]);

    const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((n) => n.id)), [visibleNodes]);

    const layoutNodes = useCallback((n: Node[], e: Edge[]) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(n, e);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, []);

    const getEdgeColor = (edge: Edge, nodesMap: Map<string, Node>) => {
        const sourceNode = nodesMap.get(edge.source);
        if (!sourceNode) return "#CBD5E0";
        return sourceNode.data?.status === "COMPLETED" ? "#38B2AC" : "#CBD5E0";
    };

    const visibleEdges = useMemo(() => {
        const nodesMap = new Map(visibleNodes.map(n => [n.id, n]));
        return allEdges
            .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
            .map(e => ({
                ...e,
                style: { stroke: getEdgeColor(e, nodesMap), strokeWidth: 3 },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: getEdgeColor(e, nodesMap),
                },
            }));
    }, [allEdges, visibleNodes, visibleNodeIds]);

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
                setRoadmapNodeTypes(new Set(data.nodes_json.map((node) => node.type ?? "")));

                const mappedNodes: Node[] = data.nodes_json.map((node) => ({
                    id: node.node_id,
                    type: "custom",
                    data: {
                        label: node.label,
                        description: node.description,
                        type: node.type,
                        roadmapId: id || "",
                        roadmapNodeId: node.node_id,
                        courseId: node.course_id || "",
                        status: node.status
                    },
                    position: { x: 0, y: 0 },
                }));

                const mappedEdges: Edge[] = data.edges_json.map((edge) => {
                    const sourceNode = data.nodes_json.find(n => n.node_id === edge.source);
                    const isSourceCompleted = sourceNode?.status === "COMPLETED";

                    return {
                        id: `${edge.source}-${edge.target}`,
                        source: edge.source,
                        target: edge.target,
                        style: {
                            stroke: "gray:500",
                            strokeWidth: 3,
                            strokeDasharray: 0,
                        },
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            color: isSourceCompleted ? "#38B2AC" : "#CBD5E0",
                        },
                    };
                });

                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(mappedNodes, mappedEdges);
                setNodes(layoutedNodes);
                setEdges(layoutedEdges);
                setAllNodes(layoutedNodes);
                setAllEdges(layoutedEdges);
            } catch (err) {
                console.error("Error fetching roadmap:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchRoadmap();
    }, [id, user, layoutNodes]);

    if (loading)
        return (
            <Center h="80vh">
                <VStack gap={3}>
                    <Spinner size="xl" color="teal.500" />
                    <Text fontSize="sm" color="gray.500">Loading roadmap...</Text>
                </VStack>
            </Center>
        );

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
        <Box w="100%" h="100vh" display="flex" flexDirection="column" overflow="hidden">
            {/* Header */}
            <Box
                bg={cardBg}
                borderBottomWidth="1px"
                borderColor={borderColor}
                px={{ base: 3, md: 6 }}
                py={{ base: 3, md: 4 }}
            >
                <VStack align="stretch" gap={{ base: 2, md: 3 }}>
                    {/* Top Row */}
                    <HStack justify="space-between" align="start" flexWrap={{ base: "wrap", md: "nowrap" }}>
                        <HStack gap={{ base: 2, md: 3 }} flex="1">
                            <IconButton
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate("/my-roadmaps")}
                                aria-label="Back to roadmaps"
                            >
                                <ArrowLeft size={18} />
                            </IconButton>
                            <VStack align="start" gap={0} flex="1">
                                <Heading size={{ base: "md", md: "lg" }} lineClamp={1}>{label}</Heading>
                                <HStack gap={2} fontSize="xs" color="gray.500" flexWrap="wrap">
                                    <HStack gap={1}>
                                        <MapPin size={12} />
                                        <Text>{totalNodes} nodes</Text>
                                    </HStack>
                                    <Text display={{ base: "none", sm: "block" }}>•</Text>
                                    <HStack gap={1}>
                                        <Target size={12} />
                                        <Text>{completedNodes} completed</Text>
                                    </HStack>
                                </HStack>
                            </VStack>
                        </HStack>

                        {/* Progress Card */}
                        <Card.Root
                            size="sm"
                            bg={cardBg}
                            borderWidth="1px"
                            borderColor={borderColor}
                            display={{ base: "none", sm: "block" }}
                        >
                            <Card.Body p={3}>
                                <HStack gap={3}>
                                    <Box
                                        w={12}
                                        h={12}
                                        borderRadius="full"
                                        bg="teal.50"
                                        _dark={{ bg: "teal.900/20" }}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                    >
                                        <Text fontSize="lg" fontWeight="bold" color="teal.600">
                                            {progressPercentage}%
                                        </Text>
                                    </Box>
                                    <VStack align="start" gap={0} display={{ base: "none", md: "flex" }}>
                                        <Text fontSize="sm" fontWeight="semibold">
                                            Progress
                                        </Text>
                                        <Text fontSize="xs" color="gray.600">
                                            {remainingNodes} remaining
                                        </Text>
                                    </VStack>
                                </HStack>
                            </Card.Body>
                        </Card.Root>

                        {/* Mobile Progress Badge */}
                        <Badge
                            display={{ base: "flex", sm: "none" }}
                            colorPalette="teal"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                            alignItems="center"
                            gap={1}
                        >
                            <CheckCircle size={12} />
                            <Text>{progressPercentage}%</Text>
                        </Badge>
                    </HStack>

                    {/* Filter Section */}
                    <Box>
                        <HStack justify="space-between" mb={2}>
                            <HStack gap={2}>
                                <Filter size={14} />
                                <Text fontSize="xs" fontWeight="medium" color="gray.600">
                                    Filter by type
                                </Text>
                                {hasActiveFilters && (
                                    <Badge color="teal" fontSize="xs" px={2} py={0.5}>
                                        {selectedTypes.size}
                                    </Badge>
                                )}
                            </HStack>
                            {hasActiveFilters && (
                                <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={clearFilters}
                                    colorPalette="gray"
                                >
                                    <X size={12} />
                                    <Text display={{ base: "none", sm: "inline" }} ml={1}>Clear</Text>
                                </Button>
                            )}
                        </HStack>

                        <HStack gap={2} wrap="wrap" maxH={{ base: "80px", md: "none" }} overflowY={{ base: "auto", md: "visible" }}>
                            {Array.from(roadmapNodeTypes).map((type) => {
                                const isSelected = selectedTypes.has(type);
                                const typeCount = allNodes.filter(n => n.data?.type === type).length;
                                const completedCount = allNodes.filter(
                                    n => n.data?.type === type && n.data?.status === "COMPLETED"
                                ).length;

                                return (
                                    <Badge
                                        key={type}
                                        px={{ base: 2, md: 3 }}
                                        py={{ base: 1, md: 1.5 }}
                                        fontSize="xs"
                                        borderRadius="md"
                                        cursor="pointer"
                                        variant="solid"
                                        transition="all 0.15s ease"
                                        bg={isSelected ? selectedBg : getTypeColor(type)}
                                        color="white"
                                        _hover={{ opacity: 0.85 }}
                                        onClick={() => toggleType(type)}
                                        display="flex"
                                        alignItems="center"
                                        gap={1}
                                        flexShrink={0}
                                    >
                                        <Text whiteSpace="nowrap">{type}</Text>
                                        <Text opacity={0.8} display={{ base: "none", sm: "block" }}>
                                            ({completedCount}/{typeCount})
                                        </Text>
                                        {isSelected && <CheckCircle size={12} />}
                                    </Badge>
                                );
                            })}
                        </HStack>
                    </Box>
                </VStack>
            </Box>

            {/* ReactFlow Canvas */}
            <Box flex="1" position="relative">
                <ReactFlow
                    nodes={visibleNodes}
                    edges={visibleEdges}
                    nodeTypes={nodeTypes}
                    defaultEdgeOptions={defaultEdgeOptions}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                >
                    <Background color="#ccc" gap={18} />
                    <Controls />
                </ReactFlow>

                {/* Active Filters Indicator */}
                {hasActiveFilters && (
                    <Box
                        position="absolute"
                        bottom={{ base: 2, md: 4 }}
                        left={{ base: 2, md: 4 }}
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="lg"
                        px={{ base: 2, md: 3 }}
                        py={{ base: 1.5, md: 2 }}
                        shadow="md"
                    >
                        <HStack gap={2} fontSize="xs">
                            <Filter size={12} color="#14b8a6" />
                            <Text fontWeight="medium">
                                <Text as="span" display={{ base: "none", sm: "inline" }}>Showing </Text>
                                {visibleNodes.length}/{totalNodes}
                            </Text>
                        </HStack>
                    </Box>
                )}
            </Box>
        </Box>
    );
}