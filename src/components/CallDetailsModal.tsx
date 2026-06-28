import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Clock, Star, Download, Play, Pause, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CallDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screening: any;
  callDetails: any;
}

export function CallDetailsModal({ open, onOpenChange, screening, callDetails }: CallDetailsModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // Implement audio playback logic here
  };

  const handleDownload = () => {
    if (callDetails?.recording_url) {
      window.open(callDetails.recording_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Call Details - {screening?.candidate || 'Unknown Candidate'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcript">Transcript</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="recording">Recording</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Call Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{screening?.duration || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={screening?.status === 'Completed' ? 'default' : 'secondary'}>
                      {screening?.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{callDetails?.telephony_details?.to_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{screening?.date} {screening?.time}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">AI Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Overall Rating:</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{screening?.rating || 'N/A'}/5</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outcome:</span>
                    <Badge variant={callDetails?.extracted_data?.outcome === 'pass' ? 'default' : 'destructive'}>
                      {callDetails?.extracted_data?.outcome || 'Pending'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span>{callDetails?.extracted_data?.confidence || 'N/A'}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {screening?.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{screening.summary}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transcript">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Call Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {callDetails?.transcript ? (
                    <div className="space-y-4">
                      {callDetails.transcript.map((entry: any, index: number) => (
                        <div key={index} className="flex gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                            entry.speaker === 'AI' ? 'bg-blue-500' : 'bg-green-500'
                          )} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {entry.speaker === 'AI' ? 'AI Interviewer' : 'Candidate'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {entry.timestamp}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{entry.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No transcript available
                    </p>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <div className="space-y-4">
              {callDetails?.extracted_data?.skills && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Skills Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(callDetails.extracted_data.skills).map(([skill, score]: [string, any]) => (
                        <div key={skill} className="flex justify-between items-center">
                          <span className="text-sm">{skill}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">{score}/5</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {callDetails?.extracted_data?.key_points && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Key Points</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {callDetails.extracted_data.key_points.map((point: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recording">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Call Recording
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {callDetails?.recording_url ? (
                  <>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePlayPause}
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      <div className="flex-1">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full w-1/3" />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {screening?.duration || '0:00'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="w-full"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Recording
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recording available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}