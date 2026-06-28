import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import pipelineService from "@/services/pipeline.service";
import { useToast } from "@/hooks/use-toast";

interface PipelineStage {
  name: string;
  systemStatus: string;
  color: string;
  icon: string;
  actionType: string;
}

const PipelineCustomizer = ({ companyId }: { companyId: number }) => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const statusOptions = [
    { value: 'new', label: 'New Application' },
    { value: 'reviewed', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview', label: 'Interview Stage' },
    { value: 'offered', label: 'Offer Stage' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const colorOptions = [
    'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 
    'bg-orange-500', 'bg-green-500', 'bg-emerald-600', 'bg-red-500'
  ];

  const iconOptions = [
    'FileText', 'Phone', 'Video', 'Users', 'Award', 'CheckCircle', 'X'
  ];

  const actionOptions = [
    { value: 'none', label: 'No Action' },
    { value: 'email', label: 'Send Email' },
    { value: 'call', label: 'Make Call' },
    { value: 'interview', label: 'Schedule Interview' }
  ];

  useEffect(() => {
    loadPipeline();
  }, [companyId]);

  const loadPipeline = async () => {
    try {
      const pipeline = await pipelineService.getCompanyPipeline(companyId);
      setStages(pipeline.map((stage: any) => ({
        name: stage.title,
        systemStatus: stage.id,
        color: stage.color,
        icon: stage.icon,
        actionType: stage.actionType
      })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load pipeline", variant: "destructive" });
    }
  };

  const updateStage = (index: number, field: keyof PipelineStage, value: string) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const savePipeline = async () => {
    try {
      setLoading(true);
      await pipelineService.updateCompanyPipeline(companyId, stages);
      toast({ title: "Success", description: "Pipeline updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update pipeline", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Pipeline Stages</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stages.map((stage, index) => (
          <div key={index} className="grid grid-cols-5 gap-2 p-4 border rounded">
            <Input
              placeholder="Stage Name"
              value={stage.name}
              onChange={(e) => updateStage(index, 'name', e.target.value)}
            />
            <Select value={stage.systemStatus} onValueChange={(value) => updateStage(index, 'systemStatus', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stage.color} onValueChange={(value) => updateStage(index, 'color', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map(color => (
                  <SelectItem key={color} value={color}>{color}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stage.icon} onValueChange={(value) => updateStage(index, 'icon', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map(icon => (
                  <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stage.actionType} onValueChange={(value) => updateStage(index, 'actionType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map(action => (
                  <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        <Button onClick={savePipeline} disabled={loading}>
          {loading ? 'Saving...' : 'Save Pipeline'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PipelineCustomizer;