import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Pill,
  Plus,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  LogOut,
  User,
  Settings,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Mock data
const todaysMedications = [
  { id: 1, name: "Vitamin D3", dosage: "1000 IU", time: "8:00 AM", status: "taken", instructions: "Take with food" },
  { id: 2, name: "Metformin", dosage: "500mg", time: "12:00 PM", status: "pending", instructions: "Take after meal" },
  { id: 3, name: "Lisinopril", dosage: "10mg", time: "6:00 PM", status: "pending", instructions: "Take once daily" },
  { id: 4, name: "Aspirin", dosage: "81mg", time: "8:00 PM", status: "pending", instructions: "Take before bed" },
];

const weeklyAdherence = [
  { day: "Mon", adherence: 100 },
  { day: "Tue", adherence: 75 },
  { day: "Wed", adherence: 100 },
  { day: "Thu", adherence: 100 },
  { day: "Fri", adherence: 50 },
  { day: "Sat", adherence: 100 },
  { day: "Sun", adherence: 85 },
];

const notifications = [
  { id: 1, title: "Time for Metformin", message: "Don't forget to take your 500mg dose", type: "reminder", time: "Just now" },
  { id: 2, title: "Low Stock Alert", message: "Only 5 Aspirin tablets remaining", type: "warning", time: "2h ago" },
  { id: 3, title: "Great Progress!", message: "You've maintained 90%+ adherence this week", type: "success", time: "1d ago" },
];

const Dashboard = () => {
  const { toast } = useToast();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [medications, setMedications] = useState(todaysMedications);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || "User";

  const handleMarkAsTaken = (id: number) => {
    setMedications(meds => 
      meds.map(med => 
        med.id === id ? { ...med, status: "taken" } : med
      )
    );
    toast({
      title: "Medication logged!",
      description: "Great job staying on track with your health.",
    });
  };

  const takenCount = medications.filter(m => m.status === "taken").length;
  const totalCount = medications.length;
  const adherencePercentage = Math.round((takenCount / totalCount) * 100);
  const overallAdherence = Math.round(weeklyAdherence.reduce((acc, curr) => acc + curr.adherence, 0) / weeklyAdherence.length);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">MedTracker</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Good morning, {displayName}!</h1>
          <p className="text-muted-foreground">Here's your health overview for today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card variant="gradient" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="active">Today</Badge>
            </div>
            <p className="text-2xl font-bold">{takenCount}/{totalCount}</p>
            <p className="text-sm text-muted-foreground">Medications taken</p>
          </Card>

          <Card variant="gradient" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <Badge variant="success">+5%</Badge>
            </div>
            <p className="text-2xl font-bold">{overallAdherence}%</p>
            <p className="text-sm text-muted-foreground">Weekly adherence</p>
          </Card>

          <Card variant="gradient" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <Badge variant="warning">2 pending</Badge>
            </div>
            <p className="text-2xl font-bold">12:00 PM</p>
            <p className="text-sm text-muted-foreground">Next medication</p>
          </Card>

          <Card variant="gradient" className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <Badge variant="destructive">Low</Badge>
            </div>
            <p className="text-2xl font-bold">2</p>
            <p className="text-sm text-muted-foreground">Refills needed</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card variant="elevated">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Today's Schedule</CardTitle>
                  <CardDescription>Your medications for today</CardDescription>
                </div>
                <Button variant="default" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Medication
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {medications.map((med) => (
                    <div
                      key={med.id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        med.status === "taken"
                          ? "bg-success/5 border-success/20"
                          : "bg-secondary/30 border-border/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            med.status === "taken"
                              ? "bg-success/10"
                              : "bg-primary/10"
                          }`}
                        >
                          {med.status === "taken" ? (
                            <CheckCircle2 className="w-6 h-6 text-success" />
                          ) : (
                            <Pill className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage} • {med.time}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {med.instructions}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={med.status === "taken" ? "taken" : "pending"}
                        >
                          {med.status === "taken" ? "Taken" : "Pending"}
                        </Badge>
                        {med.status !== "taken" && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleMarkAsTaken(med.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Take
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Adherence Chart */}
            <Card variant="elevated" className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Weekly Adherence
                </CardTitle>
                <CardDescription>Your medication adherence over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyAdherence}>
                      <defs>
                        <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, "Adherence"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="adherence"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#adherenceGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card variant="glass" className="p-6">
              <div className="text-center mb-6">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(adherencePercentage / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{adherencePercentage}%</span>
                  </div>
                </div>
                <p className="text-lg font-semibold mt-4">Today's Progress</p>
                <p className="text-sm text-muted-foreground">
                  {takenCount} of {totalCount} medications taken
                </p>
              </div>
              <Progress value={adherencePercentage} className="h-2" />
            </Card>

            {/* Notifications */}
            <Card variant="elevated">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-accent" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border ${
                      notif.type === "reminder"
                        ? "bg-accent/5 border-accent/20"
                        : notif.type === "warning"
                        ? "bg-warning/5 border-warning/20"
                        : "bg-success/5 border-success/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{notif.title}</p>
                      <span className="text-xs text-muted-foreground">{notif.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" size="sm">
                  View all notifications
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="flat" className="p-4">
              <p className="text-sm font-semibold mb-3">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Med
                </Button>
                <Button variant="secondary" size="sm" className="justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
                <Button variant="secondary" size="sm" className="justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reports
                </Button>
                <Button variant="secondary" size="sm" className="justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
