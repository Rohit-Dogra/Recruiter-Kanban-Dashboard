import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Plan {
  id: number;
  name: string;
  slug: string;
  priceMonthly: string;
  priceYearly: string | null;
  phoneScreeningsLimit: number;
  technicalInterviewsLimit: number;
  membersLimit: number;
  isActive: boolean;
  features: string[] | null;
}

const PlanManagement = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Plan>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => apiClient.get("/admin/plans").then((r) => r.data),
    staleTime: 60_000,
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Record<string, unknown> }) =>
      apiClient.put(`/admin/plans/${id}`, updates).then((r) => r.data),
    onSuccess: () => {
      toast.success("Plan updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update plan"),
  });

  const plans: Plan[] = data?.data ?? [];

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditForm({
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly ?? undefined,
      phoneScreeningsLimit: plan.phoneScreeningsLimit,
      technicalInterviewsLimit: plan.technicalInterviewsLimit,
      membersLimit: plan.membersLimit,
      isActive: plan.isActive,
    });
  };

  const handleSave = (id: number) => {
    updatePlan.mutate({ id, updates: editForm });
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Plan Management</h1>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const isEditing = editingId === plan.id;
            return (
              <Card key={plan.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <Badge variant={plan.isActive ? "default" : "secondary"}>
                    {plan.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Monthly Price</Label>
                          <Input
                            type="number"
                            value={editForm.priceMonthly ?? ""}
                            onChange={(e) => setEditForm({ ...editForm, priceMonthly: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Yearly Price</Label>
                          <Input
                            type="number"
                            value={editForm.priceYearly ?? ""}
                            onChange={(e) => setEditForm({ ...editForm, priceYearly: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Phone Screenings</Label>
                          <Input
                            type="number"
                            value={editForm.phoneScreeningsLimit ?? ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, phoneScreeningsLimit: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Tech Interviews</Label>
                          <Input
                            type="number"
                            value={editForm.technicalInterviewsLimit ?? ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, technicalInterviewsLimit: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Members Limit</Label>
                          <Input
                            type="number"
                            value={editForm.membersLimit ?? ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, membersLimit: parseInt(e.target.value) || 1 })
                            }
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div>
                            <Label className="text-xs">Active</Label>
                            <div className="pt-1">
                              <Switch
                                checked={editForm.isActive ?? true}
                                onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(plan.id)} disabled={updatePlan.isPending}>
                          <Save className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Monthly:</span>{" "}
                          ₹{Number(plan.priceMonthly).toLocaleString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Yearly:</span>{" "}
                          {plan.priceYearly ? `₹${Number(plan.priceYearly).toLocaleString()}` : "—"}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Screenings:</span> {plan.phoneScreeningsLimit}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Interviews:</span> {plan.technicalInterviewsLimit}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Members:</span> {plan.membersLimit}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => startEdit(plan)}>
                        Edit Plan
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlanManagement;
