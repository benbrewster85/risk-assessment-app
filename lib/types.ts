export type Project = {
    id: string;
    team_id: string;
    name: string;
    reference: string | null;
    cost_code: string | null;
    client_contact: string | null;
    document_status: string | null;
    location_address: string | null;
    brief_statement: string | null;
    method_statement: string | null;
    version: string | null;
    project_manager_id: string | null;
    project_manager_external_name: string | null;
    site_lead_id: string | null;
    site_lead_external_name: string | null;
    job_description: string | null;
    color?: string | null;
    latitude: number | null;    
    longitude: number | null;  
};
export type ProjectListItem = { id: string; name: string; reference: string | null; last_edited_at: string; document_status: string | null; location_address: string | null; latitude: number | null; longitude: number | null; color?: string | null; };
export type Task = { id: string; project_id: string; team_id: string; title: string; description: string | null; status: 'Not Started' | 'In Progress' | 'Completed'; progress: number; sort_order: number; created_at: string; duration_shifts?: number; personnel_count?: number;actual_shifts_logged?: number; };
export type TeamMember = { id: string; first_name: string | null; last_name: string | null; role: string; is_fleet_manager?: boolean;  };
export type RiskAssessmentListItem = { id: string; name: string; description: string | null; created_at: string; };
export type RiskAssessment = { id: string; name: string; description: string | null; project: Project; };
export type RaEntry = { id: number; task_description: string | null; hazard_id: string; hazard: { name: string; } | null; risk_id: string; risk: { name: string; } | null; person_affected: string | null; initial_likelihood: number; initial_impact: number; control_measures: string | null; resultant_likelihood: number; resultant_impact: number; };
export type Team = { id: string; name: string; logo_url: string | null; };
export type Signatory = { user_id: string; };
export type Signature = { user_id: string; signed_at: string; };


export type AssetCategory = {
    id: string;
    name: string;
    owner_id: string | null;
    asset_category_class: string | null;
    owner: {
        first_name: string | null;
        last_name: string | null;
    } | null;
};
export type Asset = { id: string; system_id: string; team_id: string; manufacturer: string | null; model: string | null; serial_number: string | null; status: string | null; status_id: string | null; created_at: string; category_id: string | null; current_assignee_id: string | null; parent_asset_id: string | null; last_calibrated_date: string | null; calibration_cycle_months: number | null; category_name: string | null; assignee_first_name: string | null; assignee_last_name: string | null; parent_assignee_first_name: string | null; parent_assignee_last_name: string | null; asset_categories: {
    asset_category_class: string;
  } | null; };
export type AssetIssue = { id: string; asset_id: string; created_at: string; log_notes: string; log_type: string; event_date: string | null; status: string; resolution_notes: string | null; resolved_at: string | null; reporter: { first_name: string | null; last_name: string | null; } | null; resolver: { first_name: string | null; last_name: string | null; } | null; photos: { id: string; file_path: string; }[]; asset?: { system_id: string; } | null; };
export type Vehicle = { id: string; team_id: string; registration_number: string; manufacturer: string | null; model: string | null; owner_id: string | null; current_assignee_id: string | null; last_serviced_date: string | null; service_cycle_months: number; mot_due_date: string | null; created_at: string; };
export type VehicleEvent = { id: string; created_at: string; log_notes: string | null; log_type: string; event_date: string | null; status: string; resolution_notes: string | null; resolved_at: string | null; reporter: { first_name: string | null; last_name: string | null; } | null; resolver: { first_name: string | null; last_name: string | null; } | null; attachments: { id: string; file_path: string; }[]; };
export type VehicleMileageLog = { id: number; journey_date: string; start_mileage: number; end_mileage: number | null; notes: string | null; user: { first_name: string | null; last_name: string | null; } | null; };
export type DynamicRisk = { id: number; logged_at: string; risk_description: string; control_measures_taken: string; personnel_on_site: string | null; is_safe_to_continue: boolean; risk_status: string | null; logged_by: { first_name: string | null; last_name: string | null; } | null; };

export type EventLogTask = {
    task_id: string;
    status_on_report: string;
    progress_on_report: number;
    progress_at_shift_start: number;
    notes: string | null;
    task: {
        title: string;
    } | null;
};

export type EventLog = {
    id: string;
    log_type: string;
    created_at: string;
    start_time: string;
    end_time: string | null;
    work_completed: string | null;
    notes: string | null;
    project: {
        id: string;
        name: string;
    } | null;
    created_by: {
        id: string;
        first_name: string | null;
        last_name: string | null;
    } | null;
    log_data: any;
    tasks: EventLogTask[];
};

export type AssetActivityLog = {
    event_log: EventLog | null;
};

export type VehicleActivityLog = {
    event_log: EventLog | null;
};

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

// Add these to the bottom of lib/types.ts

export type ResourceType = 'personnel' | 'equipment' | 'vehicles' | 'all';
export type ShiftType = 'day' | 'night';
export type ShiftView = 'all' | 'day' | 'night';

export interface WorkItem {
  id: string;
  name: string;
  type: "project" | "equipment" | "vehicle" | "personnel" | "absence";
  color: string;
  duration?: number;
  category?: 'personnel' | 'equipment' | 'vehicle'; 
}

export interface Assignment {
  id: string;
  date: string;
  shift: ShiftType;
  resourceId: string;
  workItemId: string;
  assignmentType: 'project' | 'equipment' | 'vehicle' | 'absence';
  resourceType?: 'personnel' | 'equipment' | 'vehicles'; // Add this
  duration?: number;
}

export interface WorkItem {
  id: string;
  name: string;
  type: 'project' | 'absence' | 'equipment' | 'vehicle' | 'personnel';
  color: string;
  category?: 'personnel' | 'equipment' | 'vehicle';  
  duration?: number;
}

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  color: string;
  avatar?: string;
  job_role_id?: string | null;
  sub_team_id?: string | null;
  line_manager_id?: string | null;
  category_id?: string | null;
  job_role_name?: string | null;
}


export interface SchedulerNote {
  id: string;
  resourceId: string;
  date: string;
  shift: ShiftType;
  text: string;
}

export interface DayEvent {
  id: string;
  date: string; // Format: YYYY-MM-DD
  text: string;
  type: 'holiday' | 'event' | 'blocker';
  color: string;
}

export interface Message {
  id: number;
  created_at: string;
  sender_id: string | null;
  recipient_id: string;
  content: string | null;
  is_read: boolean;
  acknowledged_at: string | null; 
  sender: {
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface TaskSummary {
  title: string;
  status: string;
}

export interface NextJobDetails {
  project_id: string;
  project_name: string;
  brief_statement: string;
  location_address: string;
  event_date: string;
  shift_pattern: string;
  tasks: TaskSummary[];
}

export type Competency = { 
  id: string; 
  name: string; 
  category: 'certification' | 'training' | 'competence';
  description: string | null;
};

export type UserCompetency = {
  id: string;
  user_id: string;
  competency_id: string;
  achieved_date: string;
  expiry_date: string | null;
  certificate_file_path: string | null;
  competencies: { name: string }[] | null; 
  competency: { // Renamed from 'competencies' to singular for clarity
    name: string;
  } | null;
};
