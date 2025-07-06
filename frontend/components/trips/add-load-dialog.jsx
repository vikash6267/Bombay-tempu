// import { useQuery } from "@tanstack/react-query";
// import {Formik} from "formik";

// const AddLoadDialog = ({open, onOpenChange}) => {
//   const {data: clientsData, isLoading: loadingClients} = useQuery({
//     queryKey: ["users", "clients"],
//     queryFn: () => usersApi.getAll({role: "client"}),
//     enabled: user?.role === "admin" && open,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     cacheTime: 10 * 60 * 1000, // 10 minutes
//   });
//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center">
//             <Truck className="h-5 w-5 mr-2" />
//             Add Load
//           </DialogTitle>
//           <DialogDescription>
//             Create a new clients and load details.
//           </DialogDescription>
//         </DialogHeader>
//         <Formik
//           initialValues={initialValues}
//           validationSchema={tripValidationSchema}
//           onSubmit={handleSubmit}>
//           <CardContent className="space-y-4">
//             {/* Client Selection */}
//             <div className="flex flex-row justify-between">
//               <div>
//                 <Label>Client *</Label>
//                 <Select
//                   value={formik?.values.client}
//                   onValueChange={(value) =>
//                     formik?.setFieldValue(`client`, value)
//                   }>
//                   <SelectTrigger
//                     className={formik?.error.client ? "border-red-500" : ""}>
//                     <SelectValue
//                       placeholder={
//                         loadingClients ? "Loading..." : "Select client"
//                       }
//                     />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {clients.map((client) => (
//                       <SelectItem key={client._id} value={client._id}>
//                         <div className="flex flex-col">
//                           <span>{client.name}</span>
//                           <span className="text-sm text-gray-500">
//                             {client.email}
//                           </span>
//                         </div>
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {clientErrors?.client && (
//                   <p className="text-sm text-red-500 mt-1">
//                     {clientErrors.client}
//                   </p>
//                 )}
//               </div>
//               <div>
//                 <Label> Date *</Label>
//                 <Input
//                   type="datetime-local"
//                   value={
//                     formik?.errors.clients &&
//                     formik?.values?.clients[index]?.loadDate
//                   }
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.loadDate`,
//                       e.target.value
//                     )
//                   }
//                   className={
//                     formik?.errors.clients &&
//                     formik?.errors?.clients[index]?.loadDate
//                       ? "border-red-500"
//                       : ""
//                   }
//                 />
//                 {formik?.errors.clients &&
//                   formik?.errors.clients[index]?.loadDate && (
//                     <p className="text-sm text-red-500 mt-1">
//                       {formik?.errors.clients[index].loadDate}
//                     </p>
//                   )}
//               </div>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               {/* Origin */}
//               <div className="space-y-4">
//                 <h4 className="font-medium text-green-600">Origin (Pickup)</h4>

//                 <CitySelect
//                   label="City"
//                   required
//                   value={
//                     formik?.values.clients[index].origin?.city
//                       ? {
//                           city: formik?.values.clients[index].origin.city,
//                           state: formik?.values.clients[index].origin.state,
//                           pincode: formik?.values.clients[index].origin.pincode,
//                         }
//                       : null
//                   }
//                   onChange={(city) => {
//                     if (city) {
//                       formik?.setFieldValue(
//                         `clients.${index}.origin.city`,
//                         city.city
//                       );
//                       formik?.setFieldValue(
//                         `clients.${index}.origin.state`,
//                         city.state
//                       );
//                       formik?.setFieldValue(
//                         `clients.${index}.origin.pincode`,
//                         city.pincode
//                       );
//                     }
//                   }}
//                   // error={
//                   //   formik?.errors.origin && formik?.errors.origin?.city
//                   // }
//                   placeholder="Search pickup city"
//                 />
//               </div>

//               {/* Destination */}
//               <div className="space-y-4">
//                 <h4 className="font-medium text-red-600">
//                   Destination (Drop-off)
//                 </h4>

//                 <CitySelect
//                   label="City"
//                   required
//                   value={
//                     formik?.values.clients[index].destination?.city
//                       ? {
//                           city: formik?.values.clients[index].destination.city,
//                           state: formik?.values.clients[index].destination.state,
//                           pincode:
//                             formik?.values.clients[index].destination.pincode,
//                         }
//                       : null
//                   }
//                   onChange={(city) => {
//                     if (city) {
//                       formik?.setFieldValue(
//                         `clients.${index}.destination.city`,
//                         city.city
//                       );
//                       formik?.setFieldValue(
//                         `clients.${index}.destination.state`,
//                         city.state
//                       );
//                       formik?.setFieldValue(
//                         `clients.${index}.destination.pincode`,
//                         city.pincode
//                       );
//                     }
//                   }}
//                   // error={formik?.errors.destination?.city? formik?.errors.destination?.city:""}
//                   placeholder="Search destination city"
//                 />
//               </div>
//             </div>
//             {/* Load Details */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="md:col-span-2">
//                 <Label>Load Description *</Label>
//                 <Textarea
//                   value={formik?.values.clients[index].loadDetails.description}
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.loadDetails.description`,
//                       e.target.value
//                     )
//                   }
//                   placeholder="Describe the load/cargo"
//                   className={
//                     clientErrors?.loadDetails?.description
//                       ? "border-red-500"
//                       : ""
//                   }
//                   rows={2}
//                 />
//                 {clientErrors?.loadDetails?.description && (
//                   <p className="text-sm text-red-500 mt-1">
//                     {clientErrors.loadDetails.description}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label>Weight (tons) *</Label>
//                 <Input
//                   type="number"
//                   step="0.1"
//                   value={formik?.values.clients[index].loadDetails.weight}
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.loadDetails.weight`,
//                       Number(e.target.value)
//                     )
//                   }
//                   placeholder="0.0"
//                   className={
//                     clientErrors?.loadDetails?.weight ? "border-red-500" : ""
//                   }
//                 />
//                 {clientErrors?.loadDetails?.weight && (
//                   <p className="text-sm text-red-500 mt-1">
//                     {clientErrors.loadDetails.weight}
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <Label>Quantity *</Label>
//                 <Input
//                   type="number"
//                   value={formik?.values.clients[index].loadDetails.quantity}
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.loadDetails.quantity`,
//                       Number(e.target.value)
//                     )
//                   }
//                   placeholder="1"
//                   className={
//                     clientErrors?.loadDetails?.quantity ? "border-red-500" : ""
//                   }
//                 />
//                 {clientErrors?.loadDetails?.quantity && (
//                   <p className="text-sm text-red-500 mt-1">
//                     {clientErrors.loadDetails.quantity}
//                   </p>
//                 )}
//               </div>

//               <LoadTypeSelect
//                 value={formik?.values.clients[index].loadDetails.loadType}
//                 onChange={(value) =>
//                   formik?.setFieldValue(
//                     `clients.${index}.loadDetails.loadType`,
//                     value
//                   )
//                 }
//                 error={clientErrors?.loadDetails?.loadType}
//               />

//               <PackagingTypeSelect
//                 value={formik?.values.clients[index].loadDetails.packagingType}
//                 onChange={(value) =>
//                   formik?.setFieldValue(
//                     `clients.${index}.loadDetails.packagingType`,
//                     value
//                   )
//                 }
//                 error={clientErrors?.loadDetails?.packagingType}
//               />

//               <div>
//                 <Label>Rate (₹) *</Label>
//                 <Input
//                   type="number"
//                   value={formik?.values.clients[index].rate}
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.rate`,
//                       Number(e.target.value)
//                     )
//                   }
//                   placeholder="0"
//                   className={clientErrors?.rate ? "border-red-500" : ""}
//                 />
//                 {clientErrors?.rate && (
//                   <p className="text-sm text-red-500 mt-1">
//                     {clientErrors.rate}
//                   </p>
//                 )}
//               </div>
//               <div>
//                 <Label>Commission (₹) *</Label>
//                 <Input
//                   type="number"
//                   value={formik?.values.clients[index].commission}
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.commission`,
//                       Number(e.target.value)
//                     )
//                   }
//                   placeholder="0"
//                   className={clientErrors?.commission ? "border-red-500" : ""}
//                 />
//                 <p className="text-xs text-muted-foreground mt-1">
//                   {formik?.values.clients[index].commission > 0
//                     ? `${(
//                         (formik?.values.clients[index].commission /
//                           (formik?.values.clients[index].rate || 1)) *
//                         100
//                       ).toFixed(1)}%`
//                     : "0%"}
//                 </p>
//                 {clientErrors?.rate && (
//                   <p className="text-sm text-red-500 mt-1">
//                     {clientErrors.commission}
//                   </p>
//                 )}
//               </div>
//               <div className="md:col-span-2">
//                 <Label>Special Instructions</Label>
//                 <Textarea
//                   value={
//                     formik?.values.clients[index].loadDetails.specialInstructions
//                   }
//                   onChange={(e) =>
//                     formik?.setFieldValue(
//                       `clients.${index}.loadDetails.specialInstructions`,
//                       e.target.value
//                     )
//                   }
//                   placeholder="Any special handling instructions"
//                   rows={2}
//                 />
//               </div>
//             </div>
//           </CardContent>
//         </Formik>
//       </DialogContent>
//     </Dialog>
//   );
// };

// export default AddLoadDialog;
import React from "react";
import {useQuery} from "@tanstack/react-query";
import {Formik, Form, Field, ErrorMessage} from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {useSelector} from "react-redux";
import {CardContent} from "components/ui/card";

const AddLoadDialog = ({open, onOpenChange}) => {
  const {user} = useSelector((state) => state.auth); // Example user context, replace with actual context or state management
  const initialValues = {
    client: "",
    loadDate: "",
    origin: {
      city: "",
      state: "",
      pincode: "",
    },
    destination: {
      city: "",
      state: "",
      pincode: "",
    },
    loadDetails: {
      description: "",
      weight: 0,
      quantity: 0,
      loadType: "",
      packagingType: "",
      specialInstructions: "",
    },
    rate: 0,
    commission: 0,
  };

  const tripValidationSchema = Yup.object().shape({
    client: Yup.string().required("Client is required"),
    loadDate: Yup.date().required("Date is required"),
    origin: Yup.object().shape({
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State is required"),
      pincode: Yup.string().required("Pincode is required"),
    }),
    destination: Yup.object().shape({
      city: Yup.string().required("City is required"),
      state: Yup.string().required("State is required"),
      pincode: Yup.string().required("Pincode is required"),
    }),
    loadDetails: Yup.object().shape({
      description: Yup.string().required("Load Description is required"),
      weight: Yup.number().required("Weight is required"),
      quantity: Yup.number().required("Quantity is required"),
      loadType: Yup.string().required("Load Type is required"),
      packagingType: Yup.string().required("Packaging Type is required"),
      specialInstructions: Yup.string(),
    }),
    rate: Yup.number().required("Rate is required"),
    commission: Yup.number().required("Commission is required"),
  });

  const handleSubmit = (values) => {
    console.log("Form values:", values);
    // Handle form submission
  };

  const {data: clientsData, isLoading: loadingClients} = useQuery({
    queryKey: ["users", "clients"],
    queryFn: () => usersApi.getAll({role: "client"}),
    enabled: user?.role === "admin" && open,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  console.log(clientsData)

  const clients = clientsData.data.users || [];
  const clientErrors = {}; // Example error handling, replace with actual error handling

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {/* <Truck className="h-5 w-5 mr-2" /> */}
            Add Load
          </DialogTitle>
          <DialogDescription>
            Create a new client and load details.
          </DialogDescription>
        </DialogHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={tripValidationSchema}
          onSubmit={handleSubmit}>
          {({formik}) => (
            <Form>
              <CardContent className="space-y-4">
                {/* Client Selection */}
                <div className="flex flex-row justify-between">
                  <div>
                    <Label>Client *</Label>
                    <Select
                      value={formik?.values.client}
                      onValueChange={(value) =>
                        formik?.setFieldValue(`client`, value)
                      }>
                      <SelectTrigger
                        className={
                          formik?.errors.client ? "border-red-500" : ""
                        }>
                        <SelectValue
                          placeholder={
                            loadingClients ? "Loading..." : "Select client"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client._id} value={client._id}>
                            <div className="flex flex-col">
                              <span>{client.name}</span>
                              <span className="text-sm text-gray-500">
                                {client.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clientErrors?.client && (
                      <p className="text-sm text-red-500 mt-1">
                        {clientErrors.client}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="datetime-local"
                      value={formik?.values.loadDate}
                      onChange={(e) =>
                        formik?.setFieldValue(`loadDate`, e.target.value)
                      }
                      className={formik?.errors.loadDate ? "border-red-500" : ""}
                    />
                    {formik?.errors.loadDate && (
                      <p className="text-sm text-red-500 mt-1">
                        {formik?.errors.loadDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Origin */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-600">
                      Origin (Pickup)
                    </h4>
                    <Field
                      name="origin.city"
                      type="text"
                      placeholder="Search pickup city"
                    />
                    <ErrorMessage
                      name="origin.city"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                    <Field
                      name="origin.state"
                      type="text"
                      placeholder="State"
                    />
                    <ErrorMessage
                      name="origin.state"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                    <Field
                      name="origin.pincode"
                      type="text"
                      placeholder="Pincode"
                    />
                    <ErrorMessage
                      name="origin.pincode"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                  {/* Destination */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-red-600">
                      Destination (Drop-off)
                    </h4>
                    <Field
                      name="destination.city"
                      type="text"
                      placeholder="Search destination city"
                    />
                    <ErrorMessage
                      name="destination.city"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                    <Field
                      name="destination.state"
                      type="text"
                      placeholder="State"
                    />
                    <ErrorMessage
                      name="destination.state"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                    <Field
                      name="destination.pincode"
                      type="text"
                      placeholder="Pincode"
                    />
                    <ErrorMessage
                      name="destination.pincode"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                </div>
                {/* Load Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* <div className="md:col-span-2">
                    <Label>Load Description *</Label>
                    <Field
                      name="loadDetails.description"
                      as="textarea"
                      placeholder="Describe the load/cargo"
                      rows={2}
                    />
                    <ErrorMessage
                      name="loadDetails.description"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div> */}
                  <div>
                    <Label>Weight (tons) *</Label>
                    <Field
                      name="loadDetails.weight"
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                    />
                    <ErrorMessage
                      name="loadDetails.weight"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Quantity *</Label>
                    <Field
                      name="loadDetails.quantity"
                      type="number"
                      placeholder="1"
                    />
                    <ErrorMessage
                      name="loadDetails.quantity"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Load Type *</Label>
                    <Field
                      name="loadDetails.loadType"
                      type="text"
                      placeholder="Load Type"
                    />
                    <ErrorMessage
                      name="loadDetails.loadType"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Packaging Type *</Label>
                    <Field
                      name="loadDetails.packagingType"
                      type="text"
                      placeholder="Packaging Type"
                    />
                    <ErrorMessage
                      name="loadDetails.packagingType"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Rate (₹) *</Label>
                    <Field name="rate" type="number" placeholder="0" />
                    <ErrorMessage
                      name="rate"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                  </div>
                  <div>
                    <Label>Commission (₹) *</Label>
                    <Field name="commission" type="number" placeholder="0" />
                    <ErrorMessage
                      name="commission"
                      component="div"
                      className="text-sm text-red-500 mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formik?.values.commission > 0
                        ? `${(
                            (formik?.values.commission /
                              (formik?.values.rate || 1)) *
                            100
                          ).toFixed(1)}%`
                        : "0%"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Special Instructions</Label>
                    <Field
                      name="loadDetails.specialInstructions"
                      as="textarea"
                      placeholder="Any special handling instructions"
                      rows={2}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded">
                  Submit
                </button>
              </CardContent>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};

export default AddLoadDialog;
