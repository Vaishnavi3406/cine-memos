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
    const { transcript, title } = await req.json();
    
    const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    console.log('Processing transcript with OpenRouter API...');

    // Call OpenRouter API for AI processing
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://zapnote.lovable.app',
        'X-Title': 'ZapNote - Meeting Minutes Generator'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert meeting minutes generator. Create structured, professional meeting minutes from the provided transcript. 

IMPORTANT: Return your response as a JSON object with this exact structure:
{
  "title": "Meeting Title",
  "date": "Meeting Date",
  "participants": ["Name1", "Name2", "Name3"],
  "agenda_summary": "Brief summary of the meeting agenda",
  "discussion_points": [
    {
      "topic": "Topic name",
      "details": "Discussion details"
    }
  ],
  "decisions": [
    {
      "decision": "Decision made",
      "responsible": "Person responsible"
    }
  ],
  "action_items": [
    {
      "task": "Task description",
      "owner": "Person responsible",
      "deadline": "Deadline if mentioned"
    }
  ],
  "html_output": "Full HTML formatted minutes for display"
}

Make sure to extract all participant names, identify key decisions with responsible parties, and create actionable items with clear ownership.`
          },
          {
            role: 'user',
            content: `Please generate meeting minutes for this transcript:

Title: ${title}

Transcript:
${transcript}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', errorData);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    console.log('Generated content:', generatedContent);

    // Parse the JSON response
    let parsedMinutes;
    try {
      parsedMinutes = JSON.parse(generatedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create structured output from the raw text
      parsedMinutes = {
        title: title,
        date: new Date().toLocaleDateString(),
        participants: ["Extracted from transcript"],
        agenda_summary: "AI-generated meeting summary",
        discussion_points: [
          {
            topic: "Meeting Discussion",
            details: generatedContent
          }
        ],
        decisions: [],
        action_items: [],
        html_output: `<div class="meeting-minutes">
          <h1>${title}</h1>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <div class="content">${generatedContent.replace(/\n/g, '<br>')}</div>
        </div>`
      };
    }

    // Ensure HTML output exists
    if (!parsedMinutes.html_output) {
      parsedMinutes.html_output = `
        <div class="meeting-minutes">
          <h1>${parsedMinutes.title}</h1>
          <p><strong>Date:</strong> ${parsedMinutes.date}</p>
          <p><strong>Participants:</strong> ${parsedMinutes.participants.join(', ')}</p>
          
          <h2>Agenda Summary</h2>
          <p>${parsedMinutes.agenda_summary}</p>
          
          <h2>Discussion Points</h2>
          ${parsedMinutes.discussion_points.map(point => `
            <div class="discussion-point">
              <h3>${point.topic}</h3>
              <p>${point.details}</p>
            </div>
          `).join('')}
          
          <h2>Decisions Made</h2>
          ${parsedMinutes.decisions.map(decision => `
            <div class="decision">
              <p><strong>Decision:</strong> ${decision.decision}</p>
              <p><strong>Responsible:</strong> ${decision.responsible}</p>
            </div>
          `).join('')}
          
          <h2>Action Items</h2>
          ${parsedMinutes.action_items.map(item => `
            <div class="action-item">
              <p><strong>Task:</strong> ${item.task}</p>
              <p><strong>Owner:</strong> ${item.owner}</p>
              ${item.deadline ? `<p><strong>Deadline:</strong> ${item.deadline}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }

    return new Response(
      JSON.stringify({
        minutes_json: parsedMinutes,
        minutes_html: parsedMinutes.html_output,
        minutes_table: {
          participants: parsedMinutes.participants,
          decisions: parsedMinutes.decisions,
          action_items: parsedMinutes.action_items,
          discussion_points: parsedMinutes.discussion_points
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-minutes function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});