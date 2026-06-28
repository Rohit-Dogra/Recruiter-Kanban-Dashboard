import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, X } from 'lucide-react';
import offerLetterService from '@/services/offer-letter-consolidated.service';
import { useToast } from '@/hooks/use-toast';

interface OfferLetterViewerProps {
  applicationId: number;
  candidateName?: string;
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
  showIcon?: boolean;
}

export const OfferLetterViewer = ({ 
  applicationId,
  candidateName = 'Candidate',
  buttonVariant = 'outline',
  buttonSize = 'sm',
  buttonClassName = '',
  showIcon = true
}: OfferLetterViewerProps) => {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [hasOfferLetter, setHasOfferLetter] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Check if offer letter exists on mount
  useEffect(() => {
    const checkOfferLetterExists = async () => {
      try {
        const response = await offerLetterService.getOfferLetters({
          applicationId,
          limit: 1,
          page: 1
        });
        setHasOfferLetter(response.offerLetters && response.offerLetters.length > 0);
      } catch (error) {
        setHasOfferLetter(false);
      }
    };
    
    checkOfferLetterExists();
  }, [applicationId]);

  const checkAndViewOfferLetter = async () => {
    try {
      setLoading(true);
      
      // Fetch offer letter by applicationId
      const response = await offerLetterService.getOfferLetters({
        applicationId,
        limit: 1,
        page: 1
      });
      
      if (response.offerLetters && response.offerLetters.length > 0) {
        const offerLetter = response.offerLetters[0];
        
        // Get the PDF URL and show in viewer
        const url = await offerLetterService.viewOfferLetterPDF(offerLetter.id);
        setPdfUrl(url);
        setShowPdfViewer(true);
        setHasOfferLetter(true);
      } else {
        // No offer letter found
        setHasOfferLetter(false);
        toast({
          title: 'No Offer Letter',
          description: 'No offer letter has been generated yet.',
          variant: 'default'
        });
      }
    } catch (error: any) {
      console.error('Error viewing offer letter:', error);
      setHasOfferLetter(false);
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

  // Don't render button if no offer letter exists
  if (hasOfferLetter === false) {
    return null;
  }

  return (
    <>
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={checkAndViewOfferLetter}
        disabled={loading}
        className={buttonClassName}
      >
        {showIcon && <Eye className="w-4 h-4 mr-2" />}
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
