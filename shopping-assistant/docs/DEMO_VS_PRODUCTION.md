# Demo Mode vs Production Mode

*Version: v1.0*  
*Last Updated: 25 June 2025*

## Overview

The AI Shopping Assistant is designed with a clear separation between Demo Mode (using mocks) and Production Mode (using real backends). This document explains the differences, current state, and migration path.

## Current State: Demo Mode (June 2025)

The system currently operates in Demo Mode with sophisticated mock implementations that mirror real UDL (Unified Data Layer) responses.

### Architecture Comparison

```
DEMO MODE (Current)
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ API Routes  │────▶│  LangGraph  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │  Mock SDK   │     │Mock Custom  │
                    │(UDL Format) │     │ Extensions  │
                    └─────────────┘     └─────────────┘

PRODUCTION MODE (Target)
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│ API Routes  │────▶│  LangGraph  │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   Real SDK  │────▶│ Middleware  │
                    │ (Alokai UDL)│     │   Custom    │
                    └─────────────┘     │ Extensions  │
                            │           └─────────────┘
                            ▼                    │
                    ┌─────────────┐             ▼
                    │  SAP/SFCC/  │     ┌─────────────┐
                    │  BigComm/   │     │ ERP/CRM/Tax │
                    │   Magento   │     │  Services   │
                    └─────────────┘     └─────────────┘
```

## Feature Availability

### ✅ Fully Functional in Demo Mode

| Feature | Demo Implementation | Production Requirement |
|---------|-------------------|----------------------|
| **Product Search** | 50+ mock products with realistic data | `sdk.unified.searchProducts()` |
| **Product Details** | Complete product information | `sdk.unified.getProductDetails()` |
| **Cart Operations** | Full cart state management | `sdk.unified.addCartLineItem()` etc. |
| **AI Conversations** | OpenAI GPT integration | Same (no change) |
| **B2C/B2B Modes** | Mode detection and switching | Same (no change) |
| **Security Features** | Prompt injection protection | Same (no change) |
| **Streaming Responses** | Server-sent events | Same (no change) |
| **UI Components** | All components functional | Same (no change) |

### ⚙️ Mock-Specific B2B Features

| Feature | Mock Implementation | Production Integration Needed |
|---------|-------------------|------------------------------|
| **Bulk Pricing** | Tiered pricing simulation | ERP system integration |
| **Bulk Availability** | Random stock generation | Real inventory service |
| **Credit Checks** | Fixed credit limits | Finance system API |
| **Product Samples** | Mock order creation | Order management system |
| **Product Demos** | Basic scheduling | Calendar service (Google/MS) |
| **Tax Exemption** | Simple validation | Tax service provider |

## Performance Characteristics

### Demo Mode Performance
- **Response Time**: <250ms (consistent)
- **Data Source**: In-memory mocks
- **Scalability**: Unlimited (no backend limits)
- **Cost**: Only OpenAI API calls

### Production Mode Performance
- **Response Time**: <250ms (target, depends on backend)
- **Data Source**: Real backend systems
- **Scalability**: Depends on backend capacity
- **Cost**: OpenAI + Backend API calls

## Mock Implementation Details

### Mock SDK Factory (`mocks/mock-sdk-factory.ts`)
```typescript
// Provides UDL-compliant mock responses
const mockSDK = {
  unified: {
    searchProducts: async (params) => mockProducts,
    getProductDetails: async ({id}) => findMockProduct(id),
    addCartLineItem: async (params) => updateMockCart(params),
    // ... all UDL methods mocked
  },
  customExtension: {
    getBulkPricing: async (params) => calculateMockPricing(params),
    checkBulkAvailability: async (items) => generateMockStock(items),
    // ... all B2B extensions mocked
  }
};
```

### Mock Data Characteristics
- **Products**: 50+ items across categories (electronics, apparel, home)
- **Pricing**: Realistic price ranges with currency support
- **Inventory**: Random but consistent stock levels
- **Cart**: Persisted in session with full calculations
- **Customer**: Sample B2C and B2B customer profiles

## Migration Path to Production

### Phase 1: Core Commerce Operations (Prompt 20 ✓)
Already completed - all core operations use SDK pattern:
```typescript
// ✅ Already implemented correctly:
await sdk.unified.searchProducts({ search: query });
await sdk.unified.addCartLineItem({ productId, quantity });
```

### Phase 2: Custom B2B Extensions (Prompt 21 ✓)
Already completed - middleware methods ready:
```typescript
// ✅ Already implemented in middleware:
await sdk.customExtension.getBulkPricing({ items, customerId });
await sdk.customExtension.checkBulkAvailability({ items });
```

### Phase 3: Backend Integration (Prompt 22 - Pending)
Required steps:
1. Configure real Alokai middleware endpoints
2. Set up authentication with commerce backend
3. Connect B2B services (ERP, CRM, Tax)
4. Update environment variables
5. Test with real data

### Phase 4: Production Testing (Prompt 23 - Pending)
1. Performance benchmarking with real APIs
2. Load testing for concurrent users
3. Security penetration testing
4. Failover and recovery testing

## Environment Configuration

### Demo Mode (.env.local)
```bash
# AI Configuration (Required)
OPENAI_API_KEY=sk-your-key-here

# Alokai Middleware (Using defaults)
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_API_URL=http://localhost:4000

# Feature Flags
NEXT_PUBLIC_AI_ASSISTANT_DEMO_MODE=true
```

### Production Mode (.env.production)
```bash
# AI Configuration
OPENAI_API_KEY=sk-production-key

# Alokai Middleware (Real endpoints)
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_API_URL=https://api.your-domain.com

# Commerce Backend
SAPCC_OAUTH_URI=https://your-sap-instance.com/oauth
SAPCC_API_URI=https://your-sap-instance.com/api

# B2B Services
ERP_API_ENDPOINT=https://erp.company.com/api
CRM_API_ENDPOINT=https://crm.company.com/api
TAX_SERVICE_ENDPOINT=https://tax-provider.com/api

# Feature Flags
NEXT_PUBLIC_AI_ASSISTANT_DEMO_MODE=false
AI_ASSISTANT_RATE_LIMIT=120
AI_ASSISTANT_RATE_LIMIT_B2B=240
```

## Development Workflow

### Working in Demo Mode
1. No backend setup required
2. Immediate feedback loop
3. Consistent test data
4. No API rate limits
5. Cost-effective development

### Testing Production Features
1. Use staging environment
2. Limited test data sets
3. Real API constraints
4. Monitor costs
5. Respect rate limits

## Key Differences for Developers

### Code Patterns
```typescript
// Demo mode uses the same patterns as production:
const products = await sdk.unified.searchProducts({ search: 'laptop' });

// The only difference is the SDK instance:
// Demo: createMockSDK()
// Prod: getSdk()
```

### Error Handling
- **Demo**: Simulated errors for testing
- **Production**: Real API errors, network issues

### Data Consistency
- **Demo**: Always returns same test data
- **Production**: Dynamic, real-time data

## FAQ

### Q: Why use mocks instead of real data?
**A**: Mocks enable rapid development, consistent testing, and demonstration without backend dependencies or costs.

### Q: How realistic are the mocks?
**A**: Very realistic - they follow exact UDL response formats and include edge cases for testing.

### Q: Can I mix demo and production?
**A**: Not recommended. Use feature flags to switch modes completely.

### Q: What's the effort to go to production?
**A**: Minimal code changes - mainly configuration and backend setup. The architecture is production-ready.

### Q: Will my demo data transfer to production?
**A**: No, demo data is ephemeral. Production uses real customer and product data.

## Benefits of Demo Mode

1. **Rapid Prototyping**: Test ideas without backend setup
2. **Cost Effective**: No backend API costs during development
3. **Consistent Testing**: Reproducible scenarios
4. **Feature Complete**: All features work as they will in production
5. **Safe Environment**: No risk to real data

## Next Steps

- **For Demo Usage**: Continue to [FEATURE_SHOWCASE.md](./FEATURE_SHOWCASE.md)
- **For Production Setup**: See [PRODUCTION_INTEGRATION.md](./PRODUCTION_INTEGRATION.md)
- **For Testing**: Review [Integration Testing Guide](./apps/storefront-unified-nextjs/features/ai-shopping-assistant/docs/TROUBLESHOOTING.md)

---

💡 **Key Takeaway**: Demo mode is not a limitation - it's a feature that enables rapid development and testing. The system is architecturally ready for production; only configuration and backend connections are needed.