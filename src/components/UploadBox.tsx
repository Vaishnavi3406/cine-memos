import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileText, File, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadBoxProps {
  onTranscriptReady: (transcript: string, title: string) => void;
}

const UploadBox = ({ onTranscriptReady }: UploadBoxProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pastedText, setPastedText] = useState("");
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setStatus('uploading');
    setProgress(10);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transcripts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setProgress(40);
      setStatus('processing');

      // If it's a PDF, use the PDF extraction edge function
      if (file.type === 'application/pdf') {
        const { data, error } = await supabase.functions.invoke('extract-pdf', {
          body: { path: uploadData.path }
        });

        if (error) throw error;
        
        setProgress(80);
        onTranscriptReady(data.text, file.name.replace(/\.[^/.]+$/, ""));
      } else {
        // For text files, read directly
        const text = await file.text();
        setProgress(80);
        onTranscriptReady(text, file.name.replace(/\.[^/.]+$/, ""));
      }

      setProgress(100);
      setStatus('success');
      toast({
        title: "Upload successful!",
        description: "Your transcript has been processed and is ready for AI analysis."
      });

    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setStatus('idle');
      }, 2000);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handlePastedText = () => {
    if (pastedText.trim()) {
      const title = `Meeting ${new Date().toLocaleDateString()}`;
      onTranscriptReady(pastedText.trim(), title);
      setPastedText("");
      toast({
        title: "Text processed!",
        description: "Your pasted transcript is ready for AI analysis."
      });
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-destructive" />;
      default:
        return <Upload className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing with AI...';
      case 'success':
        return 'Successfully processed!';
      case 'error':
        return 'Processing failed';
      default:
        return 'Upload your meeting transcript';
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-poppins font-bold gradient-text mb-4">
              Upload Your Meeting Transcript
            </h2>
            <p className="text-muted-foreground text-lg">
              Support for TXT, PDF, DOCX files or paste text directly
            </p>
          </div>

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-card/50 border-glow">
              <TabsTrigger value="upload" className="film-button">
                <Upload className="w-4 h-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="paste" className="film-button">
                <FileText className="w-4 h-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                <CardContent className="p-8">
                  <div
                    {...getRootProps()}
                    className={`
                      border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300
                      ${isDragActive 
                        ? 'border-primary bg-primary/10 scale-105' 
                        : 'border-glow hover:border-primary/50 hover:bg-muted/20'
                      }
                      ${isProcessing ? 'pointer-events-none opacity-60' : ''}
                    `}
                  >
                    <input {...getInputProps()} />
                    
                    <div className="mb-4">
                      {getStatusIcon()}
                    </div>

                    <h3 className="text-xl font-semibold mb-2">
                      {getStatusText()}
                    </h3>

                    {!isProcessing && (
                      <p className="text-muted-foreground mb-4">
                        {isDragActive
                          ? "Drop your file here..."
                          : "Drag & drop your transcript file here, or click to browse"
                        }
                      </p>
                    )}

                    <div className="flex justify-center gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <File className="w-4 h-4" />
                        TXT
                      </span>
                      <span className="flex items-center gap-1">
                        <File className="w-4 h-4" />
                        PDF
                      </span>
                      <span className="flex items-center gap-1">
                        <File className="w-4 h-4" />
                        DOCX
                      </span>
                    </div>

                    {isProcessing && (
                      <div className="mt-6">
                        <Progress value={progress} className="w-full" />
                        <p className="text-sm text-muted-foreground mt-2">
                          {progress}% complete
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paste">
              <Card className="glow-box bg-card/80 backdrop-blur-sm border-glow">
                <CardContent className="p-6">
                  <Textarea
                    placeholder="Paste your meeting transcript here..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className="min-h-[300px] bg-background/50 border-glow resize-none"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-muted-foreground">
                      {pastedText.length} characters
                    </p>
                    <Button 
                      onClick={handlePastedText}
                      disabled={!pastedText.trim()}
                      className="glow-box film-button"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Process Text
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default UploadBox;