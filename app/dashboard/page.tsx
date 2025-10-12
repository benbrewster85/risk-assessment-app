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
  ClipboardList,
  MapPin,
  Users,
  Info,
} from "lucide-react";
import QuickAccess from "@/components/QuickAccess";
import LatestNews from "@/components/LatestNews";

const today = new Date().toISOString().split("T")[0];

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

      {job.shift_note && (
        <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <div className="flex items-start">
            <Info size={20} className="text-blue-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-800">
                Note for this Shift:
              </h3>
              <p className="text-sm text-blue-700 mt-1">{job.shift_note}</p>
            </div>
          </div>
        </div>
      )}

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
            Tasks:
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
      {job.colleagues && job.colleagues.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="text-md font-semibold flex items-center">
            <Users size={16} className="mr-2" />
            Who's on this shift:
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            {job.colleagues.join(", ")}
          </p>
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
  actionItemCount,
  messageCount,
  kitCount,
}: {
  actionItemCount: number;
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
            {actionItemCount}
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

  // REPLACE WITH THIS CORRECTED BLOCK
  // --- DATA FETCHING ---
  const today = new Date().toISOString().split("T")[0];

  // Fetch action items data and calculate the total count
  const { data: actionItemsData } = await supabase.rpc("get_my_action_items");
  const totalActionItems =
    (actionItemsData?.open_asset_issues?.length || 0) +
    (actionItemsData?.open_vehicle_issues?.length || 0) +
    (actionItemsData?.assets_requiring_calibration?.length || 0) +
    (actionItemsData?.vehicles_requiring_mot?.length || 0) +
    (actionItemsData?.pending_order_requests?.length || 0) +
    (actionItemsData?.low_stock_items?.length || 0);

  // Fetch other widget data
  const { data: unreadMessagesCount } = await supabase.rpc(
    "get_my_unread_messages_count"
  );
  const { data: nextJob } = await supabase.rpc("get_my_next_job");
  const { data: myKitAssets } = await supabase.rpc("get_my_kit_bag", {
    p_date: today,
  });

  // NEW: Fetch data required for the modals
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("team_id")
    .eq("id", user.id)
    .single();
  const teamId = userProfile?.team_id || "";

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, reference, document_status, last_edited_at")
    .eq("team_id", teamId)
    .neq("document_status", "Completed");

  const { data: teamMembers } = await supabase
    .from("profiles")
    .select("*")
    .eq("team_id", teamId);
  const { data: assets } = await supabase
    .from("assets")
    .select("*, category:asset_categories(asset_category_class)")
    .eq("team_id", teamId);
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("team_id", teamId);

  const { data: rawNewsData } = await supabase
    .from("team_news")
    .select(
      `id, created_at, title, content, author:profiles (first_name, last_name)`
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false })
    .limit(3);

  // ✅ FIX 2: Transform the news data to match the component's expected type.
  // The 'author' property is converted from an array to a single object.
  const latestNews =
    rawNewsData?.map((item) => ({
      ...item,
      author: Array.isArray(item.author) ? item.author[0] : item.author,
    })) || [];

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
              actionItemCount={totalActionItems}
              messageCount={unreadMessagesCount || 0}
              kitCount={myKitAssets?.length || 0}
            />
            <LatestNews newsItems={latestNews} />
          </div>
        </div>
      </div>
    </div>
  );
}
