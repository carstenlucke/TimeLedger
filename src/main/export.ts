import fs from 'fs';
import PDFDocument from 'pdfkit';
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
   * Export report to PDF format
   */
  public async exportToPDF(report: ProjectReport[], filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Title
        doc.fontSize(20).text('TimeLedger - Zeitbericht', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, { align: 'center' });
        doc.moveDown(2);

        // Calculate totals
        const totalHours = report.reduce((sum, p) => sum + p.total_hours, 0);
        const totalValue = report.reduce((sum, p) => sum + (p.total_value || 0), 0);

        // Summary section
        doc.fontSize(14).text('Zusammenfassung', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11).text(`Gesamtstunden: ${totalHours.toFixed(2)} h`);
        if (totalValue > 0) {
          doc.text(`Gesamtwert: ${totalValue.toFixed(2)} €`);
        }
        doc.moveDown(2);

        // Projects
        for (const project of report) {
          // Project header
          doc.fontSize(14).text(project.project_name, { underline: true });
          if (project.client_name) {
            doc.fontSize(10).fillColor('#666666').text(`Kunde: ${project.client_name}`).fillColor('#000000');
          }
          doc.moveDown(0.5);

          // Project summary
          doc.fontSize(11).text(`Stunden: ${project.total_hours.toFixed(2)} h`);
          if (project.hourly_rate) {
            doc.text(`Stundensatz: ${project.hourly_rate.toFixed(2)} €`);
          }
          if (project.total_value) {
            doc.text(`Wert: ${project.total_value.toFixed(2)} €`);
          }
          doc.moveDown();

          // Entries table
          if (project.entries.length > 0) {
            doc.fontSize(10);
            const tableTop = doc.y;
            const colWidths = { date: 80, start: 60, end: 60, duration: 80, description: 200 };

            // Table header
            doc.font('Helvetica-Bold');
            doc.text('Datum', 50, tableTop, { width: colWidths.date, continued: false });
            doc.text('Start', 130, tableTop, { width: colWidths.start, continued: false });
            doc.text('Ende', 190, tableTop, { width: colWidths.end, continued: false });
            doc.text('Dauer', 250, tableTop, { width: colWidths.duration, continued: false });
            doc.text('Beschreibung', 330, tableTop, { width: colWidths.description, continued: false });
            doc.moveDown();

            // Table rows
            doc.font('Helvetica');
            for (const entry of project.entries) {
              const rowY = doc.y;

              // Check if we need a new page
              if (rowY > 700) {
                doc.addPage();
              }

              const durationHours = (entry.duration_minutes / 60).toFixed(2);

              doc.text(entry.date, 50, doc.y, { width: colWidths.date, continued: false });
              doc.text(entry.start_time || '-', 130, rowY, { width: colWidths.start, continued: false });
              doc.text(entry.end_time || '-', 190, rowY, { width: colWidths.end, continued: false });
              doc.text(`${durationHours} h`, 250, rowY, { width: colWidths.duration, continued: false });
              doc.text(entry.description || '-', 330, rowY, { width: colWidths.description, continued: false });
              doc.moveDown(0.5);
            }
          }

          doc.moveDown(2);
        }

        // Footer
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          doc.fontSize(8).text(
            `Seite ${i + 1} von ${pages.count}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );
        }

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', (error) => reject(error));
      } catch (error) {
        reject(error);
      }
    });
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
