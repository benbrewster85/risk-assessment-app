import { DynamicRisk } from "@/lib/types";

type ReportDynamicRiskLogProps = {
  risks: DynamicRisk[];
};

export default function ReportDynamicRiskLog({
  risks,
}: ReportDynamicRiskLogProps) {
  if (risks.length === 0) {
    return null; // Don't render the section if there are no dynamic risks
  }

  return (
    <section className="mt-8 break-before-page">
      <h3 className="text-xl font-bold border-b border-gray-400 pb-2 mb-4">
        Dynamic Risk Log
      </h3>
      <div className="space-y-4">
        {risks.map((risk) => {
          const loggerName =
            `${risk.logged_by?.first_name || ""} ${risk.logged_by?.last_name || ""}`.trim() ||
            "Unknown User";
          return (
            <div
              key={risk.id}
              className="border-b border-gray-200 pb-4 text-sm break-inside-avoid"
            >
              <p className="text-xs text-gray-500">
                Logged by {loggerName} on{" "}
                {new Date(risk.logged_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <p className="font-semibold">Identified Risk</p>
                  <p>{risk.risk_description}</p>
                </div>
                <div className="col-span-2">
                  <p className="font-semibold">Immediate Controls Taken</p>
                  <p>{risk.control_measures_taken}</p>
                </div>
                <div className="col-span-3">
                  <p>
                    <span className="font-semibold">Status:</span>{" "}
                    {risk.risk_status} |{" "}
                    <span className="font-semibold">Safe to Continue:</span>{" "}
                    <span
                      className={`${risk.is_safe_to_continue ? "text-green-700" : "text-red-700"}`}
                    >
                      {risk.is_safe_to_continue ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
