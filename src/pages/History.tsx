import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  CheckCircle2,
  AlertCircle,
  Calendar,
  Search,
  ChevronLeft,
  ChevronDown,
  User,
  Heart,
  FileCheck,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntakeLog {
  id: string;
  medicine_id: string;
  medicine_name: string;
  medicine_dosage: string;
  treatment_id: string;
  treatment_name?: string;
  scheduled_time: string;
  taken_time: string;
  status: string;
  notes?: string;
}

interface Treatment {
  id: string;
  name: string;
}

const History = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const treatmentId = searchParams.get("treatment");
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [intakeLogs, setIntakeLogs] = useState<IntakeLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<IntakeLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user?.id && treatmentId) {
      fetchIntakeHistory();
    } else if (user?.id && !treatmentId) {
      fetchIntakeHistory();
    }
  }, [user?.id, selectedDate, treatmentId]);

  useEffect(() => {
    // Fetch treatment name if treatmentId is provided
    if (treatmentId && user?.id) {
      fetchTreatmentName();
    }
  }, [treatmentId, user?.id]);

  useEffect(() => {
    // Filter logs based on search term
    const filtered = intakeLogs.filter((log) =>
      log.medicine_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, intakeLogs]);

  const fetchTreatmentName = async () => {
    try {
      const { data, error } = await supabase
        .from("treatments")
        .select("id, name")
        .eq("id", treatmentId)
        .single();

      if (error) throw error;
      setSelectedTreatment(data);
    } catch (error) {
      console.error("Error fetching treatment:", error);
    }
  };

  const fetchIntakeHistory = async () => {
    try {
      setLoading(true);

      // Get the current treatment ID from URL
      const currentTreatmentId = searchParams.get("treatment");
      console.log("fetchIntakeHistory called with currentTreatmentId:", currentTreatmentId);

      // Fetch medicines with their treatment IDs
      const { data: medicines, error: medicinesError } = await supabase
        .from("medicines")
        .select("id, name, dosage, treatment_id");

      if (medicinesError) throw medicinesError;

      // Fetch treatments to get treatment names
      const { data: treatments, error: treatmentsError } = await supabase
        .from("treatments")
        .select("id, name");

      if (treatmentsError) throw treatmentsError;

      // Create a map for treatments
      const treatmentMap = new Map(
        treatments?.map((t) => [t.id, t.name]) || []
      );

      // Create a map for quick medicine lookup
      const medicineMap = new Map(
        medicines?.map((m) => [
          m.id,
          { name: m.name, dosage: m.dosage, treatment_id: m.treatment_id },
        ]) || []
      );

      // Fetch intake logs for the selected date
      const selectedDateTime = new Date(selectedDate);
      const startOfDay = new Date(selectedDateTime);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDateTime);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: logs, error: logsError } = await supabase
        .from("intake_logs")
        .select("*")
        .eq("user_id", user?.id)
        .gte("taken_time", startOfDay.toISOString())
        .lte("taken_time", endOfDay.toISOString())
        .order("taken_time", { ascending: false });

      if (logsError) throw logsError;

      // Enrich logs with medicine names and filter by treatment if specified
      let enrichedLogs = (logs || []).map((log) => {
        const medicine = medicineMap.get(log.medicine_id) || {
          name: "Unknown",
          dosage: "",
          treatment_id: "",
        };
        return {
          ...log,
          medicine_name: medicine.name,
          medicine_dosage: medicine.dosage,
          treatment_id: medicine.treatment_id,
          treatment_name: treatmentMap.get(medicine.treatment_id) || "Unknown",
        };
      });

      console.log("All logs before treatment filter:", enrichedLogs);
      console.log("Current treatment ID:", currentTreatmentId);

      // Filter by treatment if treatmentId is provided
      if (currentTreatmentId) {
        console.log("Applying treatment filter for:", currentTreatmentId);
        enrichedLogs = enrichedLogs.filter((log) => {
          const matches = log.treatment_id === currentTreatmentId;
          console.log(`Medicine: ${log.medicine_name}, treatment_id: ${log.treatment_id}, filter: ${currentTreatmentId}, matches: ${matches}`);
          return matches;
        });
      }

      console.log("Final enriched logs after filtering:", enrichedLogs);
      setIntakeLogs(enrichedLogs);
      setFilteredLogs(enrichedLogs);
    } catch (error) {
      console.error("Error fetching intake history:", error);
      toast({
        title: "Error",
        description: "Failed to load history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getDaysFromToday = (dateString: string) => {
    const logDate = new Date(dateString).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    
    const logDateObj = new Date(logDate);
    const todayObj = new Date(today);
    
    const diffTime = todayObj.getTime() - logDateObj.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

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
            className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">History</span>}
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
          <div className="flex items-center gap-4 flex-1">
            {treatmentId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/treatments")}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {selectedTreatment ? `${selectedTreatment.name} - History` : "Medication History"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedTreatment
                  ? `View medication history for ${selectedTreatment.name}`
                  : "View your medication intake history"}
              </p>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading history...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Treatment Info Card (when filtered by treatment) */}
              {treatmentId && selectedTreatment && (
                <Card className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Viewing History For</p>
                        <h3 className="text-xl font-semibold text-primary">{selectedTreatment.name}</h3>
                      </div>
                      <Link to="/treatments">
                        <Button variant="outline" size="sm" className="gap-2">
                          <ChevronLeft className="w-4 h-4" />
                          Change Treatment
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">Date</label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Search Medicine
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Search by medicine name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {filteredLogs.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Clock className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No medication history</h3>
                    <p className="text-muted-foreground">
                      {intakeLogs.length === 0
                        ? treatmentId
                          ? `No medications have been logged yet for ${selectedTreatment?.name || "this treatment"} on this date`
                          : "No medications have been logged yet for this date"
                        : "No medications match your search"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">
                      {getDaysFromToday(selectedDate)} • {new Date(selectedDate).toLocaleDateString()}
                    </h3>
                    <Badge variant="outline">
                      {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
                    </Badge>
                  </div>

                  {filteredLogs.map((log) => (
                    <Card key={log.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div>
                                <p className="font-semibold text-base">
                                  {log.medicine_name}
                                </p>
                                {!treatmentId && (
                                  <p className="text-xs text-muted-foreground">
                                    {log.treatment_name}
                                  </p>
                                )}
                              </div>
                              {log.status === "taken" ? (
                                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/20">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Taken
                                </Badge>
                              ) : (
                                <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/20">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground mb-2">
                              Dosage: {log.medicine_dosage}
                            </p>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  Scheduled: {formatTime(log.scheduled_time)}
                                </span>
                              </div>
                              {log.status === "taken" && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Taken: {formatTime(log.taken_time)}</span>
                                </div>
                              )}
                            </div>

                            {log.notes && (
                              <p className="text-sm text-muted-foreground mb-2 italic">
                                Notes: {log.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default History;
