"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSelector, useDispatch } from "react-redux"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { authApi } from "@/lib/api"
import toast from "react-hot-toast"

const registerSchema = Yup.object().shape({
  name: Yup.string().min(2, "Name must be at least 2 characters").required("Name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
  role: Yup.string().required("Role is required"),
  phone: Yup.string().required("Phone number is required"),
})

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const dispatch = useDispatch()
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth)

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const { confirmPassword, ...registerData } = values
      await authApi.register(registerData)
      router.push("/auth/login")
      toast.success("Registration successful! Please log in.")  
      setSubmitting(false)
    } catch (error) {
      console.error("Registration failed:", error)
      toast.error(error.response?.data?.message || "Registration failed") 
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Truck className="h-12 w-12 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold ">Create your account</h2>
          <p className="mt-2 text-sm ">Transport & Fleet Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Create a new account to get started</CardDescription>
          </CardHeader>

          <Formik
            initialValues={{
              name: "",
              email: "",
              password: "",
              confirmPassword: "",
              role: "",
              phone: "",
            }}
            validationSchema={registerSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched, setFieldValue, values }) => (
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
                      {({ field }) => (
                        <Input
                          {...field}
                          id="name"
                          placeholder="Enter your full name"
                          className={errors.name && touched.name ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="name" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Field name="email">
                      {({ field }) => (
                        <Input
                          {...field}
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className={errors.email && touched.email ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="email" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Field name="phone">
                      {({ field }) => (
                        <Input
                          {...field}
                          id="phone"
                          placeholder="Enter your phone number"
                          className={errors.phone && touched.phone ? "border-red-500" : ""}
                        />
                      )}
                    </Field>
                    <ErrorMessage name="phone" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select onValueChange={(value) => setFieldValue("role", value)} value={values.role}>
                      <SelectTrigger className={errors.role && touched.role ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fleet_owner">Fleet Owner</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="driver">Driver</SelectItem>
                      </SelectContent>
                    </Select>
                    <ErrorMessage name="role" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Field name="password">
                        {({ field }) => (
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className={errors.password && touched.password ? "border-red-500" : ""}
                          />
                        )}
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <ErrorMessage name="password" component="p" className="text-sm text-red-500" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Field name="confirmPassword">
                        {({ field }) => (
                          <Input
                            {...field}
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            className={errors.confirmPassword && touched.confirmPassword ? "border-red-500" : ""}
                          />
                        )}
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <ErrorMessage name="confirmPassword" component="p" className="text-sm text-red-500" />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 mt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting || loading}>
                    {isSubmitting || loading ? "Creating account..." : "Create account"}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-gray-600">Already have an account? </span>
                    <Link href="/auth/login" className="text-primary hover:underline">
                      Sign in
                    </Link>
                  </div>
                </CardFooter>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    </div>
  )
}
