import { useEffect, useState, useCallback } from "react";
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
} from "@chakra-ui/react";
import dagre from "dagre";
import { useUser } from "../contexts/UserContext";
import { RoadmapNode } from "../components/RoadmapNode";
import { RoadmapLegendFloating } from "../components/RoadmapLegened";

// --- INTERFACE DEFINITIONS ---

interface RoadmapNodeResponse {
    node_id: string;
    label: string;
    description?: string;
    type?: string;
    order_index?: number;
    course_id?: string;
}

interface RoadmapData {
    nodes_json: RoadmapNodeResponse[]; // Renamed for clarity with your data
    edges_json: { source: string; target: string }[]; // Renamed for clarity with your data
}

// --- CONSTANTS ---

// 🚀 Default options for all edges: smoothstep path with a distinct arrow marker
const defaultEdgeOptions: DefaultEdgeOptions = {
    type: "smoothstep",
    animated: true,
    style: { stroke: "#444", strokeWidth: 2 },
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#3182CE", // Visible blue color
    },
};

// --- DAGRE LAYOUT HELPER ---

// 🔧 Helper: Generate Dagre Layout
// 🔧 Helper: Generate Dagre Layout
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Must match the minW/minH set in CustomNode for accurate layout
    const nodeWidth = 220;
    const nodeHeight = 60;

    // 🚀 INCREASE THESE VALUES FOR MORE SPACE
    dagreGraph.setGraph({
        rankdir: "LR",
        ranksep: 180, // Increased vertical separation (was 120)
        nodesep: 120  // Increased horizontal separation (was 80)
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        node.position = {
            // Center the node
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
        return node;
    });

    return { nodes: layoutedNodes, edges };
};


// --- MAIN COMPONENT ---

export default function TrackRoadmap() {
    const [label, setLabel] = useState<string>("");
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [loading, setLoading] = useState(true);
    const { id } = useParams<{ id: string }>();
    const { user } = useUser();

    // Memoized layout function
    const layoutNodes = useCallback((n: Node[], e: Edge[]) => {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(n, e);
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchRoadmap = async () => {
            setLoading(true);
            try {
                // Mock API call (replace with actual fetch)

                const response = await fetch(`http://localhost:8000/generate-roadmap/${id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${user?.token}`,
                    },
                });
                const data: RoadmapData = await response.json();
                setLabel(data.nodes_json[0]?.label || "");
                console.log("Fetched roadmap data:", data);


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
                    },
                    position: { x: 0, y: 0 }, // Dagre will overwrite this
                }));

                const mappedEdges: Edge[] = data.edges_json.map((edge) => ({
                    id: `${edge.source}-${edge.target}`,
                    source: edge.source,
                    target: edge.target,
                    // Style and handle IDs are now applied via defaultEdgeOptions
                }));

                layoutNodes(mappedNodes, mappedEdges);
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

    return (
        <Box w="100%" h="90vh" p={4}>
            <Heading mb={4}>{label}</Heading>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={{ custom: RoadmapNode }}
                defaultEdgeOptions={defaultEdgeOptions} // 👈 Edge styling applied here
                fitView
                fitViewOptions={{ padding: 0.2 }}
            >
                <Background color="#ccc" gap={18} />
                <Controls />
            </ReactFlow>
            <RoadmapLegendFloating />
        </Box>
    );
}