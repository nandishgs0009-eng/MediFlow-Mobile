// Admin Treatments Management Page
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
  Activity,
  AlertCircle,
  BarChart3,
  Layers,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Patient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  medical_condition: string;
}

interface Treatment {
  id: string;
  patient_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
}

interface TreatmentWithMedicines extends Treatment {
  medicines: Medicine[];
}

const AdminTreatments = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientTreatments, setPatientTreatments] = useState<TreatmentWithMedicines[]>([]);
  const [expandedTreatment, setExpandedTreatment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loadingTreatments, setLoadingTreatments] = useState(false);

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
        .select("id, full_name, email, phone, medical_condition");

      if (error) {
        console.error("Error fetching patients:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
      } else {
        console.log("Patients fetched successfully:", patientsData);
        setPatients(patientsData || []);
      }
    } catch (err) {
      console.error("Exception fetching patients:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientTreatments = async (patientId: string) => {
    try {
      setLoadingTreatments(true);
      setPatientTreatments([]);

      // Fetch treatments for this patient
      const { data: treatmentsData, error: treatmentsError } = await (supabase as any)
        .from("treatments")
        .select("id, patient_id, name, description, start_date, end_date, status")
        .eq("patient_id", patientId);

      if (treatmentsError) {
        console.error("Error fetching treatments:", treatmentsError);
        setPatientTreatments([]);
        return;
      }

      // For each treatment, fetch associated medicines
      const treatmentsWithMedicines: TreatmentWithMedicines[] = [];

      for (const treatment of treatmentsData || []) {
        // Fetch medicines for this treatment
        const { data: medicinesData, error: medicinesError } = await (supabase as any)
          .from("medicines")
          .select("id, name, dosage, frequency")
          .eq("treatment_id", treatment.id);

        if (medicinesError) {
          console.error("Error fetching medicines for treatment:", medicinesError);
        }

        treatmentsWithMedicines.push({
          ...treatment,
          medicines: medicinesData || [],
        });
      }

      console.log("Treatments with medicines:", treatmentsWithMedicines);
      setPatientTreatments(treatmentsWithMedicines);
    } catch (err) {
      console.error("Error fetching patient treatments:", err);
    } finally {
      setLoadingTreatments(false);
    }
  };

  const handlePatientClick = (patient: Patient) => {
    if (selectedPatient?.id === patient.id) {
      setSelectedPatient(null);
      setPatientTreatments([]);
      setExpandedTreatment(null);
    } else {
      setSelectedPatient(patient);
      fetchPatientTreatments(patient.id);
      setExpandedTreatment(null);
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
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin-dashboard")}
          >
            <Activity className="w-5 h-5 mr-3" />
            {sidebarOpen && "Dashboard"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin-patients")}
          >
            <Users className="w-5 h-5 mr-3" />
            {sidebarOpen && "Patients"}
          </Button>
          <Button
            variant="default"
            className="w-full justify-start bg-primary/10"
            onClick={() => navigate("/admin-treatments")}
          >
            <Layers className="w-5 h-5 mr-3" />
            {sidebarOpen && "Treatments"}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => navigate("/admin-dashboard")}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            {sidebarOpen && "Reports"}
          </Button>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-20"} transition-all duration-300`}>
        {/* Top Navigation */}
        <nav className="bg-card border-b border-border/50 px-8 py-4 sticky top-0 z-30 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Treatments Management</h1>
            <p className="text-sm text-muted-foreground">Manage patient treatments and medicines</p>
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
                      onClick={() => handlePatientClick(patient)}
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

              {/* Treatments Section */}
              {selectedPatient && (
                <div className="space-y-6">
                  {/* Patient Summary */}
                  <Card className="border-primary bg-primary/5">
                    <CardHeader>
                      <CardTitle>Selected Patient</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Full Name
                          </label>
                          <p className="text-lg font-semibold mt-1">
                            {selectedPatient.full_name}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Email
                          </label>
                          <p className="text-sm font-semibold mt-1 truncate">
                            {selectedPatient.email}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Medical Condition
                          </label>
                          <p className="text-lg font-semibold mt-1">
                            {selectedPatient.medical_condition || "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Treatments List */}
                  <div>
                    <h2 className="text-xl font-bold mb-4">Patient Treatments</h2>

                    {loadingTreatments ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
                          <p className="text-muted-foreground">Loading treatments...</p>
                        </div>
                      </div>
                    ) : patientTreatments.length > 0 ? (
                      <div className="space-y-4">
                        {patientTreatments.map((treatment) => (
                          <Card key={treatment.id} className="border-l-4 border-l-primary">
                            <CardHeader
                              className="pb-3 cursor-pointer hover:bg-secondary/50 transition-colors"
                              onClick={() =>
                                setExpandedTreatment(
                                  expandedTreatment === treatment.id ? null : treatment.id
                                )
                              }
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-lg flex items-center gap-2">
                                    <Layers className="w-5 h-5" />
                                    {treatment.name}
                                  </CardTitle>
                                  <CardDescription>{treatment.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      treatment.status === "active"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {treatment.status}
                                  </Badge>
                                  <ChevronDown
                                    className={`w-5 h-5 text-primary transition-transform ${
                                      expandedTreatment === treatment.id ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>
                              </div>
                            </CardHeader>

                            {/* Treatment Details and Medicines */}
                            {expandedTreatment === treatment.id && (
                              <CardContent className="border-t pt-4 space-y-4">
                                {/* Treatment Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      Start Date
                                    </label>
                                    <p className="text-lg font-semibold mt-1">
                                      {new Date(treatment.start_date).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                      End Date
                                    </label>
                                    <p className="text-lg font-semibold mt-1">
                                      {treatment.end_date
                                        ? new Date(treatment.end_date).toLocaleDateString()
                                        : "Ongoing"}
                                    </p>
                                  </div>
                                </div>

                                {/* Medicines Section */}
                                <div className="border-t pt-4">
                                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                    <Pill className="w-5 h-5 text-primary" />
                                    Medicines
                                  </h3>

                                  {treatment.medicines.length > 0 ? (
                                    <div className="space-y-3">
                                      {treatment.medicines.map((medicine) => (
                                        <Card
                                          key={medicine.id}
                                          className="bg-secondary/50 border-0"
                                        >
                                          <CardContent className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                              <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                  Medicine Name
                                                </label>
                                                <p className="font-semibold mt-1">
                                                  {medicine.name}
                                                </p>
                                              </div>
                                              <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                  Dosage
                                                </label>
                                                <p className="font-semibold mt-1">
                                                  {medicine.dosage}
                                                </p>
                                              </div>
                                              <div>
                                                <label className="text-xs font-medium text-muted-foreground">
                                                  Frequency
                                                </label>
                                                <p className="font-semibold mt-1">
                                                  {medicine.frequency}
                                                </p>
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">
                                      No medicines assigned to this treatment
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                          <p className="text-muted-foreground">
                            No treatments found for this patient
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTreatments;
