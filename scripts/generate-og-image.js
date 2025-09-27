#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'https://api-phi-orcin.vercel.app/api/image?action=generate';
const OUTPUT_PATH = path.join(__dirname, '../website/public/og-image.png');

// SafePrompt branding prompt for OG image
const prompt = `Professional open graph social media card image for SafePrompt cybersecurity software.
Dark black background with subtle grid pattern.
Large "SafePrompt" text in bold white font at top.
Tagline "Stop Prompt Injection in One Line of Code" in green accent color below.
Shield icon with checkmark in green.
Clean minimal tech design.
Developer-focused security product branding.
1200x630 pixel dimensions.
High contrast, professional software product presentation.`;

async function generateOGImage() {
  console.log('🎨 Generating Open Graph image for SafePrompt...');

  // Load API key from environment
  const envPath = '/home/projects/.env';
  const envContent = fs.readFileSync(envPath, 'utf8');
  const apiKeyMatch = envContent.match(/SHARED_API_KEY=(.+)/);

  if (!apiKeyMatch) {
    console.error('❌ Could not find SHARED_API_KEY in .env file');
    process.exit(1);
  }

  const apiKey = apiKeyMatch[1].trim();

  const requestBody = JSON.stringify({
    prompt: prompt,
    type: 'logo',  // Using logo type for branding image
    format: 'png',
    quality: 95,
    aspectRatio: '1200:630',  // Standard OG image ratio
    output: {
      return: 'base64',
      store: false
    }
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(API_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);

          if (response.success && response.image_base64) {
            // Save base64 image to file
            const imageBuffer = Buffer.from(response.image_base64, 'base64');

            // Ensure directory exists
            const dir = path.dirname(OUTPUT_PATH);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(OUTPUT_PATH, imageBuffer);
            console.log('✅ OG image generated successfully!');
            console.log(`📍 Saved to: ${OUTPUT_PATH}`);
            console.log(`🔍 Enhanced prompt used: ${response.prompt.enhanced}`);
            console.log(`📊 Prompt score: ${response.prompt.score}/100`);
            resolve();
          } else {
            console.error('❌ Generation failed:', response.error || 'Unknown error');
            reject(new Error(response.error || 'Generation failed'));
          }
        } catch (err) {
          console.error('❌ Failed to parse response:', err.message);
          console.error('Response:', data);
          reject(err);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message);
      reject(err);
    });

    req.write(requestBody);
    req.end();
  });
}

// Alternative: Create a simple HTML/CSS based OG image if API fails
function createFallbackOGImage() {
  console.log('📝 Creating fallback OG image...');

  // Simple SVG-based OG image as fallback
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#000000"/>
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#111111" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Shield Icon -->
  <g transform="translate(600, 200)">
    <path d="M0,-60 L40,-40 L40,20 L0,60 L-40,20 L-40,-40 Z" fill="none" stroke="#00ff00" stroke-width="3"/>
    <path d="M-15,-10 L-5,0 L15,-20" fill="none" stroke="#00ff00" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>

  <!-- Title -->
  <text x="600" y="320" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">SafePrompt</text>

  <!-- Tagline -->
  <text x="600" y="380" font-family="Arial, sans-serif" font-size="32" fill="#00ff00" text-anchor="middle">Stop Prompt Injection in One Line of Code</text>

  <!-- Features -->
  <text x="600" y="450" font-family="Arial, sans-serif" font-size="24" fill="#888888" text-anchor="middle">Fast • Simple • Transparent • Developer-First</text>

  <!-- Website -->
  <text x="600" y="550" font-family="Arial, sans-serif" font-size="20" fill="#666666" text-anchor="middle">safeprompt.dev</text>
</svg>`;

  // Save SVG as placeholder (can be converted to PNG later)
  const svgPath = OUTPUT_PATH.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svg);
  console.log(`✅ Fallback SVG created at: ${svgPath}`);
  console.log('ℹ️  Note: You may want to convert this to PNG using a tool like ImageMagick or an online converter');
}

// Main execution
generateOGImage().catch((err) => {
  console.error('⚠️  API generation failed, creating fallback image...');
  createFallbackOGImage();
});