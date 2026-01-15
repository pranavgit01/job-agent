import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req, res) {
  console.log('========= COVER LETTER API CALLED =========');
  console.log('Method:', req.method);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription, userProfile } = req.body;

    if (!jobDescription || !userProfile) {
      console.error('❌ [API] Missing required fields');
      return res.status(400).json({ error: 'Job description and user profile are required' });
    }

    console.log('🔵 [API] Job description:', jobDescription);
    console.log('🔵 [API] User profile:', userProfile);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ [API] ANTHROPIC_API_KEY not configured');
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    console.log('🔵 [API] Calling Anthropic API...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate a professional and personalized cover letter for this job application.

Job Details:
${jobDescription}

Candidate Profile:
- Name: ${userProfile.name || 'Candidate'}
- Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : userProfile.skills}
- Experience: ${userProfile.experience} years
- Current/Target Role: ${userProfile.jobTitle}

Write a compelling cover letter that:
1. Shows enthusiasm for the role
2. Highlights relevant skills and experience
3. Explains why they're a great fit
4. Is professional but personable
5. Is concise (3-4 paragraphs)

Format it as a ready-to-send cover letter.`,
        },
      ],
    });

    console.log('✅ [API] Cover letter generated successfully');
    console.log('🔵 [API] Response:', message.content[0]);

    return res.status(200).json({
      success: true,
      coverLetter: message.content[0].type === 'text' ? message.content[0].text : '',
    });
  } catch (error) {
    console.error('❌ [API] ERROR generating cover letter:', error);
    console.error('❌ [API] Error details:', {
      message: error.message,
      status: error.status,
      stack: error.stack,
    });
    
    return res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
