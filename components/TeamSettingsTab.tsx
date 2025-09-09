"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Team } from "@/lib/types";
import { useForm } from "react-hook-form";
import LocationSearchInput from "@/components/LocationSearchInput";

interface TeamSettingsTabProps {
  team: Team;
  onUpdateTeam: (updatedData: Partial<Team>) => void;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isSubmitting: boolean;
  uploading: boolean;
}

export function TeamSettingsTab({
  team,
  onUpdateTeam,
  handleLogoUpload,
  isSubmitting,
  uploading,
}: TeamSettingsTabProps) {
  const { register, handleSubmit, setValue } = useForm<Team>({
    defaultValues: team,
  });

  const onSubmit = (data: Team) => {
    onUpdateTeam(data);
  };

  const handleLocationSelect = (location: {
    address: string;
    longitude: number;
    latitude: number;
  }) => {
    const { address, longitude, latitude } = location;
    setValue("home_location_address", address, { shouldDirty: true });
    setValue("home_location_lon", longitude, { shouldDirty: true });
    setValue("home_location_lat", latitude, { shouldDirty: true });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Settings</CardTitle>
        <CardDescription>
          Manage your team's details and default settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Your Logo Uploader UI */}
          <div className="space-y-2">
            <Label>Team Logo</Label>
            <div className="mt-2 flex items-center space-x-4">
              {team.logo_url ? (
                <img
                  src={team.logo_url}
                  alt="Team Logo"
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  Logo
                </div>
              )}
              <Label
                htmlFor="logoUpload"
                className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50"
              >
                <span>{uploading ? "Uploading..." : "Upload new logo"}</span>
                <Input
                  id="logoUpload"
                  name="logoUpload"
                  type="file"
                  className="sr-only"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                  accept="image/*"
                />
              </Label>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input id="name" {...register("name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="home_location">Team Home Location</Label>
              <LocationSearchInput
                initialValue={team.home_location_address || ""}
                onLocationSelect={handleLocationSelect}
                accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting || uploading}>
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
