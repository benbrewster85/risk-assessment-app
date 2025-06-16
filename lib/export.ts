import { RaEntry } from './types';

function escapeCsvCell(cellData: string | number | boolean | null | undefined): string {
    const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
    if (/[",\n\r]/.test(stringData)) {
        const escapedString = stringData.replace(/"/g, '""');
        return `"${escapedString}"`;
    }
    return stringData;
}

export function convertToCsv(data: RaEntry[]): string {
    const headers = ["Activity / Task", "Hazard", "Risk", "Who is Affected?", "Initial Likelihood", "Initial Impact", "Initial Risk", "Control Measures", "Resultant Likelihood", "Resultant Impact", "Resultant Risk"];
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