"use client";

import {useState, useEffect} from "react";
import {useFormik} from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {api} from "@/lib/api";
import {toast} from "react-hot-toast";

const validationSchema = Yup.object({
  origin: Yup.string().required("Origin is required"),
  destination: Yup.string().required("Destination is required"),
  clientId: Yup.string().required("Client is required"),
  vehicleId: Yup.string().required("Vehicle is required"),
  driverId: Yup.string().required("Driver is required"),
  startDate: Yup.date().required("Start date is required"),
  loadType: Yup.string().required("Load type is required"),
  loadWeight: Yup.number()
    .positive("Weight must be positive")
    .required("Load weight is required"),
  clientRate: Yup.number()
    .positive("Rate must be positive")
    .required("Client rate is required"),
  fleetOwnerRate: Yup.number()
    .positive("Rate must be positive")
    .required("Fleet owner rate is required"),
});

export function EditTripDialog({trip, open, onOpenChange, onTripUpdated}) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const formik = useFormik({
    initialValues: {
      origin: trip?.origin || "",
      destination: trip?.destination || "",
      clientId: trip?.client?._id || "",
      vehicleId: trip?.vehicle?._id || "",
      driverId: trip?.driver?._id || "",
      startDate: trip?.startDate
        ? new Date(trip.startDate).toISOString().split("T")[0]
        : "",
      estimatedDuration: trip?.estimatedDuration || "",
      loadType: trip?.loadType || "",
      loadWeight: trip?.loadWeight || "",
      loadValue: trip?.loadValue || "",
      loadDescription: trip?.loadDescription || "",
      clientRate: trip?.clientRate || "",
      fleetOwnerRate: trip?.fleetOwnerRate || "",
      status: trip?.status || "booked",
      notes: trip?.notes || "",
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const commission = values.clientRate - values.fleetOwnerRate;
        const tripData = {
          ...values,
          commission,
          totalAmount: values.clientRate,
        };

        await api.put(`/trips/${trip._id}`, tripData);
        toast.success("Trip updated successfully!");
        onTripUpdated();
        onOpenChange(false);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update trip");
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      const [clientsRes, vehiclesRes, driversRes] = await Promise.all([
        api.get("/users?role=client"),
        api.get("/vehicles"),
        api.get("/users?role=driver"),
      ]);
      setClients(clientsRes.data.data.users);
      setVehicles(vehiclesRes.data.data.vehicles);
      setDrivers(driversRes.data.data.users);
    } catch (error) {
      toast.error("Failed to fetch data");
    }
  };
  console.log(vehicles, drivers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trip</DialogTitle>
        </DialogHeader>

        <form onSubmit={formik.handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="load">Load Details</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="additional">Additional</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Route Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="origin">Origin *</Label>
                    <Input
                      id="origin"
                      name="origin"
                      value={formik.values.origin}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter origin location"
                    />
                    {formik.touched.origin && formik.errors.origin && (
                      <p className="text-sm text-red-500">
                        {formik.errors.origin}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination *</Label>
                    <Input
                      id="destination"
                      name="destination"
                      value={formik.values.destination}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter destination location"
                    />
                    {formik.touched.destination &&
                      formik.errors.destination && (
                        <p className="text-sm text-red-500">
                          {formik.errors.destination}
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formik.values.startDate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.startDate && formik.errors.startDate && (
                      <p className="text-sm text-red-500">
                        {formik.errors.startDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedDuration">
                      Estimated Duration (hours)
                    </Label>
                    <Input
                      id="estimatedDuration"
                      name="estimatedDuration"
                      type="number"
                      value={formik.values.estimatedDuration}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter duration in hours"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assignments</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Client *</Label>
                    <Select
                      value={formik.values.clientId}
                      onValueChange={(value) =>
                        formik.setFieldValue("clientId", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.clientId && formik.errors.clientId && (
                      <p className="text-sm text-red-500">
                        {formik.errors.clientId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleId">Vehicle *</Label>
                    <Select
                      value={formik.values.vehicleId}
                      onValueChange={(value) =>
                        formik.setFieldValue("vehicleId", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicles.map((vehicle) => (
                          <SelectItem key={vehicle._id} value={vehicle._id}>
                            {vehicle.registrationNumber} - {vehicle.make}{" "}
                            {vehicle.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.vehicleId && formik.errors.vehicleId && (
                      <p className="text-sm text-red-500">
                        {formik.errors.vehicleId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="driverId">Driver *</Label>
                    <Select
                      value={formik.values.driverId}
                      onValueChange={(value) =>
                        formik.setFieldValue("driverId", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {drivers.map((driver) => (
                          <SelectItem key={driver._id} value={driver._id}>
                            {driver.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formik.touched.driverId && formik.errors.driverId && (
                      <p className="text-sm text-red-500">
                        {formik.errors.driverId}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="load" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Load Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loadType">Load Type *</Label>
                    <Select
                      value={formik.values.loadType}
                      onValueChange={(value) =>
                        formik.setFieldValue("loadType", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select load type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Cargo</SelectItem>
                        <SelectItem value="fragile">Fragile Items</SelectItem>
                        <SelectItem value="hazardous">
                          Hazardous Materials
                        </SelectItem>
                        <SelectItem value="perishable">
                          Perishable Goods
                        </SelectItem>
                        <SelectItem value="bulk">Bulk Materials</SelectItem>
                        <SelectItem value="machinery">Machinery</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                      </SelectContent>
                    </Select>
                    {formik.touched.loadType && formik.errors.loadType && (
                      <p className="text-sm text-red-500">
                        {formik.errors.loadType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loadWeight">Load Weight (kg) *</Label>
                    <Input
                      id="loadWeight"
                      name="loadWeight"
                      type="number"
                      value={formik.values.loadWeight}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter weight in kg"
                    />
                    {formik.touched.loadWeight && formik.errors.loadWeight && (
                      <p className="text-sm text-red-500">
                        {formik.errors.loadWeight}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loadValue">Load Value (₹)</Label>
                    <Input
                      id="loadValue"
                      name="loadValue"
                      type="number"
                      value={formik.values.loadValue}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter load value"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="loadDescription">Load Description</Label>
                    <Textarea
                      id="loadDescription"
                      name="loadDescription"
                      value={formik.values.loadDescription}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Describe the load details"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientRate">Client Rate (₹) *</Label>
                    <Input
                      id="clientRate"
                      name="clientRate"
                      type="number"
                      value={formik.values.clientRate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter client rate"
                    />
                    {formik.touched.clientRate && formik.errors.clientRate && (
                      <p className="text-sm text-red-500">
                        {formik.errors.clientRate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fleetOwnerRate">
                      Fleet Owner Rate (₹) *
                    </Label>
                    <Input
                      id="fleetOwnerRate"
                      name="fleetOwnerRate"
                      type="number"
                      value={formik.values.fleetOwnerRate}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Enter fleet owner rate"
                    />
                    {formik.touched.fleetOwnerRate &&
                      formik.errors.fleetOwnerRate && (
                        <p className="text-sm text-red-500">
                          {formik.errors.fleetOwnerRate}
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label>Commission (₹)</Label>
                    <Input
                      value={
                        formik.values.clientRate && formik.values.fleetOwnerRate
                          ? (
                              formik.values.clientRate -
                              formik.values.fleetOwnerRate
                            ).toLocaleString()
                          : "0"
                      }
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Total Amount (₹)</Label>
                    <Input
                      value={
                        formik.values.clientRate
                          ? Number(formik.values.clientRate).toLocaleString()
                          : "0"
                      }
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Trip Status</Label>
                    <Select
                      value={formik.values.status}
                      onValueChange={(value) =>
                        formik.setFieldValue("status", value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booked">Booked</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formik.values.notes}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder="Add any additional notes"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
