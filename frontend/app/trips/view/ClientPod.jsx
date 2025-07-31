// Enhanced Single-Component POD Management System with Lucide Icons

import React, { useState } from "react";
import {
  FileText,
  CheckCircle,
  Clock,
  Circle,
  AlertCircle,
  Download,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const steps = [
  { key: "started", label: "Trip Started", icon: "🚛" },
  { key: "complete", label: "Trip Completed", icon: "✅" },
  { key: "pod_received", label: "POD Received", icon: "📄" },
  { key: "pod_submitted", label: "POD Submitted", icon: "📤" },
  { key: "settled", label: "Settled", icon: "💰" },
];

const formatDate = (dateStr, format = "MMM dd, yyyy") => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function PODCard({ trip }) {
  const [currentStep, setCurrentStep] = useState(
    steps.findIndex((s) => s.key === trip?.podManage?.status) || 0
  );
  const [isUpdatingPOD, setIsUpdatingPOD] = useState(false);
  const [documentURL, setDocumentURL] = useState(
    trip?.podManage?.document?.url || null
  );

  const handleStepClick = () => {
    if (currentStep < steps.length - 1) {
      setIsUpdatingPOD(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsUpdatingPOD(false);
      }, 1000);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      setIsUpdatingPOD(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsUpdatingPOD(false);
      }, 1000);
    }
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setDocumentURL(url);
    }
  };

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-indigo-800 text-xl">
                POD Management System
              </CardTitle>
              <CardDescription className="text-indigo-600">
                Track your Proof of Delivery status in real-time
              </CardDescription>
            </div>
            <Badge className="bg-indigo-100 text-indigo-800 px-3 py-1 text-sm font-medium">
              {steps[currentStep]?.label.toUpperCase() || "NOT STARTED"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative">
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-green-400 via-blue-500 to-indigo-600 rounded-full transition-all duration-1000 ease-in-out shadow-sm"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="relative flex justify-between">
            {steps.map((step, index) => {
              const isDone = index < currentStep;
              const isCurrent = index === currentStep;
              const isNext = index === currentStep + 1;

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center space-y-3 relative"
                >
                  <div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-110 shadow-lg ${
                      isDone
                        ? "bg-gradient-to-r from-green-400 to-green-600 text-white"
                        : isCurrent
                        ? "bg-gradient-to-r from-indigo-400 to-indigo-600 text-white animate-pulse"
                        : isNext
                        ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-700 border-2 border-yellow-300"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : isCurrent ? (
                      <Clock className="w-5 h-5 animate-spin" />
                    ) : isNext ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-center max-w-24">
                    <div
                      className={`text-sm font-semibold ${
                        isDone
                          ? "text-green-700"
                          : isCurrent
                          ? "text-indigo-700"
                          : isNext
                          ? "text-yellow-700"
                          : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </div>
                    <div className="text-lg mt-1">{step.icon}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col space-y-2">
            <span className="text-gray-600 font-medium">
              Upload POD Document
            </span>
            <input
              type="file"
              onChange={handleUpload}
              className="border rounded px-2 py-1"
            />
          </div>
          {documentURL && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(documentURL, "_blank")}
              className="hover:bg-indigo-50 hover:border-indigo-300"
            >
              <Download className="h-4 w-4 mr-2" />
              View Document
            </Button>
          )}
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button onClick={handleStepBack} disabled={isUpdatingPOD}>
                {isUpdatingPOD ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" /> Reverting...
                  </>
                ) : (
                  <>Back</>
                )}
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button onClick={handleStepClick} disabled={isUpdatingPOD}>
                {isUpdatingPOD ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" /> Updating...
                  </>
                ) : (
                  <>Next</>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
