// components/CompetencyMatrix.tsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-hot-toast";

// --- Type Definitions ---
type UserCompetency = {
  competency_id: string;
  expiry_date: string | null;
};

type MatrixMember = {
  id: string;
  full_name: string;
  user_competencies: UserCompetency[] | null;
};

type Competency = {
  id: string;
  name: string;
};

type MatrixData = {
  competencies: Competency[];
  members: MatrixMember[];
};

// --- Helper Function for Status Colors ---
const getExpiryStatus = (
  expiryDate: string | null
): "green" | "amber" | "red" | null => {
  // ... (This is the same function from your profile page)
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  thirtyDaysFromNow.setHours(0, 0, 0, 0);

  if (expiry < today) return "red";
  if (expiry <= thirtyDaysFromNow) return "amber";
  return "green";
};

// --- Main Component ---
export default function CompetencyMatrix({ teamId }: { teamId: string }) {
  const supabase = createClient();
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchMatrixData = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.rpc("get_team_competency_matrix", {
        team_id_param: teamId,
      });

      if (error) {
        toast.error("Failed to load competency matrix data.");
        console.error(error);
      } else {
        setMatrixData(data);
      }
      setIsLoading(false);
    };

    if (teamId) {
      fetchMatrixData();
    }
  }, [teamId, supabase]);

  const filteredMembers = useMemo(() => {
    if (!matrixData?.members) return [];
    if (!filter) return matrixData.members;
    return matrixData.members.filter((member) =>
      member.full_name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [matrixData, filter]);

  if (isLoading) {
    return <div className="p-4">Loading matrix...</div>;
  }

  if (!matrixData || !matrixData.competencies || !matrixData.members) {
    return <div className="p-4">No competency data found for this team.</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by member name..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="block w-full md:w-1/3 rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              {matrixData.competencies.map((comp) => (
                <th
                  key={comp.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {comp.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.map((member) => (
              <tr key={member.id}>
                <td className="sticky left-0 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {member.full_name}
                </td>
                {matrixData.competencies.map((comp) => {
                  const userCompetency = member.user_competencies?.find(
                    (uc) => uc.competency_id === comp.id
                  );
                  const status = userCompetency
                    ? getExpiryStatus(userCompetency.expiry_date)
                    : null;

                  const statusInfo = status
                    ? {
                        red: {
                          color: "bg-red-500",
                          title: `Expired on ${new Date(userCompetency?.expiry_date || "").toLocaleDateString()}`,
                        },
                        amber: {
                          color: "bg-yellow-500",
                          title: `Expires on ${new Date(userCompetency?.expiry_date || "").toLocaleDateString()}`,
                        },
                        green: {
                          color: "bg-green-500",
                          title: `Valid until ${new Date(userCompetency?.expiry_date || "").toLocaleDateString()}`,
                        },
                      }[status]
                    : undefined;

                  return (
                    <td
                      key={comp.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >
                      <div className="flex justify-center items-center">
                        <div
                          className={`h-6 w-6 rounded-full ${statusInfo ? statusInfo.color : "bg-gray-200"}`}
                          title={statusInfo ? statusInfo.title : "Not Held"}
                        ></div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
