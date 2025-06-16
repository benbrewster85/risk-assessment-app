import { RiskAssessment } from "@/lib/types";

type ReportHeaderProps = {
  ra: RiskAssessment;
};

export default function ReportHeader({ ra }: ReportHeaderProps) {
  return (
    <header className="border-b-2 border-black pb-4 mb-8">
      <h1 className="text-3xl font-bold text-gray-800">{ra.project.name}</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mt-2">{ra.name}</h2>
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        {ra.project.reference && (
          <p>
            <strong>Project Ref:</strong> {ra.project.reference}
          </p>
        )}
        {ra.project.location_address && (
          <p>
            <strong>Location:</strong> {ra.project.location_address}
          </p>
        )}
      </div>
    </header>
  );
}
