import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import {
  RiskAssessment,
  RaEntry,
  DynamicRisk,
  ReportSignatory,
  ReportSignature,
} from "@/lib/types";
import ReportPrintLayout from "@/components/ReportPrintLayout";
import ReportHeader from "@/components/ReportHeader";
import ReportMatrixTable from "@/components/ReportMatrixTable";
import ReportDynamicRiskLog from "@/components/ReportDynamicRiskLog";
import ReportSignatories from "@/components/ReportSignatories";

type ReportPageProps = {
  params: { raId: string };
};

export default async function ReportPage({ params }: ReportPageProps) {
  const supabase = createClient();
  const { raId } = params;

  const { data: ra, error: raError } = await supabase
    .from("risk_assessments")
    .select("*, project:projects(*)")
    .eq("id", raId)
    .single();

  if (raError || !ra) {
    notFound();
  }

  const [
    entriesResult,
    dynamicRisksResult,
    signatoriesResult,
    signaturesResult,
  ] = await Promise.all([
    supabase
      .from("ra_entries")
      .select(
        `id, task_description, person_affected, initial_likelihood, initial_impact,
            control_measures, resultant_likelihood, resultant_impact,
            hazard:hazards(name), risk:risks(name)`
      )
      .eq("ra_id", raId)
      .order("id"),
    supabase
      .from("dynamic_risks")
      .select("*, logged_by:profiles(first_name, last_name)")
      .eq("project_id", ra.project.id)
      .order("logged_at", { ascending: false }),
    supabase
      .from("ra_signatories")
      .select("profiles(id, first_name, last_name, role)")
      .eq("ra_id", raId),
    supabase
      .from("ra_signatures")
      .select("signed_at, profiles(id, first_name, last_name)")
      .eq("ra_id", raId),
  ]);

  const entries = (entriesResult.data || []).map((entry) => ({
    ...entry,
    hazard: Array.isArray(entry.hazard) ? entry.hazard[0] : entry.hazard,
    risk: Array.isArray(entry.risk) ? entry.risk[0] : entry.risk,
  }));

  const dynamicRisks = (dynamicRisksResult.data || []).map((risk) => ({
    ...risk,
    logged_by: Array.isArray(risk.logged_by)
      ? risk.logged_by[0]
      : risk.logged_by,
  }));

  // NEW: Transform the signatory and signature data to fix the type mismatch
  const signatories = (signatoriesResult.data || []).map((item) => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  }));

  const signatures = (signaturesResult.data || []).map((item) => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
  }));

  return (
    <ReportPrintLayout>
      <ReportHeader ra={ra as RiskAssessment} />
      <ReportMatrixTable entries={entries as RaEntry[]} />
      <ReportDynamicRiskLog risks={dynamicRisks as DynamicRisk[]} />
      <ReportSignatories
        signatories={signatories as ReportSignatory[]}
        signatures={signatures as ReportSignature[]}
      />
    </ReportPrintLayout>
  );
}
