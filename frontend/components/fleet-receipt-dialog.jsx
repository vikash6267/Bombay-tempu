"use client";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Download, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FleetReceipt } from "./fleet-receipt"; // यह कंपोनेंट अभी भी डायग्राम में डिस्प्ले के लिए रहेगा

// नई PDF जनरेशन यूटिलिटी को इम्पोर्ट करें
import { generateFleetReceiptPdf } from "../lib/generate-fleet-reciept"; // सुनिश्चित करें कि पथ सही है

export function FleetReceiptDialog({ trip, open, onOpenChange }) {
  // receiptRef अब केवल प्रिंट के लिए आवश्यक है, PDF डाउनलोड के लिए नहीं
  const receiptRef = useRef(null);
  console.log(trip);

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    documentTitle: `Fleet-Receipt-${trip.tripNumber}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generateFleetReceiptPdf(trip); // नई यूटिलिटी फंक्शन को कॉल करें
      pdf.save(`Fleet-Receipt-${trip.tripNumber}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("पीडीएफ जनरेट करते समय त्रुटि हुई। कृपया पुनः प्रयास करें।");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* max-w-6xl max-h-[90vh] overflow-y-auto को यहाँ DialogContent पर ही रहने दें
          क्योंकि यह सिर्फ डिस्प्ले के लिए है, PDF जनरेशन के लिए नहीं */}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Fleet Owner Receipt - {trip.tripNumber}</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button onClick={handlePrint} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* FleetReceipt कंपोनेंट यहाँ रहेगा सिर्फ दिखाने के लिए */}
        <div className="mt-4">
          <FleetReceipt ref={receiptRef} trip={trip} />
        </div>
      </DialogContent>
    </Dialog>
  );
}