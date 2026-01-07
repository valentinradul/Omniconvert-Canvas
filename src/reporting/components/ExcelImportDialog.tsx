import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { ReportingMetric, ReportingCategory } from '@/types/reporting';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';

interface ParsedRow {
  metricName: string;
  matchedMetric: ReportingMetric | null;
  isNew: boolean;
  values: { date: string; value: number | null }[];
}

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: ReportingCategory;
  existingMetrics: ReportingMetric[];
  onImport: (data: {
    newMetrics: { name: string; categoryId: string }[];
    values: { metricId: string; metricName: string; periodDate: string; value: number }[];
  }) => Promise<void>;
}

// Parse various date formats from Excel column headers
const parseColumnDate = (header: string): string | null => {
  const headerClean = header.trim();
  if (!headerClean) return null;
  
  // Month name mappings (both short and full)
  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11
  };

  const lowerHeader = headerClean.toLowerCase();
  
  // First try manual regex patterns (more reliable than date-fns for varied formats)
  
  // Pattern: "October 2022", "September 2022", "June 2022" (full/short month name with 4-digit year)
  const monthYear4Match = lowerHeader.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYear4Match) {
    const [, monthStr, yearStr] = monthYear4Match;
    const monthNum = monthMap[monthStr];
    if (monthNum !== undefined) {
      const year = parseInt(yearStr, 10);
      return format(new Date(year, monthNum, 1), 'yyyy-MM-01');
    }
  }

  // Pattern: "January 25", "February 25", "June 22" (month name with 2-digit year, space separated)
  const monthYear2Match = lowerHeader.match(/^([a-z]+)\s+(\d{1,2})$/);
  if (monthYear2Match) {
    const [, monthStr, yearStr] = monthYear2Match;
    const monthNum = monthMap[monthStr];
    if (monthNum !== undefined) {
      let year = parseInt(yearStr, 10);
      year = year > 50 ? 1900 + year : 2000 + year;
      return format(new Date(year, monthNum, 1), 'yyyy-MM-01');
    }
  }
  
  // Pattern: "Oct-21", "Nov-2021", "Jan-24" (month with hyphen and year)
  const monthHyphenYearMatch = lowerHeader.match(/^([a-z]+)-(\d{2,4})$/);
  if (monthHyphenYearMatch) {
    const [, monthStr, yearStr] = monthHyphenYearMatch;
    const monthNum = monthMap[monthStr];
    if (monthNum !== undefined) {
      let year = parseInt(yearStr, 10);
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      return format(new Date(year, monthNum, 1), 'yyyy-MM-01');
    }
  }

  // Pattern: "Oct21", "Nov2021" (month directly followed by year, no separator)
  const monthNoSepYearMatch = lowerHeader.match(/^([a-z]+)(\d{2,4})$/);
  if (monthNoSepYearMatch) {
    const [, monthStr, yearStr] = monthNoSepYearMatch;
    const monthNum = monthMap[monthStr];
    if (monthNum !== undefined) {
      let year = parseInt(yearStr, 10);
      if (year < 100) {
        year = year > 50 ? 1900 + year : 2000 + year;
      }
      return format(new Date(year, monthNum, 1), 'yyyy-MM-01');
    }
  }

  // Try date-fns formats as fallback
  const formats = [
    'MMM-yy',      // Jan-24
    'MMM yy',      // Jan 24
    'MMM-yyyy',    // Jan-2024
    'MMM yyyy',    // Jan 2024
    'MMMM yyyy',   // January 2024
    'MMMM yy',     // January 24
    'MM/yyyy',     // 01/2024
    'yyyy-MM',     // 2024-01
    'M/yy',        // 1/24
    'MM/yy',       // 01/24
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(headerClean, fmt, new Date());
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-01');
      }
    } catch {
      continue;
    }
  }

  return null;
};

// Parse cell value, handling currency, percentages, and errors
const parseCellValue = (cell: unknown): number | null => {
  if (cell === null || cell === undefined || cell === '') return null;
  
  // Handle Excel errors
  if (typeof cell === 'object' && cell !== null && 'error' in cell) {
    return null;
  }
  
  // Already a number
  if (typeof cell === 'number') {
    if (isNaN(cell) || !isFinite(cell)) return null;
    return cell;
  }
  
  if (typeof cell === 'string') {
    // Skip error indicators
    if (cell.startsWith('#') || cell === '-' || cell.toLowerCase() === 'n/a') {
      return null;
    }
    
    // Remove currency symbols and thousands separators
    let cleaned = cell
      .replace(/[$€£¥]/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .trim();
    
    // Handle percentages (convert to decimal)
    const isPercentage = cleaned.endsWith('%');
    if (isPercentage) {
      cleaned = cleaned.slice(0, -1);
    }
    
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    
    // Keep percentage as displayed (e.g., 5% stays as 5, not 0.05)
    return num;
  }
  
  return null;
};

export const ExcelImportDialog: React.FC<ExcelImportDialogProps> = ({
  open,
  onOpenChange,
  category,
  existingMetrics,
  onImport,
}) => {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [dateColumns, setDateColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error('Excel file must have at least a header row and one data row');
        setIsParsing(false);
        return;
      }

      const headers = jsonData[0].map(h => String(h || ''));
      
      // Find date columns (skip first column which is metric name)
      const detectedDates: { index: number; date: string; header: string }[] = [];
      for (let i = 1; i < headers.length; i++) {
        const header = headers[i];
        // Skip "Total" columns
        if (header.toLowerCase().includes('total')) continue;
        
        const parsedDate = parseColumnDate(header);
        if (parsedDate) {
          detectedDates.push({ index: i, date: parsedDate, header });
        }
      }

      if (detectedDates.length === 0) {
        toast.error('No valid date columns found. Expected formats: Jan-24, Jan 2024, etc.');
        setIsParsing(false);
        return;
      }

      setDateColumns(detectedDates.map(d => d.header));

      // Parse data rows
      const rows: ParsedRow[] = [];
      for (let rowIdx = 1; rowIdx < jsonData.length; rowIdx++) {
        const row = jsonData[rowIdx];
        const metricName = String(row[0] || '').trim();
        
        if (!metricName) continue;

        // Match with existing metrics (case-insensitive)
        const matchedMetric = existingMetrics.find(
          m => m.name.toLowerCase() === metricName.toLowerCase()
        );

        const values: { date: string; value: number | null }[] = [];
        for (const { index, date } of detectedDates) {
          const cellValue = row[index];
          const parsedValue = parseCellValue(cellValue);
          values.push({ date, value: parsedValue });
        }

        // Only include rows with at least one non-null value
        if (values.some(v => v.value !== null)) {
          rows.push({
            metricName,
            matchedMetric: matchedMetric || null,
            isNew: !matchedMetric,
            values,
          });
        }
      }

      setParsedData(rows);
      
      if (rows.length === 0) {
        toast.warning('No valid data rows found in the file');
      } else {
        toast.success(`Found ${rows.length} metrics with ${detectedDates.length} date columns`);
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Failed to parse Excel file');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    setIsLoading(true);
    try {
      const newMetrics = parsedData
        .filter(row => row.isNew)
        .map(row => ({ name: row.metricName, categoryId: category.id }));

      const values = parsedData.flatMap(row =>
        row.values
          .filter(v => v.value !== null)
          .map(v => ({
            metricId: row.matchedMetric?.id || '',
            metricName: row.metricName,
            periodDate: v.date,
            value: v.value!,
          }))
      );

      await onImport({ newMetrics, values });
      
      setParsedData([]);
      setDateColumns([]);
      setFileName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setParsedData([]);
    setDateColumns([]);
    setFileName('');
    onOpenChange(false);
  };

  const matchedCount = parsedData.filter(r => !r.isNew).length;
  const newCount = parsedData.filter(r => r.isNew).length;
  const totalValues = parsedData.reduce(
    (sum, row) => sum + row.values.filter(v => v.value !== null).length,
    0
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with metrics in rows and dates in columns.
            Metrics will be matched by name or created if new.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isParsing ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Parsing file...</p>
              </div>
            ) : fileName ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <p className="text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">Click to select a different file</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  .xlsx or .xls files supported
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{matchedCount} matched metrics</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>{newCount} new metrics</span>
                </div>
                <div className="text-muted-foreground">
                  {totalValues} values to import
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-left font-medium">Metric Name</th>
                        <th className="px-3 py-2 text-right font-medium">Values</th>
                        <th className="px-3 py-2 text-left font-medium">Date Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.map((row, idx) => {
                        const nonNullValues = row.values.filter(v => v.value !== null);
                        const dates = nonNullValues.map(v => v.date).sort();
                        return (
                          <tr key={idx} className="border-t">
                            <td className="px-3 py-2">
                              {row.isNew ? (
                                <span className="inline-flex items-center gap-1 text-yellow-600">
                                  <AlertCircle className="h-3 w-3" />
                                  New
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <Check className="h-3 w-3" />
                                  Matched
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium">{row.metricName}</td>
                            <td className="px-3 py-2 text-right">{nonNullValues.length}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {dates.length > 0 && (
                                <>
                                  {format(new Date(dates[0]), 'MMM yyyy')} - {format(new Date(dates[dates.length - 1]), 'MMM yyyy')}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={parsedData.length === 0 || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import {totalValues} values
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
