import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, X } from 'lucide-react';
import offerLetterService from '@/services/offer-letter-consolidated.service';
import { useToast } from '@/hooks/use-toast';

interface OfferLetterActionsProps {
  candidateId: string;
  candidateName: string;
  applicationId?: number;
  onComplete?: () => void;
}

interface OfferLetterInfo {
  id: string;
  status: string;
  pdfUrl?: string;
  s3Uploaded: boolean;
  generatedAt: string;
  sentAt?: string;
  trackingToken: string;
}

export const OfferLetterActions = ({ 
  candidateId, 
  candidateName, 
  applicationId,
  onComplete 
}: OfferLetterActionsProps) => {
  const [offerLetterInfo, setOfferLetterInfo] = useState<OfferLetterInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const { toast } = useToast();

  const checkExistingOfferLetter = async () => {
    try {
      setLoading(true);
      
      // Get offer letters for this candidate/application
      // candidateId might actually be applicationId from KanbanBoard
      const response = await offerLetterService.getOfferLetters({
        candidateId,
        applicationId,
        limit: 1,
        page: 1
      });
      
      if (response.offerLetters && response.offerLetters.length > 0) {
        const offerLetter = response.offerLetters[0];
        setOfferLetterInfo({
          id: offerLetter.id,
          status: offerLetter.status,
          pdfUrl: offerLetter.s3Url || offerLetter.pdfUrl,
          s3Uploaded: offerLetter.s3Uploaded,
          generatedAt: offerLetter.generatedAt || offerLetter.createdAt,
          sentAt: offerLetter.sentAt,
          trackingToken: offerLetter.trackingToken
        });
        
        // Get the PDF URL and show in viewer
        const url = await offerLetterService.viewOfferLetterPDF(offerLetter.id);
        setPdfUrl(url);
        setShowPdfViewer(true);
      } else {
        // No existing offer letter found
        toast({
          title: 'No Offer Letter',
          description: 'No offer letter has been generated for this candidate yet.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error checking offer letter:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to view offer letter',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const closePdfViewer = () => {
    setShowPdfViewer(false);
    setPdfUrl(null);
  };


  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={checkExistingOfferLetter}
        disabled={loading}
        className="w-full"
      >
        <Eye className="w-4 h-4 mr-2" />
        {loading ? 'Loading...' : 'View Offer Letter'}
      </Button>

      {/* PDF Viewer Dialog */}
      <Dialog open={showPdfViewer} onOpenChange={setShowPdfViewer}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle>Offer Letter - {candidateName}</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={closePdfViewer}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full h-full" style={{ height: 'calc(95vh - 80px)' }}>
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title="Offer Letter PDF"
                style={{ minHeight: '600px' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};