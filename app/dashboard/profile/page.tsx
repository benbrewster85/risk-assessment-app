"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type { User } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const getProfile = useCallback(
    async (user: User) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, job_title")
        .eq("id", user.id)
        .single();

      if (error) {
        toast.error("Error fetching your profile data.");
      } else if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setJobTitle(data.job_title || "");
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
      </div>
    </div>
  );
}
