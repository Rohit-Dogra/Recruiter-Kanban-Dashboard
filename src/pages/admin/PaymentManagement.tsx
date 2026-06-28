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

const paymentStatusColors: Record<string, string> = {
  COMPLETED: "bg-green-500/15 text-green-600",
  INITIATED: "bg-yellow-500/15 text-yellow-600",
  FAILED: "bg-red-500/15 text-red-500",
  TIMEOUT: "bg-gray-500/15 text-gray-500",
};

const PaymentManagement = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payments", page, statusFilter],
    queryFn: () =>
      apiClient.get("/admin/payments", { params: { page, limit: 20, status: statusFilter } }).then((r) => r.data),
    staleTime: 30_000,
  });

  const payments = data?.data?.payments ?? [];
  const pagination = data?.data?.pagination;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payments</h1>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="INITIATED">Initiated</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="TIMEOUT">Timeout</SelectItem>
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
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.id}</TableCell>
                    <TableCell className="text-sm">
                      {p.user ? `${p.user.firstName} ${p.user.lastName || ""}` : `#${p.userId}`}
                      <div className="text-xs text-muted-foreground">{p.user?.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.plan?.name || "—"}</Badge></TableCell>
                    <TableCell className="font-medium">₹{Number(p.amount).toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{p.gateway}</TableCell>
                    <TableCell className="text-xs">{p.billingCycle}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${paymentStatusColors[p.status] || ""}`}>
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No payments found</TableCell></TableRow>
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

export default PaymentManagement;
