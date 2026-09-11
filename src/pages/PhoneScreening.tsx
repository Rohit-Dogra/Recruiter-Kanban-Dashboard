import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Calendar, Clock, Star, RefreshCw, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneScreeningDetailsModal } from "@/components/PhoneScreeningDetailsModal";
import phoneScreeningService from "@/services/phone-screening.service";
import { type PhoneScreening, type PhoneScreeningStats } from "@/services/phone-screening.service";
import { useToast } from "@/hooks/use-toast";

export default function PhoneScreening() {
  const [screenings, setScreenings] = useState<PhoneScreening[]>([]);
  const [stats, setStats] = useState<PhoneScreeningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<PhoneScreening | null>(null);
  const [callDetails, setCallDetails] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [screeningsData, statsData] = await Promise.all([
        phoneScreeningService.getScreenings(),
        phoneScreeningService.getStats()
      ]);
      setScreenings(screeningsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching phone screening data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch phone screening data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await phoneScreeningService.syncWithBolna();
      await fetchData();
      toast({
        title: "Success",
        description: "Successfully synced with Bolna API",
      });
    } catch (error) {
      console.error('Error syncing with Bolna:', error);
      toast({
        title: "Error",
        description: "Failed to sync with Bolna API",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleViewReport = async (screening: PhoneScreening) => {
    try {
      const details = await phoneScreeningService.getCallDetails(screening.id);
      setSelectedScreening(screening);
      setCallDetails(details);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error('Error fetching call details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch call details",
        variant: "destructive",
      });
    }
  };

  const handleFetchBolnaData = async () => {
    try {
      setSyncing(true);
      const result = await phoneScreeningService.fetchBolnaData();
      await fetchData();
      toast({
        title: "Success",
        description: `Fetched Bolna data: ${result.processed} processed, ${result.errors} errors`,
      });
    } catch (error) {
      console.error('Error fetching Bolna data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch Bolna data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="AI Phone Screening"
        subtitle="Automated phone interviews and reports"
        action={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", syncing && "animate-spin")} />
              {syncing ? "Syncing..." : "Sync with Bolna"}
            </Button>
            {/* <Button 
              variant="outline" 
              onClick={handleFetchBolnaData}
              disabled={syncing}
            >
              <Phone className="w-4 h-4 mr-2" />
              Fetch Bolna Data
            </Button> */}
          </div>
        }
      />
      
      {/* Schedule New */}
      <Card className="bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-primary/10">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Schedule AI Screening Call
                </h3>
                <p className="text-muted-foreground">
                  Automate initial phone screenings with AI-powered conversations
                </p>
              </div>
            </div>
            <Button variant="hero">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Call
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card
              key={index}
              className="bg-gradient-card border border-border/50 shadow-card animate-pulse"
            >
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : (
          [
            { label: "Total Screenings", value: stats?.totalScreenings.toString() || "0" },
            { label: "This Week", value: stats?.thisWeekScreenings.toString() || "0" },
            { label: "Avg. Duration", value: stats?.avgDuration || "0 min" },
            { label: "Avg. Rating", value: stats?.avgRating || "0.0/5" },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-300"
            >
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Screening List */}
      <Card className="bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Screening Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="py-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/3"></div>
                      <div className="h-3 bg-muted rounded w-1/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : screenings.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Phone className="w-8 h-8 mx-auto mb-2" />
                <p>No phone screenings found</p>
              </div>
            ) : (
              screenings.map((screening, index) => (
                <div
                  key={screening.id}
                  className="py-6 hover:bg-muted/50 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {screening.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {screening.candidate}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {screening.position}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {screening.date}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {screening.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {screening.duration}
                          </div>
                          {screening.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-warning" />
                              {screening.rating}/10
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={screening.status === 'Completed' ? 'default' : 
                                screening.status === 'In Progress' ? 'secondary' : 
                                screening.status === 'Failed' ? 'destructive' : 'outline'}
                      >
                        {screening.status}
                      </Badge>
                      {screening.status === 'Completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReport(screening)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        Reschedule
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <PhoneScreeningDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        screening={selectedScreening}
        details={callDetails}
      />
    </div>
  );
}