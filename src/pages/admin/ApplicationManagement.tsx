import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminDetailDialog, { DetailRow } from "./AdminDetailDialog";

const ApplicationManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "applications", page, statusFilter],
    queryFn: () =>
      apiClient.get("/admin/applications", { params: { page, limit: 20, status: statusFilter } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "applications", "detail", viewId],
    queryFn: () => apiClient.get(`/admin/applications/${viewId}`).then((r) => r.data),
    enabled: viewId !== null,
  });

  const deleteApp = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/applications/${id}`),
    onSuccess: () => { toast.success("Application deleted"); queryClient.invalidateQueries({ queryKey: ["admin", "applications"] }); queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }); },
    onError: () => toast.error("Failed to delete application"),
  });

  const applications = data?.data?.applications ?? [];
  const pagination = data?.data?.pagination;
  const detail = detailData?.data;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Applications</h1>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
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
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>AI Score</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="text-sm">{a.candidate ? `${a.candidate.firstName} ${a.candidate.lastName || ""}` : `User #${a.candidateId}`}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">{a.job?.title || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.job?.company || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{a.status}</Badge></TableCell>
                    <TableCell className="text-sm">{a.aiScore != null ? Number(a.aiScore).toFixed(1) : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewId(a.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete application?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this application.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteApp.mutate(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {applications.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No applications found</TableCell></TableRow>)}
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

      {/* View Detail Dialog */}
      <AdminDetailDialog open={viewId !== null} onOpenChange={(o) => !o && setViewId(null)} title="Application Details" isLoading={detailLoading}>
        {detail && (
          <>
            <DetailRow label="ID" value={detail.id} />
            <DetailRow label="Status" value={<Badge variant="outline">{detail.status}</Badge>} />
            <DetailRow label="Candidate" value={detail.candidate ? `${detail.candidate.firstName} ${detail.candidate.lastName || ""}` : "—"} />
            <DetailRow label="Candidate Email" value={detail.candidate?.email} />
            <DetailRow label="Job Title" value={detail.job?.title} />
            <DetailRow label="Company" value={detail.job?.company} />
            <DetailRow label="Job Type" value={detail.job?.type} />
            <DetailRow label="Location" value={detail.job?.location} />
            <DetailRow label="Stage" value={detail.stage} />
            <DetailRow label="AI Score" value={detail.aiScore != null ? Number(detail.aiScore).toFixed(1) : "—"} />
            <DetailRow label="Resume Match" value={detail.resumeMatch != null ? `${Number(detail.resumeMatch).toFixed(1)}%` : "—"} />
            <DetailRow label="ATS Status" value={detail.atsStatus} />
            <DetailRow label="Applied" value={new Date(detail.appliedDate || detail.createdAt).toLocaleString()} />
            <DetailRow label="Reviewed" value={detail.reviewedDate ? new Date(detail.reviewedDate).toLocaleString() : "Not yet"} />
            {detail.resumeUrl && (
              <div className="col-span-2">
                <DetailRow label="Resume" value={<button onClick={async () => {
                  try {
                    const res = await apiClient.get(`/upload/resume/${detail.resumeUrl}`);
                    if (res.data?.url) window.open(res.data.url, "_blank");
                  } catch {
                    toast.error("Failed to load resume");
                  }
                }} className="text-primary hover:underline text-sm cursor-pointer">View Resume</button>} />
              </div>
            )}
            {detail.coverLetter && (
              <div className="col-span-2"><DetailRow label="Cover Letter" value={<p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{detail.coverLetter}</p>} /></div>
            )}
            {detail.aiNotes && (
              <div className="col-span-2"><DetailRow label="AI Notes" value={<p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{detail.aiNotes}</p>} /></div>
            )}
            {detail.notes && (
              <div className="col-span-2"><DetailRow label="Notes" value={<p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{detail.notes}</p>} /></div>
            )}
            {detail.answers?.length > 0 && (
              <div className="col-span-2">
                <DetailRow label="Screening Answers" value={
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detail.answers.map((ans: any, i: number) => (
                      <div key={i} className="text-sm">
                        <p className="font-medium text-xs text-muted-foreground">{ans.question}</p>
                        <p>{ans.answer}</p>
                      </div>
                    ))}
                  </div>
                } />
              </div>
            )}
          </>
        )}
      </AdminDetailDialog>
    </div>
  );
};

export default ApplicationManagement;
