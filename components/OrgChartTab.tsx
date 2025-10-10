// components/OrgChartTab.tsx (Updated)

import { useMemo } from "react";
import ReactFlow, { ReactFlowProvider, Node, Edge, Position } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { TeamMember } from "@/lib/types"; // Adjust this import
import TeamMemberNode from "./TeamMemberNode"; // 1. Import your custom node

// Define a type for the LibraryItem (job roles, etc.)
type LibraryItem = { id: string; name: string };

type EnrichedTeamMember = TeamMember & {
  line_manager_id?: string | null;
  job_role_id?: string | null;
};

type OrgChartTabProps = {
  members: EnrichedTeamMember[];
  jobRoles: LibraryItem[]; // 2. Accept jobRoles as a prop
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({
    rankdir: "TB",
    ranksep: 100, // Increase vertical spacing
    nodesep: 20, // Increase horizontal spacing
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    // We are shifting the dagre node position (anchor=center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };

    return node;
  });

  return { nodes, edges };
};

export default function OrgChartTab({ members, jobRoles }: OrgChartTabProps) {
  // 3. Register the custom node type
  const nodeTypes = useMemo(() => ({ teamMember: TeamMemberNode }), []);

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    const nodes: Node[] = members.map((member) => {
      // Find the job role name from the ID
      const jobRole = jobRoles.find((role) => role.id === member.job_role_id);
      const jobTitle = jobRole ? jobRole.name : "No Role Assigned";

      return {
        id: member.id,
        position: { x: 0, y: 0 },
        // 4. Set the type and the data payload for the custom node
        type: "teamMember",
        data: {
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
          jobTitle: jobTitle,
        },
      };
    });

    const edges: Edge[] = members
      .filter((member) => member.line_manager_id)
      .map((member) => ({
        id: `e-${member.line_manager_id}-${member.id}`,
        source: member.line_manager_id!,
        target: member.id,
        animated: false, // Optional: makes the line animated
        style: { stroke: "#888", strokeWidth: 2 },
      }));

    return getLayoutedElements(nodes, edges);
  }, [members, jobRoles]);

  return (
    <div
      className="bg-gray-50 p-6 rounded-lg shadow "
      style={{ height: "700px" }}
    >
      <h2 className="text-2xl font-bold mb-4">Organisation Chart</h2>
      <ReactFlowProvider>
        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          nodeTypes={nodeTypes} // Pass the registered types here
          fitView
        ></ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
