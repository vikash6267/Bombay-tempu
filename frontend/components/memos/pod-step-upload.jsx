"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import { toast } from "react-hot-toast"

export function PODStepUpload({ stepName, onUpload, existingDocument }) {
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async event => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size should be less than 10MB")
      return
    }

    setIsUploading(true)
    try {
      setUploadedFile(file)
      await onUpload(file)
      toast.success(`Document uploaded for ${stepName}`)
    } catch (error) {
      toast.error("Failed to upload document")
      setUploadedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  const getFileIcon = fileName => {
    const extension = fileName
      .split(".")
      .pop()
      ?.toLowerCase()
    if (["jpg", "jpeg", "png", "gif"].includes(extension || "")) {
      return <ImageIcon className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <Card className="mt-4 border-indigo-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-indigo-800">
          Upload Document for: {stepName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!uploadedFile && !existingDocument ? (
          <div className="border-2 border-dashed border-indigo-300 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-indigo-400" />
              <div className="mt-2">
                <label
                  htmlFor={`pod-step-upload-${stepName}`}
                  className="cursor-pointer"
                >
                  <span className="mt-2 block text-sm font-medium text-indigo-900">
                    Upload supporting document
                  </span>
                  <span className="mt-1 block text-xs text-indigo-600">
                    PNG, JPG, PDF up to 10MB (Optional)
                  </span>
                </label>
                <input
                  id={`pod-step-upload-${stepName}`}
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-indigo-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              {uploadedFile ? (
                getFileIcon(uploadedFile.name)
              ) : (
                <FileText className="h-4 w-4" />
              )}
              <span className="text-sm text-indigo-800">
                {uploadedFile ? uploadedFile.name : "Existing document"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {existingDocument && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(existingDocument, "_blank")}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  View
                </Button>
              )}
              {uploadedFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {isUploading && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center text-sm text-indigo-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
              Uploading...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
