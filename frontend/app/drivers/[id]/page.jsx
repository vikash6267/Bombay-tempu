"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "lib/api";
import { DashboardLayout } from "components/layout/dashboard-layout";

const Page = () => {
  const { id } = useParams();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (userData) {
      console.log("Fetched user data:", userData);
    }
  }, [userData]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
      <h1>User Detail Page</h1>
      <pre>{JSON.stringify(userData, null, 2)}</pre>
    </DashboardLayout>
  );
};

export default Page;
