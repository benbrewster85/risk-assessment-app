import { createClient } from "@/lib/supabase/client";
import { Resource, WorkItem, Assignment, SchedulerNote, DayEvent, ShiftType, ResourceType } from "@/lib/types";
import { BulkAssignFormData } from "@/components/BulkAssignModal";
import { DailyForecast } from "@/lib/supabase/weather";

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
  // 1. The 'select' statement now joins with job_roles to get the name
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, job_role_id, sub_team_id, line_manager_id, job_roles(name)')
    .eq('team_id', teamId);
  if (pError) throw pError;

  const { data: jobRoles, error: jError } = await supabase.from('job_roles').select('id, name').eq('team_id', teamId);
  if (jError) throw jError;

  const { data: subTeams, error: sError } = await supabase.from('sub_teams').select('id, name').eq('team_id', teamId);
  if (sError) throw sError;
  
  const { data: assets, error: aError } = await supabase
    .from('assets')
    .select('id, system_id, category_id, manufacturer, model, asset_categories!inner(asset_category_class)')
    .eq('team_id', teamId)
    .eq('asset_categories.asset_category_class', 'Primary');
if (aError) throw aError;
  
  const { data: assetCategories, error: cError } = await supabase.from('asset_categories').select('id, name').eq('team_id', teamId);
  if (cError) throw cError;

  const { data: vehicles, error: vError } = await supabase.from('vehicles').select('id, registration_number, manufacturer, model').eq('team_id', teamId);
  if (vError) throw vError;

  // 2. The mapping now uses the nested job_roles object
  const personnel: Resource[] = profiles?.map((p: any) => ({
    id: p.id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim(),
    type: 'personnel',
    job_role_id: p.job_role_id,
    sub_team_id: p.sub_team_id,
    line_manager_id: p.line_manager_id,
    job_role_name: p.job_roles ? p.job_roles.name : null,
    color: 'bg-blue-200 text-blue-800 border-blue-300'
  })) || [];

  const equipment: Resource[] = assets?.map((a: any) => ({
    id: a.id,
    name: a.system_id,
    type: 'equipment',
    category_id: a.category_id,
    manufacturer: a.manufacturer, 
  model: a.model,               
    color: 'bg-slate-200 text-blue-500 border-blue-300',
  })) || [];

  const allVehicles: Resource[] = vehicles?.map((v: any) => ({
  id: v.id,
  name: v.registration_number,
  type: 'vehicles',
  manufacturer: v.manufacturer, 
  model: v.model,               
  color: 'bg-slate-200 border-green-300 text-green-500',
})) || [];
  const allResources = [...personnel, ...equipment, ...allVehicles];
  const lineManagers = profiles?.map((p: any) => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim() })) || [];

  return {
    resources: allResources,
    filterOptions: {
      jobRoles: jobRoles || [],
      subTeams: subTeams || [],
      lineManagers: lineManagers,
      assetCategories: assetCategories || [],
    },
  };
}

// This function now accepts a teamId
export async function getSchedulableWorkItems(teamId: string): Promise<WorkItem[]> {
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, name, color')
    .eq('team_id', teamId)
    .neq('document_status', 'Completed');
  if (pError) throw pError;

  console.log("Fetched projects from database:", projects);

  const { data: absences, error: aError } = await supabase
    .from('absence_types')
    .select('id, name, color, category')
    .eq('team_id', teamId);
  if (aError) throw aError;

  const projectItems: WorkItem[] = projects?.map((p: any) => ({
    id: p.id,
    name: p.name,
    type: 'project',
    color: (p.color || 'bg-gray-200 text-gray-800').replace(/'/g, ''),
  })) || [];
  
  const absenceItems: WorkItem[] = absences?.map((a: any) => ({
    id: a.id,
    name: a.name,
    type: 'absence',
    color: (a.color || 'bg-gray-200 text-gray-800').replace(/'/g, ''),
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
          // Absence assignment
          assignmentType = 'absence';
          workItemId = a.absence_type_id;
          resourceId = a.personnel_id || a.asset_id || a.vehicle_id;
      } else if (a.project_id) {
          // Project assignment
          assignmentType = 'project';
          workItemId = a.project_id;
          // CORRECTED: A project can be assigned to a person, asset, or vehicle
          resourceId = a.personnel_id || a.asset_id || a.vehicle_id;
      } else {
          // Person assigned to Equipment/Vehicle
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
    .filter((a): a is Assignment => !!a.resourceId && !!a.workItemId && !!a.assignmentType);

  const notes: SchedulerNote[] = (rawNotes || []).map((n: any) => ({
    id: n.id, resourceId: n.resource_id, date: n.note_date, shift: n.shift, text: n.text_content,
  }));

  const dayEvents: DayEvent[] = (rawDayEvents || []).map((e: any) => ({
    id: e.id, date: e.event_date, text: e.text, type: e.type, color: e.color,
  }));
  
  return { assignments, notes, dayEvents };
}

// CREATES a new assignment in the database
export async function createAssignment(assignment: Assignment, teamId: string, targetResourceType: ResourceType) {
  const dataToInsert: { [key: string]: any } = {
    team_id: teamId,
    assignment_date: assignment.date,
    shift: assignment.shift,
    project_id: null, personnel_id: null, asset_id: null, vehicle_id: null, absence_type_id: null,
  };

  if (assignment.assignmentType === 'project' || assignment.assignmentType === 'absence') {
    if (assignment.assignmentType === 'project') dataToInsert.project_id = assignment.workItemId;
    else dataToInsert.absence_type_id = assignment.workItemId;

    if (targetResourceType === 'personnel') dataToInsert.personnel_id = assignment.resourceId;
    else if (targetResourceType === 'equipment') dataToInsert.asset_id = assignment.resourceId;
    else if (targetResourceType === 'vehicles') dataToInsert.vehicle_id = assignment.resourceId;
    
  } else if (assignment.assignmentType === 'equipment' || assignment.assignmentType === 'vehicle') {
    if (targetResourceType === 'personnel') {
        dataToInsert.personnel_id = assignment.resourceId;
        if (assignment.assignmentType === 'equipment') {
            dataToInsert.asset_id = assignment.workItemId;
        } else {
            dataToInsert.vehicle_id = assignment.workItemId;
        }
    } else {
        dataToInsert.personnel_id = assignment.workItemId;
        if (assignment.assignmentType === 'equipment') {
            dataToInsert.asset_id = assignment.resourceId;
        } else {
            dataToInsert.vehicle_id = assignment.resourceId;
        }
    }
  }

  const { data, error } = await supabase.from('schedule_assignments').insert(dataToInsert).select().single();
  if (error) { console.error("Supabase insert error:", error); throw error; }

  // The logic in the return statement is now corrected
  return {
    id: data.id, date: data.assignment_date, shift: data.shift,
    resourceId: data.personnel_id || data.asset_id || data.vehicle_id,
    // ✅ CORRECTED ORDER: Check for project/absence IDs first.
    workItemId: data.project_id || data.absence_type_id || data.asset_id || data.vehicle_id,
    assignmentType: assignment.assignmentType,
    duration: assignment.duration,
  } as Assignment;
}

export async function createBulkAssignments(
  formData: BulkAssignFormData,
  baseAssignment: Assignment,
  targetResourceType: ResourceType,
  teamId: string
) {
  const { startDate, endDate, shift, includeWeekends } = formData;
  if (!startDate || !endDate) throw new Error("Missing date range for bulk assign.");

  let personnelId: string | null = null;
  let assetId: string | null = null;
  let vehicleId: string | null = null;
  let projectId: string | null = null;
  let absenceTypeId: string | null = null;

  if (baseAssignment.assignmentType === 'project' || baseAssignment.assignmentType === 'absence') {
    if (baseAssignment.assignmentType === 'project') projectId = baseAssignment.workItemId;
    else absenceTypeId = baseAssignment.workItemId;
    if (targetResourceType === 'personnel') personnelId = baseAssignment.resourceId;
    else if (targetResourceType === 'equipment') assetId = baseAssignment.resourceId;
    else if (targetResourceType === 'vehicles') vehicleId = baseAssignment.resourceId;
  } else {
    personnelId = baseAssignment.resourceId;
    if (baseAssignment.assignmentType === 'equipment') assetId = baseAssignment.workItemId;
    else if (baseAssignment.assignmentType === 'vehicle') vehicleId = baseAssignment.workItemId;
  }
  
  const startUTC = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()));
  const endUTC = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
  
  const deleteQuery = supabase.from('schedule_assignments').delete()
    .gte('assignment_date', startUTC.toISOString().split('T')[0])
    .lte('assignment_date', endUTC.toISOString().split('T')[0]);

  if (personnelId) deleteQuery.eq('personnel_id', personnelId);
  if (assetId) deleteQuery.eq('asset_id', assetId);
  if (vehicleId) deleteQuery.eq('vehicle_id', vehicleId);
  if (projectId) deleteQuery.eq('project_id', projectId);
  if (absenceTypeId) deleteQuery.eq('absence_type_id', absenceTypeId);
  
  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw deleteError;

  const newAssignments: any[] = [];
  const dataPayload = {
    team_id: teamId,
    personnel_id: personnelId,
    asset_id: assetId,
    vehicle_id: vehicleId,
    project_id: projectId,
    absence_type_id: absenceTypeId,
  };

  let currentDate = new Date(startUTC);
  while (currentDate <= endUTC) {
    const day = currentDate.getUTCDay();
    if (includeWeekends || (day !== 0 && day !== 6)) {
      const dateString = currentDate.toISOString().split('T')[0];
      if (shift === 'day' || shift === 'both') {
        newAssignments.push({ ...dataPayload, assignment_date: dateString, shift: 'day' });
      }
      if (shift === 'night' || shift === 'both') {
        newAssignments.push({ ...dataPayload, assignment_date: dateString, shift: 'night' });
      }
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  if (newAssignments.length > 0) {
  const { error } = await supabase.from('schedule_assignments').insert(newAssignments);
    if (error) { console.error("Supabase bulk insert error:", error); throw error; }
  }
}

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
  updates: { resourceId: string; date: string; shift: ShiftType },
  targetResourceType: ResourceType // <-- Add this new parameter
) {
  const updatePayload: { [key: string]: any } = {
    assignment_date: updates.date,
    shift: updates.shift,
    // Reset all resource type IDs to null before setting the correct one
    personnel_id: null,
    asset_id: null,
    vehicle_id: null,
  };

  // Dynamically set the correct ID based on the resource type
  switch (targetResourceType) {
    case 'personnel':
      updatePayload.personnel_id = updates.resourceId;
      break;
    case 'equipment':
      updatePayload.asset_id = updates.resourceId;
      break;
    case 'vehicles':
      updatePayload.vehicle_id = updates.resourceId;
      break;
    default:
      // Optional: handle an unknown type if necessary
      throw new Error(`Invalid target resource type: ${targetResourceType}`);
  }

  const { error } = await supabase
    .from('schedule_assignments')
    .update(updatePayload)
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

export async function getCachedWeatherForDates(teamId: string, dates: Date[]): Promise<DailyForecast[]> {
  if (!teamId || dates.length === 0) {
    return [];
  }

  const dateStrings = dates.map(d => d.toISOString().split('T')[0]);
  
  const { data, error } = await supabase
    .from('daily_forecasts')
    .select('forecast_date, max_temp_celsius, min_temp_celsius, weather_icon_code')
    .eq('team_id', teamId)
    .in('forecast_date', dateStrings);

  if (error) {
    console.error("Error fetching cached weather:", error);
    return [];
  }
  
  return data as DailyForecast[];
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