import { RaEntry } from "@/lib/types";

type ReportMatrixTableProps = {
  entries: RaEntry[];
};

const getRiskColor = (score: number) => {
  if (score >= 15) return "bg-red-500 text-white";
  if (score >= 9) return "bg-orange-500 text-white";
  if (score >= 5) return "bg-yellow-400 text-black";
  return "bg-green-500 text-white";
};

export default function ReportMatrixTable({ entries }: ReportMatrixTableProps) {
  return (
    <section className="mt-8 break-after-page">
      <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4">
        Risk Assessment Matrix
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100 print:bg-gray-100">
            <tr>
              <th className="border p-2 font-semibold text-left">
                Activity / Task
              </th>
              <th className="border p-2 font-semibold text-left">Hazard</th>
              <th className="border p-2 font-semibold text-left">Risk</th>
              <th className="border p-2 font-semibold text-left">
                Who is Affected?
              </th>
              <th
                className="border p-1 font-semibold"
                title="Initial Likelihood"
              >
                IL
              </th>
              <th className="border p-1 font-semibold" title="Initial Impact">
                II
              </th>
              <th className="border p-1 font-semibold" title="Initial Risk">
                IR
              </th>
              <th className="border p-2 font-semibold text-left">
                Control Measures
              </th>
              <th
                className="border p-1 font-semibold"
                title="Resultant Likelihood"
              >
                RL
              </th>
              <th className="border p-1 font-semibold" title="Resultant Impact">
                RI
              </th>
              <th className="border p-1 font-semibold" title="Resultant Risk">
                RR
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length > 0 ? (
              entries.map((entry) => {
                const initialRisk =
                  entry.initial_likelihood * entry.initial_impact;
                const resultantRisk =
                  entry.resultant_likelihood * entry.resultant_impact;
                return (
                  <tr key={entry.id} className="break-inside-avoid">
                    <td className="border p-2 align-top">
                      {entry.task_description}
                    </td>
                    <td className="border p-2 align-top">
                      {entry.hazard?.name}
                    </td>
                    <td className="border p-2 align-top">{entry.risk?.name}</td>
                    <td className="border p-2 align-top">
                      {entry.person_affected}
                    </td>
                    <td className="border p-1 text-center align-top">
                      {entry.initial_likelihood}
                    </td>
                    <td className="border p-1 text-center align-top">
                      {entry.initial_impact}
                    </td>
                    <td
                      className={`border p-1 text-center font-bold align-top ${getRiskColor(initialRisk)}`}
                    >
                      {initialRisk}
                    </td>
                    <td className="border p-2 align-top">
                      {entry.control_measures}
                    </td>
                    <td className="border p-1 text-center align-top">
                      {entry.resultant_likelihood}
                    </td>
                    <td className="border p-1 text-center align-top">
                      {entry.resultant_impact}
                    </td>
                    <td
                      className={`border p-1 text-center font-bold align-top ${getRiskColor(resultantRisk)}`}
                    >
                      {resultantRisk}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="p-4 text-center text-gray-500">
                  No entries found for this risk assessment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
