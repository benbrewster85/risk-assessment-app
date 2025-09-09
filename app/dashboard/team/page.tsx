"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { getUserProfile } from "@/lib/supabase/profiles";
import { Team } from "@/lib/types";
import { TeamSettingsTab } from "@/components/TeamSettingsTab";

const supabase = createClient();

export default function TeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchTeamData = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getUserProfile();
      if (!profile || !profile.team_id) {
        throw new Error("User profile or team not found.");
      }

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("id", profile.team_id)
        .single();

      if (error) throw error;
      setTeam(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeamData();
  }, [fetchTeamData]);

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

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0 || !team) {
      return;
    }
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {team ? (
        <TeamSettingsTab
          team={team}
          onUpdateTeam={handleUpdateTeam}
          handleLogoUpload={handleLogoUpload}
          isSubmitting={isSubmitting}
          uploading={uploading}
        />
      ) : (
        <div>Team data not found or you are not assigned to a team.</div>
      )}
    </div>
  );
}
