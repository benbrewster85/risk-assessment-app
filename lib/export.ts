import { RaEntry, Asset } from './types';

function escapeCsvCell(cellData: string | number | boolean | null | undefined): string {
    const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
    if (/[",\n\r]/.test(stringData)) {
        const escapedString = stringData.replace(/"/g, '""');
        return `"${escapedString}"`;
    }
    return stringData;
}

// This function is for Risk Assessments and remains unchanged
export function convertToCsv(data: RaEntry[]): string {
    const headers = [
        "Activity / Task", "Hazard", "Risk", "Who is Affected?",
        "Initial Likelihood", "Initial Impact", "Initial Risk",
        "Control Measures",
        "Resultant Likelihood", "Resultant Impact", "Resultant Risk"
    ];
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

// This function for exporting assets is now corrected
export function exportAssetsToCsv(data: Asset[]): string {
    const headers = [
        "System ID", "Category", "Manufacturer", "Model", "Serial Number",
        "Status", "Assigned To", "Last Calibrated", "Calibration Cycle (Months)"
    ];
    
    const rows = data.map(asset => {
        const directAssignee = `${asset.assignee_first_name || ''} ${asset.assignee_last_name || ''}`.trim();
        const parentAssignee = `${asset.parent_assignee_first_name || ''} ${asset.parent_assignee_last_name || ''}`.trim();
        const assigneeName = directAssignee || parentAssignee || 'In Stores';

        const rowData = [
            escapeCsvCell(asset.system_id),
            escapeCsvCell(asset.category_name),
            escapeCsvCell(asset.manufacturer),
            escapeCsvCell(asset.model),
            escapeCsvCell(asset.serial_number),
            escapeCsvCell(asset.status),
            escapeCsvCell(assigneeName),
            escapeCsvCell(asset.last_calibrated_date),
            escapeCsvCell(asset.calibration_cycle_months),
        ];
        return rowData.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
}