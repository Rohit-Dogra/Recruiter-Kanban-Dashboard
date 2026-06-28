import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/KanbanBoard";
import DashboardHeader from "@/components/DashboardHeader";
import { Users, Clock, TrendingUp, Filter, Download } from "lucide-react";
import applicationService from "@/services/application.service";
import { useToast } from "@/hooks/use-toast";

import { useDynamicPipeline } from "@/hooks/useDynamicPipeline";
import { useAuth } from "@/contexts/AuthContext";

const Pipeline = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const effectiveCompanyId = user?.invitedByUserId ?? user?.id;
  const dynamicStages = useDynamicPipeline(effectiveCompanyId);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getAllApplications();
      setApplications(response.applications || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.response?.data?.message || "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real application data
  const totalApplications = applications.length;
  const reviewedApplications = applications.filter(app => app.status === 'reviewed').length;
  const interviewApplications = applications.filter(app => app.status === 'interview').length;
  const offeredApplications = applications.filter(app => app.status === 'offered').length;

  const pipelineStats = [
    {
      title: "Total Candidates",
      value: totalApplications.toString(),
      change: "+12%",
      changeType: "positive" as const,
      icon: Users
    },
    {
      title: "Reviewed",
      value: reviewedApplications.toString(),
      change: "-2 days",
      changeType: "positive" as const,
      icon: Clock
    },
    {
      title: "In Interview",
      value: interviewApplications.toString(),
      change: "+5.2%",
      changeType: "positive" as const,
      icon: TrendingUp
    },
    {
      title: "Offers Extended",
      value: offeredApplications.toString(),
      change: "+8",
      changeType: "positive" as const,
      icon: Filter
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader 
        title="Recruitment Pipeline" 
        subtitle="Drag and drop candidates through your hiring process"
        action={
          <div className="flex space-x-2">
            {/* <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button> */}
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        }
      />
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {pipelineStats.map((stat) => {
          const IconComponent = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <IconComponent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Badge 
                    variant={stat.changeType === 'positive' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {stat.change}
                  </Badge>
                  <span>from last month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pipeline Kanban Board</CardTitle>
              <CardDescription>
                Drag candidates between stages to update their status
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p>Loading pipeline...</p>
            </div>
          ) : (
            <KanbanBoard 
              applications={applications} 
              onRefresh={fetchApplications}
              customStages={dynamicStages.length > 0 ? dynamicStages : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Pipeline;
