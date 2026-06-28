import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import pipelineService from "@/services/pipeline.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PipelineStage {
  id: string;
  name: string;
  systemStatus: string;
  color: string;
  icon: string;
  actionType: string;
}

const SortableStage = ({ stage, index, onUpdate, onDelete, stages }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusOptions = [
    { value: 'new', label: 'New Application' },
    { value: 'reviewed', label: 'Under Review' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interview', label: 'Interview Stage' },
    { value: 'offered', label: 'Offer Stage' },
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const colorOptions = ['bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-emerald-600', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'];
  const iconOptions = ['FileText', 'Phone', 'Video', 'Users', 'Award', 'CheckCircle', 'X'];
  const actionOptions = [
    { value: 'none', label: 'No Action' },
    { value: 'email', label: 'Send Email' },
    { value: 'ai_phone', label: 'AI Phone Call' },
    { value: 'ai_video', label: 'AI Video Interview' },
    { value: 'interview', label: 'Schedule Interview' },
    { value: 'offer_letter', label: 'Generate Offer Letter' }
  ];

  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-2 p-4 border rounded-lg bg-white">
      <div className="col-span-1 flex items-center">
        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" {...attributes} {...listeners} />
      </div>
      
      <div className="col-span-3">
        <Input
          placeholder="Stage Name"
          value={stage.name}
          onChange={(e) => onUpdate(index, 'name', e.target.value)}
        />
      </div>
      
      <div className="col-span-2">
        <Input
          placeholder="System Status"
          value={stage.systemStatus}
          onChange={(e) => onUpdate(index, 'systemStatus', e.target.value)}
        />
      </div>
      
      <div className="col-span-2">
        <Select value={stage.color} onValueChange={(value) => onUpdate(index, 'color', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {colorOptions.map(color => (
              <SelectItem key={color} value={color}>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color}`}></div>
                  {color}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-2">
        <Select value={stage.icon} onValueChange={(value) => onUpdate(index, 'icon', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {iconOptions.map(icon => (
              <SelectItem key={icon} value={icon}>{icon}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-2">
        <Select value={stage.actionType} onValueChange={(value) => onUpdate(index, 'actionType', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {actionOptions.map(action => {
              const isOneTimeAction = action.value === 'ai_phone' || action.value === 'ai_video' || action.value === 'offer_letter';
              const isAlreadyUsed = isOneTimeAction && stages.some((s, i) => i !== index && s.actionType === action.value);
              
              return (
                <SelectItem 
                  key={action.value} 
                  value={action.value}
                  disabled={isAlreadyUsed}
                >
                  {action.label} {isAlreadyUsed ? '(Already Used)' : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      <div className="col-span-1 flex items-center justify-center">
        <Button variant="ghost" size="sm" onClick={() => onDelete(index)}>
          <Trash2 className="w-4 h-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
};

const PipelineSettings = () => {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const effectiveCompanyId = user?.invitedByUserId ?? user?.id;
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (effectiveCompanyId) {
      loadPipeline();
    }
  }, [effectiveCompanyId]);

  const loadPipeline = async () => {
    if (!effectiveCompanyId) return;
    try {
      const pipeline = await pipelineService.getCompanyPipeline(effectiveCompanyId);
      setStages(pipeline.map((stage: any, index: number) => ({
        id: String(stage.id ?? `stage-${index}`),
        name: stage.title,
        systemStatus: stage.systemStatus,
        color: stage.color,
        icon: stage.icon,
        actionType: stage.actionType
      })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load pipeline", variant: "destructive" });
    }
  };
 
  const updateStage = (index: number, field: keyof PipelineStage, value: string) => {
    if (validateDuplicateStage(index, field, value)) {
      if (field === 'name') {
        toast({ 
          title: "Duplicate Stage Name", 
          description: "A stage with this name already exists.", 
          variant: "destructive" 
        });
      } else if (field === 'systemStatus') {
        toast({ 
          title: "Duplicate System Status", 
          description: "A stage with this system status already exists.", 
          variant: "destructive" 
        });
      } else if (field === 'actionType') {
        toast({ 
          title: "Action Already Used", 
          description: "This action can only be used once in the pipeline.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Duplicate Stage", 
          description: "A stage with this name and system status combination already exists.", 
          variant: "destructive" 
        });
      }
      return;
    }
    
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const addStage = () => {
    const newStage: PipelineStage = {
      id: `stage-${Date.now()}`,
      name: 'New Stage',
      systemStatus: `custom-${Date.now()}`,
      color: 'bg-blue-500',
      icon: 'FileText',
      actionType: 'email'
    };
    setStages([...stages, newStage]);
  };

  const validateDuplicateStage = (currentIndex: number, field: keyof PipelineStage, value: string) => {
    const currentStage = stages[currentIndex];
    const updatedStage = { ...currentStage, [field]: value };
    
    // Check for duplicate stage names
    if (field === 'name') {
      return stages.some((stage, index) => 
        index !== currentIndex && 
        stage.name.toLowerCase().trim() === value.toLowerCase().trim()
      );
    }
    
    // Check for duplicate system status
    if (field === 'systemStatus') {
      return stages.some((stage, index) => 
        index !== currentIndex && 
        stage.systemStatus.toLowerCase().trim() === value.toLowerCase().trim()
      );
    }
    
    // Check for duplicate combination of name + system status
    const hasDuplicateCombo = stages.some((stage, index) => 
      index !== currentIndex && 
      stage.name.toLowerCase().trim() === updatedStage.name.toLowerCase().trim() &&
      stage.systemStatus.toLowerCase().trim() === updatedStage.systemStatus.toLowerCase().trim()
    );
    
    if (hasDuplicateCombo) {
      return true;
    }
    
    // Check for duplicate one-time actions
    if (field === 'actionType' && (value === 'ai_phone' || value === 'ai_video' || value === 'offer_letter')) {
      return stages.some((stage, index) => 
        index !== currentIndex && 
        stage.actionType === value
      );
    }
    
    return false;
  };

  const deleteStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const savePipeline = async () => {
    try {
      setLoading(true);
      const stageData = stages.map(stage => ({
        name: stage.name,
        systemStatus: stage.systemStatus,
        color: stage.color,
        icon: stage.icon,
        actionType: stage.actionType
      }));
      await pipelineService.updateCompanyPipeline(effectiveCompanyId!, stageData);
      toast({ title: "Success", description: "Pipeline updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update pipeline", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline Settings</h1>
        <p className="text-gray-600">Customize your recruitment pipeline stages</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Stages</CardTitle>
          <div className="grid grid-cols-12 gap-2 text-sm text-gray-500 font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-3">Stage Name</div>
            <div className="col-span-2">System Status</div>
            <div className="col-span-2">Color</div>
            <div className="col-span-2">Icon</div>
            <div className="col-span-2">Action</div>
            <div className="col-span-1"></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
              {stages.map((stage, index) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  index={index}
                  onUpdate={updateStage}
                  onDelete={deleteStage}
                  stages={stages}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <div className="flex justify-between items-center pt-4">
            <Button onClick={addStage} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Stage
            </Button>
            <Button onClick={savePipeline} disabled={loading}>
              {loading ? 'Saving...' : 'Save Pipeline'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map((stage, index) => (
              <div key={stage.id} className="min-w-[200px] p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                  <h3 className="font-medium">{stage.name}</h3>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {stage.systemStatus}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineSettings;