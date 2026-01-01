import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
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
    Collapsible,
    Accordion,

} from "@chakra-ui/react";
import { Stats } from "../components/Stats";
import { MdOutlineExpandMore, MdOutlineExpandLess } from "react-icons/md";

import dagre from "dagre";
import { useUser } from "../contexts/UserContext";
import { RoadmapNode } from "../components/RoadmapNode";
import { getTypeColor } from "../components/constants";
import { useColorModeValue } from "../components/ui/color-mode";
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
    nodes_json: RoadmapNodeResponse[]; // Renamed for clarity with your data
    edges_json: { source: string; target: string }[]; // Renamed for clarity with your data
}

// --- CONSTANTS ---

const defaultEdgeOptions: DefaultEdgeOptions = {
    type: "smoothstep",
    animated: false,
    style: { stroke: "#44444", strokeWidth: 2 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#3182CE", // Visible blue color
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
    // keep both the full (layouted) set and the filtered view
    const [allNodes, setAllNodes] = useState<Node[]>([]);
    const [allEdges, setAllEdges] = useState<Edge[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [showDescAndFilter, setShowDescAndFilter] = useState(true);
    const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const { id } = useParams<{ id: string }>();
    const { user } = useUser();

    const progressPercentage = useMemo(() => {
        if (allNodes.length === 0) return 0;
        const completedNodes = allNodes.filter((n) => n.data?.status === "COMPLETED").length;
        return Math.round((completedNodes / allNodes.length) * 100);
    }, [allNodes]);


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
    // Memoized layout function
    const layoutNodes = useCallback((n: Node[], e: Edge[]) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(n, e);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, []);

    const getEdgeColor = (edge: Edge, nodesMap: Map<string, Node>) => {
        const sourceNode = nodesMap.get(edge.source);
        if (!sourceNode) return "#CBD5E0"; // default gray
        return sourceNode.data?.status === "COMPLETED" ? "#38B2AC" : "#CBD5E0"; // teal for completed
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

    const phaseLanes = useMemo(() => {
        const lanes: { y: number; height: number; type: string }[] = [];
        const phaseHeight = NODE_HEIGHT + 100;
        Array.from(roadmapNodeTypes).forEach((type, index) => {
            lanes.push({
                y: index * phaseHeight,
                height: phaseHeight,
                type,
            });
        });
        return lanes;
    }, [roadmapNodeTypes]);

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
                // setDescription(data.nodes_json[0]?.description || "");
                setRoadmapNodeTypes(new Set(data.nodes_json.map((node) => node.type ?? "")));
                console.log(roadmapNodeTypes);


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
                    position: { x: 0, y: 0 }, // Dagre will overwrite this
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

                // layout immediately and keep a copy of the full layouted graph
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
    }, [id, user, layoutNodes]); // layoutNodes is in dependencies because it's used inside useEffect

    if (loading)
        return (
            <Center h="80vh">
                <Spinner size="xl" color="teal.400" />
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

    const selectedBg = useColorModeValue("teal.100", "teal.700");
    const statItem = {
        label: "Nodes Completed",
        progress: progressPercentage,
    };



    return (
        <Box w="100%" h="90vh">
            <HStack justify="space-between" w="full">
                <Heading size="2xl" fontWeight="semibold">
                    {label}
                </Heading>
                <Stats stats={[statItem]} size="lg" />
            </HStack>

            <Text fontSize="xs" color="gray.500" mb={1}>
                Filter by node type
            </Text>

            <HStack gap={1} wrap="wrap">
                {Array.from(roadmapNodeTypes).map((type) => (
                    <Badge
                        key={type}
                        px={2}
                        py={0.5}
                        fontSize="xs"
                        borderRadius="md"
                        cursor="pointer"
                        variant="solid"
                        transition="all 0.15s ease"
                        bg={selectedTypes.has(type) ? selectedBg : getTypeColor(type)}
                        color="white"
                        _hover={{ opacity: 0.85 }}
                        onClick={() => toggleType(type)}
                    >
                        {type}
                    </Badge>
                ))}
            </HStack>

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
        </Box>
    );
}