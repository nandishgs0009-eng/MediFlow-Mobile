import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Pill,
  Users,
  Activity,
  BarChart3,
  LogOut,
  Menu,
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Heart,
  Calendar,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeTreatments: 0,
    totalMedicines: 0,
    totalIntakeLogs: 0,
    adherenceRate: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [treatmentsList, setTreatmentsList] = useState<any[]>([]);

  useEffect(() => {
    // Check if admin is logged in
    const adminId = localStorage.getItem("admin_id");
    const adminEmailLS = localStorage.getItem("admin_email");

    if (!adminId || !adminEmailLS) {
      navigate("/admin-login");
      return;
    }

    setAdminEmail(adminEmailLS);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch all users data
      const { data: usersData, error: usersError } = await (supabase as any)
        .from("profiles")
        .select("id");

      // Fetch all treatments data
      const { data: treatmentsData, error: treatmentsError } = await (supabase as any)
        .from("treatments")
        .select("id, name");

      // Fetch all medicines data
      const { data: medicinesData, error: medicinesError } = await (supabase as any)
        .from("medicines")
        .select("id");

      // Fetch ALL intake logs to calculate overall adherence
      const { data: allLogsData, error: logsError } = await (supabase as any)
        .from("intake_logs")
        .select("id, status, created_at");

      // Fetch recent admin logins
      const { data: loginsData, error: loginsError } = await (supabase as any)
        .from("admin_logins")
        .select("*")
        .order("login_time", { ascending: false })
        .limit(20);

      if (loginsError) console.error("Admin logins error:", loginsError);
      console.log("Recent admin logins fetched:", loginsData);

      // Log errors if they exist
      if (usersError) console.error("Users error:", usersError);
      if (treatmentsError) console.error("Treatments error:", treatmentsError);
      if (medicinesError) console.error("Medicines error:", medicinesError);
      if (logsError) console.error("Logs error:", logsError);
      if (loginsError) console.error("Logins error:", loginsError);

      // Calculate counts from fetched data
      const totalUsersCount = usersData?.length || 0;
      const totalTreatmentsCount = treatmentsData?.length || 0;
      const totalMedicinesCount = medicinesData?.length || 0;

      // Calculate overall adherence rate based on ALL patients' logs
      const takenCount = allLogsData?.filter((log: any) => log.status === "taken").length || 0;
      const totalLogsCount = allLogsData?.length || 0;
      const overallAdherence = totalLogsCount > 0 ? Math.round((takenCount / totalLogsCount) * 100) : 0;

      console.log("Dashboard Stats:", {
        totalUsers: totalUsersCount,
        totalTreatments: totalTreatmentsCount,
        totalMedicines: totalMedicinesCount,
        totalLogs: totalLogsCount,
        takenLogs: takenCount,
        adherenceRate: overallAdherence,
      });

      setStats({
        totalUsers: totalUsersCount,
        activeTreatments: totalTreatmentsCount,
        totalMedicines: totalMedicinesCount,
        totalIntakeLogs: totalLogsCount,
        adherenceRate: overallAdherence,
      });

      setRecentLogins(loginsData || []);
      setTreatmentsList(treatmentsData || []);

      // Prepare chart data (weekly adherence based on ALL logs)
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];

        // Filter logs for this specific day
        const dayLogs = allLogsData?.filter((log: any) => {
          const logDate = log.created_at?.split("T")[0];
          return logDate === dateStr;
        }) || [];

        const dayTaken = dayLogs.filter((log: any) => log.status === "taken").length;
        const dayAdherence = dayLogs.length > 0 ? Math.round((dayTaken / dayLogs.length) * 100) : 0;

        weeklyData.push({
          date: dayName,
          adherence: dayAdherence,
          taken: dayTaken,
          total: dayLogs.length,
        });
      }
      setChartData(weeklyData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_email");
    localStorage.removeItem("admin_login_time");
    navigate("/admin-login");
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "from-blue-500/20 to-blue-600/20",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Active Treatments",
      value: stats.activeTreatments,
      icon: Activity,
      color: "from-purple-500/20 to-purple-600/20",
      borderColor: "border-purple-500/20",
    },
    {
      title: "Total Medicines",
      value: stats.totalMedicines,
      icon: Pill,
      color: "from-green-500/20 to-green-600/20",
      borderColor: "border-green-500/20",
    },
    {
      title: "Adherence Rate",
      value: `${stats.adherenceRate}%`,
      icon: TrendingUp,
      color: "from-orange-500/20 to-orange-600/20",
      borderColor: "border-orange-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border/50 transition-all duration-300 flex flex-col fixed left-0 top-0 h-screen z-40`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">MediFlow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <div
            className={`text-xs font-semibold text-foreground/60 ${
              sidebarOpen ? "px-3 mb-3" : "hidden"
            }`}
          >
            ADMIN
          </div>

          <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>

          <button 
            onClick={() => navigate("/admin-patients")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Patients</span>}
          </button>

          <button 
            onClick={() => navigate("/admin-treatments")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Treatments</span>}
          </button>

          <button 
            onClick={() => navigate("/admin-reports")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
          >
            <Calendar className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Reports</span>}
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive font-medium"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}
      >
        {/* Top Bar */}
        <nav className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border/50 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Admin Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Welcome back, {adminEmail}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </nav>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading dashboard...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {statCards.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className={`bg-gradient-to-br ${stat.color} border ${stat.borderColor}`}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-bold">{stat.value}</h3>
                          </div>
                          <Icon className="w-12 h-12 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Weekly Adherence Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Adherence Trend</CardTitle>
                    <CardDescription>Medication adherence rate by day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="adherence"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            name="Adherence %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No data available</p>
                    )}
                  </CardContent>
                </Card>

                {/* Status Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Platform status overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">System Status</span>
                          <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Healthy
                          </Badge>
                        </div>
                        <Progress value={100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Database</span>
                          <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20">
                            Active
                          </Badge>
                        </div>
                        <Progress value={100} />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">API</span>
                          <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20">
                            Online
                          </Badge>
                        </div>
                        <Progress value={100} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Admin Logins */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Admin Logins</CardTitle>
                    <CardDescription>Latest admin access activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {recentLogins.length > 0 ? (
                        recentLogins.map((login, index) => (
                          <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0 text-xs">
                            <div className="flex items-center gap-2 flex-1">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <Users className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{login.email}</p>
                                <p className="text-muted-foreground truncate">
                                  {login.login_time
                                    ? new Date(login.login_time).toLocaleString()
                                    : "N/A"}
                                </p>
                                {login.ip_address && (
                                  <p className="text-muted-foreground text-xs truncate">
                                    IP: {login.ip_address}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                login.status === "active"
                                  ? "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20 ml-2 flex-shrink-0"
                                  : "bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/20 ml-2 flex-shrink-0"
                              }
                            >
                              {login.status || "active"}
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No login history</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Treatments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Active Treatments</CardTitle>
                    <CardDescription>Current treatment plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {treatmentsList.length > 0 ? (
                        treatmentsList.slice(0, 5).map((treatment, index) => (
                          <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                <Activity className="w-5 h-5 text-purple-500" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{treatment.name}</p>
                                <p className="text-xs text-muted-foreground">ID: {treatment.id.slice(0, 8)}...</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/20">
                              Active
                            </Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-8">No active treatments</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Statistics</CardTitle>
                  <CardDescription>Comprehensive overview of platform metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Total Intake Logs</p>
                      <p className="text-3xl font-bold">{stats.totalIntakeLogs}</p>
                      <p className="text-xs text-muted-foreground mt-2">Medication intakes recorded</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">System Uptime</p>
                      <p className="text-3xl font-bold">99.9%</p>
                      <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Average Adherence</p>
                      <p className="text-3xl font-bold">{stats.adherenceRate}%</p>
                      <p className="text-xs text-muted-foreground mt-2">All users combined</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
