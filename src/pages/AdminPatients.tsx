import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pill,
  Users,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Mail,
  Phone,
  Calendar,
  Activity,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  medical_condition: string;
  emergency_contact: string;
  created_at: string;
}

const AdminPatients = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  useEffect(() => {
    // Check if admin is logged in
    const adminId = localStorage.getItem("admin_id");
    const adminEmailLS = localStorage.getItem("admin_email");

    if (!adminId || !adminEmailLS) {
      navigate("/admin-login");
      return;
    }

    setAdminEmail(adminEmailLS);
    fetchPatients();
  }, [navigate]);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatients(patients);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredPatients(
        patients.filter(
          (patient) =>
            patient.full_name.toLowerCase().includes(term) ||
            patient.email.toLowerCase().includes(term) ||
            patient.phone.includes(term)
        )
      );
    }
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);

      // Fetch all patients from profiles table
      const { data: patientsData, error } = await (supabase as any)
        .from("profiles")
        .select("*");

      if (error) {
        console.error("Error fetching patients:", error);
      } else {
        console.log("Patients fetched:", patientsData);
        setPatients(patientsData || []);
      }
    } catch (err) {
      console.error("Error fetching patients:", err);
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

          <button 
            onClick={() => navigate("/admin-dashboard")}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
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
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-foreground hover:bg-accent transition-colors font-medium"
            onClick={() => navigate("/admin-reports")}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
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
            <h1 className="text-2xl font-bold">Patients Management</h1>
            <p className="text-sm text-muted-foreground">Manage and view patient information</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Admin: <span className="font-medium">{adminEmail}</span>
            </span>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </nav>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading patients...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Found {filteredPatients.length} patient{filteredPatients.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Patients Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <Card
                      key={patient.id}
                      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                        selectedPatient?.id === patient.id
                          ? "border-primary"
                          : "border-border/50"
                      }`}
                      onClick={() =>
                        setSelectedPatient(
                          selectedPatient?.id === patient.id ? null : patient
                        )
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {patient.full_name || "N/A"}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              ID: {patient.id.slice(0, 8)}...
                            </CardDescription>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-primary transition-transform ${
                              selectedPatient?.id === patient.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate">{patient.email || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{patient.phone || "N/A"}</span>
                          </div>
                          {patient.medical_condition && (
                            <Badge variant="secondary" className="mt-2">
                              {patient.medical_condition}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      {searchTerm ? "No patients found" : "No patients registered yet"}
                    </p>
                  </div>
                )}
              </div>

              {/* Selected Patient Details */}
              {selectedPatient && (
                <Card className="border-primary bg-primary/5">
                  <CardHeader>
                    <CardTitle>Patient Details</CardTitle>
                    <CardDescription>
                      Complete information for {selectedPatient.full_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Full Name */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Name
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedPatient.full_name || "N/A"}
                        </p>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Email Address
                        </label>
                        <p className="text-lg font-semibold mt-1 truncate">
                          {selectedPatient.email || "N/A"}
                        </p>
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Phone Number
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedPatient.phone || "N/A"}
                        </p>
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Date of Birth
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedPatient.date_of_birth
                            ? new Date(selectedPatient.date_of_birth).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>

                      {/* Medical Condition */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Medical Condition
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedPatient.medical_condition || "N/A"}
                        </p>
                      </div>

                      {/* Emergency Contact */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Emergency Contact
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedPatient.emergency_contact || "N/A"}
                        </p>
                      </div>

                      {/* Patient ID */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Patient ID
                        </label>
                        <p className="text-sm font-mono mt-1 break-all">
                          {selectedPatient.id}
                        </p>
                      </div>

                      {/* Member Since */}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Member Since
                        </label>
                        <p className="text-lg font-semibold mt-1">
                          {selectedPatient.created_at
                            ? new Date(selectedPatient.created_at).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPatients;
