// app/dashboard/messages/page.tsx
"use client"; // This page now needs state to manage the modal

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Message, TeamMember } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import MessagesList from "@/components/MessagesList";
import NewMessageModal from "@/components/NewMessageModal";
import { Plus } from "react-feather";

export default function MessagesPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      console.log("1. Starting data fetch...");
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) console.error("Error getting user:", userError);
      console.log("2. User object:", user);
      setUser(user);

      if (user) {
        // Mark messages as read
        await supabase.rpc("mark_my_messages_as_read");

        // Fetch messages with sender profiles
        // (Re-using the two-query approach)
        const { data: initialMessages } = await supabase
          .from("messages")
          .select("*")
          .eq("recipient_id", user.id)
          .order("created_at", { ascending: false });

        if (initialMessages && initialMessages.length > 0) {
          const senderIds = Array.from(
            new Set(initialMessages.map((msg) => msg.sender_id).filter(Boolean))
          );
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", senderIds as string[]);

          const profilesById = new Map(profiles?.map((p) => [p.id, p]));
          const messagesWithSenders = initialMessages.map((message) => ({
            ...message,
            sender: message.sender_id
              ? profilesById.get(message.sender_id) || null
              : null,
          }));
          setMessages(messagesWithSenders as Message[]);
        } else {
          setMessages([]);
        }

        // Fetch team members
        console.log("3. Fetching current user's profile to get team_id...");
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("team_id")
          .eq("id", user.id)
          .single();

        if (profileError)
          console.error("Error fetching user profile:", profileError);
        console.log("4. User profile result:", userProfile);

        if (userProfile?.team_id) {
          console.log(
            "5. Found team_id:",
            userProfile.team_id,
            ". Fetching all members of this team..."
          );
          const { data: teamData, error: teamError } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, role")
            .eq("team_id", userProfile.team_id);

          if (teamError) setTeamMembers(teamData || []);
        } else {
          setTeamMembers([]);
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [supabase]);

  return (
    <>
      {user && (
        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={() => setIsNewMessageModalOpen(false)}
          onSuccess={() => {
            // A simple refresh for now, could be optimized later
            window.location.reload();
          }}
          teamMembers={teamMembers}
          user={user}
        />
      )}

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Messages</h1>
            <button
              onClick={() => setIsNewMessageModalOpen(true)}
              className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">New Message</span>
            </button>
          </div>

          {isLoading ? (
            <p>Loading messages...</p>
          ) : (
            <MessagesList messages={messages} user={user} />
          )}
        </div>
      </div>
    </>
  );
}
