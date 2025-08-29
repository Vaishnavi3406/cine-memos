import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import UploadBox from "@/components/UploadBox";
import MinutesEditor from "@/components/MinutesEditor";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'editing'>('upload');
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [meetingData, setMeetingData] = useState<any>(null);
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleTranscriptReady = async (transcriptText: string, title: string) => {
    setTranscript(transcriptText);
    setMeetingTitle(title);
    setCurrentStep('processing');

    try {
      // Generate meeting minutes using AI
      const { data, error } = await supabase.functions.invoke('generate-minutes', {
        body: {
          transcript: transcriptText,
          title: title
        }
      });

      if (error) {
        console.error('Error generating minutes:', error);
        toast({
          title: "Processing failed",
          description: "There was an error generating the meeting minutes. Please try again.",
          variant: "destructive"
        });
        setCurrentStep('upload');
        return;
      }

      console.log('Generated minutes:', data);

      // Save to database (user is guaranteed to be logged in at this point)
      if (user) {
        const { data: savedMeeting, error: saveError } = await supabase
          .from('meetings')
          .insert({
            owner: user.id,
            title: title,
            transcript: transcriptText,
            minutes_html: data.minutes_html,
            minutes_json: data.minutes_json,
            minutes_table: data.minutes_table,
            participants: data.minutes_json?.participants || [],
            ai_meta: {
              model: 'openrouter',
              processed_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (saveError) {
          console.error('Error saving meeting:', saveError);
          toast({
            title: "Warning",
            description: "Minutes generated but couldn't save to database. You can still export your minutes.",
            variant: "destructive",
          });
        } else {
          console.log('Meeting saved:', savedMeeting);
          setMeetingData(savedMeeting);
        }
      }

      setMeetingData({
        title,
        transcript: transcriptText,
        minutes_html: data.minutes_html,
        minutes_json: data.minutes_json,
        minutes_table: data.minutes_table
      });

      setCurrentStep('editing');

      toast({
        title: "Minutes generated!",
        description: "Your meeting minutes have been successfully generated and are ready for review."
      });

    } catch (error) {
      console.error('Error processing transcript:', error);
      toast({
        title: "Processing failed",
        description: "There was an error generating the meeting minutes. Please try again.",
        variant: "destructive"
      });
      setCurrentStep('upload');
    }
  };

  const handleStartOver = () => {
    setCurrentStep('upload');
    setTranscript('');
    setMeetingTitle('');
    setMeetingData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background film-grain flex items-center justify-center">
        <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-background film-grain">
      <Navbar />
      
      {currentStep === 'upload' && (
        <>
          <Hero />
          <UploadBox onTranscriptReady={handleTranscriptReady} />
        </>
      )}

      {currentStep === 'processing' && (
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="glow-box bg-card/80 backdrop-blur-sm border-glow rounded-lg p-12">
              <div className="animate-spin w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-6"></div>
              <h2 className="text-2xl font-poppins font-bold gradient-text mb-4">
                Generating Meeting Minutes
              </h2>
              <p className="text-muted-foreground">
                Our AI is analyzing your transcript and creating structured meeting minutes...
              </p>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'editing' && meetingData && (
        <MinutesEditor 
          meetingData={meetingData}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  );
};

export default Index;