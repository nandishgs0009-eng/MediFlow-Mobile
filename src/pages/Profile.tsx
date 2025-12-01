import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronDown,
  User,
  Heart,
  FileCheck,
  Bell,
  Save,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  blood_type: string;
  height: string; // in cm
  weight: string; // in kg
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
  allergies: string;
  current_medications_notes: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at?: string;
  updated_at?: string;
}

const Profile = () => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [patientData, setPatientData] = useState<PatientProfile>({
    id: user?.id || "",
    full_name: profile?.full_name || "",
    email: user?.email || "",
    phone: "",
    date_of_birth: "",
    gender: "",
    blood_type: "",
    height: "",
    weight: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
    current_medications_notes: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
  });

  const [editData, setEditData] = useState<PatientProfile>(patientData);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
    if (user?.id) {
      fetchPatientProfile();
    }
  }, [user?.id]);

  const fetchPatientProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from("profiles" as any)
        .select("*")
        .eq("id", user?.id)
        .single() as any);

      if (error && error.code !== "PGRST116") {
        // PGRST116 means no rows found
        console.error("Error fetching profile:", error);
        throw error;
      }

      if (data) {
        const enrichedData: PatientProfile = {
          id: user?.id || "",
          full_name: data.full_name || "",
          email: data.email || user?.email || "",
          phone: data.phone || "",
          date_of_birth: data.date_of_birth || "",
          gender: data.gender || "",
          blood_type: data.blood_type || "",
          height: data.height || "",
          weight: data.weight || "",
          emergency_contact_name: data.emergency_contact_name || "",
          emergency_contact_phone: data.emergency_contact_phone || "",
          medical_conditions: data.medical_conditions || "",
          allergies: data.allergies || "",
          current_medications_notes: data.current_medications_notes || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip_code: data.zip_code || "",
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
        setPatientData(enrichedData);
        setEditData(enrichedData);
      } else {
        // Initialize with basic user data
        const basicData: PatientProfile = {
          id: user?.id || "",
          full_name: profile?.full_name || "",
          email: user?.email || "",
          phone: "",
          date_of_birth: "",
          gender: "",
          blood_type: "",
          height: "",
          weight: "",
          emergency_contact_name: "",
          emergency_contact_phone: "",
          medical_conditions: "",
          allergies: "",
          current_medications_notes: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
        };
        setPatientData(basicData);
        setEditData(basicData);
      }
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      // Prepare data for upsert (email is read-only, id is primary key)
      const { id, email, ...dataToSave } = editData;

      const { error } = await (supabase
        .from("profiles" as any)
        .upsert(
          {
            id: user?.id,
            ...dataToSave,
          },
          { onConflict: "id" }
        ) as any);

      if (error) throw error;

      setPatientData(editData);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(patientData);
    setIsEditing(false);
  };

  const handleEditChange = (
    field: keyof PatientProfile,
    value: string
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return "Not provided";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age.toString() : "Not provided";
  };

  const calculateBMI = (height: string, weight: string) => {
    if (!height || !weight) return "Not provided";
    const heightM = parseFloat(height) / 100;
    const weightKg = parseFloat(weight);
    const bmi = (weightKg / (heightM * heightM)).toFixed(1);
    return bmi;
  };

  const getBMICategory = (bmi: string) => {
    if (bmi === "Not provided") return "Not available";
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Normal";
    if (bmiValue < 30) return "Overweight";
    return "Obese";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

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
                <Link to="/profile" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary transition-colors text-sm">
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
            <h2 className="text-2xl font-bold">Patient Profile</h2>
            <p className="text-sm text-muted-foreground">
              Manage your personal and medical information
            </p>
          </div>
          {!isEditing && (
            <Button
              onClick={() => {
                setIsEditing(true);
              }}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </nav>

        {/* Content */}
        <div className="p-8">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your basic personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Full Name
                      </label>
                      <Input
                        value={editData.full_name}
                        onChange={(e) =>
                          handleEditChange("full_name", e.target.value)
                        }
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Email (Read-only)
                      </label>
                      <Input
                        value={editData.email}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Email cannot be changed for security reasons
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => handleEditChange("phone", e.target.value)}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={editData.date_of_birth}
                        onChange={(e) =>
                          handleEditChange("date_of_birth", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Gender
                      </label>
                      <select
                        value={editData.gender}
                        onChange={(e) =>
                          handleEditChange("gender", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Blood Type
                      </label>
                      <select
                        value={editData.blood_type}
                        onChange={(e) =>
                          handleEditChange("blood_type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="">Select blood type</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Health Metrics
                  </CardTitle>
                  <CardDescription>
                    Your physical health measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Height (cm)
                      </label>
                      <Input
                        type="number"
                        value={editData.height}
                        onChange={(e) =>
                          handleEditChange("height", e.target.value)
                        }
                        placeholder="170"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Weight (kg)
                      </label>
                      <Input
                        type="number"
                        value={editData.weight}
                        onChange={(e) =>
                          handleEditChange("weight", e.target.value)
                        }
                        placeholder="70"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Medical Information
                  </CardTitle>
                  <CardDescription>
                    Important medical details and history
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Medical Conditions
                    </label>
                    <Textarea
                      value={editData.medical_conditions}
                      onChange={(e) =>
                        handleEditChange("medical_conditions", e.target.value)
                      }
                      placeholder="List any chronic conditions, previous surgeries, etc."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Allergies
                    </label>
                    <Textarea
                      value={editData.allergies}
                      onChange={(e) =>
                        handleEditChange("allergies", e.target.value)
                      }
                      placeholder="List any known allergies and reactions"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Current Medications Notes
                    </label>
                    <Textarea
                      value={editData.current_medications_notes}
                      onChange={(e) =>
                        handleEditChange("current_medications_notes", e.target.value)
                      }
                      placeholder="Add any additional notes about your medications"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Address Information
                  </CardTitle>
                  <CardDescription>
                    Your contact address details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">
                      Street Address
                    </label>
                    <Input
                      value={editData.address}
                      onChange={(e) =>
                        handleEditChange("address", e.target.value)
                      }
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        City
                      </label>
                      <Input
                        value={editData.city}
                        onChange={(e) => handleEditChange("city", e.target.value)}
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        State/Province
                      </label>
                      <Input
                        value={editData.state}
                        onChange={(e) => handleEditChange("state", e.target.value)}
                        placeholder="NY"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Zip/Postal Code
                      </label>
                      <Input
                        value={editData.zip_code}
                        onChange={(e) =>
                          handleEditChange("zip_code", e.target.value)
                        }
                        placeholder="10001"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Emergency Contact
                  </CardTitle>
                  <CardDescription>
                    Contact information in case of emergency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Contact Name
                      </label>
                      <Input
                        value={editData.emergency_contact_name}
                        onChange={(e) =>
                          handleEditChange(
                            "emergency_contact_name",
                            e.target.value
                          )
                        }
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block">
                        Contact Phone
                      </label>
                      <Input
                        type="tel"
                        value={editData.emergency_contact_phone}
                        onChange={(e) =>
                          handleEditChange(
                            "emergency_contact_phone",
                            e.target.value
                          )
                        }
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end sticky bottom-0 bg-background/95 backdrop-blur p-4 rounded-lg border border-border">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-6">
              {/* Personal Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Full Name
                      </p>
                      <p className="font-semibold text-lg">
                        {patientData.full_name || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Email
                      </p>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        {patientData.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Phone
                      </p>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Phone className="w-4 h-4 text-primary" />
                        {patientData.phone || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Date of Birth
                      </p>
                      <p className="font-semibold text-lg flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {patientData.date_of_birth
                          ? new Date(
                              patientData.date_of_birth
                            ).toLocaleDateString()
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Age</p>
                      <p className="font-semibold text-lg">
                        {calculateAge(patientData.date_of_birth)} years
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Gender
                      </p>
                      <p className="font-semibold text-lg capitalize">
                        {patientData.gender
                          ? patientData.gender.replace(/_/g, " ")
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Metrics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Health Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Height
                      </p>
                      <p className="font-semibold text-lg">
                        {patientData.height ? `${patientData.height} cm` : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Weight
                      </p>
                      <p className="font-semibold text-lg">
                        {patientData.weight ? `${patientData.weight} kg` : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">BMI</p>
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">
                          {calculateBMI(
                            patientData.height,
                            patientData.weight
                          )}
                        </p>
                        <Badge
                          variant="outline"
                          className={
                            getBMICategory(
                              calculateBMI(
                                patientData.height,
                                patientData.weight
                              )
                            ) === "Normal"
                              ? "bg-green-500/20 text-green-700 border-green-500/20"
                              : getBMICategory(
                                  calculateBMI(
                                    patientData.height,
                                    patientData.weight
                                  )
                                ) === "Overweight"
                                ? "bg-orange-500/20 text-orange-700 border-orange-500/20"
                                : "bg-red-500/20 text-red-700 border-red-500/20"
                          }
                        >
                          {getBMICategory(
                            calculateBMI(
                              patientData.height,
                              patientData.weight
                            )
                          )}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Blood Type
                      </p>
                      <Badge className="text-base py-1.5">
                        {patientData.blood_type || "Not provided"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information Card */}
              {(patientData.medical_conditions ||
                patientData.allergies ||
                patientData.current_medications_notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Medical Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {patientData.medical_conditions && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Medical Conditions
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                          {patientData.medical_conditions}
                        </p>
                      </div>
                    )}
                    {patientData.allergies && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Allergies
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                          {patientData.allergies}
                        </p>
                      </div>
                    )}
                    {patientData.current_medications_notes && (
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-2">
                          Medication Notes
                        </p>
                        <p className="whitespace-pre-wrap text-sm">
                          {patientData.current_medications_notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Address Information Card */}
              {(patientData.address ||
                patientData.city ||
                patientData.state ||
                patientData.zip_code) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {patientData.address && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Street:</span>{" "}
                          {patientData.address}
                        </p>
                      )}
                      {patientData.city && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">City:</span>{" "}
                          {patientData.city}
                        </p>
                      )}
                      {patientData.state && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">State:</span>{" "}
                          {patientData.state}
                        </p>
                      )}
                      {patientData.zip_code && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">
                            Zip Code:
                          </span>{" "}
                          {patientData.zip_code}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contact Card */}
              {(patientData.emergency_contact_name ||
                patientData.emergency_contact_phone) && (
                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-5 h-5" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Name
                        </p>
                        <p className="font-semibold">
                          {patientData.emergency_contact_name ||
                            "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Phone
                        </p>
                        <p className="font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-orange-500" />
                          {patientData.emergency_contact_phone ||
                            "Not provided"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Future Enhancements Section */}
              <Card className="border-dashed border-2 bg-muted/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Future Enhancements
                  </CardTitle>
                  <CardDescription>
                    Upcoming features to enhance your profile management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Medical History Upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Upload and manage past medical records and test results
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Medication History Tracking
                        </p>
                        <p className="text-xs text-muted-foreground">
                          View complete history of all medications prescribed to
                          you
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Lab Reports Integration
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Integrate lab reports and view results directly in your
                          profile
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Insurance Information
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Store and manage your health insurance details
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Doctor & Clinic Directory
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Maintain a list of your healthcare providers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm">
                          Export Profile as PDF
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Download your complete profile for sharing with doctors
                        </p>
                      </div>
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

export default Profile;
