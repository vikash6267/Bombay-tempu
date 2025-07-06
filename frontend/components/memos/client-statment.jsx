"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, FileText, Printer } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "react-hot-toast"
import { generateClientStatementPDF } from "./pdf-generetors"

export function ClientStatementGenerator({ clientData, tripData }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    try {
      const doc = generateClientStatementPDF(clientData, tripData)
      doc.save(
        `Client_Statement_${clientData?.client?.name}_${formatDate(
          new Date(),
          "dd-MM-yyyy"
        )}.pdf`
      )
      toast.success("Statement downloaded successfully")
    } catch (error) {
      toast.error("Failed to generate statement")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateStatementHTML = () => {
    const doc = generateClientStatementPDF(clientData, tripData)
    const pdfBlob = doc.output("blob")
    const url = URL.createObjectURL(pdfBlob)
    window.open(url, "_blank")
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center text-purple-800">
          <FileText className="h-5 w-5 mr-2" />
          Client Statement Generator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Generate a comprehensive statement for {clientData?.client?.name}
            </p>
            <p className="text-xs text-gray-500">
              Includes trip details, payments, expenses, and memo history
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            <Button
              onClick={generateStatementHTML}
              disabled={isGenerating}
              variant="outline"
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Printer className="h-4 w-4 mr-2" />
              Preview & Print
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
