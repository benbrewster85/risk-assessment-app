"use client";

import { createClient } from "@/lib/supabase/client";
import { Team } from "@/lib/types";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from "@/components/Modal";

export default function SuperAdminPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitingToTeam, setInvitingToTeam] = useState<Team | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const checkPermissionsAndFetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", user.id)
        .single();
      if (profile?.is_super_admin) {
        setIsSuperAdmin(true);
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .order("name");
        if (teamsError) {
          toast.error("Could not fetch teams list.");
        } else {
          setTeams(teamsData || []);
        }
      }
      setLoading(false);
    };
    checkPermissionsAndFetchData();
  }, [supabase]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) {
      toast.error("New team name cannot be empty.");
      return;
    }

    const { data: newTeam, error } = await supabase
      .from("teams")
      .insert({ name: newTeamName })
      .select()
      .single();
    if (error) {
      toast.error(`Failed to create team: ${error.message}`);
    } else if (newTeam) {
      toast.success(`Team "${newTeam.name}" created successfully.`);
      setTeams(
        [...teams, newTeam].sort((a, b) => a.name.localeCompare(b.name))
      );
      setNewTeamName("");
    }
  };

  const openInviteModal = (team: Team) => {
    setInvitingToTeam(team);
    setInviteEmail("");
    setIsInviteModalOpen(true);
  };

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !invitingToTeam) return;
    setIsInviting(true);

    const response = await fetch("/api/send-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inviteeEmail: inviteEmail,
        role: "team_admin",
        teamId: invitingToTeam.id,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      toast.error(`Error sending invite: ${result.error || "Unknown error"}`);
    } else {
      toast.success(`Invitation email sent to ${inviteEmail}!`);
      setIsInviteModalOpen(false);
    }
    setIsInviting(false);
  };

  if (loading) return <p className="p-8">Loading...</p>;
  if (!isSuperAdmin)
    return (
      <div className="p-8 text-red-600">
        Access Denied. This area is for Super Admins only.
      </div>
    );

  return (
    <>
      <Modal
        title={`Invite Admin for ${invitingToTeam?.name || ""}`}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      >
        <form onSubmit={handleInviteAdmin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Admin's Email Address
            </label>
            <input
              type="email"
              id="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="py-2 px-4 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isInviting}
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isInviting ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </Modal>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Super Admin Dashboard</h1>
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
            <form
              onSubmit={handleCreateTeam}
              className="flex items-end space-x-4"
            >
              <div className="flex-grow">
                <label
                  htmlFor="teamName"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Team Name
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  required
                />
              </div>
              <button
                type="submit"
                className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Team
              </button>
            </form>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">All Teams</h2>
            <ul className="divide-y divide-gray-200">
              {teams.map((team) => (
                <li
                  key={team.id}
                  className="py-3 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-xs text-gray-500">ID: {team.id}</p>
                  </div>
                  <button
                    onClick={() => openInviteModal(team)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Invite Admin
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
