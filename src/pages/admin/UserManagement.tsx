import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import AdminDetailDialog, { DetailRow } from "./AdminDetailDialog";

const UserManagement = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewId, setViewId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search],
    queryFn: () =>
      apiClient.get("/admin/users", { params: { page, limit: 20, search } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ["admin", "users", viewId],
    queryFn: () => apiClient.get(`/admin/users/${viewId}`).then((r) => r.data),
    enabled: viewId !== null,
  });

  const updateUser = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) =>
      apiClient.put(`/admin/users/${id}`, updates).then((r) => r.data),
    onSuccess: () => {
      toast.success("User updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: () => toast.error("Failed to update user"),
  });

  const users = data?.data?.users ?? [];
  const pagination = data?.data?.pagination;
  const detail = detailData?.data;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pl-9" />
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
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u: any) => {
                  const activeSub = u.subscriptions?.[0];
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-mono text-xs">{u.id}</TableCell>
                      <TableCell>{u.firstName} {u.lastName || ""}</TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.userType === "admin" ? "destructive" : "secondary"}>{u.userType}</Badge>
                      </TableCell>
                      <TableCell>
                        {activeSub ? <Badge variant="outline">{activeSub.plan?.name ?? "Active"}</Badge> : <span className="text-xs text-muted-foreground">None</span>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewId(u.id)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Select value={u.userType} onValueChange={(val) => updateUser.mutate({ id: u.id, updates: { userType: val } })}>
                            <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="company">Company</SelectItem>
                              <SelectItem value="candidate">Candidate</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="banned">Banned</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {users.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Detail Dialog */}
      <AdminDetailDialog open={viewId !== null} onOpenChange={(o) => !o && setViewId(null)} title="User Details" isLoading={detailLoading}>
        {detail && (
          <>
            <DetailRow label="ID" value={detail.id} />
            <DetailRow label="Type" value={<Badge variant={detail.userType === "admin" ? "destructive" : "secondary"}>{detail.userType}</Badge>} />
            <DetailRow label="First Name" value={detail.firstName} />
            <DetailRow label="Last Name" value={detail.lastName} />
            <DetailRow label="Email" value={detail.email} />
            <DetailRow label="Company" value={detail.company} />
            <DetailRow label="Role" value={detail.role} />
            <DetailRow label="Google ID" value={detail.googleId ? "Linked" : "Not linked"} />
            <DetailRow label="Profile Completed" value={detail.profile_completed ? "Yes" : "No"} />
            <DetailRow label="Subscription" value={detail.subscriptions?.[0]?.plan?.name || "None"} />
            <DetailRow label="Joined" value={new Date(detail.createdAt).toLocaleString()} />
            <DetailRow label="Updated" value={new Date(detail.updatedAt).toLocaleString()} />
          </>
        )}
      </AdminDetailDialog>
    </div>
  );
};

export default UserManagement;
