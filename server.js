const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Your AI that creates images using multiple 3rd party APIs
class MyAIImageCreator {
  constructor() {
    this.services = [
      {
        name: "Pollinations AI",
        generate: async (prompt) => {
          return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;
        }
      },
      {
        name: "CatAI", 
        generate: async (prompt) => {
          return `https://image.catai.me/api/generate?prompt=${encodeURIComponent(prompt)}&width=512&height=512`;
        }
      }
    ];
  }

  async generateImage(prompt) {
    console.log(`🤖 My AI is creating image: "${prompt}"`);
    const enhancedPrompt = `${prompt}, high quality, detailed, professional`;
    
    for (let service of this.services) {
      try {
        const imageUrl = await service.generate(enhancedPrompt);
        return {
          success: true,
          image: imageUrl,
          source: service.name,
          enhanced_prompt: enhancedPrompt,
          created_by: "My AI Image Creator"
        };
      } catch (error) {
        continue;
      }
    }
    throw new Error("All image services are busy");
  }
}

const myAI = new MyAIImageCreator();

// API Routes
app.post("/ai/generate", async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const result = await myAI.generateImage(prompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Please try again" });
  }
});

app.get("/ai/status", (req, res) => {
  res.json({
    name: "My AI Image Creator",
    status: "🟢 Online",
    version: "1.0"
  });
});

// Serve React build
app.use(express.static(path.join(__dirname, "build")));

// HTML FRONTEND - Works on mobile!
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My AI Image Creator</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: Arial, sans-serif; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 30px;
                text-align: center;
            }
            h1 { font-size: 2.5em; margin-bottom: 10px; }
            .subtitle { opacity: 0.9; }
            .chat-container { padding: 0; }
            .chat-box {
                height: 400px;
                overflow-y: auto;
                padding: 20px;
                background: #f8f9fa;
            }
            .input-area {
                display: flex;
                padding: 20px;
                background: white;
                border-top: 1px solid #dee2e6;
                gap: 10px;
            }
            .input-area input {
                flex: 1;
                padding: 15px;
                border: 2px solid #e9ecef;
                border-radius: 10px;
                font-size: 16px;
            }
            .generate-btn {
                padding: 15px 25px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                cursor: pointer;
            }
            .message {
                margin-bottom: 15px;
                padding: 15px;
                border-radius: 10px;
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .user-msg { background: #007bff; color: white; margin-left: 20px; }
            .ai-msg { background: #e9ecef; }
            .ai-msg img { max-width: 100%; border-radius: 10px; margin-top: 10px; }
            .loading { color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="container">
            <header>
                <h1>🤖 My AI Image Creator</h1>
                <p class="subtitle">Generate images with AI - Works on Mobile!</p>
            </header>
            <div class="chat-container">
                <div class="chat-box" id="chatBox">
                    <div class="message ai-msg">
                        <strong>AI:</strong> Welcome! Enter a prompt to generate images.
                    </div>
                </div>
                <div class="input-area">
                    <input type="text" id="promptInput" placeholder="Describe an image..." />
                    <button onclick="generateImage()" class="generate-btn">Generate</button>
                </div>
            </div>
        </div>
        <script>
            async function generateImage() {
                const prompt = document.getElementById('promptInput').value;
                const chatBox = document.getElementById('chatBox');
                const button = document.querySelector('.generate-btn');
                if (!prompt) return;
                chatBox.innerHTML += \`
                    <div class="message user-msg">
                        <strong>You:</strong> \${prompt}
                    </div>
                \`;
                chatBox.innerHTML += \`
                    <div class="message ai-msg">
                        <div class="loading">🔄 Generating image...</div>
                    </div>
                \`;
                button.disabled = true;
                button.textContent = 'Generating...';
                try {
                    const response = await fetch('/ai/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt })
                    });
                    const data = await response.json();
                    chatBox.removeChild(chatBox.lastChild);
                    if (data.success) {
                        chatBox.innerHTML += \`
                            <div class="message ai-msg">
                                <strong>AI:</strong> Generated: "\${prompt}"
                                <br>
                                <img src="\${data.image}" alt="AI Generated" />
                                <br>
                                <small>Source: \${data.source}</small>
                            </div>
                        \`;
                    } else throw new Error(data.error);
                } catch (error) {
                    chatBox.removeChild(chatBox.lastChild);
                    chatBox.innerHTML += \`
                        <div class="message ai-msg">
                            <strong>AI:</strong> ❌ Failed to generate. Please try again.
                        </div>
                    \`;
                } finally {
                    button.disabled = false;
                    button.textContent = 'Generate';
                    document.getElementById('promptInput').value = '';
                    chatBox.scrollTop = chatBox.scrollHeight;
                }
            }
            document.getElementById('promptInput').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') generateImage();
            });
        </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});