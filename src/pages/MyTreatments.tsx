import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pill,
  Plus,
  Bell,
  Home,
  Stethoscope,
  FileText,
  Menu,
  X,
  Clock,
  LogOut,
  Settings,
  Trash2,
  Loader2,
  CheckCircle2,
  ChevronDown,
  User,
  Heart,
  FileCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  schedule_time: string;
  instructions?: string;
  stock?: number;
  treatment_id: string;
}

interface Treatment {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  medicines: Medicine[];
  start_date: string;
  end_date?: string;
  patient_id: string;
}

const MyTreatments = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTreatmentOpen, setAddTreatmentOpen] = useState(false);
  const [addMedicineOpen, setAddMedicineOpen] = useState(false);
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [displayTime, setDisplayTime] = useState(new Date());
  
  const [treatmentForm, setTreatmentForm] = useState({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    status: "active" as "active" | "inactive",
  });

  const [medicineForm, setMedicineForm] = useState({
    name: "",
    dosage: "",
    frequency: "",
    schedule_time: "",
    instructions: "",
    stock: "",
    times: [] as string[], // Array to store multiple times
  });

  const [medicationLogOpen, setMedicationLogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicationTaken, setMedicationTaken] = useState<{
    [key: string]: boolean;
  }>({});
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Play alert sound
  const playAlertSound = () => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  // Check if it's time for a medication and show reminder
  const checkMedicationTime = (medicine: Medicine) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [scheduleHour, scheduleMin] = medicine.schedule_time.split(":").map(Number);
    const scheduleMinutes = scheduleHour * 60 + scheduleMin;

    // Check if current time is within 5 minutes of scheduled time
    if (Math.abs(currentMinutes - scheduleMinutes) <= 5) {
      return true;
    }
    return false;
  };

  // Check if it's time for any added medicine times (for newly added medicines)
  const checkMedicineTimesForAlert = (times: string[]) => {
    if (!times || times.length === 0) return false;
    
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    return times.some((time) => {
      if (!time) return false;
      const [hour, min] = time.split(":").map(Number);
      const timeMinutes = hour * 60 + min;
      return Math.abs(currentMinutes - timeMinutes) <= 5;
    });
  };

  // Handle medication confirmation
  const handleMedicationConfirm = async (medicine: Medicine) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    // Check if medicine has stock
    if (medicine.stock === null || medicine.stock === undefined || medicine.stock === 0) {
      toast({
        title: "⚠️ Out of Stock",
        description: `${medicine.name} has no stock available. Please add stock before marking as taken.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if medicine has already been taken today based on frequency
      const today = new Date().toISOString().split("T")[0];
      const { data: todayLogs, error: logsError } = await supabase
        .from("intake_logs")
        .select("*")
        .eq("medicine_id", medicine.id)
        .eq("user_id", user.id)
        .gte("taken_time", `${today}T00:00:00`)
        .lte("taken_time", `${today}T23:59:59`);

      if (!logsError && todayLogs && todayLogs.length > 0) {
        // Medicine has already been taken today
        const frequencyType = medicine.frequency.toLowerCase();
        
        if (frequencyType.includes("once")) {
          toast({
            title: "Already Taken",
            description: `${medicine.name} has already been taken once today. This medicine is for once daily use.`,
            variant: "destructive",
          });
          return;
        }
        
        // For twice or more daily, check if already taken at this scheduled time
        const timesLoggedToday = todayLogs.length;
        const dailyDoses = frequencyType.includes("twice") ? 2 : frequencyType.includes("three") ? 3 : 4;
        
        if (timesLoggedToday >= dailyDoses) {
          toast({
            title: "Already Taken",
            description: `${medicine.name} has already been taken ${timesLoggedToday} times today. Maximum daily doses: ${dailyDoses}`,
            variant: "destructive",
          });
          return;
        }
      }

      // Record intake log with proper format
      const now = new Date();
      const takenTime = now.toISOString();
      
      // Convert TIME (HH:MM:SS) to today's TIMESTAMP by creating a date from schedule_time
      const todayAtScheduledTime = new Date();
      const [hours, minutes, seconds] = medicine.schedule_time.split(':');
      todayAtScheduledTime.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds || '0'), 0);
      const scheduledTimestamp = todayAtScheduledTime.toISOString();

      console.log("Attempting to log medication:", {
        medicine_id: medicine.id,
        user_id: user.id,
        scheduled_time: scheduledTimestamp,
        taken_time: takenTime,
        status: "taken",
      });

      const { data, error } = await supabase.from("intake_logs").insert({
        medicine_id: medicine.id,
        user_id: user.id,
        scheduled_time: scheduledTimestamp,
        taken_time: takenTime,
        status: "taken" as any,
        notes: null,
      });

      if (error) {
        console.error("Supabase insert error:", error);
        throw new Error(error.message);
      }

      console.log("Intake log inserted successfully:", data);

      // Save confirmation notification
      try {
        await supabase.from("notifications").insert({
          user_id: user.id,
          medicine_id: medicine.id,
          title: `${medicine.name} taken`,
          message: `You confirmed taking ${medicine.name} (${medicine.dosage}) at ${new Date().toLocaleTimeString()}`,
          type: "info",
          scheduled_for: takenTime,
          read: false,
        });
      } catch (notifError) {
        console.error("Error saving confirmation notification:", notifError);
      }

      // Update stock
      if (medicine.stock !== null && medicine.stock > 0) {
        const { error: updateError } = await supabase
          .from("medicines")
          .update({ stock: medicine.stock - 1 })
          .eq("id", medicine.id);

        if (updateError) {
          console.error("Stock update error:", updateError);
        }
      }

      // Mark as taken
      setMedicationTaken((prev) => ({
        ...prev,
        [medicine.id]: true,
      }));

      // Add to intake logs
      setIntakeLogs((prev) => [
        ...prev,
        {
          medicine_id: medicine.id,
          user_id: user.id,
          scheduled_time: scheduledTimestamp,
          taken_time: takenTime,
          status: "taken",
        },
      ]);

      setMedicationLogOpen(false);
      setSelectedMedicine(null);

      // Play success sound
      playAlertSound();

      toast({
        title: "Success",
        description: `${medicine.name} marked as taken`,
      });

      // Refresh medicines to update stock
      // Add small delay to ensure database write is complete
      setTimeout(() => {
        fetchTreatments();
      }, 500);
    } catch (error) {
      console.error("Error logging medication:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to log medication";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Check for due medications every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setDisplayTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for due medications every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      treatments.forEach(async (treatment) => {
        treatment.medicines.forEach(async (medicine) => {
          // Only show alert if not already taken today and has stock
          if (!medicationTaken[medicine.id] && checkMedicationTime(medicine) && (medicine.stock !== null && medicine.stock !== undefined && medicine.stock > 0)) {
            setSelectedMedicine(medicine);
            setMedicationLogOpen(true);
            playAlertSound();

            // Save notification to database
            try {
              await supabase.from("notifications").insert({
                user_id: user?.id,
                medicine_id: medicine.id,
                title: `Time to take ${medicine.name}`,
                message: `It's time to take ${medicine.name} (${medicine.dosage}). ${medicine.instructions ? 'Instructions: ' + medicine.instructions : ''}`,
                type: "reminder",
                scheduled_for: new Date().toISOString(),
                read: false,
              });
            } catch (error) {
              console.error("Error saving notification:", error);
            }
          }
        });
      });
    }, 60000); // Check every minute

    // Also run the check immediately when component mounts or dependencies change
    treatments.forEach(async (treatment) => {
      treatment.medicines.forEach(async (medicine) => {
        if (!medicationTaken[medicine.id] && checkMedicationTime(medicine) && (medicine.stock !== null && medicine.stock !== undefined && medicine.stock > 0)) {
          setSelectedMedicine(medicine);
          setMedicationLogOpen(true);
          playAlertSound();

          // Save notification to database
          try {
            await supabase.from("notifications").insert({
              user_id: user?.id,
              medicine_id: medicine.id,
              title: `Time to take ${medicine.name}`,
              message: `It's time to take ${medicine.name} (${medicine.dosage}). ${medicine.instructions ? 'Instructions: ' + medicine.instructions : ''}`,
              type: "reminder",
              scheduled_for: new Date().toISOString(),
              read: false,
            });
          } catch (error) {
            console.error("Error saving notification:", error);
          }
        }
      });
    });

    return () => clearInterval(interval);
  }, [treatments, medicationTaken, user?.id]);

  // Fetch treatments and medicines
  useEffect(() => {
    if (user?.id) {
      fetchTreatments();
    }
  }, [user?.id]);

  // Refresh data when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        // Page became visible, refresh the data
        fetchTreatments();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user?.id]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("treatments")
        .select("*")
        .eq("patient_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch medicines for each treatment
      const treatmentsWithMedicines = await Promise.all(
        (data || []).map(async (treatment) => {
          const { data: medicines, error: medicinesError } = await supabase
            .from("medicines")
            .select("*")
            .eq("treatment_id", treatment.id);

          if (medicinesError) throw medicinesError;

          return {
            ...treatment,
            medicines: medicines || [],
          };
        })
      );

      setTreatments(treatmentsWithMedicines);

      // Fetch intake logs for today
      const today = new Date().toISOString().split("T")[0];
      const { data: logs, error: logsError } = await supabase
        .from("intake_logs")
        .select("*")
        .eq("user_id", user?.id)
        .gte("taken_time", `${today}T00:00:00`)
        .lte("taken_time", `${today}T23:59:59`);

      if (!logsError && logs) {
        setIntakeLogs(logs);
        // Mark medicines as taken based on logs
        const takenMedicines: { [key: string]: boolean } = {};
        const takenByTime: { [key: string]: number } = {}; // Track taken count per medicine name and time
        
        logs.forEach((log) => {
          if (log.status === "taken") {
            takenMedicines[log.medicine_id] = true;
          }
        });
        
        setMedicationTaken(takenMedicines);
      }
    } catch (error) {
      console.error("Error fetching treatments:", error);
      toast({
        title: "Error",
        description: "Failed to load treatments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTreatment = async () => {
    if (!user?.id || !treatmentForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a treatment name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("treatments")
        .insert({
          name: treatmentForm.name,
          description: treatmentForm.description || null,
          start_date: treatmentForm.start_date,
          end_date: treatmentForm.end_date || null,
          status: treatmentForm.status,
          patient_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setTreatments([{ ...data, medicines: [] } as Treatment, ...treatments]);
      setTreatmentForm({
        name: "",
        description: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
        status: "active",
      });
      setAddTreatmentOpen(false);
      toast({
        title: "Success",
        description: "Treatment added successfully",
      });
    } catch (error) {
      console.error("Error adding treatment:", error);
      toast({
        title: "Error",
        description: "Failed to add treatment",
        variant: "destructive",
      });
    }
  };

  const handleAddMedicine = async () => {
    if (!selectedTreatmentId || !medicineForm.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter medicine details",
        variant: "destructive",
      });
      return;
    }

    if (medicineForm.times.length === 0 || medicineForm.times.some(t => !t)) {
      toast({
        title: "Error",
        description: "Please add at least one valid time",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a medicine entry for each time slot (for multiple daily doses)
      const medicinePromises = medicineForm.times.map((time) =>
        supabase
          .from("medicines")
          .insert({
            name: medicineForm.name,
            dosage: medicineForm.dosage,
            frequency: medicineForm.frequency,
            schedule_time: time, // Each entry has its own time
            instructions: medicineForm.instructions || null,
            stock: medicineForm.stock ? parseInt(medicineForm.stock) : null,
            treatment_id: selectedTreatmentId,
          })
          .select()
          .single()
      );

      const results = await Promise.all(medicinePromises);
      
      // Check if any insert failed
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(errors[0].error.message);
      }

      // Get all the inserted medicines
      const newMedicines = results.map((r) => r.data as Medicine);

      // Update treatment with all new medicines
      setTreatments(
        treatments.map((treatment) =>
          treatment.id === selectedTreatmentId
            ? { ...treatment, medicines: [...treatment.medicines, ...newMedicines] }
            : treatment
        )
      );

      setMedicineForm({
        name: "",
        dosage: "",
        frequency: "",
        schedule_time: "",
        instructions: "",
        stock: "",
        times: [],
      });
      setAddMedicineOpen(false);
      
      const timesText = medicineForm.times.length > 1 
        ? `${medicineForm.times.length} times daily` 
        : "daily";
      
      toast({
        title: "Success",
        description: `${medicineForm.name} added ${timesText}`,
      });
    } catch (error) {
      console.error("Error adding medicine:", error);
      toast({
        title: "Error",
        description: "Failed to add medicine",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTreatment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this treatment?")) return;

    try {
      const { error } = await supabase
        .from("treatments")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTreatments(treatments.filter((t) => t.id !== id));
      toast({
        title: "Success",
        description: "Treatment deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting treatment:", error);
      toast({
        title: "Error",
        description: "Failed to delete treatment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMedicine = async (medicineId: string, treatmentId: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;

    try {
      const { error } = await supabase
        .from("medicines")
        .delete()
        .eq("id", medicineId);

      if (error) throw error;

      setTreatments(
        treatments.map((treatment) =>
          treatment.id === treatmentId
            ? {
                ...treatment,
                medicines: treatment.medicines.filter((m) => m.id !== medicineId),
              }
            : treatment
        )
      );
      toast({
        title: "Success",
        description: "Medicine deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting medicine:", error);
      toast({
        title: "Error",
        description: "Failed to delete medicine",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-card border-r border-border/50 transition-all duration-300 flex flex-col fixed left-0 top-0 h-screen`}>
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
          <div className={`text-xs font-semibold text-muted-foreground ${sidebarOpen ? 'px-3 mb-3' : 'hidden'}`}>
            MAIN
          </div>
          
          <Link to="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors">
            <Home className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Dashboard</span>}
          </Link>

          <div className={`text-xs font-semibold text-muted-foreground ${sidebarOpen ? 'px-3 mt-6 mb-3' : 'hidden'}`}>
            MENU
          </div>

          <Link to="/treatments" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Stethoscope className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">My Treatments</span>}
          </Link>

          <Link to="/history" className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors">
            <Clock className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>History</span>}
          </Link>

          <Link to="/recovery-reports" className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors">
            <FileText className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Recovery Reports</span>}
          </Link>

          <div className={`text-xs font-semibold text-muted-foreground ${sidebarOpen ? 'px-3 mt-6 mb-3' : 'hidden'}`}>
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
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <nav className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border/50 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">My Treatments</h2>
            <p className="text-sm text-muted-foreground">Manage your active treatments and associated medicines</p>
          </div>
          <div className="flex items-center gap-6">
            {/* 12-Hour Time Display */}
            <div className="flex flex-col items-center px-4 py-2 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg border border-blue-200 dark:border-blue-800 backdrop-blur-sm">
              <div className="text-xs font-semibold text-muted-foreground mb-1">Current Time</div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-primary font-mono">
                  {(displayTime.getHours() % 12 || 12).toString().padStart(2, '0')}:
                  {displayTime.getMinutes().toString().padStart(2, '0')}:
                  {displayTime.getSeconds().toString().padStart(2, '0')}
                </div>
                <div className="text-lg font-semibold text-primary">
                  {displayTime.getHours() >= 12 ? 'PM' : 'AM'}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {displayTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>

            {/* Add Treatment Button */}
            <div className="flex items-center gap-3">
            <Dialog open={addTreatmentOpen} onOpenChange={setAddTreatmentOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-5 h-5" />
                  Add Treatment
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Treatment</DialogTitle>
                  <DialogDescription>
                    Create a new treatment plan with details
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Treatment Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Diabetes Management"
                      value={treatmentForm.name}
                      onChange={(e) =>
                        setTreatmentForm({ ...treatmentForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Treatment details and purpose"
                      value={treatmentForm.description}
                      onChange={(e) =>
                        setTreatmentForm({ ...treatmentForm, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_date">Start Date</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={treatmentForm.start_date}
                        onChange={(e) =>
                          setTreatmentForm({ ...treatmentForm, start_date: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_date">End Date (Optional)</Label>
                      <Input
                        id="end_date"
                        type="date"
                        value={treatmentForm.end_date}
                        onChange={(e) =>
                          setTreatmentForm({ ...treatmentForm, end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={treatmentForm.status}
                      onValueChange={(value: string) =>
                        setTreatmentForm({
                          ...treatmentForm,
                          status: value === "active" ? "active" : "inactive",
                        })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddTreatment} className="w-full">
                    Add Treatment
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading treatments...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {treatments.map((treatment) => (
                  <Card key={treatment.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl">{treatment.name}</CardTitle>
                            <Badge
                              className={
                                treatment.status === "active"
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-500 text-white"
                              }
                            >
                              {treatment.status.charAt(0).toUpperCase() +
                                treatment.status.slice(1)}
                            </Badge>
                          </div>
                          <CardDescription className="text-base">
                            {treatment.description || "No description provided"}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTreatment(treatment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                      {/* Treatment Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                          <p className="font-semibold">
                            {new Date(treatment.start_date).toLocaleDateString()}
                          </p>
                        </div>
                        {treatment.end_date && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">End Date</p>
                            <p className="font-semibold">
                              {new Date(treatment.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Duration</p>
                          <p className="font-semibold">
                            {treatment.status === "active" ? "Ongoing" : "Completed"}
                          </p>
                        </div>
                      </div>

                      {/* Medicines */}
                      <div className="mt-6 border-t pt-6">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Pill className="w-5 h-5 text-primary" />
                          Associated Medicines ({treatment.medicines.length})
                        </h4>
                        {treatment.medicines.length > 0 ? (
                          <>
                            <div className="space-y-3">
                              {treatment.medicines.map((medicine) => (
                                <div
                                  key={medicine.id}
                                  className="p-4 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="font-semibold flex items-center gap-2">
                                        {medicine.name}
                                        {medicationTaken[medicine.id] && (
                                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                                        )}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {medicine.dosage}
                                      </p>
                                    </div>
                                    <Badge variant="outline">{medicine.frequency}</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                    <Clock className="w-4 h-4" />
                                    {medicine.schedule_time}
                                  </p>
                                  {medicine.instructions && (
                                    <p className="text-xs text-muted-foreground italic mb-2">
                                      {medicine.instructions}
                                    </p>
                                  )}
                                  {medicine.stock !== null && (
                                    <p className="text-sm mb-3">
                                      Stock:{" "}
                                      <span
                                        className={
                                          medicine.stock < 5
                                            ? "text-red-500 font-semibold"
                                            : "text-green-600"
                                        }
                                      >
                                        {medicine.stock} tablets
                                      </span>
                                    </p>
                                  )}
                                  <Dialog open={medicationLogOpen && selectedMedicine?.id === medicine.id && !medicationTaken[medicine.id]} onOpenChange={setMedicationLogOpen}>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant={medicationTaken[medicine.id] ? "outline" : "default"}
                                        disabled={medicationTaken[medicine.id]}
                                        onClick={() => {
                                          if (!medicationTaken[medicine.id]) {
                                            setSelectedMedicine(medicine);
                                            playAlertSound();
                                          }
                                        }}
                                        className="w-full gap-2"
                                      >
                                        {medicationTaken[medicine.id] ? (
                                          <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Already Taken
                                          </>
                                        ) : (
                                          <>
                                            <Pill className="w-4 h-4" />
                                            Log Medication
                                          </>
                                        )}
                                      </Button>
                                    </DialogTrigger>
                                    {selectedMedicine?.id === medicine.id && (
                                      <DialogContent className="max-w-md">
                                        <DialogHeader>
                                          <DialogTitle>Take Medication</DialogTitle>
                                          <DialogDescription>
                                            Confirm that you have taken this medication
                                          </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                            <p className="font-semibold text-lg mb-2">
                                              {selectedMedicine.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground mb-2">
                                              Dosage: {selectedMedicine.dosage}
                                            </p>
                                            <p className="text-sm text-muted-foreground mb-2">
                                              Frequency: {selectedMedicine.frequency}
                                            </p>
                                            <p className="text-sm text-muted-foreground mb-2">
                                              Time: {selectedMedicine.schedule_time}
                                            </p>
                                            {selectedMedicine.instructions && (
                                              <p className="text-sm text-muted-foreground font-semibold">
                                                ℹ️ {selectedMedicine.instructions}
                                              </p>
                                            )}
                                          </div>
                                          <div className="flex gap-3">
                                            <Button
                                              variant="outline"
                                              onClick={() => setMedicationLogOpen(false)}
                                              className="flex-1"
                                            >
                                              Cancel
                                            </Button>
                                            <Button
                                              onClick={() =>
                                                handleMedicationConfirm(selectedMedicine)
                                              }
                                              className="flex-1 gap-2"
                                            >
                                              <CheckCircle2 className="w-4 h-4" />
                                              Confirm Taken
                                            </Button>
                                          </div>
                                        </div>
                                      </DialogContent>
                                    )}
                                  </Dialog>
                                </div>
                              ))}
                            </div>
                            <Dialog open={addMedicineOpen} onOpenChange={setAddMedicineOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="mt-4 w-full gap-2"
                                  onClick={() => setSelectedTreatmentId(treatment.id)}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Medicine to This Treatment
                                </Button>
                              </DialogTrigger>
                              {selectedTreatmentId === treatment.id && (
                                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Add New Medicine</DialogTitle>
                                    <DialogDescription>
                                      Add a medicine to this treatment plan
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="med-name">Medicine Name *</Label>
                                      <Input
                                        id="med-name"
                                        placeholder="e.g., Metformin"
                                        value={medicineForm.name}
                                        onChange={(e) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            name: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="med-dosage">Dosage *</Label>
                                      <Input
                                        id="med-dosage"
                                        placeholder="e.g., 500mg"
                                        value={medicineForm.dosage}
                                        onChange={(e) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            dosage: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="med-frequency">Frequency *</Label>
                                      <Select
                                        value={medicineForm.frequency}
                                        onValueChange={(value) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            frequency: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger id="med-frequency">
                                          <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Once daily">Once daily</SelectItem>
                                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                                          <SelectItem value="Three times daily">Three times daily</SelectItem>
                                          <SelectItem value="Four times daily">Four times daily</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Times Management */}
                                    <div>
                                      <Label>Medicine Times *</Label>
                                      <div className="space-y-2 mt-2">
                                        {medicineForm.times.map((time, index) => (
                                          <div key={index} className="flex gap-2">
                                            <Input
                                              type="time"
                                              value={time}
                                              onChange={(e) => {
                                                const newTimes = [...medicineForm.times];
                                                newTimes[index] = e.target.value;
                                                setMedicineForm({
                                                  ...medicineForm,
                                                  times: newTimes,
                                                });
                                              }}
                                              className="flex-1"
                                            />
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => {
                                                setMedicineForm({
                                                  ...medicineForm,
                                                  times: medicineForm.times.filter((_, i) => i !== index),
                                                });
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="w-full gap-2"
                                          onClick={() => {
                                            setMedicineForm({
                                              ...medicineForm,
                                              times: [...medicineForm.times, ""],
                                            });
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                          Add Time
                                        </Button>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="med-instructions">Instructions *</Label>
                                      <Select
                                        value={medicineForm.instructions}
                                        onValueChange={(value) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            instructions: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger id="med-instructions">
                                          <SelectValue placeholder="Select instruction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Before food">Before food</SelectItem>
                                          <SelectItem value="After food">After food</SelectItem>
                                          <SelectItem value="Afternoon">Afternoon</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="med-stock">Stock (tablets)</Label>
                                      <Input
                                        id="med-stock"
                                        type="number"
                                        placeholder="e.g., 30"
                                        value={medicineForm.stock}
                                        onChange={(e) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            stock: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <Button onClick={handleAddMedicine} className="w-full">
                                      Add Medicine
                                    </Button>
                                  </div>
                                </DialogContent>
                              )}
                            </Dialog>
                          </>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-muted-foreground mb-3">
                              No medicines added yet
                            </p>
                            <Dialog open={addMedicineOpen} onOpenChange={setAddMedicineOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedTreatmentId(treatment.id)}
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add First Medicine
                                </Button>
                              </DialogTrigger>
                              {selectedTreatmentId === treatment.id && (
                                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Add New Medicine</DialogTitle>
                                    <DialogDescription>
                                      Add a medicine to this treatment plan
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="med-name">Medicine Name *</Label>
                                      <Input
                                        id="med-name"
                                        placeholder="e.g., Metformin"
                                        value={medicineForm.name}
                                        onChange={(e) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            name: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="med-dosage">Dosage *</Label>
                                      <Input
                                        id="med-dosage"
                                        placeholder="e.g., 500mg"
                                        value={medicineForm.dosage}
                                        onChange={(e) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            dosage: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="med-frequency">Frequency *</Label>
                                      <Select
                                        value={medicineForm.frequency}
                                        onValueChange={(value) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            frequency: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger id="med-frequency">
                                          <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Once daily">Once daily</SelectItem>
                                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                                          <SelectItem value="Three times daily">Three times daily</SelectItem>
                                          <SelectItem value="Four times daily">Four times daily</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Times Management */}
                                    <div>
                                      <Label>Medicine Times *</Label>
                                      <div className="space-y-2 mt-2">
                                        {medicineForm.times.map((time, index) => (
                                          <div key={index} className="flex gap-2">
                                            <Input
                                              type="time"
                                              value={time}
                                              onChange={(e) => {
                                                const newTimes = [...medicineForm.times];
                                                newTimes[index] = e.target.value;
                                                setMedicineForm({
                                                  ...medicineForm,
                                                  times: newTimes,
                                                });
                                              }}
                                              className="flex-1"
                                            />
                                            <Button
                                              type="button"
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => {
                                                setMedicineForm({
                                                  ...medicineForm,
                                                  times: medicineForm.times.filter((_, i) => i !== index),
                                                });
                                              }}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        ))}
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="w-full gap-2"
                                          onClick={() => {
                                            setMedicineForm({
                                              ...medicineForm,
                                              times: [...medicineForm.times, ""],
                                            });
                                          }}
                                        >
                                          <Plus className="w-4 h-4" />
                                          Add Time
                                        </Button>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="med-instructions">Instructions *</Label>
                                      <Select
                                        value={medicineForm.instructions}
                                        onValueChange={(value) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            instructions: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger id="med-instructions">
                                          <SelectValue placeholder="Select instruction" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Before food">Before food</SelectItem>
                                          <SelectItem value="After food">After food</SelectItem>
                                          <SelectItem value="Afternoon">Afternoon</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="med-stock">Stock (tablets)</Label>
                                      <Input
                                        id="med-stock"
                                        type="number"
                                        placeholder="e.g., 30"
                                        value={medicineForm.stock}
                                        onChange={(e) =>
                                          setMedicineForm({
                                            ...medicineForm,
                                            stock: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <Button onClick={handleAddMedicine} className="w-full">
                                      Add Medicine
                                    </Button>
                                  </div>
                                </DialogContent>
                              )}
                            </Dialog>
                          </div>
                        )}
                      </div>

                      {/* View History Button */}
                      <div className="mt-6 pt-6 border-t">
                        <Link to={`/history?treatment=${treatment.id}`} className="w-full">
                          <Button variant="outline" className="w-full gap-2">
                            <Clock className="w-4 h-4" />
                            View Treatment History
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Empty State */}
              {treatments.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Stethoscope className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No treatments yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start by adding your first treatment plan
                    </p>
                    <Dialog open={addTreatmentOpen} onOpenChange={setAddTreatmentOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Treatment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add New Treatment</DialogTitle>
                          <DialogDescription>
                            Create a new treatment plan with details
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Treatment Name *</Label>
                            <Input
                              id="name"
                              placeholder="e.g., Diabetes Management"
                              value={treatmentForm.name}
                              onChange={(e) =>
                                setTreatmentForm({ ...treatmentForm, name: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              placeholder="Treatment details and purpose"
                              value={treatmentForm.description}
                              onChange={(e) =>
                                setTreatmentForm({
                                  ...treatmentForm,
                                  description: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="start_date">Start Date</Label>
                              <Input
                                id="start_date"
                                type="date"
                                value={treatmentForm.start_date}
                                onChange={(e) =>
                                  setTreatmentForm({
                                    ...treatmentForm,
                                    start_date: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor="end_date">End Date (Optional)</Label>
                              <Input
                                id="end_date"
                                type="date"
                                value={treatmentForm.end_date}
                                onChange={(e) =>
                                  setTreatmentForm({
                                    ...treatmentForm,
                                    end_date: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={treatmentForm.status}
                              onValueChange={(value: string) =>
                                setTreatmentForm({
                                  ...treatmentForm,
                                  status: value === "active" ? "active" : "inactive",
                                })
                              }
                            >
                              <SelectTrigger id="status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleAddTreatment} className="w-full">
                            Add Treatment
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyTreatments;
