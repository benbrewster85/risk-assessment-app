import { RaEntry, Asset, Vehicle } from './types';

function escapeCsvCell(cellData: string | number | boolean | null | undefined): string {
    const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
    if (/[",\n\r]/.test(stringData)) {
        const escapedString = stringData.replace(/"/g, '""');
        return `"${escapedString}"`;
    }
    return stringData;
}

export function convertToCsv(data: RaEntry[]): string {
    const headers = [ "Activity / Task", "Hazard", "Risk", "Who is Affected?", "Initial Likelihood", "Initial Impact", "Initial Risk", "Control Measures", "Resultant Likelihood", "Resultant Impact", "Resultant Risk" ];
    const rows = data.map(entry => {
        const initialRisk = entry.initial_likelihood * entry.initial_impact;
        const resultantRisk = entry.resultant_likelihood * entry.resultant_impact;
        const rowData = [
            escapeCsvCell(entry.task_description), escapeCsvCell(entry.hazard?.name), escapeCsvCell(entry.risk?.name),
            escapeCsvCell(entry.person_affected), entry.initial_likelihood, entry.initial_impact, initialRisk,
            escapeCsvCell(entry.control_measures), entry.resultant_likelihood, entry.resultant_impact, resultantRisk
        ];
        return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}

export function exportAssetsToCsv(data: Asset[]): string {
    const headers = [ "System ID", "Category", "Manufacturer", "Model", "Serial Number", "Status", "Assigned To", "Last Calibrated", "Calibration Cycle (Months)" ];
    const rows = data.map(asset => {
        const directAssignee = `${asset.assignee_first_name || ''} ${asset.assignee_last_name || ''}`.trim();
        const parentAssignee = `${asset.parent_assignee_first_name || ''} ${asset.parent_assignee_last_name || ''}`.trim();
        const assigneeName = directAssignee || parentAssignee || 'In Stores';
        const rowData = [
            escapeCsvCell(asset.system_id), escapeCsvCell(asset.category_name), escapeCsvCell(asset.manufacturer),
            escapeCsvCell(asset.model), escapeCsvCell(asset.serial_number), escapeCsvCell(asset.status),
            escapeCsvCell(assigneeName), escapeCsvCell(asset.last_calibrated_date), escapeCsvCell(asset.calibration_cycle_months),
        ];
        return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}

// NEW: Dedicated function for exporting vehicles
export function exportVehiclesToCsv(data: Vehicle[]): string {
    const headers = [ "Registration", "Manufacturer", "Model", "Assigned To", "Last Serviced", "Service Cycle (Months)", "MOT Due" ];
    const rows = data.map(vehicle => {
        const assigneeName = `${(vehicle as any).assignee_first_name || ''} ${(vehicle as any).assignee_last_name || ''}`.trim() || '--';
        const rowData = [
            escapeCsvCell(vehicle.registration_number),
            escapeCsvCell(vehicle.manufacturer),
            escapeCsvCell(vehicle.model),
            escapeCsvCell(assigneeName),
            escapeCsvCell(vehicle.last_serviced_date),
            escapeCsvCell(vehicle.service_cycle_months),
            escapeCsvCell(vehicle.mot_due_date),
        ];
        return rowData.join(',');
    });
    return [headers.join(','), ...rows].join('\n');
}