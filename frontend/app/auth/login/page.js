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
import {Truck, Eye, EyeOff} from "lucide-react";
import {useState} from "react";
import {authApi} from "@/lib/api";
import {loginFailure, loginStart, loginSuccess} from "@/lib/slices/authSlice";
import {set} from "date-fns";
import Image from "next/image";
const logo = require("../../../public/logo.jpg");
const loginSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const {isAuthenticated, loading, error} = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);
 
  const handleSubmit = async (values, {setSubmitting, resetForm}) => {
    dispatch(loginStart());
    try {
      const res = await authApi.login(values);
      console.log(res);
      res &&
        (await dispatch(loginSuccess(res)), router.push("/dashboard"));
      resetForm();
    } catch (error) {
      dispatch(loginFailure(error.message || "Login failed"));
      console.error("Login failed:", {...error});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Image
              src={logo} 
              alt="Logo"
              width={80}
              height={80}
              // className="h-16 w-16 mx-auto mb-4"
            />
          </div>
          <p className="mt-2 text-xl font-extrabold text-gray-600">
           Bombay Uttranchal Tempo Service
          </p>
          <h2 className="mt-2 text-3xl  ">
            Sign in to your account
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <Formik
            initialValues={{email: "", password: ""}}
            validationSchema={loginSchema}
            onSubmit={handleSubmit}>
            {({isSubmitting, errors, touched, values, setSubmitting}) => (
              <Form
                onSubmitCapture={(e) => {
                  e.preventDefault();
                }}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

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
                            errors.email && touched.email
                              ? "border-red-500"
                              : ""
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
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Field name="password">
                        {({field}) => (
                          <Input
                            {...field}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            className={
                              errors.password && touched.password
                                ? "border-red-500"
                                : ""
                            }
                          />
                        )}
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="p"
                      className="text-sm text-red-500"
                    />
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 mt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || loading}>
                    {isSubmitting || loading ? "Signing in..." : "Sign in"}
                  </Button>

                  <div className="text-center text-sm">
                    <span className="text-gray-600">
                      Don't have an account?{" "}
                    </span>
                    <Link
                      href="/auth/register"
                      className="text-primary hover:underline">
                      Sign up
                    </Link>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm text-primary hover:underline">
                      Forgot your password?
                    </Link>
                  </div>
                </CardFooter>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    </div>
  );
}
