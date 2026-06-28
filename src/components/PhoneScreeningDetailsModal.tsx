import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, Clock, Phone, PlayCircle, FileText, User, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneScreeningDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screening: any;
  details: any;
}

export function PhoneScreeningDetailsModal({ 
  open, 
  onOpenChange, 
  screening, 
  details 
}: PhoneScreeningDetailsModalProps) {
  if (!screening || !details) return null;

  const getRatingColor = (rating: string) => {
    const num = parseInt(rating?.split('/')[0] || '0');
    if (num >= 8) return "text-green-600";
    if (num >= 6) return "text-yellow-600";
    if (num >= 4) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50";
    if (score >= 6) return "text-yellow-600 bg-yellow-50";
    if (score >= 4) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            Phone Screening Details - {details.candidateName || screening.candidate}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Overall Score</span>
                  </div>
                  <div className={cn("text-2xl font-bold", getScoreColor(details.overallScore || 0))}>
                    {details.overallScore || 'N/A'}/10
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Duration</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {details.conversationDuration ? `${Math.round(details.conversationDuration / 60)} min` : 'N/A'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Call Status</span>
                  </div>
                  <Badge variant={details.callStatus === 'completed' ? 'default' : 'secondary'}>
                    {details.callStatus || 'Unknown'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Call Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Candidate Number:</span>
                    <p className="font-medium">{details.userNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Agent Number:</span>
                    <p className="font-medium">{details.agentNumber || 'N/A'}</p>
                  </div>
                  {/* <div>
                    <span className="text-sm text-muted-foreground">Total Cost:</span>
                    <p className="font-medium">${details.totalCost || 'N/A'}</p>
                  </div> */}
                  {/* <div>
                    <span className="text-sm text-muted-foreground">Recording:</span>
                    {details.recordingUrl ? (
                      <Button variant="outline" size="sm" className="mt-1">
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Play Recording
                      </Button>
                    ) : (
                      <p className="text-muted-foreground">Not available</p>
                    )}
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evaluation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Final Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{details.finalEvaluation || 'No evaluation available'}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Technical Qualification', text: details.technicalQualification, rating: details.technicalQualificationRating },
                { label: 'Clarity & Communication', text: details.clarity, rating: details.clarityRating },
                { label: 'Technical Understanding', text: details.technicalUnderstanding, rating: details.technicalUnderstandingRating },
                { label: 'CV Consistency', text: details.consistencyWithCv, rating: details.consistencyWithCvRating },
                { label: 'Handling Edge Cases', text: details.handlingEdgeCases, rating: details.handlingEdgeCasesRating }
              ].map((item, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      {item.label}
                      {item.rating && (
                        <Badge variant="outline" className={getRatingColor(item.rating)}>
                          {item.rating}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {item.text || 'No information available'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="transcript" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Call Transcript
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm">
                    {details.transcript || 'No transcript available'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Technical Assessment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Technical Qualification:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getRatingColor(details.technicalQualificationRating)}>
                          {details.technicalQualificationRating || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Technical Understanding:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getRatingColor(details.technicalUnderstandingRating)}>
                          {details.technicalUnderstandingRating || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Technical Qualification Details:</h4>
                      <p className="text-sm text-muted-foreground">
                        {details.technicalQualification || 'No details available'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Technical Understanding Details:</h4>
                      <p className="text-sm text-muted-foreground">
                        {details.technicalUnderstanding || 'No details available'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}