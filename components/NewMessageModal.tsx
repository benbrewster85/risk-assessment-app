// components/NewMessageModal.tsx
"use client";

import { useState, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import { X } from "react-feather";

type TeamMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type NewMessageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  teamMembers: TeamMember[];
  user: User;
};

export default function NewMessageModal({
  isOpen,
  onClose,
  onSuccess,
  teamMembers,
  user,
}: NewMessageModalProps) {
  const supabase = createClient();
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSending, setIsSending] = useState(false);

  const filteredMembers = useMemo(() => {
    // Exclude the current user from the recipient list
    const otherMembers = teamMembers.filter((m) => m.id !== user.id);
    if (!searchTerm) {
      return otherMembers;
    }
    return otherMembers.filter((m) =>
      `${m.first_name || ""} ${m.last_name || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [teamMembers, searchTerm, user.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !content.trim()) {
      toast.error("Please select a recipient and write a message.");
      return;
    }
    setIsSending(true);

    const { error } = await supabase.from("messages").insert({
      recipient_id: recipientId,
      sender_id: user.id,
      content: content,
    });

    setIsSending(false);
    if (error) {
      toast.error("Failed to send message.");
      console.error(error);
    } else {
      toast.success("Message sent!");
      onSuccess();
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setRecipientId("");
    setContent("");
    setSearchTerm("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">New Message</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="recipient"
              className="block text-sm font-medium text-gray-700"
            >
              Recipient
            </label>
            <input
              type="text"
              placeholder="Search for a team member..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            <select
              id="recipient"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm"
              required
              size={5} // Show multiple options to suggest it's a list
            >
              <option value="" disabled>
                Select a recipient
              </option>
              {filteredMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {`${member.first_name || ""} ${member.last_name || ""}`.trim()}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-6">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700"
            >
              Message
            </label>
            <textarea
              id="content"
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSending ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
