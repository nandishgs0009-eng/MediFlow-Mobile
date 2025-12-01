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
  Loader2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Calendar,
  ChevronDown,
  User,
  Bell,
  Heart,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
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

interface TreatmentStats {
  id: string;
  name: string;
  totalMedicines: number;
  takenToday: number;
  adherenceRate: number;
}

interface DailyAdherence {
  date: string;
  taken: number;
  pending: number;
  adherencePercent: number;
}

interface MedicineStats {
  name: string;
  taken: number;
  missed: number;
  adherenceRate: number;
}

const RecoveryReports = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days"); // 7days, 14days, 30days
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Statistics
  const [overallAdherence, setOverallAdherence] = useState(0);
  const [recoveryPercentage, setRecoveryPercentage] = useState(0);
  const [treatmentStats, setTreatmentStats] = useState<TreatmentStats[]>([]);
  const [dailyAdherence, setDailyAdherence] = useState<DailyAdherence[]>([]);
  const [medicineStats, setMedicineStats] = useState<MedicineStats[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [treatmentAdherence, setTreatmentAdherence] = useState<any[]>([]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user?.id) {
      fetchRecoveryReports();
    }
  }, [user?.id, dateRange]);

  // Refresh data when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        fetchRecoveryReports();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user?.id]);

  const getDaysFromDateRange = () => {
    switch (dateRange) {
      case "7days":
        return 7;
      case "14days":
        return 14;
      case "30days":
        return 30;
      default:
        return 7;
    }
  };

  const fetchRecoveryReports = async () => {
    try {
      setLoading(true);
      
      // Calculate the current week (Sunday to Saturday) for both fetching and display
      const today = new Date();
      const currentDayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - currentDayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      const days = getDaysFromDateRange();

      // For fetching older data based on date range selector
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999); // End of today
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0); // Start of that day

      console.log("🔍 Fetch Date Range:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        days,
      });

      // Fetch all data needed
      const [treatmentsRes, medicinesRes, intakeLogsRes, treatmentsDetailsRes] = await Promise.all([
        supabase
          .from("treatments")
          .select("id, name")
          .eq("patient_id", user?.id),
        supabase
          .from("medicines")
          .select("id, name, treatment_id"),
        supabase
          .from("intake_logs")
          .select("*")
          .eq("user_id", user?.id)
          .gte("taken_time", startDate.toISOString())
          .lte("taken_time", endDate.toISOString()),
        supabase
          .from("treatments")
          .select("id, name, medicines(id)")
          .eq("patient_id", user?.id),
      ]);

      if (treatmentsRes.error) throw treatmentsRes.error;
      if (medicinesRes.error) throw medicinesRes.error;
      if (intakeLogsRes.error) throw intakeLogsRes.error;

      console.log("📥 Fetched Data:", {
        treatments: treatmentsRes.data?.length,
        medicines: medicinesRes.data?.length,
        intakeLogs: intakeLogsRes.data?.length,
        intakeLogsData: intakeLogsRes.data?.map(log => ({ 
          id: log.id, 
          medicine_id: log.medicine_id, 
          status: log.status, 
          taken_time: log.taken_time,
          date_part: log.taken_time ? log.taken_time.split("T")[0] : "NO_DATE"
        })),
        statusCounts: intakeLogsRes.data?.reduce((acc: any, log: any) => {
          acc[log.status] = (acc[log.status] || 0) + 1;
          return acc;
        }, {}),
      });

      const treatments = treatmentsRes.data || [];
      const medicines = medicinesRes.data || [];
      const intakeLogs = intakeLogsRes.data || [];

      // Build medicine map
      const medicineMap = new Map(
        medicines.map((m) => [m.id, { name: m.name, treatment_id: m.treatment_id }])
      );

      // Calculate treatment statistics
      const treatmentStatsData: TreatmentStats[] = treatments.map((treatment) => {
        const treatmentMedicines = medicines.filter((m) => m.treatment_id === treatment.id);
        const treatmentLogs = intakeLogs.filter((log) =>
          treatmentMedicines.some((m) => m.id === log.medicine_id)
        );

        const takenLogs = treatmentLogs.filter((log) => log.status === "taken").length;
        const adherenceRate =
          treatmentLogs.length > 0
            ? Math.round((takenLogs / treatmentLogs.length) * 100)
            : 0;

        return {
          id: treatment.id,
          name: treatment.name,
          totalMedicines: treatmentMedicines.length,
          takenToday: takenLogs,
          adherenceRate: adherenceRate,
        };
      });

      setTreatmentStats(treatmentStatsData);

      // Calculate treatment adherence for pie chart
      const treatmentAdherenceData = treatmentStatsData.map((t) => ({
        name: t.name,
        value: t.adherenceRate,
      }));
      setTreatmentAdherence(treatmentAdherenceData);

      // Calculate medicine statistics
      const medicineStatsMap = new Map<string, { taken: number; missed: number }>();
      intakeLogs.forEach((log) => {
        const medicine = medicineMap.get(log.medicine_id);
        if (medicine) {
          const current = medicineStatsMap.get(medicine.name) || { taken: 0, missed: 0 };
          if (log.status === "taken") {
            current.taken += 1;
          } else {
            current.missed += 1;
          }
          medicineStatsMap.set(medicine.name, current);
        }
      });

      const medicineStatsData: MedicineStats[] = Array.from(medicineStatsMap.entries()).map(
        ([name, stats]) => ({
          name,
          taken: stats.taken,
          missed: stats.missed,
          adherenceRate: Math.round(
            (stats.taken / (stats.taken + stats.missed)) * 100
          ) || 0,
        })
      );

      setMedicineStats(medicineStatsData.slice(0, 5)); // Top 5 medicines

      // Calculate daily medication status - show current week (Sunday to Saturday) using same logic as Dashboard
      const totalMedicinesCount = medicines.length;
      const dailyMap = new Map<string, { takenIds: Set<string>; dayName: string }>();
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      
      // Initialize the current week (Sunday to Saturday)
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];
        const dayName = dayNames[date.getDay()];
        dailyMap.set(dateStr, { takenIds: new Set<string>(), dayName });
      }

      // Filter intake logs that fall within the current week
      const weekIntakeLogs = intakeLogs.filter((log) => {
        const logDate = new Date(log.taken_time);
        return logDate >= weekStart && logDate < weekEnd;
      });

      console.log("� Daily Adherence Debug:", {
        weekStart: weekStart.toISOString().split("T")[0],
        weekEnd: weekEnd.toISOString().split("T")[0],
        totalMedicines: totalMedicinesCount,
        allIntakeLogsCount: intakeLogs.length,
        weekIntakeLogsCount: weekIntakeLogs.length,
        logsWithTakenStatus: weekIntakeLogs.filter(log => log.status === "taken").length,
      });

      // Count unique medicine IDs per day that have been marked as "taken" (same logic as Dashboard)
      weekIntakeLogs.forEach((log) => {
        const dateStr = log.taken_time.split("T")[0];
        const daily = dailyMap.get(dateStr);
        if (daily && log.status === "taken") {
          daily.takenIds.add(log.medicine_id);
        }
      });

      // Convert to array and maintain Sunday-Saturday order
      const dailyAdherenceData: DailyAdherence[] = Array.from(dailyMap.entries())
        .map(([date, stats]) => {
          const takenCount = stats.takenIds.size; // Unique medicines taken
          const pendingCount = Math.max(0, totalMedicinesCount - takenCount);
          return {
            date: stats.dayName,
            taken: takenCount,
            pending: pendingCount,
            adherencePercent:
              totalMedicinesCount > 0
                ? Math.round((takenCount / totalMedicinesCount) * 100)
                : 0,
          };
        })
        .sort((a, b) => {
          const dayOrder = { "Sun": 0, "Mon": 1, "Tue": 2, "Wed": 3, "Thu": 4, "Fri": 5, "Sat": 6 };
          return (dayOrder[a.date as keyof typeof dayOrder] || 0) - (dayOrder[b.date as keyof typeof dayOrder] || 0);
        });

      console.log("✅ Final Daily Adherence Data:", {
        data: dailyAdherenceData,
        todaySaturday: dailyAdherenceData.find(d => d.date === "Sat"),
      });
      setDailyAdherence(dailyAdherenceData);

      // Calculate overall adherence
      const totalTaken = intakeLogs.filter((log) => log.status === "taken").length;
      const totalLogs = intakeLogs.length;
      const overallRate = totalLogs > 0 ? Math.round((totalTaken / totalLogs) * 100) : 0;
      setOverallAdherence(overallRate);

      // Calculate recovery percentage based on treatments and medicines adherence
      // Recovery is calculated from: treatment adherence rate + medicine adherence rate / 2
      const treatmentAdherenceValues = treatmentStatsData.map((t) => t.adherenceRate);
      const medicineAdherenceValues = medicineStatsData.map((m) => m.adherenceRate);
      
      const avgTreatmentAdherence = treatmentAdherenceValues.length > 0
        ? treatmentAdherenceValues.reduce((a, b) => a + b, 0) / treatmentAdherenceValues.length
        : 0;
      
      const avgMedicineAdherence = medicineAdherenceValues.length > 0
        ? medicineAdherenceValues.reduce((a, b) => a + b, 0) / medicineAdherenceValues.length
        : 0;
      
      // Recovery percentage = (treatment adherence + medicine adherence + overall adherence) / 3
      const recovery = treatmentStatsData.length > 0 && medicineStatsData.length > 0
        ? Math.round((avgTreatmentAdherence + avgMedicineAdherence + overallRate) / 3)
        : overallRate;
      
      setRecoveryPercentage(recovery);

      // Prepare weekly trend data (last 4 weeks or days)
      const weeklyData: any[] = [];
      for (let i = 0; i < Math.ceil(days / 7); i++) {
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const weekLogs = intakeLogs.filter(
          (log) =>
            new Date(log.taken_time) >= weekStart && new Date(log.taken_time) < weekEnd
        );

        const weekTaken = weekLogs.filter((log) => log.status === "taken").length;
        const weekAdherence = weekLogs.length > 0 ? Math.round((weekTaken / weekLogs.length) * 100) : 0;

        weeklyData.push({
          week: `Week ${i + 1}`,
          adherence: weekAdherence,
          taken: weekTaken,
          total: weekLogs.length,
        });
      }
      setWeeklyTrend(weeklyData);

      // Log all data for verification
      console.log("📊 Recovery Reports Data:");
      console.log("Overall Adherence:", overallRate);
      console.log("Average Treatment Adherence:", Math.round(avgTreatmentAdherence));
      console.log("Average Medicine Adherence:", Math.round(avgMedicineAdherence));
      console.log("Recovery Percentage (Based on Treatments & Medicines):", recovery);
      console.log("Treatment Stats:", treatmentStatsData);
      console.log("Daily Adherence:", dailyAdherenceData);
      console.log("Medicine Stats:", medicineStatsData.slice(0, 5));
      console.log("Weekly Trend:", weeklyData);
      console.log("Total Intake Logs:", intakeLogs.length);
    } catch (error) {
      console.error("Error fetching recovery reports:", error);
      toast({
        title: "Error",
        description: "Failed to load recovery reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return "text-green-600";
    if (adherence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getAdherenceBadge = (adherence: number) => {
    if (adherence >= 80) return "bg-green-500/20 text-green-700 dark:text-green-400";
    if (adherence >= 60) return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    return "bg-red-500/20 text-red-700 dark:text-red-400";
  };

  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

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
            className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Recovery Reports</span>}
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
                    className={`w-4 h-4 ml-auto transition-transform ${settingsOpen ? 'rotate-180' : ''}`} 
                  />
                </>
              )}
            </button>

            {/* Settings Submenu */}
            {settingsOpen && sidebarOpen && (
              <div className="mt-2 space-y-1 pl-4">
                <Link to="/profile" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm">
                  <User className="w-4 h-4 flex-shrink-0" />
                  <span>Profile</span>
                </Link>
                <Link to="/notifications" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm">
                  <Bell className="w-4 h-4 flex-shrink-0" />
                  <span>Notifications</span>
                </Link>
                <Link to="/medical-records" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm">
                  <FileCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Medical Records</span>
                </Link>
                <Link to="/health-summary" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm">
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
            <h2 className="text-2xl font-bold">Recovery Reports</h2>
            <p className="text-sm text-muted-foreground">
              Monitor your medication adherence and recovery progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm"
            >
              <option value="7days">Last 7 Days</option>
              <option value="14days">Last 14 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </nav>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading recovery reports...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Overall Adherence and Recovery Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Overall Adherence Card */}
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Overall Adherence Rate</p>
                        <h3 className="text-4xl font-bold text-primary">{overallAdherence}%</h3>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{overallAdherence}%</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={overallAdherence} className="mt-4" />
                  </CardContent>
                </Card>

                {/* Recovery Percentage Card */}
                <Card className="bg-gradient-to-r from-green-500/5 to-emerald-500/10 border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Recovery Progress</p>
                        <h3 className="text-4xl font-bold text-green-600 dark:text-green-400">{recoveryPercentage}%</h3>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-2xl font-bold text-green-600 dark:text-green-400">{recoveryPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={recoveryPercentage} className="mt-4" />
                  </CardContent>
                </Card>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Active Treatments</p>
                        <h3 className="text-3xl font-bold">{treatmentStats.length}</h3>
                      </div>
                      <Stethoscope className="w-12 h-12 text-primary/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Total Medicines</p>
                        <h3 className="text-3xl font-bold">
                          {treatmentStats.reduce((sum, t) => sum + t.totalMedicines, 0)}
                        </h3>
                      </div>
                      <Pill className="w-12 h-12 text-blue-500/20" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Recovery Status</p>
                        <h3 className={`text-3xl font-bold ${getAdherenceColor(recoveryPercentage)}`}>
                          {recoveryPercentage >= 80 ? "Excellent" : recoveryPercentage >= 60 ? "Good" : "Needs Improvement"}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-2">
                          Based on treatments & medicines
                        </p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-500/20" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Weekly Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Adherence Trend</CardTitle>
                    <CardDescription>Medication adherence rate by week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {weeklyTrend.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={weeklyTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
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
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">No data available for this period</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Daily Adherence Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Medication Status</CardTitle>
                    <CardDescription>Medicines taken vs pending per day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dailyAdherence.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dailyAdherence}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            interval={Math.floor(dailyAdherence.length / 7) || 0}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="taken" stackId="a" fill="#10b981" name="Taken" />
                          <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">No data available for this period</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Treatment Adherence */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Treatment Adherence Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Adherence</CardTitle>
                    <CardDescription>Adherence rate by treatment plan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {treatmentStats.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={treatmentStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="adherenceRate" fill="#8b5cf6" name="Adherence %" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-muted-foreground">No treatment data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Treatment Adherence Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Treatment Distribution</CardTitle>
                    <CardDescription>Adherence percentage by treatment</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    {treatmentAdherence.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={treatmentAdherence}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {treatmentAdherence.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground">No treatment data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Medicine Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Medicines by Adherence</CardTitle>
                  <CardDescription>Adherence rate for your most-used medicines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {medicineStats.length > 0 ? (
                      medicineStats.map((medicine, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold">{medicine.name}</p>
                            <Badge className={getAdherenceBadge(medicine.adherenceRate)}>
                              {medicine.adherenceRate}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                            <span>Taken: {medicine.taken} | Missed: {medicine.missed}</span>
                          </div>
                          <Progress value={medicine.adherenceRate} />
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No medication data available for the selected period
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Details Table */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Treatment Summary</CardTitle>
                  <CardDescription>Details of each treatment plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Treatment</th>
                          <th className="text-left py-3 px-4 font-semibold">Medicines</th>
                          <th className="text-left py-3 px-4 font-semibold">Taken</th>
                          <th className="text-left py-3 px-4 font-semibold">Adherence</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {treatmentStats.length > 0 ? (
                          treatmentStats.map((treatment) => (
                            <tr key={treatment.id} className="border-b hover:bg-secondary/50">
                              <td className="py-3 px-4">{treatment.name}</td>
                              <td className="py-3 px-4">{treatment.totalMedicines}</td>
                              <td className="py-3 px-4">{treatment.takenToday}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16">
                                    <Progress value={treatment.adherenceRate} />
                                  </div>
                                  <span className={`font-semibold ${getAdherenceColor(treatment.adherenceRate)}`}>
                                    {treatment.adherenceRate}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={
                                    treatment.adherenceRate >= 80
                                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                      : treatment.adherenceRate >= 60
                                      ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                                      : "bg-red-500/20 text-red-700 dark:text-red-400"
                                  }
                                >
                                  {treatment.adherenceRate >= 80 ? "On Track" : treatment.adherenceRate >= 60 ? "Good" : "Needs Help"}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted-foreground">
                              No treatment data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
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

export default RecoveryReports;
