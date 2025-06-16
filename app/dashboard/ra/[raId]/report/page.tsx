import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { RiskAssessment, RaEntry } from "@/lib/types";
import ReportPrintLayout from "@/components/ReportPrintLayout";
import ReportHeader from "@/components/ReportHeader";
import ReportMatrixTable from "@/components/ReportMatrixTable"; // Import the new component

type ReportPageProps = {
  params: { raId: string };
};

export default async function ReportPage({ params }: ReportPageProps) {
  const supabase = createClient();
  const { raId } = params;

  // Fetch the RA details AND all of its entries in parallel
  const [raResult, entriesResult] = await Promise.all([
    supabase
      .from("risk_assessments")
      .select("*, project:projects(*)")
      .eq("id", raId)
      .single(),
    supabase
      .from("ra_entries")
      .select(
        `
            id, task_description, person_affected, initial_likelihood, initial_impact,
            control_measures, resultant_likelihood, resultant_impact,
            hazard:hazards(name), risk:risks(name)
        `
      )
      .eq("ra_id", raId)
      .order("id", { ascending: true }),
  ]);

  const ra = raResult.data;
  if (raResult.error || !ra) {
    notFound();
  }

  // Transform the entries data to handle the nested structure
  const entries = (entriesResult.data || []).map((entry) => ({
    ...entry,
    hazard: Array.isArray(entry.hazard) ? entry.hazard[0] : entry.hazard,
    risk: Array.isArray(entry.risk) ? entry.risk[0] : entry.risk,
  }));

  // TODO in next steps:
  // - Fetch signatories
  // - Fetch dynamic risks

  return (
    <ReportPrintLayout>
      <ReportHeader ra={ra as RiskAssessment} />

      {/* UPDATED: We now render our new matrix table component */}
      <ReportMatrixTable entries={entries as RaEntry[]} />

      {/* We will add the other report components here in the next steps */}
      <div className="my-8 p-4 bg-gray-100 rounded-md text-center text-gray-500">
        <p>Dynamic Risk Log Section - Coming Soon</p>
      </div>
      <div className="my-8 p-4 bg-gray-100 rounded-md text-center text-gray-500">
        <p>Signatories Section - Coming Soon</p>
      </div>
    </ReportPrintLayout>
  );
}
