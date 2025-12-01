import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  LogOut,
  Menu,
  X,
  Search,
  Activity,
  BarChart3,
  FileText,
  AlertCircle,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  ChevronDown,
  Heart,
  Zap,
  Stethoscope,
  Pill,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
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
  adherenceRate: number;
}

interface MedicineStats {
  name: string;
  taken: number;
  missed: number;
  adherenceRate: number;
}

interface PatientReport {
  id: string;
  full_name: string;
  email: string;
  medical_condition: string;
  date_of_birth: string;
  emergency_contact: string;
  phone: string;
  totalTreatments: number;
  activeTreatments: number;
  totalMedicines: number;
  adherenceRate: number;
  recoveryPercentage: number;
  adherenceData: Array<{ date: string; adherence: number; taken: number; total: number }>;
  recentIntakeLogs: Array<{
    id: string;
    medicine_name: string;
    status: string;
    scheduled_time: string;
    taken_time: string | null;
    created_at: string;
  }>;
  treatmentStats: TreatmentStats[];
  medicineStats: MedicineStats[];
}

const AdminReports = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [patientReports, setPatientReports] = useState<PatientReport[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredReports, setFilteredReports] = useState<PatientReport[]>([]);

  useEffect(() => {
    // Check if admin is logged in
    const adminId = localStorage.getItem("admin_id");
    const adminEmailLS = localStorage.getItem("admin_email");

    if (!adminId || !adminEmailLS) {
      navigate("/admin-login");
      return;
    }

    setAdminEmail(adminEmailLS);
    fetchAllPatientReports();
  }, [navigate]);

  // Filter reports based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredReports(patientReports);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredReports(
        patientReports.filter(
          (report) =>
            report.full_name.toLowerCase().includes(term) ||
            report.email.toLowerCase().includes(term) ||
            report.medical_condition.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, patientReports]);

  const fetchAllPatientReports = async () => {
    try {
      setLoading(true);

      // Fetch all patients
      const { data: patientsData, error: patientsError } = await (supabase as any)
        .from("profiles")
        .select("*");

      if (patientsError) {
        console.error("Error fetching patients:", patientsError);
        return;
      }

      const reports: PatientReport[] = [];

      // For each patient, fetch their reports
      for (const patient of patientsData || []) {
        try {
          // Fetch treatments
          const { data: treatmentsData, error: treatmentsError } = await (supabase as any)
            .from("treatments")
            .select("id, status")
            .eq("patient_id", patient.id);

          if (treatmentsError) throw treatmentsError;

          const totalTreatments = treatmentsData?.length || 0;
          const activeTreatments =
            treatmentsData?.filter((t: any) => t.status === "active").length || 0;

          // Fetch medicines count
          const { data: medicinesData, error: medicinesError } = await (supabase as any)
            .from("medicines")
            .select("id, treatment_id")
            .in("treatment_id", treatmentsData?.map((t: any) => t.id) || []);

          if (medicinesError) throw medicinesError;

          const totalMedicines = medicinesData?.length || 0;

          // Fetch intake logs for adherence calculation
          const { data: intakeLogsData, error: logsError } = await (supabase as any)
            .from("intake_logs")
            .select("id, status, created_at, medicine_id")
            .eq("user_id", patient.id);

          if (logsError) throw logsError;

          // Calculate adherence by date (last 7 days)
          const adherenceByDate: {
            [key: string]: { taken: number; total: number };
          } = {};
          const today = new Date();

          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split("T")[0];
            adherenceByDate[dateStr] = { taken: 0, total: 0 };
          }

          // Count intake logs by date
          intakeLogsData?.forEach((log: any) => {
            const logDate = new Date(log.created_at).toISOString().split("T")[0];
            if (logDate in adherenceByDate) {
              adherenceByDate[logDate].total++;
              if (log.status === "taken") {
                adherenceByDate[logDate].taken++;
              }
            }
          });

          const adherenceData = Object.entries(adherenceByDate).map(([date, data]) => {
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const dateObj = new Date(date);
            const dayName = dayNames[dateObj.getDay()];
            const adherence = data.total > 0 ? Math.round((data.taken / data.total) * 100) : 0;

            return {
              date: dayName,
              adherence,
              taken: data.taken,
              total: data.total,
            };
          });

          // Overall adherence rate
          const totalLogs = intakeLogsData?.length || 0;
          const takenLogs = intakeLogsData?.filter((log: any) => log.status === "taken").length || 0;
          const overallAdherence = totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 0;

          // Fetch recent intake logs with medicine names
          const { data: recentLogsData, error: recentLogsError } = await (supabase as any)
            .from("intake_logs")
            .select(
              `
              id,
              status,
              scheduled_time,
              taken_time,
              created_at,
              medicines(name)
            `
            )
            .eq("user_id", patient.id)
            .order("created_at", { ascending: false })
            .limit(10);

          if (recentLogsError) throw recentLogsError;

          const recentIntakeLogs = (recentLogsData || []).map((log: any) => ({
            id: log.id,
            medicine_name: log.medicines?.name || "Unknown Medicine",
            status: log.status,
            scheduled_time: log.scheduled_time,
            taken_time: log.taken_time,
            created_at: log.created_at,
          }));

          // Fetch full treatment details with medicines for recovery calculation
          const { data: treatmentDetailsData, error: treatmentDetailsError } = await (supabase as any)
            .from("treatments")
            .select("id, name, medicines(id)")
            .eq("patient_id", patient.id);

          if (treatmentDetailsError) throw treatmentDetailsError;

          // Calculate treatment statistics
          const treatmentStatsData: TreatmentStats[] = (treatmentDetailsData || []).map((treatment: any) => {
            const treatmentMedicines = (treatment.medicines || []);
            const treatmentLogs = (intakeLogsData || []).filter((log: any) =>
              treatmentMedicines.some((m: any) => m.id === log.medicine_id)
            );
            const takenLogs = treatmentLogs.filter((log: any) => log.status === "taken").length;
            const adherenceRate = treatmentLogs.length > 0 ? Math.round((takenLogs / treatmentLogs.length) * 100) : 0;

            return {
              id: treatment.id,
              name: treatment.name,
              totalMedicines: treatmentMedicines.length,
              adherenceRate,
            };
          });

          // Fetch medicines with details for recovery calculation
          const { data: medicinesDetailsData, error: medicinesDetailsError } = await (supabase as any)
            .from("medicines")
            .select("id, name, treatment_id")
            .in("treatment_id", treatmentDetailsData?.map((t: any) => t.id) || []);

          if (medicinesDetailsError) throw medicinesDetailsError;

          // Build medicine map
          const medicineMap = new Map(
            (medicinesDetailsData || []).map((m: any) => [m.id, { name: m.name, treatment_id: m.treatment_id }])
          );

          // Calculate medicine statistics
          const medicineStatsMap = new Map<string, { taken: number; missed: number }>();
          (intakeLogsData || []).forEach((log: any) => {
            const medicine = medicineMap.get(log.medicine_id) as any;
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

          const medicineStats: MedicineStats[] = Array.from(medicineStatsMap.entries()).map(([name, stats]) => ({
            name,
            taken: stats.taken,
            missed: stats.missed,
            adherenceRate: stats.taken + stats.missed > 0 ? Math.round((stats.taken / (stats.taken + stats.missed)) * 100) : 0,
          }));

          // Calculate recovery percentage (same logic as patient RecoveryReports)
          const treatmentAdherenceValues = treatmentStatsData.map((t) => t.adherenceRate);
          const medicineAdherenceValues = medicineStats.map((m) => m.adherenceRate);

          const avgTreatmentAdherence = treatmentAdherenceValues.length > 0
            ? treatmentAdherenceValues.reduce((a, b) => a + b, 0) / treatmentAdherenceValues.length
            : 0;

          const avgMedicineAdherence = medicineAdherenceValues.length > 0
            ? medicineAdherenceValues.reduce((a, b) => a + b, 0) / medicineAdherenceValues.length
            : 0;

          const recovery = treatmentStatsData.length > 0 && medicineStats.length > 0
            ? Math.round((avgTreatmentAdherence + avgMedicineAdherence + overallAdherence) / 3)
            : overallAdherence;

          reports.push({
            id: patient.id,
            full_name: patient.full_name,
            email: patient.email,
            medical_condition: patient.medical_condition,
            date_of_birth: patient.date_of_birth,
            emergency_contact: patient.emergency_contact,
            phone: patient.phone,
            totalTreatments,
            activeTreatments,
            totalMedicines,
            adherenceRate: overallAdherence,
            recoveryPercentage: recovery,
            adherenceData,
            recentIntakeLogs,
            treatmentStats: treatmentStatsData,
            medicineStats: medicineStats.slice(0, 5),
          });
        } catch (err) {
          console.error(`Error fetching report for patient ${patient.id}:`, err);
        }
      }

      setPatientReports(reports);
      console.log("All patient reports:", reports);
    } catch (error) {
      console.error("Error fetching patient reports:", error);
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

  const getHealthStatus = (adherence: number) => {
    if (adherence >= 85) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50", borderColor: "border-green-200" };
    if (adherence >= 70) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200" };
    if (adherence >= 50) return { label: "Fair", color: "text-orange-600", bg: "bg-orange-50", borderColor: "border-orange-200" };
    return { label: "Needs Improvement", color: "text-red-600", bg: "bg-red-50", borderColor: "border-red-200" };
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  const selectedReport = patientReports.find((r) => r.id === selectedPatientId);

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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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

          <button
            onClick={() => navigate("/admin-dashboard")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            onClick={() => navigate("/admin-patients")}
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Patients</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            onClick={() => navigate("/admin-treatments")}
          >
            <Pill className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Treatments</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
            onClick={() => navigate("/admin-reports")}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Reports</span>}
          </button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors font-medium"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
        {/* Top Navigation */}
        <nav className="bg-card border-b border-border/50 px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm text-muted-foreground">Patient reports and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Admin: <span className="font-medium">{adminEmail}</span>
            </span>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/50 hover:bg-accent transition-colors text-sm font-medium text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading reports...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Patient List */}
              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="text-lg">Patients</CardTitle>
                    <CardDescription>Select a patient to view reports</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col">
                    {/* Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search patients..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Patient List */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                      {filteredReports.length > 0 ? (
                        filteredReports.map((report) => (
                          <button
                            key={report.id}
                            onClick={() => setSelectedPatientId(report.id)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              selectedPatientId === report.id
                                ? "bg-primary/10 border-primary/50"
                                : "border-border/50 hover:border-border"
                            }`}
                          >
                            <div className="font-medium text-sm">{report.full_name}</div>
                            <div className="text-xs text-muted-foreground truncate">{report.email}</div>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <div className="text-xs text-muted-foreground">
                                Adherence: <span className="font-semibold text-primary">{report.adherenceRate}%</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Recovery: <span className="font-semibold text-amber-600">{report.recoveryPercentage}%</span>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          No patients found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Patient Report Details */}
              <div className="lg:col-span-2">
                {selectedReport ? (
                  <div className="space-y-6">
                    {/* Patient Info */}
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedReport.full_name}</CardTitle>
                        <CardDescription>{selectedReport.medical_condition}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="font-medium">{selectedReport.email}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="font-medium">{selectedReport.phone}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">DOB</p>
                            <p className="font-medium">
                              {new Date(selectedReport.date_of_birth).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Emergency Contact</p>
                            <p className="font-medium">{selectedReport.emergency_contact}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-primary">
                              {selectedReport.adherenceRate}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Adherence Rate</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {selectedReport.activeTreatments}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Active Treatments</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedReport.totalMedicines}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Medicines</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Health Status Card */}
                    <Card className={`border-l-4 ${getHealthStatus(selectedReport.adherenceRate).borderColor}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getHealthStatus(selectedReport.adherenceRate).bg}`}>
                              <Heart className={`w-6 h-6 ${getHealthStatus(selectedReport.adherenceRate).color}`} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Overall Health Status</p>
                              <p className={`text-lg font-bold ${getHealthStatus(selectedReport.adherenceRate).color}`}>
                                {getHealthStatus(selectedReport.adherenceRate).label}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Adherence</p>
                            <p className="text-2xl font-bold text-primary">{selectedReport.adherenceRate}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recovery Reports Section */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Recovery Reports</h3>
                      </div>

                      {/* Recovery Percentage Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Recovery Progress
                          </CardTitle>
                          <CardDescription>Overall recovery percentage based on treatment and medicine adherence</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-4xl font-bold text-primary">{selectedReport.recoveryPercentage}%</p>
                              <p className="text-sm text-muted-foreground mt-1">Recovery Score</p>
                            </div>
                            <div className="relative w-24 h-24">
                              <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="hsl(var(--muted))"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <circle
                                  cx="48"
                                  cy="48"
                                  r="40"
                                  stroke="hsl(var(--primary))"
                                  strokeWidth="4"
                                  fill="none"
                                  strokeDasharray={`${(selectedReport.recoveryPercentage / 100) * 251} 251`}
                                  strokeLinecap="round"
                                  className="transition-all duration-500"
                                />
                              </svg>
                            </div>
                          </div>
                          <Progress value={selectedReport.recoveryPercentage} className="h-2" />
                        </CardContent>
                      </Card>

                      {/* Treatment Statistics */}
                      {selectedReport.treatmentStats.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Stethoscope className="w-5 h-5 text-blue-500" />
                              Treatment Adherence
                            </CardTitle>
                            <CardDescription>Adherence rate per treatment</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {selectedReport.treatmentStats.map((treatment) => (
                                <div key={treatment.id} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">{treatment.name}</p>
                                    <p className="text-sm font-semibold text-primary">{treatment.adherenceRate}%</p>
                                  </div>
                                  <Progress value={treatment.adherenceRate} className="h-1.5" />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Medicine Statistics Chart */}
                      {selectedReport.medicineStats.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Pill className="w-5 h-5 text-green-500" />
                              Medicine Adherence
                            </CardTitle>
                            <CardDescription>Top medicines adherence rates</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart data={selectedReport.medicineStats}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="adherenceRate" fill="#10b981" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      )}
                    </div>

                    {/* Adherence Chart */}
                    {selectedReport.adherenceData.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">7-Day Adherence Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={selectedReport.adherenceData}>
                              <defs>
                                <linearGradient id="colorAdherence" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
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
                        </CardContent>
                      </Card>
                    )}

                    {/* Recent Intake Logs */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Medication Logs</CardTitle>
                        <CardDescription>Last 10 intake records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedReport.recentIntakeLogs.length > 0 ? (
                            selectedReport.recentIntakeLogs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{log.medicine_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleDateString()}{" "}
                                    {new Date(log.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                                <Badge
                                  variant={log.status === "taken" ? "default" : "outline"}
                                  className={
                                    log.status === "taken"
                                      ? "bg-green-500/20 text-green-700 border-green-200"
                                      : "bg-yellow-500/20 text-yellow-700 border-yellow-200"
                                  }
                                >
                                  {log.status === "taken" ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Taken
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3 mr-1" />
                                      Pending
                                    </>
                                  )}
                                </Badge>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted-foreground text-sm py-8">
                              No intake logs found
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="flex items-center justify-center min-h-96">
                    <CardContent className="text-center">
                      <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Select a patient to view their report</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
