// components/TeamMemberNode.tsx

import { Handle, Position } from "reactflow";

// Define the shape of the data object we'll pass to our node
type TeamMemberNodeData = {
  name: string;
  jobTitle: string;
};

// The props include the data object we define
type TeamMemberNodeProps = {
  data: TeamMemberNodeData;
};

export default function TeamMemberNode({ data }: TeamMemberNodeProps) {
  return (
    <>
      {/* Target handle (top): This is where lines from managers connect TO */}
      <Handle type="target" position={Position.Top} className="!bg-gray-400" />

      {/* Node Content: Styled with Tailwind CSS */}
      <div className="px-4 py-2 shadow-md rounded-md bg-white border-2 border-stone-400 w-44">
        <p className="text-lg font-bold text-gray-800">{data.name}</p>
        <p className="text-xs text-gray-600 mt-1">{data.jobTitle}</p>
      </div>

      {/* Source handle (bottom): This is where lines to subordinates connect FROM */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400"
      />
    </>
  );
}
