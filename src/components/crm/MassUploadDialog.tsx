import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, MapPin, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type Lead } from "@/hooks/useLeads";
import Papa from "papaparse";
import * as XLSX from "xlsx";

interface MassUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadLeads: (leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>[]) => void;
}

interface ParsedData {
  headers: string[];
  rows: string[][];
}

interface FieldMapping {
  [key: string]: string; // fileColumn -> leadField
}

const leadFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', required: true },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'assigned_to', label: 'Assigned To', required: false }
];

export function MassUploadDialog({ open, onOpenChange, onUploadLeads }: MassUploadDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'processing' | 'complete'>('upload');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    parseFile(file);
  };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;

        let parsed: ParsedData;
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'csv') {
          const result = Papa.parse(data as string, {
            skipEmptyLines: true,
          });
          
          if (result.errors.length > 0) {
            toast({
              title: "CSV parsing error",
              description: result.errors[0].message,
              variant: "destructive",
            });
            return;
          }

          parsed = {
            headers: result.data[0] as string[],
            rows: result.data.slice(1) as string[][]
          };
        } else {
          // Excel file
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
          
          parsed = {
            headers: jsonData[0] || [],
            rows: jsonData.slice(1)
          };
        }

        setParsedData(parsed);
        setStep('mapping');
        
        // Auto-map common field names
        const autoMapping: FieldMapping = {};
        parsed.headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          if (lowerHeader.includes('name')) autoMapping[header] = 'name';
          else if (lowerHeader.includes('email')) autoMapping[header] = 'email';
          else if (lowerHeader.includes('phone')) autoMapping[header] = 'phone';
          else if (lowerHeader.includes('source')) autoMapping[header] = 'source';
          else if (lowerHeader.includes('status')) autoMapping[header] = 'status';
          else if (lowerHeader.includes('assigned')) autoMapping[header] = 'assigned_to';
        });
        setFieldMapping(autoMapping);

      } catch (error) {
        toast({
          title: "File parsing error",
          description: "Unable to parse the uploaded file.",
          variant: "destructive",
        });
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    if (draggedField) {
      setFieldMapping(prev => ({
        ...prev,
        [draggedField]: targetField
      }));
      setDraggedField(null);
    }
  };

  const removeMapping = (fileColumn: string) => {
    setFieldMapping(prev => {
      const newMapping = { ...prev };
      delete newMapping[fileColumn];
      return newMapping;
    });
  };

  const processLeads = async () => {
    if (!parsedData) return;

    setStep('processing');
    setUploadProgress(0);

    const requiredFields = leadFields.filter(f => f.required).map(f => f.key);
    const mappedRequiredFields = Object.values(fieldMapping).filter(field => requiredFields.includes(field));
    
    if (mappedRequiredFields.length !== requiredFields.length) {
      toast({
        title: "Missing required fields",
        description: "Please map all required fields (Name and Email).",
        variant: "destructive",
      });
      setStep('mapping');
      return;
    }

    const leads: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'created_by'>[] = [];
    const totalRows = parsedData.rows.length;

    for (let i = 0; i < totalRows; i++) {
      const row = parsedData.rows[i];
      const lead: any = {
        name: '',
        email: '',
        phone: '',
        source: 'Import',
        status: 'New',
        assigned_to: '',
        interested_products: []
      };

      // Map data based on field mapping
      Object.entries(fieldMapping).forEach(([fileColumn, leadField]) => {
        const columnIndex = parsedData.headers.indexOf(fileColumn);
        if (columnIndex !== -1 && row[columnIndex]) {
          if (leadField === 'interested_products') {
            lead[leadField] = row[columnIndex].split(',').map((s: string) => s.trim());
          } else {
            lead[leadField] = row[columnIndex];
          }
        }
      });

      // Skip rows without required fields
      if (lead.name && lead.email) {
        leads.push(lead);
      }

      // Update progress
      setUploadProgress(Math.round(((i + 1) / totalRows) * 100));
      
      // Allow UI to update
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    try {
      await onUploadLeads(leads);
      setStep('complete');
      
      toast({
        title: "Upload successful",
        description: `Successfully imported ${leads.length} leads.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error importing the leads.",
        variant: "destructive",
      });
      setStep('mapping');
    }
  };

  const resetDialog = () => {
    setStep('upload');
    setParsedData(null);
    setFieldMapping({});
    setUploadProgress(0);
    setUploadedFile(null);
    setDraggedField(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  const downloadTemplate = () => {
    const csvContent = "name,email,phone,source,status,assigned_to\nJohn Doe,john@example.com,+1234567890,Website,New,John Smith\nJane Smith,jane@example.com,+0987654321,Meta Ads,Contacted,Sarah Wilson";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const requiredFields = leadFields.filter(f => f.required).map(f => f.key);
  const mappedRequiredFields = Object.values(fieldMapping).filter(field => requiredFields.includes(field));
  const hasRequiredFieldsMapped = mappedRequiredFields.length === requiredFields.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[80vh] glass-card border-glass-border flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-display text-foreground flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-primary" />
              Mass Upload Leads
            </div>
            {step === 'mapping' && parsedData && (
              <Button 
                onClick={processLeads} 
                className="modern-button"
                disabled={!hasRequiredFieldsMapped}
                size="sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Import {parsedData.rows.length} Leads
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {step === 'upload' && (
            <div className="space-y-6 p-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Upload your leads file</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Support for CSV and Excel files. Maximum 1000 leads per upload.
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-glass-border/60 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="glass-subtle border-glass-border"
                >
                  Choose File
                </Button>
              </div>

              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadTemplate}
                  className="text-primary hover:text-primary/80"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          )}

          {step === 'mapping' && parsedData && (
            <div className="space-y-6 p-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Map your columns</h3>
                <p className="text-sm text-muted-foreground">
                  Drag the file columns to the corresponding lead fields
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* File columns */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">File Columns</Label>
                  <ScrollArea className="h-80 glass-subtle rounded-lg p-3">
                    <div className="space-y-2">
                      {parsedData.headers.map((header) => (
                        <div
                          key={header}
                          draggable
                          onDragStart={() => handleDragStart(header)}
                          className="p-3 border rounded-lg cursor-move hover:bg-muted/50 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-medium">{header}</span>
                          {fieldMapping[header] && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                → {leadFields.find(f => f.key === fieldMapping[header])?.label}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMapping(header)}
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Lead fields */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">Lead Fields</Label>
                  <ScrollArea className="h-80 glass-subtle rounded-lg p-3">
                    <div className="space-y-2">
                      {leadFields.map((field) => {
                        const mappedColumn = Object.entries(fieldMapping).find(([_, leadField]) => leadField === field.key)?.[0];
                        return (
                          <div
                            key={field.key}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, field.key)}
                            className={`p-3 border-2 border-dashed rounded-lg min-h-12 flex items-center justify-between transition-colors ${
                              mappedColumn 
                                ? 'border-primary/50 bg-primary/5' 
                                : 'border-glass-border/60 hover:border-primary/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{field.label}</span>
                              {field.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            {mappedColumn && (
                              <Badge variant="outline" className="text-xs">
                                {mappedColumn}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="space-y-6 p-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <div>
                <h3 className="text-lg font-medium">Processing leads...</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while we import your leads
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">{uploadProgress}% complete</p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 p-6 text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Upload complete!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Your leads have been successfully imported
                </p>
              </div>
              <Button onClick={handleClose} className="modern-button">
                Done
              </Button>
            </div>
          )}
        </div>

        {/* Fixed action bar at bottom */}
        {step === 'mapping' && (
          <div className="flex-shrink-0 border-t border-glass-border/60 p-4 bg-background/50 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={resetDialog} 
                className="glass-subtle border-glass-border"
              >
                Back
              </Button>
              <div className="flex items-center gap-3">
                {!hasRequiredFieldsMapped && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    Please map required fields (Name & Email)
                  </p>
                )}
                <Button 
                  onClick={processLeads} 
                  className="modern-button"
                  disabled={!hasRequiredFieldsMapped}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Import {parsedData?.rows.length || 0} Leads
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}