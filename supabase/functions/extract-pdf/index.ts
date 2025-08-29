import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { path } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download the PDF file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('transcripts')
      .download(path);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error('Failed to download file');
    }

    // Convert the file to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // For now, we'll return a mock response since pdf-parse requires Node.js
    // In a real implementation, you'd use a PDF parsing library compatible with Deno
    const mockText = `
Meeting Transcript - Extracted from PDF

This is a sample extracted text from the PDF file. 
In a production environment, this would contain the actual text extracted from the PDF using a proper PDF parsing library.

The PDF processing functionality would extract:
- All text content from the PDF
- Preserve basic formatting
- Handle multi-page documents
- Extract metadata like creation date, author, etc.

Sample meeting content:
John: Let's finalize the launch date for the mobile app. I suggest September 15.
Priya: Agreed, but QA needs 2 more weeks. Let's push it to September 30.
John: Okay, final decision — Launch date September 30. Priya, please update the project plan.
Ravi: I will prepare the marketing material by September 20.
    `;

    return new Response(
      JSON.stringify({ 
        text: mockText,
        meta: {
          pages: 1,
          size: uint8Array.length,
          processed_at: new Date().toISOString()
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in extract-pdf function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});