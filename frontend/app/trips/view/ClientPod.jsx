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
import { toast } from "react-hot-toast";
import { tripsApi } from "lib/api";
import { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import PodDocuments from "./ViewsDocument";

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

export default function PODCard({ trip, clientData }) {
  const [currentStep, setCurrentStep] = useState(
    steps.findIndex((s) => s.key === clientData?.podManage?.status) || 0
  );

  console.log(clientData?.podManage)
 const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const token = localStorage?.getItem("token");

  const [isUpdatingPOD, setIsUpdatingPOD] = useState(false);
  const [documents, setDocuments] = useState(
    clientData?.documents || {} // key: stepKey, value: URL
  );

  const queryClient = useQueryClient();


  console.log(documents,"documents")
  const handleStepClick = async () => {
    const nextStep = steps[currentStep + 1];
    if (!nextStep) {
      toast.error("Trip is already at the final step");
      return;
    }

    setIsUpdatingPOD(true);

    try {
      const toastId = toast.loading(`Updating to: ${nextStep.label}...`);

      const data = await tripsApi.clientupdatePodStatus(
        trip._id,
        clientData.client._id,
        {
          status: nextStep.key,
        }
      );

      if (data.success) {
        setCurrentStep(currentStep + 1);
        toast.dismiss(toastId);
        toast.success(`✅ POD status updated to: ${nextStep.label}`);
        queryClient.invalidateQueries(["trips", trip._id]);
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to update POD status");
      }
    } catch (error) {
      console.error("Error updating POD status:", error);
      toast.error("Something went wrong while updating POD status");
    } finally {
      setIsUpdatingPOD(false);
    }
  };

  const handleStepBack = async () => {
    if (isUpdatingPOD || currentStep <= 0) return;

    const previousStep = steps[currentStep - 1];

    setIsUpdatingPOD(true);

    try {
      const toastId = toast.loading(`Reverting to: ${previousStep.label}...`);

      const data = await tripsApi.clientupdatePodStatus(
        trip._id,
        clientData.client._id,
        {
          status: previousStep.key,
        }
      );

      if (data.success) {
        setCurrentStep(currentStep - 1);
        toast.dismiss(toastId);
        toast.success(`🔙 Reverted to: ${previousStep.label}`);
        queryClient.invalidateQueries(["trips", trip._id]);
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to revert POD status");
      }
    } catch (err) {
      console.error("Error reverting POD status:", err);
      toast.error("Something went wrong while reverting POD status");
    } finally {
      setIsUpdatingPOD(false);
    }
  };

  const handleUpload = async (file, stepKey) => {
    if (!file) return;

    const toastId = toast.loading(`Uploading document for "${steps[currentStep].label}"...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("stepKey", stepKey);
    formData.append("clientId", clientData.client._id);

    try {
      // const res = await tripsApi.clientupdatePodDocs(trip._id, clientData.client._id, formData);

      // if (res.success) {
      //   setDocuments((prevDocs) => ({
      //     ...prevDocs,
      //     [stepKey]: res.data.url, // Assuming the API returns the URL
      //   }));
      //   toast.dismiss(toastId);
      //   toast.success("Document uploaded successfully!");
      //   queryClient.invalidateQueries(["trips", trip._id]);
      // } else {
      //   toast.dismiss(toastId);
      //   toast.error("Failed to upload document");
      // }

        const res = await axios.post(
              `${API_BASE_URL}/trips/${trip._id}/client/podDocument`, // 👈 Trip ID ke hisab se URL
              formData,
              {
                headers: {
                  "Content-Type": "multipart/form-data", // 👈 VERY IMPORTANT
                  Authorization: token ? `Bearer ${token}` : "",
                },
              }
            );
    } catch (error) {
      console.error("POD upload failed:", error);
      toast.dismiss(toastId);
      toast.error("Something went wrong with the upload");
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
              const documentURL = documents[step.key];

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
                  </div>
                  {/* Upload input for the current step */}
                  {isCurrent && (
                    <div className="flex flex-col space-y-2 mt-4 items-center">
                      <span className="text-gray-600 font-medium text-xs">
                        Upload Document
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          handleUpload(file, step.key);
                        }}
                        className="text-xs w-full"
                      />
                    </div>
                  )}

                  {/* Show uploaded document info for any completed step */}
                  {documentURL && (
                    <div className="flex items-center mt-2 space-x-2 text-xs text-gray-600">
                      <Download className="w-3 h-3" />
                      <a
                        href={documentURL}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        View File
                      </a>
                    </div>
                  )}
                </div>


              );
            })}
          </div>
        </div>
<PodDocuments documents={documents} />

        <div className="flex flex-wrap justify-between items-center space-y-4 md:space-y-0 md:space-x-4">
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
              <Button
                onClick={handleStepClick}
                disabled={isUpdatingPOD}
              >
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