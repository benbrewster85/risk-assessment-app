"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import { v4 as uuidv4 } from "uuid";
import type { Asset, AssetIssue } from "@/lib/types";

type LogAssetIssueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newIssue: AssetIssue) => void;
  asset: Asset;
  userId: string;
};

export default function LogAssetIssueModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
  userId,
}: LogAssetIssueModalProps) {
  const supabase = createClient();
  const [issueDetails, setIssueDetails] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDetails) {
      toast.error("Please provide details about the issue.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: issueData, error: issueError } = await supabase
        .from("asset_issues")
        .insert({
          asset_id: asset.id,
          team_id: asset.team_id,
          reported_by_id: userId,
          log_notes: issueDetails,
          log_type: "Issue",
        })
        .select("id")
        .single();
      if (issueError) throw issueError;

      if (photos.length > 0) {
        const photoUploadPromises = photos.map((file) => {
          const fileExt = file.name.split(".").pop();
          const filePath = `${asset.team_id}/${issueData.id}/${uuidv4()}.${fileExt}`;
          return supabase.storage
            .from("asset-issue-photos")
            .upload(filePath, file);
        });
        const uploadResults = await Promise.all(photoUploadPromises);

        const photoRecords = [];
        for (const result of uploadResults) {
          if (result.error) throw result.error;
          if (!result.data?.path)
            throw new Error(
              "File upload succeeded but did not return a valid path."
            );
          photoRecords.push({
            issue_id: issueData.id,
            file_path: result.data.path,
          });
        }

        if (photoRecords.length > 0) {
          const { error: photoError } = await supabase
            .from("asset_issue_photos")
            .insert(photoRecords);
          if (photoError) throw photoError;
        }
      }

      const { data: finalIssue, error: finalError } = await supabase
        .from("asset_issues")
        .select(
          "*, reporter:reported_by_id(first_name, last_name), photos:asset_issue_photos(id, file_path)"
        )
        .eq("id", issueData.id)
        .single();

      if (finalError) throw finalError;

      toast.success("Issue logged successfully!");
      onSuccess(finalIssue as AssetIssue);
      onClose();
    } catch (error) {
      console.error("Failed to log issue. Full error object:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unknown error occurred. See console for details.";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title={`Log Issue for ${asset.system_id}`}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="issueDetails" className="block text-sm font-medium">
            Issue Details
          </label>
          <textarea
            id="issueDetails"
            value={issueDetails}
            onChange={(e) => setIssueDetails(e.target.value)}
            rows={5}
            required
            className="mt-1 block w-full"
          />
        </div>
        <div>
          <label htmlFor="photos" className="block text-sm font-medium">
            Upload Photos (Optional)
          </label>
          <input
            id="photos"
            type="file"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf"
            className="mt-1 block w-full text-sm"
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
            className="py-2 px-4 border rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Submitting..." : "Log Issue"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
