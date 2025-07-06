"use client"

import { useState } from "react"
import { useFormik } from "formik"
import * as Yup from "yup"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useDispatch } from "react-redux"
// import { updateUserProfile } from "@/lib/slices/authSlice"
import toast from "react-hot-toast"
import { Upload, User } from "lucide-react"

export function ProfileInfo({ user }) {
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [previewImage, setPreviewImage] = useState(user?.avatar || null)

  const formik = useFormik({
    initialValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      state: user?.state || "",
      zipCode: user?.zipCode || "",
      bio: user?.bio || "",
      avatar: null,
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required("First name is required"),
      lastName: Yup.string().required("Last name is required"),
      email: Yup.string().email("Invalid email address").required("Email is required"),
      phone: Yup.string(),
      address: Yup.string(),
      city: Yup.string(),
      state: Yup.string(),
      zipCode: Yup.string(),
      bio: Yup.string().max(500, "Bio must be 500 characters or less"),
    }),
    onSubmit: async (values) => {
      setIsLoading(true)
      try {
        // In a real app, you would upload the avatar and save the profile to your backend
        const formData = new FormData()
        Object.keys(values).forEach((key) => {
          if (values[key] !== null) {
            formData.append(key, values[key])
          }
        })

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // dispatch(updateUserProfile(values))
        toast.success("Profile updated successfully")
      } catch (error) {
        toast.error("Failed to update profile")
        console.error("Profile update error:", error)
      } finally {
        setIsLoading(false)
      }
    },
  })

  const handleAvatarChange = (event) => {
    const file = event.currentTarget.files[0]
    if (file) {
      formik.setFieldValue("avatar", file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal information and profile picture</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={formik.handleSubmit}>
          <div className="mb-6 flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={previewImage || "/placeholder.svg"} alt={user?.firstName} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-2">
              <Label
                htmlFor="avatar"
                className="flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photo
              </Label>
              <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter your first name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.firstName}
              />
              {formik.touched.firstName && formik.errors.firstName ? (
                <div className="text-sm text-red-500">{formik.errors.firstName}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter your last name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.lastName}
              />
              {formik.touched.lastName && formik.errors.lastName ? (
                <div className="text-sm text-red-500">{formik.errors.lastName}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-sm text-red-500">{formik.errors.email}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.phone}
              />
              {formik.touched.phone && formik.errors.phone ? (
                <div className="text-sm text-red-500">{formik.errors.phone}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Enter your address"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.address}
              />
              {formik.touched.address && formik.errors.address ? (
                <div className="text-sm text-red-500">{formik.errors.address}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                placeholder="Enter your city"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.city}
              />
              {formik.touched.city && formik.errors.city ? (
                <div className="text-sm text-red-500">{formik.errors.city}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                name="state"
                placeholder="Enter your state"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.state}
              />
              {formik.touched.state && formik.errors.state ? (
                <div className="text-sm text-red-500">{formik.errors.state}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">Zip Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                placeholder="Enter your zip code"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.zipCode}
              />
              {formik.touched.zipCode && formik.errors.zipCode ? (
                <div className="text-sm text-red-500">{formik.errors.zipCode}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself"
              rows={4}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.bio}
            />
            {formik.touched.bio && formik.errors.bio ? (
              <div className="text-sm text-red-500">{formik.errors.bio}</div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
