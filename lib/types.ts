export type Project = {
    id: string;
    name: string;
    reference: string | null;
    team_id: string;
    location_address: string | null;
    location_what3words: string | null;
    // New Fields:
    scope: string | null;
    author: string | null;
    reviewer: string | null;
    document_status: string | null;
    version: string | null;
    method_statement: string | null;
};

export type ProjectListItem = {
    id: string;
    name: string;
    reference: string | null;
    last_edited_at: string;
};

export type RiskAssessmentListItem = {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
};

// THIS IS THE TYPE WE ARE UPDATING
export type RiskAssessment = { 
    id: string; 
    name: string; 
    description: string | null; 
    project: { 
        id: string; 
        name: string; 
        team_id: string;
        // The missing properties are now included
        reference: string | null;
        location_address: string | null;
        location_what3words: string | null;
    } 
};

export type RaEntry = {
    id: number;
    task_description: string | null;
    hazard_id: string;
    hazard: { name: string; } | null;
    risk_id: string;
    risk: { name: string; } | null;
    person_affected: string | null;
    initial_likelihood: number;
    initial_impact: number;
    control_measures: string | null;
    resultant_likelihood: number;
    resultant_impact: number;
};

export type TeamMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

export type Signatory = {
  user_id: string;
};

export type Signature = {
  user_id: string;
  signed_at: string;
};

export type DynamicRisk = {
    id: number;
    logged_at: string;
    risk_description: string;
    control_measures_taken: string;
    personnel_on_site: string | null;
    is_safe_to_continue: boolean;
    risk_status: string | null;
    logged_by: {
        first_name: string | null;
        last_name: string | null;
    } | null;
};