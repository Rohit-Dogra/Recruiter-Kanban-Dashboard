import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Trash2, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api-client";

interface Booking {
  id: number;
  name: string;
  email: string;
  company: string;
  teamSize: string | null;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const DemoBookings = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterStatus !== "all") params.set("status", filterStatus);
      const { data } = await apiClient.get(`/admin/demo-bookings?${params}`);
      setBookings(data.data.bookings);
      setTotalPages(data.data.pagination.totalPages);
      setTotal(data.data.pagination.total);
    } catch {
      toast({ title: "Failed to fetch bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, [page, filterStatus]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await apiClient.put(`/admin/demo-bookings/${id}`, { status });
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: status as Booking["status"] } : b)));
      toast({ title: "Status updated" });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const deleteBooking = async (id: number) => {
    if (!confirm("Delete this booking?")) return;
    try {
      await apiClient.delete(`/admin/demo-bookings/${id}`);
      setBookings((prev) => prev.filter((b) => b.id !== id));
      setTotal((t) => t - 1);
      toast({ title: "Booking deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6" /> Demo Bookings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total bookings</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchBookings}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No bookings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Team Size</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell>{b.email}</TableCell>
                    <TableCell>{b.company}</TableCell>
                    <TableCell>{b.teamSize || "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{b.date}</div>
                      <div className="text-xs text-muted-foreground">{b.time}</div>
                    </TableCell>
                    <TableCell>
                      <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <Badge className={`${statusColors[b.status]} border-0 text-xs`}>{b.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteBooking(b.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default DemoBookings;
