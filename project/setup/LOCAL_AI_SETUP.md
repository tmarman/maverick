# 🤖 Local AI Integration Setup Guide

This guide shows you how to set up local AI services (Ollama or LM Studio) to power Maverick's demos with real AI responses instead of hardcoded responses.

## 🎯 Why Use Local AI?

- **Privacy**: All AI processing happens on your machine
- **No API costs**: Free to run unlimited demos
- **Customization**: Use any open-source model you prefer
- **Offline capable**: Works without internet connection
- **Real responses**: Get actual AI-generated business advice

## 🚀 Quick Start Options

### Option 1: Ollama (Recommended)

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Or download from https://ollama.ai
   ```

2. **Start Ollama service**
   ```bash
   ollama serve
   ```

3. **Download a recommended model**
   ```bash
   # Good balance of speed and quality
   ollama pull llama3.1:8b
   
   # Or for better quality (requires more RAM)
   ollama pull llama3.1:70b
   ```

4. **Test the installation**
   ```bash
   curl http://localhost:11434/api/tags
   ```

### Option 2: LM Studio

1. **Download LM Studio**
   - Visit https://lmstudio.ai
   - Download and install for your platform

2. **Download a model in LM Studio**
   - Open LM Studio
   - Go to "Discover" tab
   - Download: `microsoft/Phi-3-mini-4k-instruct-gguf`
   - Or: `meta-llama/Llama-3.2-3B-Instruct-GGUF`

3. **Start the local server**
   - Go to "Local Server" tab
   - Load your downloaded model
   - Start server (default: http://localhost:1234)

## 🔧 Configuration

### Environment Variables (Optional)

Add to your `.env.local`:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama3.1:8b

# LM Studio Configuration  
LM_STUDIO_URL=http://localhost:1234
LM_STUDIO_DEFAULT_MODEL=local-model

# Preferred provider (ollama or lmstudio)
LOCAL_AI_PROVIDER=ollama
```

### Automatic Detection

Maverick automatically detects available services:
- Checks Ollama at `http://localhost:11434`
- Checks LM Studio at `http://localhost:1234`
- Auto-enables local AI if models are available

## 🎯 Demo Features with Local AI

### Enhanced Goose Demo (`/goose-demo`)

- **Real-time business analysis**: AI analyzes your business ideas
- **Dynamic conversation**: Contextual responses based on conversation history
- **Market insights**: AI-generated market analysis and recommendations
- **Formation advice**: Personalized business formation recommendations

### Example Interactions

**Business Analysis:**
```
User: "I want to start a coffee shop"
AI: *Analyzes coffee shop market, competition, target demographics*
AI: "Coffee shops have strong fundamentals - $45B market, loyal customers, 
     15-20% margins typical. Key success factors: location, quality, 
     customer experience. Would you like me to analyze your local market?"
```

**Formation Advice:**
```
User: "Should I form an LLC or corporation?"
AI: *Considers business type, location, tax implications*
AI: "For a coffee shop, I recommend LLC formation. Benefits: simpler taxes, 
     personal liability protection, operational flexibility. Cost ~$300-500 
     including state fees. Shall I start the formation process?"
```

## 🔍 Model Recommendations

### For Development/Testing
- **Phi-3-mini (4B)**: Fast, good for basic conversations
- **Llama 3.1 8B**: Good balance of speed and quality

### For Production Demos
- **Llama 3.1 70B**: High quality responses (requires 64GB+ RAM)
- **Mixtral 8x7B**: Good quality with reasonable resource usage

### Resource Requirements

| Model Size | RAM Required | Speed | Quality |
|------------|--------------|-------|---------|
| 3-4B       | 8GB          | Fast  | Good    |
| 7-8B       | 16GB         | Medium| Better  |
| 70B        | 64GB         | Slow  | Best    |

## ⚡ Performance Tips

1. **GPU Acceleration**
   ```bash
   # For Ollama with GPU support
   ollama pull llama3.1:8b-q4_K_M  # Quantized for speed
   ```

2. **Memory Management**
   - Close other apps when running large models
   - Use quantized models (q4_K_M, q5_K_M) for better performance

3. **Model Warming**
   - Models load faster after first use
   - Keep Ollama/LM Studio running in background

## 🛠️ Troubleshooting

### "No local AI services available"
- Check if Ollama/LM Studio is running
- Verify ports (11434 for Ollama, 1234 for LM Studio)
- Check firewall settings

### "Model not found"
- List available models: `ollama list`
- Download missing model: `ollama pull model-name`

### Slow responses
- Try smaller/quantized models
- Close memory-intensive applications
- Check CPU/RAM usage

### Connection errors
- Restart Ollama service: `ollama serve`
- Check if port is in use: `lsof -i :11434`
- Try different port in environment variables

## 🎨 Customization

### Custom Business Prompts

Edit `/src/lib/ollama.ts` to customize:
- Business analysis criteria
- Formation recommendations  
- Response formatting
- Industry-specific advice

### Model Selection

Configure preferred models in the UI:
- Models auto-detected from local services
- Switch between models in demo interface
- Fallback to demo responses if AI unavailable

## 🔄 Integration with Maverick Features

### Chat Wizard Enhancement
- AI-powered business name suggestions  
- Real-time market validation
- Dynamic follow-up questions

### Formation Workflow
- Personalized document generation
- State-specific advice
- Cost estimation based on location

### Square Integration Planning
- Payment processing recommendations
- Revenue projections
- Business model optimization

## 📊 Demo Scenarios

The local AI integration powers these demo scenarios:

1. **Coffee Shop Formation**: Market analysis → LLC formation → Square setup
2. **SaaS Platform**: Market sizing → Corporation setup → Payment integration  
3. **Service Business**: Competition analysis → LLC formation → Booking system
4. **E-commerce Store**: Product validation → Business formation → Payment flow

## 🚀 Getting Started

1. **Choose your AI provider** (Ollama recommended)
2. **Install and download a model**
3. **Start the service**
4. **Visit `/goose-demo`** in Maverick
5. **Toggle "Using Local AI"** in the status panel
6. **Start chatting with real AI!**

## 💡 Pro Tips

- **Start with Llama 3.1 8B** for best balance of quality and speed
- **Keep AI service running** in background for faster responses
- **Use the toggle** to compare AI vs demo responses
- **Check the status panel** for real-time connection info
- **Refresh status** if you start/stop AI services

Your local AI is now ready to power realistic business formation demos! 🎉