import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, Briefcase, Calendar, Clock } from "lucide-react";
import CandidateLayout from "@/layouts/CandidateLayout";
import candidateAuthService from "@/services/candidate-auth.service";
import { notificationService, Notification } from "@/services/notification.service";
import { useToast } from "@/hooks/use-toast";

const CandidateNotifications = () => {
  const [candidate, setCandidate] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const candidateData = candidateAuthService.getCurrentCandidate();
    setCandidate(candidateData);
    
    if (candidateData?.email) {
      fetchNotifications(candidateData.email);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async (email: string) => {
    try {
      setLoading(true);
      const data = await notificationService.getCandidateNotifications(email);
      setNotifications(data);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markCandidateAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'candidate': return <Briefcase className="w-5 h-5" />;
      case 'interview': return <Calendar className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getTagColor = (tag?: string) => {
    if (!tag) return 'bg-muted text-muted-foreground';
    
    const lowerTag = tag.toLowerCase();
    if (lowerTag.includes('applied')) return 'bg-info/15 text-info';
    if (lowerTag.includes('review') || lowerTag.includes('shortlist')) return 'bg-warning/15 text-warning';
    if (lowerTag.includes('interview')) return 'bg-primary/15 text-primary';
    if (lowerTag.includes('offer')) return 'bg-success/15 text-success';
    if (lowerTag.includes('reject')) return 'bg-destructive/15 text-destructive';
    return 'bg-muted text-muted-foreground';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <CandidateLayout hideFooter>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading notifications...</p>
        </div>
      </CandidateLayout>
    );
  }

  return (
    <CandidateLayout hideFooter>
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                Notifications
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All Notifications</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {unreadCount} New
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">We'll notify you when there are updates on your applications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-all ${
                      notification.read 
                        ? 'bg-card hover:bg-muted/50' 
                        : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        notification.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-foreground">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            
                            {notification.job && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <span className="font-medium">Job:</span> {notification.job.title}
                                {notification.job.company && ` at ${notification.job.company}`}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-3 mt-2">
                              {notification.tag && (
                                <Badge className={getTagColor(notification.tag)}>
                                  {notification.tag}
                                </Badge>
                              )}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                          
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-primary hover:text-primary/80 hover:bg-primary/5"
                            >
                              <CheckCheck className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CandidateLayout>
  );
};

export default CandidateNotifications;
