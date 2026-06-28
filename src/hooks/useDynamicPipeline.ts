import { useState, useEffect } from 'react';
import pipelineService from '@/services/pipeline.service';
import { FileText, Phone, Video, Users, Award, CheckCircle } from 'lucide-react';

export const useDynamicPipeline = (companyId?: number) => {
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);

  useEffect(() => {
    if (companyId) {
      pipelineService.getCompanyPipeline(companyId).then(stages => {
        const iconMap: Record<string, any> = {
          'FileText': FileText,
          'Phone': Phone,
          'Video': Video,
          'Users': Users,
          'Award': Award,
          'CheckCircle': CheckCircle
        };

        setPipelineStages(stages.map(stage => ({
          id: stage.systemStatus,
          title: stage.title,
          icon: iconMap[stage.icon] || FileText,
          color: stage.color,
          candidates: [],
          actionType: stage.actionType || 'email'
        })));
      });
    }
  }, [companyId]);

  return pipelineStages;
};