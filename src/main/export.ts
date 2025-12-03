import fs from 'fs';
import type { ProjectReport } from '../shared/types';

export class ExportManager {
  /**
   * Export report to CSV format
   */
  public exportToCSV(report: ProjectReport[]): string {
    const lines: string[] = [];

    // Header
    lines.push('Project,Client,Date,Start Time,End Time,Duration (hours),Description,Hourly Rate,Value');

    // Data rows
    for (const project of report) {
      for (const entry of project.entries) {
        const durationHours = (entry.duration_minutes / 60).toFixed(2);
        const value = project.hourly_rate
          ? (entry.duration_minutes / 60 * project.hourly_rate).toFixed(2)
          : '';

        const row = [
          this.escapeCsvValue(project.project_name),
          this.escapeCsvValue(project.client_name || ''),
          entry.date,
          entry.start_time || '',
          entry.end_time || '',
          durationHours,
          this.escapeCsvValue(entry.description || ''),
          project.hourly_rate?.toFixed(2) || '',
          value,
        ];

        lines.push(row.join(','));
      }
    }

    // Summary section
    lines.push('');
    lines.push('SUMMARY');
    lines.push('Project,Client,Total Hours,Hourly Rate,Total Value');

    for (const project of report) {
      const row = [
        this.escapeCsvValue(project.project_name),
        this.escapeCsvValue(project.client_name || ''),
        project.total_hours.toFixed(2),
        project.hourly_rate?.toFixed(2) || '',
        project.total_value?.toFixed(2) || '',
      ];

      lines.push(row.join(','));
    }

    return lines.join('\n');
  }

  /**
   * Export report to JSON format
   */
  public exportToJSON(report: ProjectReport[]): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Save export to file
   */
  public async saveToFile(content: string, filePath: string): Promise<void> {
    await fs.promises.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Escape CSV value (handle commas, quotes, newlines)
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
