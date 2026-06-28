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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AdminDetailDialog, { DetailRow } from "./AdminDetailDialog";

const CompanyManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "companies", page, search],
    queryFn: () =>
      apiClient.get("/admin/companies", { params: { page, limit: 20, search } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "companies", "detail", viewId],
    queryFn: () => apiClient.get(`/admin/companies/${viewId}`).then((r) => r.data),
    enabled: viewId !== null,
  });

  const deleteCompany = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/admin/companies/${id}`),
    onSuccess: () => { toast.success("Company deleted"); queryClient.invalidateQueries({ queryKey: ["admin", "companies"] }); },
    onError: () => toast.error("Failed to delete company"),
  });

  const companies = data?.data?.companies ?? [];
  const pagination = data?.data?.pagination;
  const detail = detailData?.data;

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Companies</h1>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or industry..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          <div className="border rounded-lg overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.industry}</Badge></TableCell>
                    <TableCell className="text-sm">{c.size}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.location}</TableCell>
                    <TableCell className="text-xs">
                      {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]">{c.website}</a> : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewId(c.id)}><Eye className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Delete company?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{c.name}".</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteCompany.mutate(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {companies.length === 0 && (<TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No companies found</TableCell></TableRow>)}
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
      <AdminDetailDialog open={viewId !== null} onOpenChange={(o) => !o && setViewId(null)} title="Company Details" isLoading={detailLoading}>
        {detail && (
          <>
            <DetailRow label="ID" value={detail.id} />
            <DetailRow label="Owner ID" value={detail.company_id} />
            <DetailRow label="Name" value={detail.name} />
            <DetailRow label="Industry" value={detail.industry} />
            <DetailRow label="Size" value={detail.size} />
            <DetailRow label="Location" value={detail.location} />
            <DetailRow label="Website" value={detail.website ? <a href={detail.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{detail.website}</a> : "—"} />
            <DetailRow label="Founded" value={detail.founded} />
            <DetailRow label="Created" value={new Date(detail.createdAt).toLocaleString()} />
            <DetailRow label="Updated" value={new Date(detail.updatedAt).toLocaleString()} />
            {detail.description && (
              <div className="col-span-2"><DetailRow label="Description" value={<p className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">{detail.description}</p>} /></div>
            )}
            {detail.mission && (
              <div className="col-span-2"><DetailRow label="Mission" value={<p className="text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">{detail.mission}</p>} /></div>
            )}
            {detail.values && (
              <div className="col-span-2"><DetailRow label="Values" value={<p className="text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">{detail.values}</p>} /></div>
            )}
            {detail.culture && (
              <div className="col-span-2"><DetailRow label="Culture" value={<p className="text-sm whitespace-pre-wrap max-h-24 overflow-y-auto">{detail.culture}</p>} /></div>
            )}
          </>
        )}
      </AdminDetailDialog>
    </div>
  );
};

export default CompanyManagement;
