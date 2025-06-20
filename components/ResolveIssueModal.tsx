"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import type { AssetIssue } from "@/lib/types";

type ResolveIssueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedIssue: AssetIssue) => void;
  issue: AssetIssue | null;
};

export default function ResolveIssueModal({
  isOpen,
  onClose,
  onSuccess,
  issue,
}: ResolveIssueModalProps) {
  const supabase = createClient();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When a new issue is selected, reset the notes field
  useEffect(() => {
    if (isOpen) {
      setResolutionNotes("");
    }
  }, [isOpen]);

  if (!issue) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes) {
      toast.error("Please provide resolution notes.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { error: rpcError } = await supabase.rpc("resolve_asset_issue", {
        p_issue_id: issue.id,
        p_resolution_notes: resolutionNotes,
      });

      if (rpcError) throw rpcError;

      // UPDATED: This query is now explicit and will not cause an error.
      const { data: updatedIssue, error: fetchError } = await supabase
        .from("asset_issues")
        .select(
          "*, reporter:reported_by_id(first_name, last_name), resolver:resolved_by_id(first_name, last_name), photos:asset_issue_photos(id, file_path)"
        )
        .eq("id", issue.id)
        .single();

      if (fetchError) throw fetchError;

      toast.success("Issue resolved successfully!");
      onSuccess(updatedIssue as AssetIssue);
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Failed to resolve issue: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Resolve Issue for ${issue.log_type}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium">Issue Details:</p>
          <p className="text-sm text-gray-600 mt-1 p-2 border rounded-md bg-gray-50">
            {issue.log_notes}
          </p>
        </div>
        <div>
          <label
            htmlFor="resolutionNotes"
            className="block text-sm font-medium"
          >
            Resolution Notes
          </label>
          <textarea
            id="resolutionNotes"
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            rows={5}
            required
            className="mt-1 block w-full"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="mr-2 py-2 px-4 border rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-4 border rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Mark as Resolved"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
