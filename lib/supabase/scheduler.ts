import { createClient } from "@/lib/supabase/client";
import { Resource, WorkItem, Assignment, SchedulerNote, DayEvent, ShiftType, ResourceType } from "@/lib/types";

const supabase = createClient();

// This interface defines the shape of the data returned by the function
export interface SchedulableResourcesData {
  resources: Resource[];
  filterOptions: {
    jobRoles: { id: string; name: string }[];
    subTeams: { id: string; name: string }[];
    lineManagers: { id: string; name: string }[];
    assetCategories: { id: string; name: string }[];
  };
}

// Fetches all people, equipment, and vehicles and formats them as 'Resource' objects
export async function getSchedulableResources(teamId: string): Promise<SchedulableResourcesData> {
  // 1. Fetch profiles with new fields
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, job_role_id, sub_team_id, line_manager_id')
    .eq('team_id', teamId);
  if (pError) throw pError;

  // 2. Fetch related data for filter dropdowns
  const { data: jobRoles, error: jError } = await supabase.from('job_roles').select('id, name').eq('team_id', teamId);
  if (jError) throw jError;

  const { data: subTeams, error: sError } = await supabase.from('sub_teams').select('id, name').eq('team_id', teamId);
  if (sError) throw sError;
  
  const { data: assets, error: aError } = await supabase.from('assets').select('id, system_id, category_id').eq('team_id', teamId);
  if (aError) throw aError;
  
  // ADDED: Fetch Asset Categories for the filter dropdown
  const { data: assetCategories, error: cError } = await supabase.from('asset_categories').select('id, name').eq('team_id', teamId);
  if (cError) throw cError;

  const { data: vehicles, error: vError } = await supabase.from('vehicles').select('id, registration_number').eq('team_id', teamId);
  if (vError) throw vError;

  // 4. Map profiles to Resource type
  const personnel: Resource[] = profiles?.map((p: any) => ({
    id: p.id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    type: 'personnel',
    job_role_id: p.job_role_id,
    sub_team_id: p.sub_team_id,
    line_manager_id: p.line_manager_id,
  })) || [];

  const equipment: Resource[] = assets?.map((a: any) => ({
    id: a.id,
    name: a.system_id,
    type: 'equipment',
    category_id: a.category_id,
  })) || [];

  const allVehicles: Resource[] = vehicles?.map((v: any) => ({ id: v.id, name: v.registration_number, type: 'vehicles' })) || [];

  const allResources = [...personnel, ...equipment, ...allVehicles];
  
  // Line managers are just other people in the team
  const lineManagers = profiles?.map((p: any) => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() })) || [];

  return {
    resources: allResources,
    filterOptions: {
      jobRoles: jobRoles || [],
      subTeams: subTeams || [],
      lineManagers: lineManagers,
      assetCategories: assetCategories || [], // ADDED: Include categories in the return object
    },
  };
}

// This function now accepts a teamId
export async function getSchedulableWorkItems(teamId: string): Promise<WorkItem[]> {
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('team_id', teamId);
  if (pError) throw pError;

  const { data: absences, error: aError } = await supabase
    .from('absence_types')
    .select('id, name, color, category')
    .eq('team_id', teamId);
  if (aError) throw aError;

  const projectItems: WorkItem[] = projects?.map((p: any) => ({ id: p.id, name: p.name, type: 'project', color: 'bg-orange-500' })) || [];
  const absenceItems: WorkItem[] = absences?.map((a: any) => ({
    id: a.id,
    name: a.name,
    type: 'absence',
    color: a.color,
    category: a.category,
  })) || [];

  return [...projectItems, ...absenceItems];
}

// This function now accepts a teamId

export async function getSchedulerData(teamId: string) {
  const { data: rawAssignments, error: aError } = await supabase.from('schedule_assignments').select('*').eq('team_id', teamId);
  if (aError) throw aError;
  
  const { data: rawNotes, error: nError } = await supabase.from('schedule_notes').select('*').eq('team_id', teamId);
  if (nError) throw nError;

  const { data: rawDayEvents, error: dError } = await supabase.from('day_events').select('*').eq('team_id', teamId);
  if (dError) throw dError;

  const assignments: Assignment[] = (rawAssignments || [])
    .map((a: any) => {
    let assignmentType: any;
    let workItemId: string | null = null;
    let resourceId: string | null = null;

    if (a.absence_type_id) {
        // Case 1: Absence assignment
        assignmentType = 'absence';
        workItemId = a.absence_type_id;
        // The resource is whichever of the other columns is filled
        resourceId = a.personnel_id || a.asset_id || a.vehicle_id;
    } else if (a.project_id) {
        // Case 2: Project assignment
        assignmentType = 'project';
        workItemId = a.project_id;
          resourceId = a.personnel_id;
    } else {
        // Case 3: Person assigned to Equipment/Vehicle
        resourceId = a.personnel_id;
    if (a.asset_id) {
      assignmentType = 'equipment';
      workItemId = a.asset_id;
    } else if (a.vehicle_id) {
      assignmentType = 'vehicle';
      workItemId = a.vehicle_id;
        }
    }

    return {
      id: a.id,
      date: a.assignment_date,
      shift: a.shift,
      resourceId: resourceId,
      workItemId: workItemId,
      assignmentType: assignmentType,
    };
    })
    .filter((a): a is Assignment => !!a.resourceId && !!a.workItemId);

  const notes: SchedulerNote[] = (rawNotes || []).map((n: any) => ({
    id: n.id,
    resourceId: n.resource_id,
    date: n.note_date,
    shift: n.shift,
    text: n.text_content,
  }));

  const dayEvents: DayEvent[] = (rawDayEvents || []).map((e: any) => ({
    id: e.id,
    date: e.event_date,
    text: e.text,
    type: e.type,
    color: e.color,
  }));
  
  return { assignments, notes, dayEvents };
}

// CREATES a new assignment in the database
export async function createAssignment(assignment: Assignment, teamId: string, targetResourceType: ResourceType) {
  const dataToInsert: { [key: string]: any } = {
    team_id: teamId,
    assignment_date: assignment.date,
    shift: assignment.shift,
    project_id: null,
    personnel_id: null,
    asset_id: null,
    vehicle_id: null,
    absence_type_id: null,
  };

  if (assignment.assignmentType === 'project' || assignment.assignmentType === 'absence') {
    // Use Case 1: A work item (Project/Absence) is assigned TO a resource.
    if (assignment.assignmentType === 'project') {
      dataToInsert.project_id = assignment.workItemId;
    } else {
      dataToInsert.absence_type_id = assignment.workItemId;
    }

    // The resource the work is assigned to
  if (targetResourceType === 'personnel') {
    dataToInsert.personnel_id = assignment.resourceId;
  } else if (targetResourceType === 'equipment') {
    dataToInsert.asset_id = assignment.resourceId;
  } else if (targetResourceType === 'vehicles') {
    dataToInsert.vehicle_id = assignment.resourceId;
  }
  } else if (assignment.assignmentType === 'equipment' || assignment.assignmentType === 'vehicle') {
    dataToInsert.personnel_id = assignment.resourceId;
    
    if (assignment.assignmentType === 'equipment') {
      dataToInsert.asset_id = assignment.workItemId;
    } else {
      dataToInsert.vehicle_id = assignment.workItemId;
    }
  }

  const { data, error } = await supabase
    .from('schedule_assignments')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw error;
  }

  // Format the raw database response to match the front-end 'Assignment' type
  const formattedAssignment: Assignment = {
    id: data.id,
    date: data.assignment_date,
    shift: data.shift,
    resourceId: data.personnel_id || data.asset_id || data.vehicle_id,
    workItemId: data.project_id || data.asset_id || data.vehicle_id || data.absence_type_id,
    assignmentType: assignment.assignmentType,
    duration: assignment.duration,
  };

  return formattedAssignment;
}


// DELETES an assignment from the database
export async function deleteAssignment(assignmentId: string) {
  const { error } = await supabase
    .from('schedule_assignments')
    .delete()
    .eq('id', assignmentId);

  if (error) throw error;
}

// UPDATES an existing assignment in the database
export async function updateAssignment(
  assignmentId: string,
  updates: { resourceId: string; date: string; shift: ShiftType }
) {
  const { error } = await supabase
    .from('schedule_assignments')
    .update({
      personnel_id: updates.resourceId,
      assignment_date: updates.date,
      shift: updates.shift,
    })
    .eq('id', assignmentId);

  if (error) throw error;
}

// Creates a new day event in the database
// Creates a new day event in the database
export async function createDayEvent(dayEvent: DayEvent, teamId: string) {
  // Omit the temporary front-end ID from the object
  const { id, ...eventData } = dayEvent;

  // Create a new object that perfectly matches the database table's columns
  const dataToInsert = {
    event_date: eventData.date,
    text: eventData.text,
    type: eventData.type,
    color: eventData.color,
    team_id: teamId,
  };

  const { data, error } = await supabase
    .from('day_events')
    .insert(dataToInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Deletes a day event from the database
export async function deleteDayEvent(eventId: string) {
  const { error } = await supabase
    .from('day_events')
    .delete()
    .eq('id', eventId);
  
  if (error) throw error;
}

// In lib/supabase/scheduler.ts

// In lib/supabase/scheduler.ts

export async function createNote(noteData: Omit<SchedulerNote, 'id'>, teamId: string) {
  const { data: rawNote, error } = await supabase
    .from('schedule_notes')
    .insert({
      resource_id: noteData.resourceId,
      note_date: noteData.date,
      shift: noteData.shift,
      text_content: noteData.text,
      team_id: teamId,
    })
    .select()
    .single();
  
  if (error) throw error;

  // Add the transformation to match the front-end type
  const formattedNote: SchedulerNote = {
    id: rawNote.id,
    resourceId: rawNote.resource_id,
    date: rawNote.note_date,
    shift: rawNote.shift,
    text: rawNote.text_content,
  };

  return formattedNote;
}

export async function updateNote(noteId: string, newText: string) {
  const { data: rawNote, error } = await supabase
    .from('schedule_notes')
    .update({ text_content: newText })
    .eq('id', noteId)
    .select()
    .single();
    
  if (error) throw error;

  // Add the transformation to match the front-end type
  const formattedNote: SchedulerNote = {
    id: rawNote.id,
    resourceId: rawNote.resource_id,
    date: rawNote.note_date,
    shift: rawNote.shift,
    text: rawNote.text_content,
  };

  return formattedNote;
}

export async function deleteNote(noteId: string) {
  // If the ID is temporary, we don't need to call the database.
  if (noteId.startsWith('temp-')) {
    return;
  }
  const { error } = await supabase
    .from('schedule_notes')
    .delete()
    .eq('id', noteId);

  if (error) throw error;
}