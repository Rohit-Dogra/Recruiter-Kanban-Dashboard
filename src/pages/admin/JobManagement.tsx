import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, ChevronLeft, ChevronRight, Trash2, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
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

const statusColors: Record<string, string> = {
  active: "bg-green-500/15 text-green-600 border-green-500/20",
  draft: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20",
  paused: "bg-blue-500/15 text-blue-600 border-blue-500/20",
  closed: "bg-gray-500/15 text-gray-500 border-gray-500/20",
};

const JobManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "jobs", page, search, statusFilter],
    queryFn: () =>
      apiClient.get("/admin/jobs", { params: { page, limit: 20, search, status: statusFilter } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "jobs", "detail", viewId],
    queryFn: () => apiClient.get(`/admin/jobs/${viewId}`).then((r) => r.data),
    enabled: viewId !== null,
  });

  const updateJob = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) =>
      apiClient.put(`/admin/jobs/${id}`, updates),
    onSuccess: () => { toast.success("Job updated"); queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] }); },
    onError: () => toast.error("Failed to update job"),
  });

  const deleteJob = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/jobs/${id}`),
    onSuccess: () => { toast.success("Job deleted"); queryClient.invalidateQueries({ queryKey: ["admin", "jobs"] }); queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }); },
    onError: () => toast.error("Failed to delete job"),
  });

  const jobs = data?.data?.jobs ?? [];
  const pagination = data?.data?.pagination;
  const detail = detailData?.data;

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Job Management</h1>

      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[250px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search jobs..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
          </div>
          <Button type="submit" size="sm">Search</Button>
        </form>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
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
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Posted By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((j: any) => (
                  <TableRow key={j.id}>
                    <TableCell className="font-mono text-xs">{j.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate font-medium">{j.title}</TableCell>
                    <TableCell className="text-sm">{j.company}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{j.type}</Badge></TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${statusColors[j.status] || ""}`}>{j.status}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{j.companyUser ? `${j.companyUser.firstName} ${j.companyUser.lastName || ""}` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(j.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewId(j.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Select value={j.status} onValueChange={(val) => updateJob.mutate({ id: j.id, updates: { status: val } })}>
                          <SelectTrigger className="w-[90px] h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete job?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{j.title}".</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteJob.mutate(j.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No jobs found</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} ({pagination.total} jobs)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Detail Dialog */}
      <AdminDetailDialog open={viewId !== null} onOpenChange={(o) => !o && setViewId(null)} title="Job Details" isLoading={detailLoading}>
        {detail && (
          <>
            <DetailRow label="ID" value={detail.id} />
            <DetailRow label="Status" value={<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${statusColors[detail.status] || ""}`}>{detail.status}</span>} />
            <div className="col-span-2"><DetailRow label="Title" value={detail.title} /></div>
            <DetailRow label="Company" value={detail.company} />
            <DetailRow label="Location" value={detail.location} />
            <DetailRow label="Type" value={detail.type} />
            <DetailRow label="Experience" value={detail.experience} />
            <DetailRow label="Work Type" value={detail.workType} />
            <DetailRow label="Salary" value={detail.salary} />
            <DetailRow label="Department" value={detail.department} />
            <DetailRow label="Urgency" value={detail.urgency} />
            <DetailRow label="Applications" value={detail.applications?.length ?? 0} />
            <DetailRow label="Posted By" value={detail.companyUser ? `${detail.companyUser.firstName} ${detail.companyUser.lastName || ""} (${detail.companyUser.email})` : "—"} />
            <DetailRow label="Deadline" value={detail.deadline ? new Date(detail.deadline).toLocaleDateString() : "None"} />
            <DetailRow label="Created" value={new Date(detail.createdAt).toLocaleString()} />
            <div className="col-span-2"><DetailRow label="Description" value={<p className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{detail.description}</p>} /></div>
            <div className="col-span-2"><DetailRow label="Requirements" value={<p className="text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">{detail.requirements}</p>} /></div>
            {Array.isArray(detail.skills) && detail.skills.length > 0 && (
              <div className="col-span-2">
                <DetailRow label="Skills" value={<div className="flex flex-wrap gap-1">{detail.skills.map((s: string, i: number) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}</div>} />
              </div>
            )}
          </>
        )}
      </AdminDetailDialog>
    </div>
  );
};

export default JobManagement;
