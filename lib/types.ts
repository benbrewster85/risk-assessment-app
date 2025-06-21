export type Project = {
    id: string;
    name: string;
    reference: string | null;
    team_id: string;
    location_address: string | null;
    location_what3words: string | null;
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

export type RiskAssessment = { 
    id: string; 
    name: string; 
    description: string | null; 
    project: Project;
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

export type Team = {
    id: string;
    name: string;
    logo_url: string | null;
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

export type AssetCategory = {
    id: string;
    name: string;
    owner_id: string | null;
    owner: {
        first_name: string | null;
        last_name: string | null;
    } | null;
};

export type Asset = {
    id: string;
    system_id: string;
    team_id: string;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    status: string | null;
    status_id: string | null;
    created_at: string;
    category_id: string | null;
    current_assignee_id: string | null;
    parent_asset_id: string | null;
    last_calibrated_date: string | null;
    calibration_cycle_months: number | null;
    category_name: string | null;
    assignee_first_name: string | null;
    assignee_last_name: string | null;
    parent_assignee_first_name: string | null;
    parent_assignee_last_name: string | null;
};

export type AssetIssue = {
    id: string;
    asset_id: string; // The missing foreign key ID
    created_at: string;
    log_notes: string;
    log_type: string;
    event_date: string | null;
    status: string;
    resolution_notes: string | null;
    resolved_at: string | null;
    reporter: {
        first_name: string | null;
        last_name: string | null;
    } | null;
    resolver: {
        first_name: string | null;
        last_name: string | null;
    } | null;
    photos: {
        id: string;
        file_path: string;
    }[];
    // The optional nested asset from the join
    asset?: {
        system_id: string;
    } | null;
};

// These are the types that were missing from the Vercel build log
export type ReportSignatory = {
    profiles: {
        first_name: string | null;
        last_name: string | null;
        role: string;
        id: string;
    } | null;
};

export type ReportSignature = {
    signed_at: string;
    profiles: {
        first_name: string | null;
        last_name: string | null;
        id: string;
    } | null;
};


