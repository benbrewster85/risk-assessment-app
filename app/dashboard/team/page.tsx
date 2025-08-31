"use client";

import { createClient } from "@/lib/supabase/client";
import { TeamMember, Team, AssetCategory } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import LibraryPage from "@/components/LibraryPage";
import TeamSettingsTab from "@/components/TeamSettingsTab";
import { useRouter } from "next/navigation";

type EnrichedTeamMember = TeamMember & { is_fleet_manager?: boolean };
type LibraryItem = { id: string; name: string; is_system_status?: boolean };

export default function TeamPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<EnrichedTeamMember[]>([]);
  const [hazards, setHazards] = useState<LibraryItem[]>([]);
  const [risks, setRisks] = useState<LibraryItem[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<LibraryItem[]>([]);

  // MOVED a new state for competencies here
  const [competencies, setCompetencies] = useState<LibraryItem[]>([]);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role, team_id")
          .eq("id", user.id)
          .single();
        if (profileData && profileData.team_id) {
          setCurrentUserRole(profileData.role);
          const teamId = profileData.team_id;

          const [
            membersResult,
            hazardsResult,
            risksResult,
            teamResult,
            categoriesResult,
            statusesResult,
            competenciesResult,
          ] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, first_name, last_name, role, is_fleet_manager")
              .eq("team_id", teamId)
              .order("last_name", { ascending: true }),
            supabase
              .from("hazards")
              .select("id, name")
              .eq("team_id", teamId)
              .eq("is_archived", false)
              .order("name"),
            supabase
              .from("risks")
              .select("id, name")
              .eq("team_id", teamId)
              .eq("is_archived", false)
              .order("name"),
            supabase.from("teams").select("*").eq("id", teamId).single(),
            supabase
              .from("asset_categories")
              .select("*, owner:profiles(first_name, last_name)")
              .eq("team_id", teamId)
              .order("name"),
            supabase
              .from("asset_statuses")
              .select("*")
              .eq("team_id", teamId)
              .order("name"), // <-- The comma here is crucial
            supabase
              .from("competencies")
              .select("id, name")
              .eq("team_id", teamId)
              .eq("is_archived", false)
              .order("name"),
          ]);

          if (membersResult.data) setTeamMembers(membersResult.data);
          if (hazardsResult.data) setHazards(hazardsResult.data);
          if (risksResult.data) setRisks(risksResult.data);
          if (teamResult.data) setTeam(teamResult.data);
          if (categoriesResult.data) {
            const transformedCategories = categoriesResult.data.map((c) => ({
              ...c,
              owner: Array.isArray(c.owner) ? c.owner[0] : c.owner,
            }));
            setAssetCategories(transformedCategories as AssetCategory[]);
          }
          if (statusesResult.data) setAssetStatuses(statusesResult.data);
          // ADDED: Set competencies state
          if (competenciesResult.data) setCompetencies(competenciesResult.data);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !team?.id) {
      toast.error("Could not determine your team.");
      return;
    }
    setIsInviting(true);
    const response = await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteeEmail: inviteEmail,
        role: inviteRole,
        teamId: team.id,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      toast.error(`Error sending invite: ${result.error || "Unknown error"}`);
    } else {
      toast.success(`Invitation process started for ${inviteEmail}!`);
      setInviteEmail("");
    }
    setIsInviting(false);
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own role.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);
    if (error) {
      toast.error(`Error updating role: ${error.message}`);
    } else {
      toast.success("User role updated.");
      setTeamMembers((currentMembers) =>
        currentMembers.map((m) =>
          m.id === userId ? { ...m, role: newRole } : m
        )
      );
    }
  };

  const handleFleetManagerChange = async (
    userId: string,
    isManager: boolean
  ) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own permissions.");
      // Visually revert the checkbox instantly
      setTeamMembers((currentMembers) =>
        currentMembers.map((m) =>
          m.id === userId ? { ...m, is_fleet_manager: !isManager } : m
        )
      );
      return;
    }

    // Optimistically update the UI first for a faster feel
    setTeamMembers((currentMembers) =>
      currentMembers.map((m) =>
        m.id === userId ? { ...m, is_fleet_manager: isManager } : m
      )
    );

    const { error } = await supabase
      .from("profiles")
      .update({ is_fleet_manager: isManager })
      .eq("id", userId);

    if (error) {
      toast.error(`Error updating permission: ${error.message}`);
      // If the database update fails, revert the optimistic UI change
      setTeamMembers((currentMembers) =>
        currentMembers.map((m) =>
          m.id === userId ? { ...m, is_fleet_manager: !isManager } : m
        )
      );
    } else {
      toast.success("Fleet Manager permission updated.");
    }
  };

  if (loading) return <p className="p-8">Loading team data...</p>;
  const isAdmin = currentUserRole === "team_admin";

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Team & Library Management</h1>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("members")}
              className={`${activeTab === "members" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`${activeTab === "library" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Library
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`${activeTab === "settings" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settings
            </button>
          </nav>
        </div>
        <div className="mt-8">
          {!isAdmin ? (
            <p className="text-red-600">
              You do not have permission to manage this team.
            </p>
          ) : (
            <>
              {activeTab === "members" && (
                <div className="space-y-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-4">
                      Invite New Member
                    </h2>
                    <form
                      onSubmit={handleInviteUser}
                      className="flex items-end space-x-4"
                    >
                      <div className="flex-grow">
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email address
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                          placeholder="new.member@email.com"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="role"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Role
                        </label>
                        <select
                          id="role"
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                          <option value="user">User</option>
                          <option value="team_admin">Admin</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isInviting}
                        className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {isInviting ? "Sending..." : "Send Invite"}
                      </button>
                    </form>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-4">Current Members</h2>
                    <ul className="divide-y divide-gray-200">
                      {teamMembers.map((member) => (
                        <li
                          key={member.id}
                          className="py-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {`${member.first_name || ""} ${member.last_name || ""}`.trim() ||
                                "Unnamed User"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.role}
                            </p>
                          </div>
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center">
                              <input
                                id={`fleet-manager-${member.id}`}
                                type="checkbox"
                                className="h-4 w-4 rounded"
                                checked={!!member.is_fleet_manager}
                                onChange={(e) =>
                                  handleFleetManagerChange(
                                    member.id,
                                    e.target.checked
                                  )
                                }
                                disabled={member.role === "team_admin"}
                              />
                              <label
                                htmlFor={`fleet-manager-${member.id}`}
                                className="ml-2 text-sm"
                              >
                                Fleet Manager
                              </label>
                            </div>
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value)
                              }
                              className="block w-40 rounded-md border-gray-300 shadow-sm"
                              disabled={member.id === currentUserId}
                            >
                              <option value="user">User</option>
                              <option value="team_admin">Admin</option>
                            </select>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {activeTab === "library" && team && (
                <LibraryPage
                  hazards={hazards}
                  risks={risks}
                  assetCategories={assetCategories}
                  assetStatuses={assetStatuses}
                  competencies={competencies} // Pass the new prop
                  teamMembers={teamMembers}
                  teamId={team.id}
                />
              )}
              {activeTab === "settings" && team && (
                <TeamSettingsTab team={team} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
