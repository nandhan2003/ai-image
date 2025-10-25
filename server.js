const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Your AI that creates images using multiple 3rd party APIs
class MyAIImageCreator {
  constructor() {
    this.services = [
      {
        name: "Pollinations AI",
        generate: async (prompt) => {
          return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024`;
        }
      },
      {
        name: "CatAI", 
        generate: async (prompt) => {
          return `https://image.catai.me/api/generate?prompt=${encodeURIComponent(prompt)}&width=1024&height=1024`;
        }
      },
      {
        name: "Prodia",
        generate: async (prompt) => {
          // Enhanced prompt for better quality
          const enhanced = `${prompt}, high quality, detailed, realistic`;
          return `https://api.prodia.com/v1/sd/generate?prompt=${encodeURIComponent(enhanced)}&model=realisticVisionV50_v50VAE.safetensors`;
        }
      }
    ];
  }

  // Your AI's image generation logic
  async generateImage(prompt) {
    console.log(`🤖 My AI is creating image: "${prompt}"`);
    
    // Enhance the prompt (like Gemini would)
    const enhancedPrompt = await this.enhancePrompt(prompt);
    
    // Try services in order
    for (let service of this.services) {
      try {
        console.log(`🔄 Trying ${service.name}...`);
        const imageUrl = await service.generate(enhancedPrompt);
        
        return {
          success: true,
          image: imageUrl,
          source: service.name,
          enhanced_prompt: enhancedPrompt,
          created_by: "My AI Image Creator",
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.log(`❌ ${service.name} failed, trying next...`);
        continue;
      }
    }
    
    throw new Error("All image services are busy");
  }

  // Your AI's prompt enhancement (like Gemini)
  async enhancePrompt(originalPrompt) {
    const enhancements = [
      "high quality, detailed, professional",
      "ultra realistic, 4K resolution", 
      "sharp focus, professional photography",
      "cinematic lighting, highly detailed"
    ];
    
    const randomEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    return `${originalPrompt}, ${randomEnhancement}`;
  }
}

// Initialize your AI
const myAI = new MyAIImageCreator();

// Your AI's API endpoints
app.post("/ai/generate", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ 
      error: "Prompt is required for my AI to create images" 
    });
  }

  try {
    console.log(`🎨 My AI received request: "${prompt}"`);
    
    const result = await myAI.generateImage(prompt);
    
    res.json({
      ...result,
      ai_name: "My Image Creator AI",
      version: "1.0",
      response_time: `${Date.now() - req.startTime}ms`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: "My AI is currently busy. Please try again in a moment.",
      ai_name: "My Image Creator AI"
    });
  }
});

// Batch image generation
app.post("/ai/generate-batch", async (req, res) => {
  const { prompts } = req.body;
  
  if (!prompts || !Array.isArray(prompts)) {
    return res.status(400).json({ 
      error: "Array of prompts required" 
    });
  }

  try {
    const results = [];
    
    for (let prompt of prompts) {
      const result = await myAI.generateImage(prompt);
      results.push(result);
    }
    
    res.json({
      success: true,
      batch_id: `batch_${Date.now()}`,
      created_by: "My AI Image Creator",
      results: results,
      total_generated: results.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Batch generation failed"
    });
  }
});

// AI status and capabilities
app.get("/ai/status", (req, res) => {
  res.json({
    ai_name: "My Image Creator AI",
    version: "1.0.0",
    status: "🟢 Online",
    capabilities: [
      "Image Generation from Text",
      "Prompt Enhancement", 
      "Multiple Service Integration",
      "Batch Processing",
      "Real-time Generation"
    ],
    supported_services: myAI.services.map(s => s.name),
    endpoints: {
      "POST /ai/generate": "Generate single image",
      "POST /ai/generate-batch": "Generate multiple images",
      "GET /ai/status": "AI status and capabilities"
    },
    usage_examples: {
      single: `curl -X POST http://localhost:5000/ai/generate -H "Content-Type: application/json" -d '{"prompt":"a beautiful sunset"}'`,
      batch: `curl -X POST http://localhost:5000/ai/generate-batch -H "Content-Type: application/json" -d '{"prompts":["sunset", "mountain", "ocean"]}'`
    }
  });
});

// Demo your AI's capabilities
app.get("/ai/demo", async (req, res) => {
  const demoPrompts = [
    "a futuristic city at night",
    "a mystical forest with glowing plants",
    "an astronaut floating in space",
    "a dragon flying over mountains",
    "a cyberpunk street market"
  ];

  try {
    const demoResults = [];
    
    for (let prompt of demoPrompts.slice(0, 2)) { // Just 2 for demo
      const result = await myAI.generateImage(prompt);
      demoResults.push({
        original_prompt: prompt,
        enhanced_prompt: result.enhanced_prompt,
        image_url: result.image,
        generated_by: result.created_by
      });
    }
    
    res.json({
      ai_name: "My Image Creator AI",
      demonstration: "Showing AI capabilities with sample generations",
      features: [
        "🤖 Intelligent prompt enhancement",
        "🖼️ Multi-service image generation", 
        "⚡ Real-time processing",
        "🔧 Error handling & fallbacks"
      ],
      generated_images: demoResults,
      try_it: "Use POST /ai/generate with your own prompts!"
    });
    
  } catch (error) {
    res.json({
      ai_name: "My Image Creator AI", 
      status: "Demo temporarily unavailable",
      error: error.message
    });
  }
});

// Add timing middleware
app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

app.listen(PORT, () => {
  console.log(`🚀 MY AI IMAGE CREATOR running on http://localhost:${PORT}`);
  console.log(`🤖 AI Status: http://localhost:${PORT}/ai/status`);
  console.log(`🎨 Generate: http://localhost:${PORT}/ai/generate`);
  console.log(`📦 Batch: http://localhost:${PORT}/ai/generate-batch`);
  console.log(`👁️ Demo: http://localhost:${PORT}/ai/demo`);
  console.log(`💡 Your own AI is ready!`);
});