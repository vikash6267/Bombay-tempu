"use client"
import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Truck,
  Route,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  MapPin,
  Package,
  Calculator,
  PiggyBank,
  Activity
} from "lucide-react"
import { api } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { tripsApi } from "lib/api"
import { Skeleton } from "@/components/ui/skeleton"

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  isLoading = false
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
    )
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
  )
}

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
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) return null

  const profitMargin = (
    (data.totalFinalProfit / data.totalProfitBeforeExpenses) *
    100
  ).toFixed(1)

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
  {/* Revenue Before Expenses */}
  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
    <span className="font-medium text-green-700 dark:text-green-300">
      Revenue (Before Expenses)
    </span>
    <span className="font-bold text-green-700 dark:text-green-300">
      ₹{data.totalProfitBeforeExpenses.toLocaleString("en-IN")}
    </span>
  </div>

  {/* Trip Expenses */}
  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
    <span className="font-medium text-red-700 dark:text-red-300">
      Trip Expenses
    </span>
    <span className="font-bold text-red-700 dark:text-red-300">
      -₹{(data.totalExpenses - data.otherExpense).toLocaleString("en-IN")}
    </span>
  </div>

  {/* Other Expenses */}
  <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
    <span className="font-medium text-red-700 dark:text-red-300">
      Other Expenses
    </span>
    <span className="font-bold text-red-700 dark:text-red-300">
      -₹{data.otherExpense.toLocaleString("en-IN")}
    </span>
  </div>

  {/* Total Expenses */}
  <div className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900 rounded-lg">
    <span className="font-semibold text-red-800 dark:text-red-200">
      Total Expenses
    </span>
    <span className="font-bold text-red-800 dark:text-red-200">
      -₹{data.totalExpenses.toLocaleString("en-IN")}
    </span>
  </div>

  {/* Final Profit */}
  <div className="border-t pt-3">
    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
      <span className="font-bold text-blue-700 dark:text-blue-300">
        Final Profit
      </span>
      <span className="font-bold text-xl text-blue-700 dark:text-blue-300">
        ₹{data.totalFinalProfit.toLocaleString("en-IN")}
      </span>
    </div>
  </div>

  {/* Profit Margin */}
  <div className="text-center pt-2">
    <Badge variant="secondary" className="text-sm">
      Profit Margin: {profitMargin}%
    </Badge>
  </div>
</div>

      </CardContent>
    </Card>
  )
}

function RecentTrips() {
  const { data: trips, isLoading } = useQuery({
    queryKey: ["recent-trips"],
    queryFn: () => api.get("/trips?limit=5&sort=-createdAt")
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
          <CardDescription>Latest trip activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
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
    )
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
            {trips?.data?.data?.trips?.map(trip => (
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
  )
}

function UpcomingMaintenance() {
  const { data: maintenance, isLoading } = useQuery({
    queryKey: ["upcoming-maintenance"],
    queryFn: () => api.get("/maintenance?status=scheduled&limit=5")
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Maintenance</CardTitle>
          <CardDescription>Scheduled vehicle maintenance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Maintenance</CardTitle>
        <CardDescription>Scheduled vehicle maintenance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {maintenance?.data?.data?.maintenanceRecords?.length > 0 ? (
            maintenance.data.data.maintenanceRecords.map(item => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {item.vehicle?.registrationNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {new Date(item.scheduledDate).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ₹{item.estimatedCost?.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming maintenance scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useSelector(state => state.auth)
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        const res = await tripsApi.getDashboard()
        console.log("Dashboard Data:", res.data)
        setDashboardData(res.data)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
            title="Pod Count"
            value={dashboardData?.pendingPodClientsCount?.toLocaleString("en-IN") || "0"}
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
            <TabsTrigger value="trips">Recent Trips</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <ProfitBreakdownCard data={dashboardData} isLoading={isLoading} />

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Frequently used actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start">
                    <Route className="mr-2 h-4 w-4" />
                    Create New Trip
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Add Vehicle
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record Payment
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Business Metrics Summary */}
            {dashboardData && !isLoading && (
              <Card>
                <CardHeader>
                  <CardTitle>Business Performance Summary</CardTitle>
                  <CardDescription>
                    Key insights from your operations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        ₹
                        {Math.round(
                          dashboardData.totalFinalProfit /
                            dashboardData.totalTrips
                        ).toLocaleString("en-IN")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Profit per Trip
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(
                          dashboardData.totalPods / dashboardData.totalTrips
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Pods per Trip
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(
                          (dashboardData.totalFinalProfit /
                            dashboardData.totalProfitBeforeExpenses) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Profit Margin
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trips">
            <RecentTrips />
          </TabsContent>

          <TabsContent value="maintenance">
            <UpcomingMaintenance />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
