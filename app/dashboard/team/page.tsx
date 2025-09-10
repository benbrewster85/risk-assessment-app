"use client";

import { createClient } from "@/lib/supabase/client";
import { TeamMember, Team, AssetCategory } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import LibraryPage from "@/components/LibraryPage";
import { TeamSettingsTab } from "@/components/TeamSettingsTab";
import OrgChartTab from "@/components/OrgChartTab";

// Define the shape of team members and library items
type EnrichedTeamMember = TeamMember & {
  is_fleet_manager?: boolean;
  job_role_id?: string | null;
  sub_team_id?: string | null;
  line_manager_id?: string | null;
};
type LibraryItem = { id: string; name: string; is_system_status?: boolean };

export default function TeamPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");

  // State from the original multi-tab component
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<EnrichedTeamMember[]>([]);
  const [hazards, setHazards] = useState<LibraryItem[]>([]);
  const [risks, setRisks] = useState<LibraryItem[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<LibraryItem[]>([]);
  const [competencies, setCompetencies] = useState<LibraryItem[]>([]);
  const [jobRoles, setJobRoles] = useState<LibraryItem[]>([]);
  const [subTeams, setSubTeams] = useState<LibraryItem[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);

  // State integrated from the new settings component
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // This comprehensive data fetching function is from your original code
    const fetchData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setCurrentUserId(user.id);
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("role, team_id")
          .eq("id", user.id);

        // Check if we got a result and handle errors
        if (error) {
          // Optionally set an error state here
          setLoading(false); // Stop loading on error
          return; // Exit the function
        }

        // Get the first profile from the array, or null if it's empty
        const profileData =
          profiles && profiles.length > 0 ? profiles[0] : null;

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
            jobRolesResult,
            subTeamsResult,
          ] = await Promise.all([
            supabase
              .from("profiles")
              .select(
                "id, first_name, last_name, role, is_fleet_manager, job_role_id, sub_team_id,line_manager_id"
              )
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
              .order("name"),
            supabase
              .from("competencies")
              .select("id, name")
              .eq("team_id", teamId)
              .eq("is_archived", false)
              .order("name"),
            supabase
              .from("job_roles")
              .select("id, name")
              .eq("team_id", teamId)
              .order("name"),
            supabase
              .from("sub_teams")
              .select("id, name")
              .eq("team_id", teamId)
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
          if (competenciesResult.data) setCompetencies(competenciesResult.data);
          if (jobRolesResult.data) setJobRoles(jobRolesResult.data);
          if (subTeamsResult.data) setSubTeams(subTeamsResult.data);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  // --- HANDLER FUNCTIONS MERGED FROM BOTH FILES ---

  // New handler for updating team settings (name, location)
  const handleUpdateTeam = async (updatedTeamData: Partial<Team>) => {
    if (!team) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from("teams")
      .update(updatedTeamData)
      .eq("id", team.id);

    if (error) {
      toast.error(`Failed to update team settings: ${error.message}`);
    } else {
      toast.success("Team settings updated successfully.");
      setTeam((prevTeam) => ({ ...prevTeam!, ...updatedTeamData }));
    }
    setIsSubmitting(false);
  };

  // New handler for uploading the team logo
  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0 || !team) return;
    const file = event.target.files[0];
    setUploading(true);

    const filePath = `team-logos/${team.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("team-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(`Logo upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("team-assets").getPublicUrl(filePath);
    await handleUpdateTeam({ logo_url: publicUrl });
    toast.success("Logo updated successfully!");
    setUploading(false);
  };

  // Original handler functions for member management
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

  const handleMemberUpdate = async (
    userId: string,
    field: "job_role_id" | "sub_team_id" | "line_manager_id",
    value: string | null
  ) => {
    setTeamMembers((current) =>
      current.map((m) => (m.id === userId ? { ...m, [field]: value } : m))
    );
    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", userId);
    if (error) {
      toast.error(`Failed to update user: ${error.message}`);
    } else {
      toast.success("User updated successfully.");
    }
  };

  const handleFleetManagerChange = async (
    userId: string,
    isManager: boolean
  ) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own permissions.");
      setTeamMembers((currentMembers) =>
        currentMembers.map((m) =>
          m.id === userId ? { ...m, is_fleet_manager: !isManager } : m
        )
      );
      return;
    }
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

        {isAdmin ? (
          // If user IS an admin, render the full tabbed interface
          <>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("members")}
                  className={`${activeTab === "members" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Members
                </button>
                <button
                  onClick={() => setActiveTab("orgChart")}
                  className={`${activeTab === "orgChart" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Org Chart
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
              {/* --- Members Tab (Restored Content) --- */}
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
                          Permission
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
                          className="py-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {`${member.first_name || ""} ${member.last_name || ""}`.trim() ||
                                "Unnamed User"}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {member.role === "team_admin" ? "Admin" : "User"}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            <select
                              value={member.job_role_id || ""}
                              onChange={(e) =>
                                handleMemberUpdate(
                                  member.id,
                                  "job_role_id",
                                  e.target.value || null
                                )
                              }
                              className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                              aria-label="Job Role"
                            >
                              <option value="">No Job Role</option>
                              {jobRoles.map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={member.sub_team_id || ""}
                              onChange={(e) =>
                                handleMemberUpdate(
                                  member.id,
                                  "sub_team_id",
                                  e.target.value || null
                                )
                              }
                              className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                              aria-label="Sub-Team"
                            >
                              <option value="">No Sub-Team</option>
                              {subTeams.map((team) => (
                                <option key={team.id} value={team.id}>
                                  {team.name}
                                </option>
                              ))}
                            </select>
                            <select
                              value={member.line_manager_id || ""}
                              onChange={(e) =>
                                handleMemberUpdate(
                                  member.id,
                                  "line_manager_id",
                                  e.target.value || null
                                )
                              }
                              className="block w-full rounded-md border-gray-300 shadow-sm text-sm"
                              aria-label="Line Manager"
                            >
                              <option value="">No Line Manager</option>
                              {teamMembers
                                .filter((m) => m.id !== member.id)
                                .map((manager) => (
                                  <option key={manager.id} value={manager.id}>
                                    {`${manager.first_name || ""} ${manager.last_name || ""}`.trim()}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="flex items-center justify-end space-x-4">
                            <div className="flex items-center">
                              <input
                                id={`fleet-manager-${member.id}`}
                                type="checkbox"
                                className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
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
                                className="ml-2 text-sm text-gray-700"
                              >
                                Fleet Manager
                              </label>
                            </div>
                            <select
                              value={member.role}
                              onChange={(e) =>
                                handleRoleChange(member.id, e.target.value)
                              }
                              className="block w-32 rounded-md border-gray-300 shadow-sm text-sm"
                              disabled={member.id === currentUserId}
                              aria-label="Permission Level"
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

              {/* Library Tab */}
              {activeTab === "library" && team && (
                <LibraryPage
                  hazards={hazards}
                  risks={risks}
                  assetCategories={assetCategories}
                  assetStatuses={assetStatuses}
                  competencies={competencies}
                  teamMembers={teamMembers}
                  teamId={team.id}
                  jobRoles={jobRoles}
                  subTeams={subTeams}
                />
              )}

              {/* Settings Tab */}
              {activeTab === "settings" && team && (
                <TeamSettingsTab
                  team={team}
                  onUpdateTeam={handleUpdateTeam}
                  handleLogoUpload={handleLogoUpload}
                  isSubmitting={isSubmitting}
                  uploading={uploading}
                />
              )}

              {/* Org Chart Tab */}
              {activeTab === "orgChart" && (
                <OrgChartTab members={teamMembers} jobRoles={jobRoles} />
              )}
            </div>
          </>
        ) : (
          // If user is NOT an admin, render only the permission message
          <div className="mt-8">
            <p className="text-red-800 bg-red-100 p-4 rounded-md border border-red-200">
              You do not have administration rights to view or edit this
              section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
