"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";

// --- TYPE DEFINITIONS ---
// Standardizing on these final types for consistency.
type Competency = {
  id: string;
  name: string;
  category: string;
};

type UserCompetency = {
  id: string;
  user_id: string;
  competency_id: string;
  achieved_date: string;
  expiry_date: string | null;
  certificate_file_path: string | null;
  competency: {
    // Using singular 'competency' for the joined data
    name: string;
  } | null;
};

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);

  // States for the competencies feature
  const [teamCompetencies, setTeamCompetencies] = useState<Competency[]>([]);
  const [myCompetencies, setMyCompetencies] = useState<UserCompetency[]>([]);

  // States for the "Add New" form
  const [selectedCompetency, setSelectedCompetency] = useState("");
  const [achievedDate, setAchievedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getProfile = useCallback(
    async (user: User) => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, job_title, team_id")
        .eq("id", user.id)
        .single();

      if (profileError) {
        toast.error("Error fetching your profile data.");
        setLoading(false);
        return;
      }

      if (profileData) {
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
        setJobTitle(profileData.job_title || "");
        setTeamId(profileData.team_id || null);

        if (profileData.team_id) {
          // FIXED: Corrected how Promise.all results are handled
          const [teamListResult, myListResult] = await Promise.all([
            supabase
              .from("competencies")
              .select("id, name, category")
              .eq("team_id", profileData.team_id)
              .eq("is_archived", false),
            supabase
              .from("user_competencies")
              .select("*, competency:competencies(name)")
              .eq("user_id", user.id),
          ]);

          if (teamListResult.data) setTeamCompetencies(teamListResult.data);
          if (myListResult.data)
            setMyCompetencies(myListResult.data as UserCompetency[]);
        }
      }
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        getProfile(user);
      } else {
        router.push("/login");
      }
    };
    init();
  }, [supabase, router, getProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        job_title: jobTitle,
      })
      .eq("id", user.id);

    if (error) {
      toast.error(`Error updating profile: ${error.message}`);
    } else {
      toast.success("Profile updated successfully!");
    }
  };

  const handleAddCompetency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !teamId || !selectedCompetency || !achievedDate) {
      toast.error("Please select a competency and an achieved date.");
      return;
    }
    setIsSubmitting(true);

    let filePath: string | null = null;

    if (certificateFile) {
      const fileExt = certificateFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const path = `public/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("certificates")
        .upload(path, certificateFile);

      if (uploadError) {
        toast.error(`Failed to upload certificate: ${uploadError.message}`);
        setIsSubmitting(false);
        return;
      }
      filePath = path;
    }

    const newCompetencyRecord = {
      user_id: user.id,
      competency_id: selectedCompetency,
      team_id: teamId,
      achieved_date: achievedDate,
      expiry_date: expiryDate || null,
      certificate_file_path: filePath,
    };

    // FIXED: Correctly defined 'newData'
    const { data: newData, error } = await supabase
      .from("user_competencies")
      .insert(newCompetencyRecord)
      .select("id")
      .single();

    if (error || !newData) {
      toast.error(
        `Failed to save competency: ${error?.message || "Unknown error"}`
      );
    } else {
      toast.success("Competency added successfully!");

      // FIXED: Correctly defined 'competencyInfo'
      const competencyInfo = teamCompetencies.find(
        (c) => c.id === selectedCompetency
      );

      const newCompetencyForState: UserCompetency = {
        id: newData.id,
        user_id: user.id,
        competency_id: selectedCompetency,
        achieved_date: achievedDate,
        expiry_date: expiryDate || null,
        certificate_file_path: filePath,
        competency: competencyInfo ? { name: competencyInfo.name } : null,
      };

      setMyCompetencies((prev) => [...prev, newCompetencyForState]);

      setSelectedCompetency("");
      setAchievedDate("");
      setExpiryDate("");
      setCertificateFile(null);
      const fileInput = document.getElementById(
        "certificateFile"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }

    setIsSubmitting(false);
  };

  if (loading) return <p className="p-8">Loading profile...</p>;

  return (
    <div className="p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        <div className="bg-white p-8 rounded-lg shadow">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="text"
                value={user?.email || ""}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium"
                >
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="jobTitle" className="block text-sm font-medium">
                Job Title
              </label>
              <input
                id="jobTitle"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Update Profile
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white p-8 rounded-lg shadow mt-8">
          <h2 className="text-2xl font-bold mb-4">My Competencies</h2>

          <ul className="divide-y divide-gray-200 mb-6">
            {myCompetencies.map((comp) => (
              <li key={comp.id} className="py-3">
                <p className="font-medium">{comp.competency?.name}</p>
                <p className="text-sm text-gray-500">
                  Achieved: {new Date(comp.achieved_date).toLocaleDateString()}
                  {/* FIXED: Corrected typo 'toLocaleDateDateString' -> 'toLocaleDateString' */}
                  {comp.expiry_date &&
                    ` | Expires: ${new Date(comp.expiry_date).toLocaleDateString()}`}
                </p>
              </li>
            ))}
            {myCompetencies.length === 0 && (
              <p className="text-sm text-gray-500">
                You have not added any competencies yet.
              </p>
            )}
          </ul>

          <form
            onSubmit={handleAddCompetency}
            className="space-y-4 border-t pt-6"
          >
            <h3 className="text-xl font-semibold">Add New</h3>
            <div>
              <label htmlFor="competency" className="block text-sm font-medium">
                Competency
              </label>
              <select
                id="competency"
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="">Select from library...</option>
                {teamCompetencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="achievedDate"
                  className="block text-sm font-medium"
                >
                  Date Achieved
                </label>
                <input
                  type="date"
                  id="achievedDate"
                  value={achievedDate}
                  onChange={(e) => setAchievedDate(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="expiryDate"
                  className="block text-sm font-medium"
                >
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="certificateFile"
                className="block text-sm font-medium"
              >
                Upload Certificate
              </label>
              <input
                type="file"
                id="certificateFile"
                onChange={(e) =>
                  setCertificateFile(e.target.files ? e.target.files[0] : null)
                }
                className="mt-1 block w-full text-sm"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? "Saving..." : "Add Competency"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
