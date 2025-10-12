// components/MemberProfileView.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { TeamMember } from "@/lib/types";
import { ArrowLeft } from "react-feather";
import { toast } from "react-hot-toast";

type LibraryItem = { id: string; name: string };
type EnrichedTeamMember = TeamMember & {
  is_fleet_manager?: boolean;
  is_storesperson?: boolean;
  job_role_id?: string | null;
  sub_team_id?: string | null;
  line_manager_id?: string | null;
};

type MemberProfileViewProps = {
  memberId: string;
  onBack: () => void;
  jobRoles: LibraryItem[];
  allTeamMembers: EnrichedTeamMember[];
  subTeams: LibraryItem[];
};

export default function MemberProfileView({
  memberId,
  onBack,
  jobRoles,
  allTeamMembers,
  subTeams,
}: MemberProfileViewProps) {
  const supabase = createClient();
  const [member, setMember] = useState<EnrichedTeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", memberId)
        .single();

      if (error) {
        toast.error("Failed to fetch member profile.");
        console.error(error);
      } else {
        setMember(data as EnrichedTeamMember);
      }
      setLoading(false);
    };

    fetchMemberData();
  }, [memberId, supabase]);

  // --- HANDLER FUNCTIONS RE-INTEGRATED HERE ---
  const handleMemberUpdate = async (
    field: "job_role_id" | "sub_team_id" | "line_manager_id" | "role",
    value: string | null
  ) => {
    if (!member) return;
    const originalValue = member[field];
    // Optimistic UI update
    setMember((current) => (current ? { ...current, [field]: value } : null));

    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", member.id);

    if (error) {
      toast.error(`Failed to update user: ${error.message}`);
      // Revert on error
      setMember((current) =>
        current ? { ...current, [field]: originalValue } : null
      );
    } else {
      toast.success("User updated successfully.");
    }
  };

  const handleFleetManagerChange = async (isManager: boolean) => {
    if (!member) return;
    setMember((current) =>
      current ? { ...current, is_fleet_manager: isManager } : null
    );

    const { error } = await supabase
      .from("profiles")
      .update({ is_fleet_manager: isManager })
      .eq("id", member.id);

    if (error) {
      toast.error(`Error updating permission: ${error.message}`);
      setMember((current) =>
        current ? { ...current, is_fleet_manager: !isManager } : null
      );
    } else {
      toast.success("Fleet Manager permission updated.");
    }
  };

  const handleStorespersonChange = async (isStoresperson: boolean) => {
    if (!member) return;
    setMember((current) =>
      current ? { ...current, is_storesperson: isStoresperson } : null
    );

    const { error } = await supabase
      .from("profiles")
      .update({ is_storesperson: isStoresperson })
      .eq("id", member.id);

    if (error) {
      toast.error(`Error updating permission: ${error.message}`);
      setMember((current) =>
        current ? { ...current, is_storesperson: !isStoresperson } : null
      );
    } else {
      toast.success("Storesperson permission updated.");
    }
  };

  if (loading) return <p>Loading member profile...</p>;
  if (!member) return <p>Could not load member profile.</p>;

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} className="mr-2" />
        Back to Members List
      </button>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold">
          {`${member.first_name || ""} ${member.last_name || ""}`.trim()}
        </h2>
        <p className="text-gray-500 capitalize">
          {member.role === "team_admin" ? "Admin" : "User"}
        </p>

        <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={member.role || ""}
              onChange={(e) => handleMemberUpdate("role", e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="user">User</option>
              <option value="team_admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Job Role
            </label>
            <select
              value={member.job_role_id || ""}
              onChange={(e) =>
                handleMemberUpdate("job_role_id", e.target.value || null)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="">No Job Role</option>
              {jobRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sub-Team
            </label>
            <select
              value={member.sub_team_id || ""}
              onChange={(e) =>
                handleMemberUpdate("sub_team_id", e.target.value || null)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="">No Sub-Team</option>
              {subTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Line Manager (Reports to)
            </label>
            <select
              value={member.line_manager_id || ""}
              onChange={(e) =>
                handleMemberUpdate("line_manager_id", e.target.value || null)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm text-sm"
            >
              <option value="">No Line Manager</option>
              {allTeamMembers
                .filter((m) => m.id !== member.id)
                .map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {`${manager.first_name || ""} ${manager.last_name || ""}`.trim()}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center">
            <input
              id="storesperson"
              type="checkbox"
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              checked={!!member.is_storesperson}
              onChange={(e) => handleStorespersonChange(e.target.checked)}
              disabled={member.role === "team_admin"}
            />
            <label
              htmlFor="storesperson"
              className="ml-2 text-sm text-gray-700"
            >
              Storesperson
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="fleet-manager"
              type="checkbox"
              className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
              checked={!!member.is_fleet_manager}
              onChange={(e) => handleFleetManagerChange(e.target.checked)}
              disabled={member.role === "team_admin"}
            />
            <label
              htmlFor="fleet-manager"
              className="ml-2 text-sm text-gray-700"
            >
              Fleet Manager
            </label>
          </div>
        </div>
      </div>

      <div className="mt-6 p-6 bg-white rounded-lg shadow">
        <h3 className="text-xl font-semibold">Competencies & Skills</h3>
        <p className="mt-4 text-gray-500">
          The list and editing controls for this member's competencies will go
          here.
        </p>
      </div>
    </div>
  );
}
