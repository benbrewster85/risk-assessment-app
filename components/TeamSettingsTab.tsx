"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import type { Team } from "@/lib/types"; // We will add this type next

type TeamSettingsTabProps = {
  team: Team;
};

export default function TeamSettingsTab({ team }: TeamSettingsTabProps) {
  const supabase = createClient();
  const [teamName, setTeamName] = useState(team.name);
  const [logoUrl, setLogoUrl] = useState(team.logo_url);
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${team.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("team-logos")
        .upload(filePath, file, { upsert: true }); // upsert:true overwrites existing file

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded file to display and save
      const {
        data: { publicUrl },
      } = supabase.storage.from("team-logos").getPublicUrl(filePath);
      setLogoUrl(publicUrl);
      toast.success("Logo uploaded!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Logo upload failed: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("teams")
      .update({ name: teamName, logo_url: logoUrl })
      .eq("id", team.id);

    if (error) {
      toast.error("Failed to save settings.");
    } else {
      toast.success("Settings saved successfully!");
    }
  };

  return (
    <form
      onSubmit={handleSaveChanges}
      className="bg-white p-6 rounded-lg shadow space-y-6"
    >
      <div>
        <label
          htmlFor="teamName"
          className="block text-sm font-medium text-gray-700"
        >
          Team Name
        </label>
        <input
          id="teamName"
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Team Logo
        </label>
        <div className="mt-2 flex items-center space-x-4">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Team Logo"
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
              Logo
            </div>
          )}
          <label
            htmlFor="logoUpload"
            className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50"
          >
            <span>{uploading ? "Uploading..." : "Upload new logo"}</span>
            <input
              id="logoUpload"
              name="logoUpload"
              type="file"
              className="sr-only"
              onChange={handleLogoUpload}
              disabled={uploading}
              accept="image/*"
            />
          </label>
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="py-2 px-6 border rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Save Settings
        </button>
      </div>
    </form>
  );
}
