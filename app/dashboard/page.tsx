// page.tsx (New Version)

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  NextJobDetails,
  ProjectListItem,
  TeamMember,
  Asset,
  Vehicle,
} from "@/lib/types";
import {
  AlertTriangle,
  MessageSquare,
  PlusCircle,
  BookOpen,
  Truck,
  Calendar,
  Briefcase,
  ClipboardList, // Added missing icon
  MapPin, // Added missing icon
} from "lucide-react";
import QuickAccess from "@/components/QuickAccess";

// --- Final <NextJob /> Component ---
const NextJob = ({ job }: { job: NextJobDetails | null }) => {
  if (!job) {
    return (
      <div className="mt-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">My Next Job</h2>
        <p className="text-gray-500 mt-4">
          Your schedule is clear. No upcoming jobs assigned.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">My Next Job</h2>
          <p className="text-blue-600 font-semibold mt-1">{job.project_name}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <p className="font-bold">
            {new Date(job.event_date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="text-sm text-gray-500">{job.shift_pattern} Shift</p>
        </div>
      </div>

      <div className="mt-4 border-t pt-4">
        {job.brief_statement && (
          <p className="text-sm text-gray-600 italic">
            "{job.brief_statement}"
          </p>
        )}
        {job.location_address && (
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <MapPin size={14} className="mr-2" />
            <span>{job.location_address}</span>
          </div>
        )}
      </div>

      {job.tasks && job.tasks.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-md font-semibold flex items-center">
            <ClipboardList size={16} className="mr-2" />
            Tasks for this Project:
          </h3>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            {job.tasks.map((task, index) => (
              <li key={index}>
                {task.title}{" "}
                <span className="text-xs text-gray-400">({task.status})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-right mt-6">
        <Link
          href={`/dashboard/project/${job.project_id}`}
          className="text-blue-600 font-semibold hover:underline"
        >
          View Full Project →
        </Link>
      </div>
    </div>
  );
};

// --- Full <QuickAccess /> Component ---

// --- Full <StatusWidgets /> Component ---
const StatusWidgets = ({
  issueCount,
  messageCount,
  kitCount,
}: {
  issueCount: number;
  messageCount: number;
  kitCount: number;
}) => {
  return (
    <div className="space-y-4">
      {/* Action Items */}
      <Link href="/dashboard/action-items">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <AlertTriangle className="text-orange-500" size={24} />
            <span className="ml-4 text-lg font-medium">Action Items</span>
          </div>
          <span className="bg-orange-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {issueCount}
          </span>
        </div>
      </Link>
      {/* Messages */}
      <Link href="/dashboard/messages">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <MessageSquare className="text-blue-500" size={24} />
            <span className="ml-4 text-lg font-medium">Messages</span>
          </div>
          <span className="bg-blue-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center">
            {messageCount}
          </span>
        </div>
      </Link>
      {/* My Kit */}
      <Link href="/dashboard/my-kit">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex items-center">
            <Briefcase className="text-gray-500" size={24} />
            <span className="ml-4 text-lg font-medium">My Kit</span>
          </div>
          {kitCount > 0 && (
            <span className="bg-gray-600 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {kitCount}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

// --- Main Dashboard Page ---
export default async function Dashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // --- DATA FETCHING ---
  // Fetch existing data for widgets
  const { count: openIssuesCount } = await supabase.rpc(
    "get_my_actionable_issues",
    {},
    { count: "exact", head: true }
  );
  const { data: unreadMessagesCount } = await supabase.rpc(
    "get_my_unread_messages_count"
  );
  const { data: nextJob } = await supabase.rpc("get_my_next_job");

  const { count: assignedItemCount } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true })
    .eq("current_assignee_id", user.id);

  // NEW: Fetch data required for the modals
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  const teamId = userProfile?.team_id || "";

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId);
  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("*")
    .eq("team_id", teamId);
  const { data: assets } = await supabase
    .from("assets")
    .select("*, asset_categories!assets_category_id_fkey(asset_category_class)")
    .eq("team_id", teamId);
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("team_id", teamId);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Use the new component and pass props to it */}
            <QuickAccess
              projects={(projects as ProjectListItem[]) || []}
              teamMembers={(teamMembers as TeamMember[]) || []}
              assets={(assets as Asset[]) || []}
              vehicles={(vehicles as Vehicle[]) || []}
              teamId={teamId}
              userId={user.id}
            />
            <NextJob job={nextJob as NextJobDetails | null} />
          </div>
          <div className="lg:col-span-1">
            <StatusWidgets
              issueCount={openIssuesCount || 0}
              messageCount={unreadMessagesCount || 0}
              kitCount={assignedItemCount || 0} // <-- ADD THIS PROP
            />
          </div>
        </div>
      </div>
    </div>
  );
}
