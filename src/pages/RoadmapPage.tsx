import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, {
    Background,
    Controls,
    type Node,
    type Edge, // 👈 Essential: Used in CustomNode
    MarkerType, // For edge marker definition
    type DefaultEdgeOptions, // For typing default options
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
    nodes_json: RoadmapNodeResponse[]; // Renamed for clarity with your data
    edges_json: { source: string; target: string }[]; // Renamed for clarity with your data
}

// --- CONSTANTS ---

// 🚀 Default options for all edges: smoothstep path with a distinct arrow marker
const defaultEdgeOptions: DefaultEdgeOptions = {
    type: "smoothstep",
    animated: false,
    style: { stroke: "#44444", strokeWidth: 2 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#3182CE", // Visible blue color
    },
};


const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    const rankdir: "TB" | "LR" = "TB"; // Top→Bottom layout
    const minNodeWidth = 220; // Minimum width for nodes
    const nodeHeightBase = 60; // Base node height
    const approxCharWidth = 8; // Approx width per character in px
    const padding = 40; // Padding around text
    const lineHeight = 20; // Height per extra line
    const maxLines = 3; // Limit lines to avoid huge nodes

    dagreGraph.setGraph({
        rankdir,
        ranksep: 220, // vertical spacing
        nodesep: 160, // horizontal spacing
    });

    // Dynamically calculate node width & height
    nodes.forEach((node) => {
        const label = node.data?.label ?? "";
        const width = Math.max(minNodeWidth, label.length * approxCharWidth + padding);

        const textLines = Math.min(Math.ceil((label.length * approxCharWidth) / width), maxLines);
        const height = nodeHeightBase + (textLines - 1) * lineHeight;

        dagreGraph.setNode(node.id, { width, height });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.position = {
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
        };
        return node;
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

    const visibleEdges = useMemo(() => {
        return allEdges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    }, [allEdges, visibleNodeIds]);

    useEffect(() => {
        if (!user) return;

        const fetchRoadmap = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${BACKEND_URL}/generate-roadmap/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                });
                const data: RoadmapData = await response.json();
                setLabel(data.nodes_json[0]?.label || "");
                // setDescription(data.nodes_json[0]?.description || "");
                setRoadmapNodeTypes(new Set(data.nodes_json.map((node) => node.type ?? "")));
                console.log("Fetched roadmap data:", data);
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

                const mappedEdges: Edge[] = data.edges_json.map((edge) => ({
                    id: `${edge.source}-${edge.target}`,
                    source: edge.source,
                    target: edge.target,
                    // Style and handle IDs are now applied via defaultEdgeOptions
                }));

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
        label: "Stage",
        progress: progressPercentage,
    };

    return (
        <Box w="100%" h="90vh" p={4}>
            <Box mb={6}>
                <HStack justifyContent="space-between">
                    <Heading>{label}</Heading>
                    <Stats stats={[statItem]} />
                </HStack>

                <Collapsible.Root defaultOpen>
                    <Collapsible.Trigger onClick={() => setShowDescAndFilter(!showDescAndFilter)} >
                        {showDescAndFilter ? <MdOutlineExpandLess /> : <MdOutlineExpandMore />}
                    </Collapsible.Trigger>
                    <Collapsible.Content>

                        <Text fontSize="sm" mb={2}>Filter by node type:</Text>
                        <HStack gap={2}>

                            {Array.from(roadmapNodeTypes).map((type) => (
                                <Badge
                                    key={type}
                                    onClick={() => toggleType(type)}
                                    cursor="pointer"
                                    variant={"solid"}

                                    bg={selectedTypes.has(type) ? selectedBg : getTypeColor(type)}
                                    color="black"
                                >
                                    {type}
                                </Badge>
                            ))}
                        </HStack>
                    </Collapsible.Content>
                </Collapsible.Root>


            </Box>


            <ReactFlow
                nodes={visibleNodes}
                edges={visibleEdges}
                nodeTypes={{ custom: RoadmapNode }}
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