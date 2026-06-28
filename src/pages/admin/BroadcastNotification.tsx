import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const BroadcastNotification = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetUserType, setTargetUserType] = useState("all");
  const [notifType, setNotifType] = useState("system");

  const broadcast = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      apiClient.post("/admin/notifications/broadcast", payload).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(data.message || "Broadcast sent");
      setTitle("");
      setMessage("");
    },
    onError: () => toast.error("Failed to send broadcast"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message are required");
      return;
    }
    const payload: Record<string, string> = { title: title.trim(), message: message.trim(), type: notifType };
    if (targetUserType !== "all") payload.userType = targetUserType;
    broadcast.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Broadcast Notification</h1>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Send System Notification</CardTitle>
          <CardDescription>Send a notification to all users or a specific user type.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select value={targetUserType} onValueChange={setTargetUserType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="company">Companies Only</SelectItem>
                    <SelectItem value="candidate">Candidates Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notification Type</Label>
                <Select value={notifType} onValueChange={setNotifType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..." maxLength={200} />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." rows={4} maxLength={1000} />
              <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
            </div>

            <Button type="submit" disabled={broadcast.isPending} className="w-full">
              {broadcast.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Send Broadcast
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BroadcastNotification;
