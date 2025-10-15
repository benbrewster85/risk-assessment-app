"use client";

import { createClient } from "@/lib/supabase/client";
import {
  TeamMember,
  Team,
  AssetCategory,
  LibraryItem,
  EnrichedTeamMember,
} from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import LibraryPage from "@/components/LibraryPage";
import { TeamSettingsTab } from "@/components/TeamSettingsTab";
import OrgChartTab from "@/components/OrgChartTab";
import CompetencyMatrix from "@/components/CompetencyMatrix";
import MemberProfileView from "@/components/MemberProfileView";
import NewsManagementTab from "@/components/NewsManagementTab";
import { useRouter } from "next/navigation";
// Define the shape of team members and library items

// Define the new AbsenceType based on your schema
export type AbsenceType = {
  id: string;
  name: string;
  color: string;
  category: "personnel" | "vehicle" | "equipment";
};

export default function TeamPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("members");

  // NEW: State to track the selected member's ID
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // All your other state variables remain the same
  const [team, setTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<EnrichedTeamMember[]>([]);
  const [hazards, setHazards] = useState<LibraryItem[]>([]);
  const [risks, setRisks] = useState<LibraryItem[]>([]);
  const [assetCategories, setAssetCategories] = useState<AssetCategory[]>([]);
  const [assetStatuses, setAssetStatuses] = useState<LibraryItem[]>([]);
  const [competencies, setCompetencies] = useState<LibraryItem[]>([]);
  const [jobRoles, setJobRoles] = useState<LibraryItem[]>([]);
  const [subTeams, setSubTeams] = useState<LibraryItem[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [isInviting, setIsInviting] = useState(false);

  // State integrated from the new settings component
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
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
          setLoading(false);
          return;
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
            absenceTypesResult, // Fetch absence types
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
            supabase // New query
              .from("absence_types")
              .select("id, name, color, category")
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
          if (absenceTypesResult.data) setAbsenceTypes(absenceTypesResult.data); // Set state for absence types
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  // --- HANDLER FUNCTIONS MERGED FROM BOTH FILES ---

  const handleUpdateTeam = async (updatedTeamData: Partial<Team>) => {
    if (!team) {
      toast.error("Team data not available.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("teams")
        .update(updatedTeamData)
        .eq("id", team.id)
        .select(); // Keep this .select() call

      if (error) {
        throw error;
      }

      toast.success("Team settings updated successfully.");
      router.refresh();
      setTeam((prevTeam: Team | null) => ({
        ...prevTeam!,
        ...updatedTeamData,
      }));
    } catch (error: any) {
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
      .from("team-logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error(`Logo upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("team-logos").getPublicUrl(filePath);
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
                  className={`${activeTab === "members" ? "..." : "..."}`}
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
                  onClick={() => setActiveTab("matrix")}
                  className={`${activeTab === "matrix" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Competency Matrix
                </button>
                <button
                  onClick={() => setActiveTab("library")}
                  className={`${activeTab === "library" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Library
                </button>
                <button
                  onClick={() => setActiveTab("news")}
                  className={`${activeTab === "news" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  News
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
              {activeTab === "members" && (
                <div>
                  {/* Conditionally render list or profile view */}
                  {selectedMemberId ? (
                    <MemberProfileView
                      memberId={selectedMemberId}
                      onBack={() => setSelectedMemberId(null)}
                      jobRoles={jobRoles}
                      allTeamMembers={teamMembers}
                      subTeams={subTeams}
                    />
                  ) : (
                    <div className="space-y-8">
                      {/* Invite New Member Form */}
                      <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-2xl font-bold mb-4">
                          Invite New Member
                        </h2>
                        <form
                          onSubmit={handleInviteUser}
                          className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0"
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
                          <div className="w-full sm:w-auto">
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
                            className="w-full sm:w-auto px-4 py-2 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isInviting ? "Sending..." : "Send Invite"}
                          </button>
                        </form>
                      </div>

                      {/* Current Members List */}
                      <div className="bg-white rounded-lg shadow overflow-x-auto">
                        <h2 className="text-2xl font-bold p-6">
                          Current Members
                        </h2>
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Role
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Job Title
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {teamMembers.map((member) => (
                              <tr key={member.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() =>
                                      setSelectedMemberId(member.id)
                                    }
                                    className="text-indigo-600 hover:underline text-left w-full"
                                  >
                                    {`${member.first_name || ""} ${
                                      member.last_name || ""
                                    }`.trim()}
                                  </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                  {member.role === "team_admin"
                                    ? "Admin"
                                    : "User"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {jobRoles.find(
                                    (jr) => jr.id === member.job_role_id
                                  )?.name || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
                  absenceTypes={absenceTypes}
                />
              )}

              {/* --- Other Tabs (Unchanged) --- */}
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
              {activeTab === "matrix" && team && (
                <CompetencyMatrix teamId={team.id} />
              )}
              {activeTab === "news" && team && (
                <NewsManagementTab teamId={team.id} isAdmin={isAdmin} />
              )}
            </div>
          </>
        ) : (
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
