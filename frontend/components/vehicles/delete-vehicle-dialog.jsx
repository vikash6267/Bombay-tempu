"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function DeleteVehicleDialog({ open, onOpenChange, vehicle, onConfirm, isLoading }) {
  if (!vehicle) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>Delete Vehicle</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this vehicle? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will permanently delete the vehicle "{vehicle.registrationNumber}" and all associated data.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <p>
            <strong>Registration Number:</strong> {vehicle.registrationNumber}
          </p>
          <p>
            <strong>Type:</strong> {vehicle.type}
          </p>
          <p>
            <strong>Make & Model:</strong> {vehicle.make} {vehicle.model}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
