  import { useState, useEffect } from "react";
  import { Link, useNavigate } from "react-router-dom";
  import { Button } from "@/components/ui/button";
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
  import { Badge } from "@/components/ui/badge";
  import { Progress } from "@/components/ui/progress";
  import {
    Pill,
    Home,
    Stethoscope,
    FileText,
    Menu,
    X,
    Clock,
    LogOut,
    Settings,
    ChevronDown,
    User,
    Heart,
    FileCheck,
    Bell,
    TrendingUp,
    Activity,
    Zap,
    AlertCircle,
    CheckCircle2,
  } from "lucide-react";
  import { useAuth } from "@/contexts/AuthContext";
  import { supabase } from "@/integrations/supabase/client";
  import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
  } from "recharts";
  
  interface HealthMetric {
    date: string;
    adherence: number;
    medicines_taken: number;
    medicines_total: number;
    average_bmi?: number;
  }
  
  const HealthSummary = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
  
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
    const [summaryStats, setSummaryStats] = useState({
      totalTreatments: 0,
      activeTreatments: 0,
      totalMedicines: 0,
      overallAdherence: 0,
      averageBMI: 0,
      recoveryScore: 0,
    });
  
    const handleSignOut = async () => {
      await signOut();
      navigate("/");
    };
  
    useEffect(() => {
      if (user?.id) {
        fetchHealthSummary();
      }
    }, [user?.id]);
  
    const fetchHealthSummary = async () => {
      try {
        setLoading(true);
        console.log("🔵 Starting fetchHealthSummary for user:", user?.id);
  
        // Step 1: Fetch treatments
        const { data: treatments, error: treatmentsError } = await (supabase
          .from("treatments" as any)
          .select("*")
          .eq("patient_id", user?.id) as any);
  
        console.log("✅ Treatments response:", { count: treatments?.length, data: treatments, error: treatmentsError });
  
        if (treatmentsError) {
          console.error("❌ Error fetching treatments:", treatmentsError);
          throw treatmentsError;
        }
  
        // Step 2: Fetch medicines
        let medicines: any[] = [];
        if (treatments && treatments.length > 0) {
          const treatmentIds = treatments.map((t: any) => t.id);
          console.log("📋 Treatment IDs:", treatmentIds);
          
          const { data: medicinesData, error: medicinesError } = await (supabase
            .from("medicines" as any)
            .select("*")
            .in("treatment_id", treatmentIds) as any);
          
          console.log("✅ Medicines response:", { count: medicinesData?.length, data: medicinesData, error: medicinesError });
          
          if (medicinesError) {
            console.error("❌ Error fetching medicines:", medicinesError);
            throw medicinesError;
          }
          medicines = medicinesData || [];
        } else {
          console.warn("⚠️ No treatments found");
        }
  
        // Step 3: Fetch user profile
        const { data: profile, error: profileError } = await (supabase
          .from("profiles" as any)
          .select("height, weight")
          .eq("id", user?.id)
          .single() as any);
  
        console.log("✅ Profile response:", { profile, error: profileError });
  
        // Step 4: Fetch intake logs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
        const { data: logs, error: logsError } = await (supabase
          .from("intake_logs" as any)
          .select("*")
          .eq("user_id", user?.id)
          .gte("taken_time", thirtyDaysAgo.toISOString()) as any);
  
        console.log("✅ Logs response:", { count: logs?.length, error: logsError });
  
        if (logsError) {
          console.error("❌ Error fetching logs:", logsError);
        }
  
        // Calculate BMI
        let averageBMI = 0;
        if (profile?.height && profile?.weight) {
          const heightM = profile.height / 100;
          averageBMI = parseFloat(
            (profile.weight / (heightM * heightM)).toFixed(1)
          );
        }
  
        // Calculate metrics
        const groupedByDate: { [key: string]: any } = {};
  
        logs?.forEach((log: any) => {
          const date = new Date(log.taken_time).toISOString().split("T")[0];
          if (!groupedByDate[date]) {
            groupedByDate[date] = {
              date,
              taken: 0,
              total: medicines.length || 0,
            };
          }
          if (log.status === "taken") {
            groupedByDate[date].taken += 1;
          }
        });
  
        const metricsData = Object.values(groupedByDate)
          .map((metric: any) => ({
            date: metric.date,
            medicines_taken: metric.taken,
            medicines_total: metric.total,
            adherence:
              metric.total > 0
                ? Math.round((metric.taken / metric.total) * 100)
                : 0,
          }))
          .sort((a: any, b: any) => a.date.localeCompare(b.date));
  
        const overallAdherence =
          logs && logs.length > 0
            ? Math.round(
                ((logs.filter((l: any) => l.status === "taken").length /
                  logs.length) *
                  100)
              )
            : 0;
  
        setHealthMetrics(metricsData);
  
        const finalStats = {
          totalTreatments: treatments?.length || 0,
          activeTreatments: treatments?.length || 0,
          totalMedicines: medicines.length || 0,
          overallAdherence,
          averageBMI,
          recoveryScore: Math.round((overallAdherence * 0.7 + 75 * 0.3) / 1),
        };
  
        console.log("✅ FINAL STATS:", finalStats);
        setSummaryStats(finalStats);
      } catch (error) {
        console.error("❌ Error fetching health summary:", error);
      } finally {
        setLoading(false);
      }
    };
  
    const chartData = healthMetrics.slice(-14).map((metric) => ({
      date: new Date(metric.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      adherence: metric.adherence,
      taken: metric.medicines_taken,
      total: metric.medicines_total,
    }));
  
    const adherenceDistribution = [
      { name: "Excellent", value: healthMetrics.filter((m) => m.adherence >= 90).length, label: "90-100%" },
      { name: "Good", value: healthMetrics.filter((m) => m.adherence >= 70 && m.adherence < 90).length, label: "70-89%" },
      { name: "Fair", value: healthMetrics.filter((m) => m.adherence >= 50 && m.adherence < 70).length, label: "50-69%" },
      { name: "Poor", value: healthMetrics.filter((m) => m.adherence < 50).length, label: "<50%" },
    ];
  
    const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];
  
    // Custom label renderer for pie chart to avoid overlapping text
    const renderCustomLabel = (entry: any) => {
      return entry.value > 0 ? `${entry.label} (${entry.value})` : "";
    };
  
    const getHealthStatus = (adherence: number) => {
      if (adherence >= 85) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50" };
      if (adherence >= 70) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
      if (adherence >= 50) return { label: "Fair", color: "text-orange-600", bg: "bg-orange-50" };
      return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-50" };
    };
  
    const status = getHealthStatus(summaryStats.overallAdherence);
  
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-64" : "w-20"
          } bg-card border-r border-border/50 transition-all duration-300 flex flex-col fixed left-0 top-0 h-screen`}
        >
          {/* Logo */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            {sidebarOpen && (
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Pill className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">MediFlow</span>
              </Link>
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
              className={`text-xs font-semibold text-muted-foreground ${
                sidebarOpen ? "px-3 mb-3" : "hidden"
              }`}
            >
              MAIN
            </div>
  
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <Home className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </Link>
  
            <div
              className={`text-xs font-semibold text-muted-foreground ${
                sidebarOpen ? "px-3 mt-6 mb-3" : "hidden"
              }`}
            >
              MENU
            </div>
  
            <Link
              to="/treatments"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <Stethoscope className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>My Treatments</span>}
            </Link>
  
            <Link
              to="/history"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <Clock className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>History</span>}
            </Link>
  
            <Link
              to="/recovery-reports"
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Recovery Reports</span>}
            </Link>
  
            <div
              className={`text-xs font-semibold text-muted-foreground ${
                sidebarOpen ? "px-3 mt-6 mb-3" : "hidden"
              }`}
            >
              SETTINGS
            </div>
  
            {/* Settings Dropdown */}
            <div className="w-full">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors"
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span>Settings</span>
                    <ChevronDown
                      className={`w-4 h-4 ml-auto transition-transform ${
                        settingsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </>
                )}
              </button>
  
              {/* Settings Submenu */}
              {settingsOpen && sidebarOpen && (
                <div className="mt-2 space-y-1 pl-4">
                  <Link
                    to="/profile"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/notifications"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm"
                  >
                    <Bell className="w-4 h-4 flex-shrink-0" />
                    <span>Notifications</span>
                  </Link>
                  <Link
                    to="/medical-records"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm"
                  >
                    <FileCheck className="w-4 h-4 flex-shrink-0" />
                    <span>Medical Records</span>
                  </Link>
                  <Link
                    to="/health-summary"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary transition-colors text-sm"
                  >
                    <Heart className="w-4 h-4 flex-shrink-0" />
                    <span>Health Summary</span>
                  </Link>
                </div>
              )}
            </div>
          </nav>
  
          {/* Logout */}
          <div className="p-4 border-t border-border/50">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
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
          <nav className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border/50 px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Health Summary</h2>
              <p className="text-sm text-muted-foreground">
                Your overall health and medication adherence report
              </p>
            </div>
          </nav>
  
          {/* Content */}
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading health summary...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Overall Health Status */}
                <Card className={`${status.bg} border-2`}>
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Overall Health Status
                        </p>
                        <p className={`text-4xl font-bold ${status.color} mb-2`}>
                          {status.label}
                        </p>
                        <p className="text-muted-foreground">
                          Medication adherence: {summaryStats.overallAdherence}%
                        </p>
                      </div>
                      <div className="text-right">
                        <Heart className={`w-24 h-24 ${status.color} opacity-20`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
  
                {/* Key Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Total Treatments
                          </p>
                          <p className="text-3xl font-bold">
                            {summaryStats.totalTreatments}
                          </p>
                        </div>
                        <Stethoscope className="w-12 h-12 text-primary/20" />
                      </div>
                    </CardContent>
                  </Card>
  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Total Medicines
                          </p>
                          <p className="text-3xl font-bold">
                            {summaryStats.totalMedicines}
                          </p>
                        </div>
                        <Pill className="w-12 h-12 text-blue-500/20" />
                      </div>
                    </CardContent>
                  </Card>
  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Adherence Rate
                          </p>
                          <p className="text-3xl font-bold">
                            {summaryStats.overallAdherence}%
                          </p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-green-500/20" />
                      </div>
                    </CardContent>
                  </Card>
  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Recovery Score
                          </p>
                          <p className="text-3xl font-bold">
                            {summaryStats.recoveryScore}%
                          </p>
                        </div>
                        <Activity className="w-12 h-12 text-orange-500/20" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
  
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 14-Day Adherence Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle>14-Day Adherence Trend</CardTitle>
                      <CardDescription>
                        Your medication adherence over the last 2 weeks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient
                                id="colorAdherence"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="5%"
                                  stopColor="#10b981"
                                  stopOpacity={0.3}
                                />
                                <stop
                                  offset="95%"
                                  stopColor="#10b981"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="adherence"
                              stroke="#10b981"
                              fillOpacity={1}
                              fill="url(#colorAdherence)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
  
                  {/* Adherence Distribution */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Adherence Distribution</CardTitle>
                      <CardDescription>
                        Your adherence levels over 30 days
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {adherenceDistribution.some((d) => d.value > 0) ? (
                        <div className="space-y-4">
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={adherenceDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => (value > 0 ? name : "")}
                                outerRadius={70}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value, name, props) => [
                                  `${value} days`,
                                  props.payload?.label || name
                                ]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          {/* Legend */}
                          <div className="grid grid-cols-2 gap-3">
                            {adherenceDistribution.map((item, index) => (
                              <div key={item.name} className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index] }}
                                ></div>
                                <div>
                                  <p className="text-sm font-semibold">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.label} • {item.value} days
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-muted-foreground">
                          No data available
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
  
                {/* Health Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      Health Recommendations
                    </CardTitle>
                    <CardDescription>
                      Personalized recommendations based on your health data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summaryStats.overallAdherence >= 85 ? (
                      <>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-green-900">
                              Excellent Adherence!
                            </p>
                            <p className="text-sm text-green-800">
                              Keep up your consistent medication schedule. Your dedication is helping your recovery.
                            </p>
                          </div>
                        </div>
                      </>
                    ) : summaryStats.overallAdherence >= 70 ? (
                      <>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-blue-900">
                              Good Progress
                            </p>
                            <p className="text-sm text-blue-800">
                              You're doing well with your medications. Try to maintain consistency to reach 85%+ adherence.
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-orange-900">
                              Improvement Needed
                            </p>
                            <p className="text-sm text-orange-800">
                              Your adherence rate is below optimal. Setting reminders and planning medication times can help.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
  
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                      <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-purple-900">
                          Track Your Health
                        </p>
                        <p className="text-sm text-purple-800">
                          Regularly update your medical records and health metrics for better insights.
                        </p>
                      </div>
                    </div>
  
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                      <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-indigo-900">
                          Consult Your Doctor
                        </p>
                        <p className="text-sm text-indigo-800">
                          Review your recovery reports regularly with your healthcare provider.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  };
  
  export default HealthSummary;
