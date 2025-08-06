'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AsanaImportDialogProps {
  projectName: string
  onImportComplete?: (result: any) => void
  onClose?: () => void
}

export function AsanaImportDialog({ projectName, onImportComplete, onClose }: AsanaImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResult(null)
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file exported from Asana',
        variant: 'destructive'
      })
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectName', projectName)

      const response = await fetch('/api/import/asana', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast({
          title: 'Import successful!',
          description: `Imported ${data.imported} of ${data.total} tasks`,
        })
        
        if (onImportComplete) {
          onImportComplete(data)
        }
      } else {
        throw new Error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'An error occurred during import',
        variant: 'destructive'
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Import from Asana
        </CardTitle>
        <CardDescription>
          Bootstrap your Maverick project by importing tasks from an Asana CSV export
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {!result ? (
          <>
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How to export from Asana:</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Go to your Asana project</li>
                <li>Click the three dots menu (⋯) next to your project name</li>
                <li>Select "Export" → "CSV"</li>
                <li>Download the CSV file</li>
                <li>Upload it here to import into Maverick</li>
              </ol>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="csv-file">Asana CSV File</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                  className="flex-1"
                />
                {file && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {file.name}
                  </Badge>
                )}
              </div>
            </div>

            {/* Import Button */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Project: <strong>{projectName}</strong>
              </p>
              <div className="flex gap-2">
                {onClose && (
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
                <Button 
                  onClick={handleImport} 
                  disabled={!file || importing}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {importing ? 'Importing...' : 'Import Tasks'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Import Results */
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <h3 className="font-medium">Import Completed Successfully!</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-600">{result.imported}</div>
                <div className="text-sm text-green-700">Tasks Imported</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{result.total}</div>
                <div className="text-sm text-blue-700">Total Tasks</div>
              </div>
            </div>

            {result.log && result.log.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Import Log:</h4>
                <div className="bg-gray-50 border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {result.log.map((entry: string, index: number) => (
                    <div key={index} className="text-sm font-mono flex items-center gap-2">
                      {entry.startsWith('✅') ? (
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                      )}
                      <span className={entry.startsWith('✅') ? 'text-green-700' : 'text-red-700'}>
                        {entry}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Tasks are now available in your project canvas
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setResult(null)}>
                  Import More
                </Button>
                {onClose && (
                  <Button onClick={onClose}>
                    Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default AsanaImportDialog