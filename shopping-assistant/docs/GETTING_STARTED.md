# Getting Started with AI Shopping Assistant

*Version: v1.0*  
*Last Updated: 25 June 2025*

Welcome to the Alokai AI Shopping Assistant! This guide will help you get the system running quickly in demo mode.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Understanding Demo Mode](#understanding-demo-mode)
4. [Your First Interaction](#your-first-interaction)
5. [Available Features](#available-features)
6. [Common Issues](#common-issues)
7. [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have:

- **Node.js** (see `.nvmrc` for required version)
- **Yarn v1** (classic)
- **Git** for cloning the repository
- **OpenAI API Key** (get one at https://platform.openai.com/api-keys)
- **8GB RAM minimum** (for running middleware + frontend)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone [repository-url]
cd shopping-assistant

# Install dependencies and setup environment
yarn run init
```

### 2. Configure AI Assistant

Create `.env.local` in `apps/storefront-unified-nextjs/`:

```bash
# Copy the example file
cp apps/storefront-unified-nextjs/.env.example apps/storefront-unified-nextjs/.env.local

# Edit and add your OpenAI API key (REQUIRED!)
# Find the line: OPENAI_API_KEY=sk-your-openai-api-key-here
# Replace with your actual key
```

⚠️ **IMPORTANT**: Never commit your `.env.local` file! It contains sensitive API keys.

### 3. Start Development Servers

```bash
# Start both frontend and middleware
yarn dev

# Or start them separately:
yarn dev:next       # Frontend only (port 3000)
yarn dev:middleware # Middleware only (port 4000)
```

### 4. Access the Application

- **Main Store**: http://localhost:3000
- **AI Assistant Widget**: Look for the chat bubble in the bottom-right corner
- **Direct Assistant Page**: http://localhost:3000/en/assistant

## Understanding Demo Mode

The AI Shopping Assistant currently runs in **Demo Mode** using mock data. This means:

### ✅ What Works Now (Demo Mode)
- Full AI conversation capabilities
- Product search with realistic results
- Cart management operations
- B2C and B2B mode switching
- Bulk order processing (B2B)
- Product comparisons
- Rich UI components
- Streaming responses
- Security features (prompt injection protection)

### ⏳ What Requires Backend Integration
- Real product inventory
- Actual pricing from ERP
- Live customer accounts
- Order placement
- Payment processing
- Real-time stock levels

### Why Demo Mode?
Demo mode allows you to:
- Test AI capabilities without backend setup
- Develop and debug quickly
- Showcase features to stakeholders
- Validate UX patterns
- Benchmark performance

## Your First Interaction

### 1. Open the AI Assistant
Click the chat bubble in the bottom-right corner of any page.

### 2. Try These Example Queries

**B2C Shopping:**
```
"Show me laptops under $1000"
"Compare the MacBook Air and ThinkPad"
"Add 2 units of product ABC123 to my cart"
"What's in my cart?"
```

**B2B Operations:**
```
"Switch to B2B mode"
"I need bulk pricing for 100 units of SKU123"
"Show me products with volume discounts"
"Create a quote for my cart"
```

### 3. Upload CSV (B2B Mode)
1. Switch to B2B mode
2. Type: "I want to upload a bulk order"
3. Use the CSV upload interface
4. Watch real-time progress

**Sample CSV Format:**
```csv
sku,quantity,notes
ABC123,50,Urgent delivery needed
DEF456,100,Q4 inventory
GHI789,25,Sample request
```

## Available Features

### 🛍️ B2C Features
- Natural language product search
- Visual product comparisons
- Cart management
- Personalized recommendations
- Multi-language support (EN/DE)

### 🏢 B2B Features
- Bulk order via CSV upload
- Volume-based pricing
- Quote generation
- Credit limit checks
- Product sample requests
- Tax exemption handling

### 🤖 AI Capabilities
- Intent detection
- Context awareness
- Error recovery
- Security validation
- Performance optimization

### 🎨 UI Components
- Product grid displays
- Comparison tables
- Cart previews
- Progress indicators
- Action buttons

## Common Issues

### Issue: "OpenAI API key is not configured"
**Solution**: Ensure your `.env.local` file contains a valid `OPENAI_API_KEY`

### Issue: "Cannot find module 'sdk.commerce'"
**Solution**: This is a code error. The correct import is `sdk.unified.*`

### Issue: Chat widget doesn't appear
**Solution**: 
1. Check browser console for errors
2. Ensure you're on a page with the layout wrapper
3. Try the direct assistant page: `/en/assistant`

### Issue: Slow responses
**Solution**: 
- First request may be slow (cold start)
- Check your internet connection
- Verify OpenAI API is accessible

### Issue: "Rate limit exceeded"
**Solution**: Default limit is 60 requests/minute. Wait a moment and try again.

## Next Steps

### For Developers
1. Read [ARCHITECTURE.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/ARCHITECTURE.md) to understand the system
2. Check [DEVELOPMENT_WORKFLOW.md](./DEVELOPMENT_WORKFLOW.md) to add features
3. Review [CONFIGURATION_COOKBOOK.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/CONFIGURATION_COOKBOOK.md) for customization

### For Business Users
1. Read [BUSINESS_USER_GUIDE.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/BUSINESS_USER_GUIDE.md)
2. Try different conversation flows
3. Test CSV bulk upload scenarios

### For Production Deployment
1. See [DEMO_VS_PRODUCTION.md](./DEMO_VS_PRODUCTION.md) for backend requirements
2. Review [INFRASTRUCTURE_GUIDE.md](./INFRASTRUCTURE_GUIDE.md) for deployment
3. Check [COST_ANALYSIS.md](./COST_ANALYSIS.md) for budget planning

## Getting Help

- **Documentation Index**: [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/TROUBLESHOOTING.md)
- **Architecture**: [ARCHITECTURE.md](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/ARCHITECTURE.md)

## System Requirements Summary

| Component | Requirement |
|-----------|-------------|
| Node.js | See `.nvmrc` |
| RAM | 8GB minimum |
| Disk | 2GB free space |
| Network | Stable internet for OpenAI API |
| Browser | Chrome, Firefox, Safari, Edge (latest) |

---

🎉 **You're ready to explore the AI Shopping Assistant!** Start with simple queries and gradually try more complex scenarios. The system is designed to handle natural language, so feel free to chat as you would with a human shopping assistant.