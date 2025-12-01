import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "reminder" | "alert" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const Notifications = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mock notification preferences
  const [preferences, setPreferences] = useState({
    medicineReminders: true,
    appointmentAlerts: true,
    stockLowWarnings: true,
    weeklyReports: true,
    healthAlerts: true,
    emailNotifications: true,
    pushNotifications: true,
  });

  // Mock notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "reminder",
      title: "Medicine Reminder",
      message: "Time to take your Aspirin (500mg) - Scheduled at 09:00 AM",
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      read: false,
    },
    {
      id: "2",
      type: "alert",
      title: "Low Stock Alert",
      message: "Paracetamol stock is running low. Only 5 tablets remaining.",
      timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
      read: false,
    },
    {
      id: "3",
      type: "info",
      title: "Weekly Report Ready",
      message: "Your weekly medication adherence report is ready to view.",
      timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
      read: true,
    },
    {
      id: "4",
      type: "success",
      title: "Appointment Confirmed",
      message: "Your appointment with Dr. Smith is confirmed for tomorrow at 10:00 AM.",
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
      read: true,
    },
    {
      id: "5",
      type: "alert",
      title: "Health Alert",
      message: "Your medication adherence rate dropped below 80%. Please maintain consistency.",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
      read: true,
    },
  ]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    toast({
      title: "Success",
      description: "Notification preference updated.",
    });
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
    toast({
      title: "Deleted",
      description: "Notification removed.",
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast({
      title: "Cleared",
      description: "All notifications have been cleared.",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "alert":
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case "info":
        return <Bell className="w-5 h-5 text-gray-500" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary transition-colors text-sm"
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
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary/50 transition-colors text-sm"
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
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Manage your notifications and preferences
            </p>
          </div>
          {notifications.length > 0 && (
            <Badge variant="outline" className="text-base py-1.5">
              {unreadCount} Unread
            </Badge>
          )}
        </nav>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Customize what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {/* Medicine Reminders */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Medicine Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Get reminded when it's time to take your medicine
                      </p>
                    </div>
                    <Switch
                      checked={preferences.medicineReminders}
                      onCheckedChange={() =>
                        handlePreferenceChange("medicineReminders")
                      }
                    />
                  </div>

                  {/* Appointment Alerts */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Appointment Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about upcoming appointments
                      </p>
                    </div>
                    <Switch
                      checked={preferences.appointmentAlerts}
                      onCheckedChange={() =>
                        handlePreferenceChange("appointmentAlerts")
                      }
                    />
                  </div>

                  {/* Low Stock Warnings */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Low Stock Warnings</p>
                      <p className="text-sm text-muted-foreground">
                        Alert when medicine stock is running low
                      </p>
                    </div>
                    <Switch
                      checked={preferences.stockLowWarnings}
                      onCheckedChange={() =>
                        handlePreferenceChange("stockLowWarnings")
                      }
                    />
                  </div>

                  {/* Weekly Reports */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Weekly Reports</p>
                      <p className="text-sm text-muted-foreground">
                        Receive your weekly medication adherence report
                      </p>
                    </div>
                    <Switch
                      checked={preferences.weeklyReports}
                      onCheckedChange={() =>
                        handlePreferenceChange("weeklyReports")
                      }
                    />
                  </div>

                  {/* Health Alerts */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Health Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified about important health metrics
                      </p>
                    </div>
                    <Switch
                      checked={preferences.healthAlerts}
                      onCheckedChange={() =>
                        handlePreferenceChange("healthAlerts")
                      }
                    />
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={() =>
                        handlePreferenceChange("emailNotifications")
                      }
                    />
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30">
                    <div>
                      <p className="font-semibold">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive real-time push notifications on your device
                      </p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={() =>
                        handlePreferenceChange("pushNotifications")
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Notifications
                  </CardTitle>
                  <CardDescription>
                    Your latest notifications and alerts
                  </CardDescription>
                </div>
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                  >
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      No notifications yet. You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          notif.read
                            ? "border-border/50 bg-muted/20"
                            : "border-primary/30 bg-primary/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{notif.title}</p>
                              {!notif.read && (
                                <Badge className="bg-primary text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notif.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notif.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notif.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notif.id)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteNotification(notif.id)
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Notifications;
