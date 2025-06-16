"use client";

import { createClient } from "@/lib/supabase/client"; // Import the client function
import { TeamMember, Signatory, Signature } from "@/lib/types";
import { useState, useEffect } from "react";

type SignatoryManagerProps = {
  raId: string;
  teamId: string;
  currentUserId: string;
  isCurrentUserAdmin: boolean;
  teamMembers: TeamMember[];
  initialSignatories: Signatory[];
  initialSignatures: Signature[];
  onUpdate: () => void;
};

export default function SignatoryManager({
  raId,
  teamId,
  currentUserId,
  isCurrentUserAdmin,
  teamMembers,
  initialSignatories,
  initialSignatures,
  onUpdate,
}: SignatoryManagerProps) {
  const supabase = createClient(); // THIS IS THE MISSING LINE
  const [signatories, setSignatories] = useState<Set<string>>(
    new Set(initialSignatories.map((s) => s.user_id))
  );
  const [signatures, setSignatures] = useState<Map<string, string>>(
    new Map(initialSignatures.map((s) => [s.user_id, s.signed_at]))
  );

  useEffect(() => {
    setSignatories(new Set(initialSignatories.map((s) => s.user_id)));
    setSignatures(
      new Map(initialSignatures.map((s) => [s.user_id, s.signed_at]))
    );
  }, [initialSignatories, initialSignatures]);

  const handleToggleSignatory = async (
    targetUserId: string,
    isRequired: boolean
  ) => {
    if (isRequired) {
      const { error } = await supabase
        .from("ra_signatories")
        .insert({ ra_id: raId, user_id: targetUserId, team_id: teamId });
      if (error) {
        alert(`Error adding signatory: ${error.message}`);
      } else {
        onUpdate();
      }
    } else {
      const { error } = await supabase
        .from("ra_signatories")
        .delete()
        .match({ ra_id: raId, user_id: targetUserId });
      if (error) {
        alert(`Error removing signatory: ${error.message}`);
      } else {
        onUpdate();
      }
    }
  };

  const handleSign = async () => {
    if (
      !window.confirm(
        "By signing, you confirm you have been briefed on and understand the risks and control measures outlined in this assessment."
      )
    )
      return;
    const { error } = await supabase
      .from("ra_signatures")
      .insert({ ra_id: raId, user_id: currentUserId, team_id: teamId });
    if (error) {
      alert(`Error signing: ${error.message}`);
    } else {
      onUpdate();
    }
  };

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-4">Signatories</h2>
      <div className="bg-white rounded-lg shadow p-6">
        <ul className="space-y-4">
          {teamMembers.map((member) => {
            const isRequired = signatories.has(member.id);
            const signature = signatures.get(member.id);
            const canUserSign =
              isRequired && !signature && member.id === currentUserId;
            const displayName =
              `${member.first_name || ""} ${member.last_name || ""}`.trim() ||
              "Unnamed User";

            return (
              <li
                key={member.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
              >
                <div className="flex items-center">
                  {isCurrentUserAdmin && (
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-4"
                      checked={isRequired}
                      onChange={(e) =>
                        handleToggleSignatory(member.id, e.target.checked)
                      }
                    />
                  )}
                  <span className="font-medium">{displayName}</span>
                </div>
                <div className="flex items-center">
                  {signature ? (
                    <span className="text-sm text-green-700 font-semibold">
                      Signed on{" "}
                      {new Date(signature).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  ) : isRequired ? (
                    <span className="text-sm text-yellow-700 font-semibold">
                      Awaiting Signature
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Not Required</span>
                  )}
                  {canUserSign && (
                    <button
                      onClick={handleSign}
                      className="ml-4 bg-green-600 text-white font-bold py-1 px-3 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Sign Now
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
