"use client";

import { createClient } from "@/lib/supabase/client";
import { Project } from "@/lib/types";
import { useState } from "react";
import { toast } from "react-hot-toast";

type MethodStatementTabProps = {
  project: Project;
  isCurrentUserAdmin: boolean;
};

export default function MethodStatementTab({
  project,
  isCurrentUserAdmin,
}: MethodStatementTabProps) {
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This state will hold the content of the text area
  const [methodStatement, setMethodStatement] = useState(
    project.method_statement || ""
  );

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from("projects")
      .update({ method_statement: methodStatement })
      .eq("id", project.id);

    if (error) {
      toast.error(`Failed to save Method Statement: ${error.message}`);
    } else {
      toast.success("Method Statement saved successfully!");
    }
    setIsSubmitting(false);
  };

  return (
    <form
      onSubmit={handleSaveChanges}
      className="space-y-6 bg-white p-8 rounded-lg shadow"
    >
      <div>
        <label
          htmlFor="methodStatement"
          className="block text-lg font-bold text-gray-800"
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
          rows={25}
          className="block w-full rounded-md border-gray-300 shadow-sm font-mono text-sm focus:ring-blue-500 focus:border-blue-500 read-only:bg-gray-50"
          readOnly={!isCurrentUserAdmin}
          placeholder={
            isCurrentUserAdmin
              ? "Start writing your method statement here..."
              : "No method statement has been written yet."
          }
        />
      </div>

      {/* The save button is only shown to admins */}
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
