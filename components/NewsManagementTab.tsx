"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal"; // Assuming a generic Modal component exists
import { Plus, Edit2, Trash2 } from "react-feather";

// Define the shape of a news item
type TeamNewsItem = {
  id: string;
  created_at: string;
  title: string;
  content: string;
  author_id: string;
  author: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

type NewsManagementTabProps = {
  teamId: string;
  isAdmin: boolean;
};

export default function NewsManagementTab({
  teamId,
  isAdmin,
}: NewsManagementTabProps) {
  const supabase = createClient();
  const [newsItems, setNewsItems] = useState<TeamNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  // State for the Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeamNewsItem | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemContent, setNewItemContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all news items on component mount
  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("team_news")
        .select(
          `
          id, created_at, title, content, author_id,
          author:profiles (first_name, last_name)
        `
        )
        .eq("team_id", teamId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to fetch news: " + error.message);
      } else if (data) {
        // Supabase returns joined data as an array, so we flatten it
        const formattedData = data.map((item) => ({
          ...item,
          author: Array.isArray(item.author) ? item.author[0] : item.author,
        }));
        setNewsItems(formattedData);
      }
      setLoading(false);
    };

    fetchNews();
  }, [supabase, teamId]);

  const openModal = (item: TeamNewsItem | null = null) => {
    setEditingItem(item);
    setNewItemTitle(item ? item.title : "");
    setNewItemContent(item ? item.content : "");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to post news.");
      setIsSubmitting(false);
      return;
    }

    const newsData = {
      team_id: teamId,
      author_id: user.id,
      title: newItemTitle,
      content: newItemContent,
    };

    const query = editingItem
      ? supabase.from("team_news").update(newsData).eq("id", editingItem.id)
      : supabase.from("team_news").insert(newsData);

    const { data, error } = await query
      .select("*, author:profiles(first_name, last_name)")
      .single();

    if (error) {
      toast.error("Failed to save post: " + error.message);
    } else if (data) {
      const updatedItem = {
        ...data,
        author: Array.isArray(data.author) ? data.author[0] : data.author,
      };
      if (editingItem) {
        // Update existing item in the list
        setNewsItems(
          newsItems.map((item) =>
            item.id === updatedItem.id ? updatedItem : item
          )
        );
      } else {
        // Add new item to the top of the list
        setNewsItems([updatedItem, ...newsItems]);
      }
      toast.success(`Post ${editingItem ? "updated" : "added"} successfully!`);
      setIsModalOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (itemId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this post? This cannot be undone."
      )
    )
      return;

    const { error } = await supabase
      .from("team_news")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast.error("Failed to delete post: " + error.message);
    } else {
      setNewsItems(newsItems.filter((item) => item.id !== itemId));
      toast.success("Post deleted.");
    }
  };

  if (loading) return <p>Loading news...</p>;

  return (
    <>
      <Modal
        title={editingItem ? "Edit Post" : "Add New Post"}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              required
              rows={8}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="py-2 px-4 border rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? "Saving..." : "Save Post"}
            </button>
          </div>
        </form>
      </Modal>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Team News & Announcements</h2>
          {isAdmin && (
            <button
              onClick={() => openModal()}
              className="bg-blue-600 text-white font-bold py-2 px-3 text-sm rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Post
            </button>
          )}
        </div>
        <div className="space-y-8">
          {newsItems.length > 0 ? (
            newsItems.map((item) => (
              <div key={item.id} className="border-b last:border-b-0 pb-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {item.title}
                  </h3>
                  {isAdmin && (
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                      <button
                        onClick={() => openModal(item)}
                        className="p-1 text-gray-400 hover:text-indigo-600"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Posted by{" "}
                  <strong>
                    {item.author
                      ? `${item.author.first_name} ${item.author.last_name}`
                      : "Unknown User"}
                  </strong>{" "}
                  on {new Date(item.created_at).toLocaleDateString()}
                </p>
                <p className="mt-4 text-gray-700 whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-8">
              No news has been posted yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
