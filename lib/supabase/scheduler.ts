import { createClient } from "@/lib/supabase/client";
import { Resource, WorkItem, Assignment, SchedulerNote, DayEvent } from "@/lib/types";

const supabase = createClient();

// In lib/supabase/scheduler.ts

// Fetches all people, equipment, and vehicles and formats them as 'Resource' objects
export async function getSchedulableResources(teamId: string): Promise<Resource[]> {
  // --- This part for fetching profiles remains the same ---
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('team_id', teamId);
  if (pError) throw pError;



  // =================================================================
  // START: UPDATED EQUIPMENT FETCHING LOGIC
  // =================================================================

  // Step 1: Get the IDs of all 'primary' asset categories for the team.
  const { data: primaryCategoryIds, error: cError } = await supabase
    .from('asset_categories')
    .select('id')
    .eq('team_id', teamId)
    .eq('asset_category_class', 'Primary');
  
  if (cError) throw cError;

  // If there are no primary categories, we can stop here to avoid an error.
  if (!primaryCategoryIds || primaryCategoryIds.length === 0) {
    // This part for fetching vehicles remains the same
    const { data: vehicles, error: vError } = await supabase.from('vehicles').select('id, registration_number').eq('team_id', teamId);
    if (vError) throw vError;
    const personnel: Resource[] = profiles?.map((p: any) => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), type: 'personnel' })) || [];
    const allVehicles: Resource[] = vehicles?.map((v: any) => ({ id: v.id, name: v.registration_number, type: 'vehicles' })) || [];
    return [...personnel, ...allVehicles]; // Return just personnel and vehicles
  }

  // Extract just the IDs into a simple array.
  const categoryIdList = primaryCategoryIds.map(c => c.id);

  // Step 2: Get all assets that belong to one of those categories using the .in() filter.
  const { data: assets, error: aError } = await supabase
    .from('assets')
    .select('id, system_id')
    .eq('team_id', teamId)
    .in('category_id', categoryIdList); // <-- Use the list of IDs to filter assets

  if (aError) throw aError;

  // =================================================================
  // END: UPDATED EQUIPMENT FETCHING LOGIC
  // =================================================================

  // --- This part for fetching vehicles remains the same ---
  const { data: vehicles, error: vError } = await supabase
    .from('vehicles')
    .select('id, registration_number')
    .eq('team_id', teamId);
  if (vError) throw vError;

  // --- Mapping the results remains the same ---
  const personnel: Resource[] = profiles?.map((p: any) => ({ id: p.id, name: `${p.first_name || ''} ${p.last_name || ''}`.trim(), type: 'personnel' })) || [];
  const equipment: Resource[] = assets?.map((a: any) => ({ id: a.id, name: a.system_id, type: 'equipment' })) || [];
  const allVehicles: Resource[] = vehicles?.map((v: any) => ({ id: v.id, name: v.registration_number, type: 'vehicles' })) || [];

  return [...personnel, ...equipment, ...allVehicles];
}

// This function now accepts a teamId
export async function getSchedulableWorkItems(teamId: string): Promise<WorkItem[]> {
  const { data: projects, error: pError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('team_id', teamId); // <-- The crucial filter
  if (pError) throw pError;

  const { data: absences, error: aError } = await supabase
    .from('absence_types')
    .select('id, name, color')
    .eq('team_id', teamId); // <-- The crucial filter
  if (aError) throw aError;

  const projectItems: WorkItem[] = projects?.map((p: any) => ({ id: p.id, name: p.name, type: 'project', color: 'bg-orange-500' })) || [];
  const absenceItems: WorkItem[] = absences?.map((a: any) => ({ id: a.id, name: a.name, type: 'absence', color: a.color })) || [];

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

  const assignments: Assignment[] = (rawAssignments || []).map((a: any) => {
    let assignmentType: any = 'project';
    let workItemId = a.project_id;
    let resourceId = a.personnel_id;

    if (a.asset_id) {
      assignmentType = 'equipment';
      workItemId = a.asset_id;
    } else if (a.vehicle_id) {
      assignmentType = 'vehicle';
      workItemId = a.vehicle_id;
    } else if (a.absence_type_id) { // <-- The new logic
      assignmentType = 'absence';
      workItemId = a.absence_type_id;
    }

    return {
      id: a.id,
      date: a.assignment_date,
      shift: a.shift,
      resourceId: resourceId,
      workItemId: workItemId,
      assignmentType: assignmentType,
    };
  });

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
export async function createAssignment(assignment: Assignment, teamId: string) {
  const assignmentData = {
    team_id: teamId,
    assignment_date: assignment.date,
    shift: assignment.shift,
    project_id: assignment.assignmentType === 'project' ? assignment.workItemId : null,
    personnel_id: assignment.resourceId,
    asset_id: assignment.assignmentType === 'equipment' ? assignment.workItemId : null,
    vehicle_id: assignment.assignmentType === 'vehicle' ? assignment.workItemId : null,
    absence_type_id: assignment.assignmentType === 'absence' ? assignment.workItemId : null, // <-- The new logic
  };

  const { data, error } = await supabase
    .from('schedule_assignments')
    .insert(assignmentData)
    .select()
    .single();

  if (error) throw error;
  return data as Assignment;
}

// DELETES an assignment from the database
export async function deleteAssignment(assignmentId: string) {
  const { error } = await supabase
    .from('schedule_assignments')
    .delete()
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
    event_date: eventData.date, // <-- The crucial fix: map `date` to `event_date`
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