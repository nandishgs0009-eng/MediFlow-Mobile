import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Pill, 
  Clock, 
  Bell, 
  BarChart3, 
  Shield, 
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Heart,
  Calendar,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Landing = () => {
  const { user } = useAuth();
  const features = [
    {
      icon: Pill,
      title: "Medication Tracking",
      description: "Never miss a dose with intelligent scheduling and reminders for all your medications."
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Set up complex medication schedules with ease, including multiple daily doses."
    },
    {
      icon: Bell,
      title: "Timely Reminders",
      description: "Get notified at the right time to take your medications, every single time."
    },
    {
      icon: BarChart3,
      title: "Adherence Analytics",
      description: "Track your medication adherence over time with beautiful charts and insights."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is encrypted and protected with enterprise-grade security."
    },
    {
      icon: Smartphone,
      title: "Access Anywhere",
      description: "Manage your medications from any device, anytime, anywhere in the world."
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "50K+", label: "Active Users" },
    { value: "2M+", label: "Doses Tracked" },
    { value: "4.9★", label: "User Rating" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MedTracker</span>
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="hero">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5">
              <Heart className="w-3.5 h-3.5 mr-1.5 text-destructive" />
              Trusted by 50,000+ patients worldwide
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Your Health,{" "}
              <span className="gradient-text">Simplified</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              The smart medication tracker that helps you stay on top of your health. 
              Never miss a dose again with intelligent reminders and beautiful insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative mx-auto max-w-5xl">
              <Card variant="glass" className="p-8 animate-slide-up">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Today's Schedule Preview */}
                  <Card variant="elevated" className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">Today's Schedule</p>
                        <p className="text-sm text-muted-foreground">3 medications</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Vitamin D", time: "8:00 AM", status: "taken" },
                        { name: "Metformin", time: "12:00 PM", status: "pending" },
                        { name: "Aspirin", time: "8:00 PM", status: "pending" }
                      ].map((med, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${med.status === 'taken' ? 'bg-success' : 'bg-warning'}`} />
                            <span className="font-medium text-sm">{med.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{med.time}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Adherence Score */}
                  <Card variant="elevated" className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold">Adherence Score</p>
                        <p className="text-sm text-muted-foreground">This week</p>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <div className="text-5xl font-bold text-success mb-2">94%</div>
                      <p className="text-sm text-muted-foreground">Excellent! Keep it up!</p>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                    <div className="flex justify-between mt-2 gap-1">
                      {[95, 100, 90, 100, 85, 95, 92].map((val, i) => (
                        <div key={i} className="flex-1 bg-secondary rounded-full h-16 relative overflow-hidden">
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-success/70 rounded-full transition-all"
                            style={{ height: `${val}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Quick Actions */}
                  <Card variant="elevated" className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-semibold">Notifications</p>
                        <p className="text-sm text-muted-foreground">2 unread</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                        <p className="text-sm font-medium">Time for Metformin</p>
                        <p className="text-xs text-muted-foreground">Scheduled for 12:00 PM</p>
                      </div>
                      <div className="p-3 rounded-lg bg-secondary/50">
                        <p className="text-sm font-medium">Refill Reminder</p>
                        <p className="text-xs text-muted-foreground">Aspirin - 5 pills left</p>
                      </div>
                    </div>
                    <Button variant="accent" className="w-full mt-4" size="sm">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Taken
                    </Button>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">Everything you need to stay healthy</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make medication management effortless and stress-free.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} variant="interactive" className="p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto">
          <Card variant="glass" className="p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Ready to take control of your health?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of users who trust MedTracker to manage their medications and improve their health outcomes.
              </p>
              <Link to="/signup">
                <Button variant="hero" size="xl">
                  Get Started for Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">MedTracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 MedTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
