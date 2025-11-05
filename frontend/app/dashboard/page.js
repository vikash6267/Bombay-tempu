"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Route,
  CreditCard,
  Package,
  Calculator,
  PiggyBank,
  Activity,
  MapPin,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { tripsApi } from "lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import VehicleExpiryList from "./ui/ExpiryList";
import PodReport from "./ui/PodStatement";

// StatCard Component
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  isLoading = false,
}) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            ) : null}
            {trendValue && <span className="mr-1">{trendValue}</span>}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ProfitBreakdownCard Component
function ProfitBreakdownCard({ data, isLoading }) {
  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const profitMargin = (
    (data.totalFinalProfit / data.totalProfitBeforeExpenses) *
    100
  ).toFixed(1);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Profit Breakdown
        </CardTitle>
        <CardDescription>Financial overview for current period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Trip Profit */}
          <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <span className="font-medium text-green-700 dark:text-green-300">
              Trip Profit
            </span>
            <span className="font-bold text-green-700 dark:text-green-300">
              ₹{data.totalTripProfit?.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Commission */}
          <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <span className="font-medium text-blue-700 dark:text-blue-300">
              Commission
            </span>
            <span className="font-bold text-blue-700 dark:text-blue-300">
              ₹{data.totalCommission?.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Trip Difference */}
          <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <span className="font-medium text-purple-700 dark:text-purple-300">
              Trip Difference
            </span>
            <span className="font-bold text-purple-700 dark:text-purple-300">
              ₹{data.totalTripDifference?.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Trip Expenses */}
          <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <span className="font-medium text-red-700 dark:text-red-300">
              Trip Expenses
            </span>
            <span className="font-bold text-red-700 dark:text-red-300">
              -₹
              {(data.totalExpenses - data.otherExpense)?.toLocaleString(
                "en-IN"
              )}
            </span>
          </div>

          {/* Other Expenses */}
          <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
            <span className="font-medium text-red-700 dark:text-red-300">
              Other Expenses
            </span>
            <span className="font-bold text-red-700 dark:text-red-300">
              -₹{data.otherExpense?.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Total Expenses */}
          <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900 rounded-lg">
            <span className="font-semibold text-red-800 dark:text-red-200">
              Total Expenses
            </span>
            <span className="font-bold text-red-800 dark:text-red-200">
              -₹{data.totalExpenses?.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Final Profit */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="font-bold text-blue-700 dark:text-blue-300">
                Final Profit
              </span>
              <span className="font-bold text-xl text-blue-700 dark:text-blue-300">
                ₹{data.totalFinalProfit?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Profit Margin */}
        </div>
      </CardContent>
    </Card>
  );
}

// RecentTrips Component
function RecentTrips() {
  const { data: trips, isLoading } = useQuery({
    queryKey: ["recent-trips"],
    queryFn: () => api.get("/trips?limit=5&sort=-createdAt"),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
          <CardDescription>Latest trip activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trips</CardTitle>
        <CardDescription>Latest trip activities</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip ID</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips?.data?.data?.trips?.map((trip) => (
              <TableRow key={trip._id}>
                <TableCell className="font-medium">
                  #{trip._id.slice(-6)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-3 w-3" />
                    <span className="text-sm">
                      {trip.origin?.city} → {trip.destination?.city}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      trip.status === "completed"
                        ? "default"
                        : trip.status === "in_progress"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {trip.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  ₹{trip.clientAmount?.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            )) || (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  No recent trips found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// DashboardPage Component
export default function DashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");

  // limit month selection to last 18 months from current month
  const now = new Date();
  const maxMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const minDate = new Date(now);
  minDate.setMonth(minDate.getMonth() - 17); // include current month + previous 17 = 18 months
  const minMonthStr = `${minDate.getFullYear()}-${String(minDate.getMonth() + 1).padStart(2, "0")}`;

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const params = selectedMonth
        ? { month: selectedMonth, monthsBack: 18 }
        : undefined;
      const res = await tripsApi.getDashboard(params);
      setDashboardData(res.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="text-muted-foreground">
              Here's your business overview and performance metrics.
            </p>
        </div>
        <div className="flex items-center space-x-2">
          <Activity className="h-5 w-5 text-green-500" />
          <span className="text-sm text-muted-foreground">
            Live Dashboard
          </span>
        </div>
      </div>

      {/* Month Filter */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Month-wise Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              min={minMonthStr}
              max={maxMonthStr}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <button
            className="text-blue-600 text-sm underline"
            onClick={() => setSelectedMonth("")}
          >
            View All
          </button>
          {selectedMonth && (
            <Badge variant="secondary">Showing last 18 months from {selectedMonth}</Badge>
          )}
        </CardContent>
      </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Trips"
            value={dashboardData?.totalTrips?.toString() || "0"}
            description="completed trips"
            icon={Route}
            trend="up"
            trendValue="+12.5%"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Pods"
            value={dashboardData?.totalPods?.toLocaleString("en-IN") || "0"}
            description="cargo pods handled"
            icon={Package}
            trend="up"
            trendValue=""
            isLoading={isLoading}
          />
          <StatCard
            title="Pending Pods"
            value={
              dashboardData?.pendingPodClientsCount?.toLocaleString("en-IN") ||
              "0"
            }
            description="Trip Pending Pods"
            icon={Package}
            trend="up"
            trendValue=""
            isLoading={isLoading}
          />
          <StatCard
            title="Total Expenses"
            value={
              dashboardData
                ? `₹${dashboardData.totalExpenses.toLocaleString("en-IN")}`
                : "₹0"
            }
            description="operational costs"
            icon={CreditCard}
            trend="down"
            trendValue="-5.2%"
            isLoading={isLoading}
          />
          <StatCard
            title="Final Profit"
            value={
              dashboardData
                ? `₹${dashboardData.totalFinalProfit.toLocaleString("en-IN")}`
                : "₹0"
            }
            description="net earnings"
            icon={PiggyBank}
            trend="up"
            trendValue="+15.7%"
            isLoading={isLoading}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="pods">Pods</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <ProfitBreakdownCard data={dashboardData} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="maintenance">
            <VehicleExpiryList />
          </TabsContent>
          <TabsContent value="pods">
            <PodReport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
