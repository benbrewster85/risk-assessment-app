"use client";

import { createClient } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type MethodStatementTabProps = {
  project: Project;
  isCurrentUserAdmin: boolean;
  onUpdate: (updatedProject: Project) => void;
};

export default function MethodStatementTab({
  project,
  isCurrentUserAdmin,
  onUpdate,
}: MethodStatementTabProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [methodStatement, setMethodStatement] = useState(
    project.method_statement || ""
  );

  useEffect(() => {
    setMethodStatement(project.method_statement || "");
  }, [project]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updateData = {
      method_statement: methodStatement,
      last_edited_at: new Date().toISOString(),
    };

    const { data: updatedProject, error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", project.id)
      .select("*")
      .single();

    if (error) {
      toast.error(`Failed to save Method Statement: ${error.message}`);
    } else if (updatedProject) {
      toast.success("Method Statement saved successfully!");
      onUpdate(updatedProject);
    }
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSaveChanges}
      className="space-y-6 bg-white p-6 rounded-lg shadow"
    >
      <div>
        <label
          htmlFor="methodStatement"
          className="block text-2xl font-bold text-gray-800"
        >
          Method Statement
        </label>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Describe the step-by-step process for carrying out the work safely.
        </p>
        <textarea
          id="methodStatement"
          value={methodStatement}
          onChange={(e) => setMethodStatement(e.target.value)}
          rows={20}
          className="block w-full"
          readOnly={!isCurrentUserAdmin}
          placeholder={
            isCurrentUserAdmin
              ? "Start writing here..."
              : "No method statement written yet."
          }
        />
      </div>
      {isCurrentUserAdmin && (
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2 px-6 border rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Save Method Statement"}
          </button>
        </div>
      )}
    </form>
  );
}
