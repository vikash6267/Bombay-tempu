"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useSelector, useDispatch} from "react-redux";
import {Formik, Form, Field, ErrorMessage} from "formik";
import * as Yup from "yup";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {Truck, Eye, EyeOff} from "lucide-react";
import {useState} from "react";
import {authApi, usersApi} from "@/lib/api";
import toast from "react-hot-toast";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "../ui/dialog";

const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters"),
  role: Yup.string().required("Role is required"),
  phone: Yup.string().required("Phone number is required"),
  balance: Yup.number(),
});
export const AddUserDialog = ({open, onOpenChange, onUserAdded}) => {
  const {loading, error} = useSelector((state) => state.auth);

  const handleSubmit = async (values, {setSubmitting}) => {
    try {
      const registerData = {
        name: values.name,
        email: values.email,
        password: values.phone,
        role: values.role,
        phone: values.phone,
        balance: values.balance,
      };
      await usersApi.create(registerData);
onUserAdded()
      toast.success("Registration successful!.");
      setSubmitting(false);
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>

        <Formik
          initialValues={{
            name: "",
            email: "",
            password: "",
            role: "",
            phone: "",
            balance: 0,
          }}
          validationSchema={registerSchema}
          onSubmit={handleSubmit}>
          {({isSubmitting, errors, touched, setFieldValue, values}) => (
            <Form>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Field name="name">
                    {({field}) => (
                      <Input
                        {...field}
                        id="name"
                        placeholder="Enter your full name"
                        className={
                          errors.name && touched.name ? "border-red-500" : ""
                        }
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="name"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Field name="email">
                    {({field}) => (
                      <Input
                        {...field}
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className={
                          errors.email && touched.email ? "border-red-500" : ""
                        }
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="email"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Field name="phone">
                    {({field}) => (
                      <Input
                        {...field}
                        id="phone"
                        placeholder="Enter your phone number"
                        className={
                          errors.phone && touched.phone ? "border-red-500" : ""
                        }
                      />
                    )}
                  </Field>
                  <ErrorMessage
                    name="phone"
                    component="p"
                    className="text-sm text-red-500"
                  />
                </div>
                <div className="flex flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      onValueChange={(value) => setFieldValue("role", value)}
                      value={values.role}
                      className="w-full">
                      <SelectTrigger
                        className={
                          errors.role && touched.role
                            ? "border-red-500 w-full"
                            : " w-full"
                        }>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fleet_owner">Fleet Owner</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage
                      name="role"
                      component="p"
                      className="text-sm text-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="balance">Opening Balance</Label>
                    <Field name="balance">
                      {({field}) => (
                        <Input
                          {...field}
                          id="balance"
                          type="number"
                          placeholder="Enter Amount"
                          className={
                            errors.balance && touched.balance
                              ? "border-red-500"
                              : ""
                          }
                        />
                      )}
                    </Field>
                    <ErrorMessage
                      name="balance"
                      component="p"
                      className="text-sm text-red-500"
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 mt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || loading}>
                  {isSubmitting || loading ? "Creating User..." : "Create user"}
                </Button>
              </CardFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};
