// app/dashboard/team/[memberId]/page.tsx

import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";

export default async function MemberProfilePage({
  params,
}: {
  params: { memberId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Security check: ensure the viewer is an admin
  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "team_admin") {
    return <div>Access Denied</div>;
  }

  // Fetch the profile of the member being viewed
  const { data: memberProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.memberId)
    .single();

  if (!memberProfile) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">
          {`${memberProfile.first_name || ""} ${memberProfile.last_name || ""}`.trim()}
        </h1>
        <p className="text-gray-500">{memberProfile.role}</p>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold">
            Profile Details & Competencies
          </h2>
          <p className="mt-4 text-gray-500">
            This is where you can add the forms to edit this user's role, job
            title, competencies, skills, etc.
          </p>
        </div>
      </div>
    </div>
  );
}
