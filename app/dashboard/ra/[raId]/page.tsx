import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RiskAssessmentClientPage from "@/components/RiskAssessmentClientPage";
import {
  RiskAssessment,
  RaEntry,
  TeamMember,
  Signatory,
  Signature,
} from "@/lib/types";

type RaPageProps = {
  params: {
    raId: string;
  };
};

export default async function RaPage({ params }: RaPageProps) {
  const supabase = createClient();
  const { raId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return notFound();
  }

  // Fetch the risk assessment first to get the team_id
  const { data: ra, error: raError } = await supabase
    .from("risk_assessments")
    .select("*, project:projects(id, name, team_id)")
    .eq("id", raId)
    .single();

  if (raError || !ra) {
    return notFound();
  }

  // Now fetch the rest in parallel
  const [
    entriesResult,
    teamMembersResult,
    signatoriesResult,
    signaturesResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("ra_entries")
      .select("*, hazard:hazards(name), risk:risks(name)")
      .eq("ra_id", raId),
    supabase
      .from("profiles")
      .select("id, first_name, last_name, role")
      .eq("team_id", ra.project?.team_id || ""),
    supabase.from("ra_signatories").select("user_id").eq("ra_id", raId),
    supabase
      .from("ra_signatures")
      .select("user_id, signed_at")
      .eq("ra_id", raId),
    supabase.from("profiles").select("role").eq("id", user.id).single(),
  ]);

  return (
    <RiskAssessmentClientPage
      initialRa={ra as RiskAssessment}
      initialEntries={(entriesResult.data as RaEntry[]) || []}
      teamMembers={(teamMembersResult.data as TeamMember[]) || []}
      initialSignatories={(signatoriesResult.data as Signatory[]) || []}
      initialSignatures={(signaturesResult.data as Signature[]) || []}
      currentUserId={user.id}
      currentUserRole={profileResult.data?.role || "user"}
    />
  );
}
