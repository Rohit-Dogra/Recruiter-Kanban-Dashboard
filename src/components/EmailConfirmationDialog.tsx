import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, X } from "lucide-react";

interface EmailConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  fromStage: string;
  toStage: string;
  onConfirm: (sendEmail: boolean, emailContent?: string) => void;
}

const getEmailTemplate = (candidateName: string, fromStage: string, toStage: string) => {
  const templates: Record<string, string> = {
    reviewed: `Dear ${candidateName},

Thank you for your application. We have reviewed your profile and would like to schedule a phone screening call.

We will contact you within the next 2 business days to arrange a convenient time.

Best regards,
Hiring Team`,
    
    shortlisted: `Dear ${candidateName},

Congratulations! You have successfully passed our initial screening and we would like to invite you for a technical interview.

Please reply to this email with your availability for the next week.

Best regards,
Hiring Team`,
    
    interview: `Dear ${candidateName},

Thank you for the technical interview. We are pleased to inform you that you have been selected for the final review stage.

Our team will be in touch with you shortly regarding the next steps.

Best regards,
Hiring Team`,
    
    offered: `Dear ${candidateName},

We are excited to extend you an offer to join our team! 

Please find the detailed offer letter attached. We look forward to your response.

Best regards,
Hiring Team`,
    
    hired: `Dear ${candidateName},

Welcome to the team! We are thrilled to have you on board.

Please check your email for onboarding instructions and next steps.

Best regards,
Hiring Team`
  };

  return templates[toStage] || `Dear ${candidateName},

Your application status has been updated to: ${toStage}.

Best regards,
Hiring Team`;
};

export const EmailConfirmationDialog = ({
  open,
  onOpenChange,
  candidateName,
  fromStage,
  toStage,
  onConfirm
}: EmailConfirmationDialogProps) => {
  const [emailContent, setEmailContent] = useState(() => 
    getEmailTemplate(candidateName, fromStage, toStage)
  );

  const handleSendEmail = () => {
    onConfirm(true, emailContent);
    onOpenChange(false);
  };

  const handleSkipEmail = () => {
    onConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Email Notification?
          </DialogTitle>
          <DialogDescription>
            {candidateName} has been moved from "{fromStage}" to "{toStage}". 
            Would you like to send them an email notification?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-content">Email Content</Label>
            <Textarea
              id="email-content"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={8}
              className="mt-2"
              placeholder="Enter email content..."
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleSkipEmail}>
            <X className="w-4 h-4 mr-2" />
            Skip Email
          </Button>
          <Button onClick={handleSendEmail}>
            <Send className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};