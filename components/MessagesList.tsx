// components/MessagesList.tsx
"use client";

import { useState } from "react";
import { Message } from "@/lib/types";
import { User } from "@supabase/supabase-js"; // Import the User type
import { Trash2, MessageSquareReply, ThumbsUp, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function MessagesList({
  messages: initialMessages,
  user,
}: {
  messages: Message[];
  user: User | null;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState<string | null>(null);

  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");

  if (messages.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow text-center text-gray-500">
        <p>You have no messages.</p>
      </div>
    );
  }

  // --- NEW: handleSendReply LOGIC ---
  const handleSendReply = async (originalMessage: Message) => {
    if (!replyContent.trim() || !user || !originalMessage.sender_id) {
      return;
    }

    const { error } = await supabase.from("messages").insert({
      content: replyContent,
      sender_id: user.id, // The current user is the sender
      recipient_id: originalMessage.sender_id, // The original sender is the new recipient
    });

    if (error) {
      console.error("Error sending reply:", error);
      setError("Could not send reply. Please try again.");
    } else {
      // Success! Clear the UI.
      setReplyContent("");
      setReplyingToId(null);
      alert("Reply sent successfully!");
    }
  };

  const handleAcknowledge = async (messageId: number) => {
    // We will build the full logic for sending a message in the next step
    alert(`Sending reply: "${replyContent}" to message ID: ${replyingToId}`);
    setReplyContent("");
    setReplyingToId(null);
  };
  const handleDelete = async (messageId: number) => {
    if (!window.confirm("Are you sure you want to delete this message?"))
      return;
    const { error } = await supabase.rpc("delete_message", {
      message_id: messageId,
    });
    if (error) {
      setError("Could not delete the message.");
    } else {
      setMessages((currentMessages) =>
        currentMessages.filter((msg) => msg.id !== messageId)
      );
    }
  };

  const toggleReply = (messageId: number) => {
    setReplyingToId((currentId) =>
      currentId === messageId ? null : messageId
    );
    setReplyContent("");
  };

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>
      )}
      {messages.map((message) => {
        const senderName =
          message.sender?.first_name || message.sender?.last_name
            ? `${message.sender.first_name || ""} ${message.sender.last_name || ""}`.trim()
            : "System Message";

        const isReplying = replyingToId === message.id;

        return (
          <div
            key={message.id}
            className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="font-bold text-gray-800">{senderName}</p>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(message.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                {message.acknowledged_at && (
                  <div className="flex items-center justify-end mt-1 text-xs text-green-600">
                    <Check size={14} className="mr-1" /> Acknowledged
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 border-t pt-3 mt-3">
              <button
                onClick={() => handleAcknowledge(message.id)}
                disabled={!!message.acknowledged_at}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-green-600 p-2 rounded-md disabled:text-green-600 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {message.acknowledged_at ? (
                  <Check size={16} className="mr-1.5" />
                ) : (
                  <ThumbsUp size={16} className="mr-1.5" />
                )}
                {message.acknowledged_at ? "Acknowledged" : "Acknowledge"}
              </button>
              <button
                onClick={() => toggleReply(message.id)}
                className={`flex items-center text-sm font-medium p-2 rounded-md ${isReplying ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"}`}
              >
                <MessageSquareReply size={16} className="mr-1.5" />
                {isReplying ? "Cancel" : "Reply"}
              </button>
              <button
                onClick={() => handleDelete(message.id)}
                className="flex items-center text-sm font-medium text-gray-500 hover:text-red-600 p-2 rounded-md"
              >
                <Trash2 size={16} className="mr-1.5" />
                Delete
              </button>
            </div>

            {/* Inline Reply Box (conditionally rendered) */}
            {isReplying && (
              <div className="mt-4 border-t pt-4">
                <textarea
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  rows={3}
                  placeholder={`Replying to ${message.sender?.first_name || "sender"}...`}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  autoFocus
                />
                <div className="mt-2 text-right">
                  <button
                    // Pass the original message object to the handler
                    onClick={() => handleSendReply(message)}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    disabled={!replyContent.trim()}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
