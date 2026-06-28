import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/15 text-blue-600",
  completed: "bg-green-500/15 text-green-600",
  cancelled: "bg-gray-500/15 text-gray-500",
  "no-show": "bg-red-500/15 text-red-500",
};

const InterviewManagement = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "interviews", page, statusFilter],
    queryFn: () =>
      apiClient.get("/admin/interviews", { params: { page, limit: 20, status: statusFilter } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const interviews = data?.data?.interviews ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Interviews</h1>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviews.map((iv: any) => {
                  const app = iv.application;
                  const candidate = app?.candidate;
                  const job = app?.job;
                  return (
                    <TableRow key={iv.id}>
                      <TableCell className="font-mono text-xs">{iv.id}</TableCell>
                      <TableCell className="text-sm">
                        {candidate ? `${candidate.firstName} ${candidate.lastName || ""}` : "—"}
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm">{job?.title || "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{iv.type}</Badge></TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[iv.status] || ""}`}>
                          {iv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{new Date(iv.scheduledDate).toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{iv.duration}min</TableCell>
                      <TableCell className="text-sm">{iv.rating != null ? Number(iv.rating).toFixed(1) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
                {interviews.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No interviews found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InterviewManagement;
