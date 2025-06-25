# Business User Guide - AI Shopping Assistant Configuration

*Version: v1.0*  
*Last Updated: 25 June 2025*

## Overview

This guide helps business users configure and manage the AI Shopping Assistant without requiring technical knowledge. The assistant can be customized through simple configuration files to match your business needs.

## Table of Contents
1. [Getting Started](#getting-started)
2. [Understanding Actions](#understanding-actions)
3. [Basic Configuration](#basic-configuration)
4. [Common Use Cases](#common-use-cases)
5. [Managing B2B Features](#managing-b2b-features)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Troubleshooting](#troubleshooting)

## Getting Started

The AI Shopping Assistant helps your customers find products, manage their carts, and complete purchases through natural conversation. You can customize its behavior by configuring "actions" - specific tasks the assistant can perform.

### Key Benefits
- 🛒 Increased conversion rates through guided shopping
- 🕒 24/7 customer support without additional staff
- 📊 Valuable insights into customer behavior
- 🔧 Easy customization without coding

## Understanding Demo vs Production Mode

### What is Demo Mode?

Demo mode allows you to test and configure the AI Shopping Assistant without connecting to your real backend systems. It's perfect for:
- 🧪 Testing new configurations safely
- 👀 Demonstrating capabilities to stakeholders
- 🎓 Training staff on the system
- 🔧 Development and customization

**In Demo Mode:**
- Uses realistic but fake product data
- No real orders are placed
- No charges to credit cards
- All features work exactly like production
- Response times are consistent (<250ms)

### What is Production Mode?

Production mode connects to your real commerce backend (SAP Commerce Cloud, Shopify, etc.) and processes actual customer orders.

**In Production Mode:**
- Uses your real product catalog
- Places actual orders
- Processes real payments
- Integrates with your inventory system
- Response times depend on backend performance

### How to Tell Which Mode You're In

**Visual Indicators:**
```yaml
# Look for this in your configuration
mode: "demo"  # or "production"

# Or check the UI - demo mode shows:
"🧪 Demo Mode - No real orders will be placed"
```

**In the Assistant Interface:**
- Demo mode has a yellow banner at the top
- Production mode has no banner (or a green "Live" indicator)

### Feature Comparison

| Feature | Demo Mode | Production Mode |
|---------|-----------|----------------|
| Product Search | ✅ Mock products | ✅ Your products |
| Add to Cart | ✅ Works normally | ✅ Works normally |
| Checkout | ✅ Simulated | ✅ Real orders |
| Inventory | ✅ Random stock | ✅ Real stock |
| Pricing | ✅ Sample prices | ✅ Your prices |
| B2B Features | ✅ All available | ✅ All available |
| Customer Data | ✅ Test accounts | ✅ Real accounts |
| Analytics | ✅ Captured | ✅ Captured |
| API Costs | ✅ Same | ✅ Same |

### Transitioning from Demo to Production

**Step 1: Configuration Update**
```yaml
# config/environment.yaml
# Change from:
mode: "demo"

# To:
mode: "production"
backend:
  url: "https://your-backend.com"
  apiKey: "your-secure-api-key"
```

**Step 2: Verify Connections**
```yaml
# Run connection test
healthCheck:
  enabled: true
  endpoints:
    - products: "Should return your catalog"
    - inventory: "Should show real stock"
    - pricing: "Should reflect your prices"
```

**Step 3: Test Critical Paths**
- Search for a real product
- Add to cart
- Go through checkout (use test payment)
- Verify order appears in your system

### Best Practices for Each Mode

**Demo Mode Best Practices:**
1. Test all new features here first
2. Train your team using demo mode
3. Show stakeholders without risk
4. Verify configurations before production

**Production Mode Best Practices:**
1. Always test in demo first
2. Use gradual rollouts
3. Monitor real metrics closely
4. Have rollback plan ready

### Configuration Example

```yaml
# config/modes.yaml
development:
  mode: "demo"
  features:
    all: true  # Enable everything for testing
  logging:
    level: "debug"
    
staging:
  mode: "production"
  backend: "staging-backend"
  features:
    experimental: false  # More cautious
    
production:
  mode: "production"
  backend: "production-backend"
  features:
    onlyStable: true
  monitoring:
    enhanced: true
```

## Understanding Actions

Actions are the building blocks of the AI Assistant. Each action represents something the assistant can do, like:
- Search for products
- Add items to cart
- Check order status
- Compare products
- Generate quotes (B2B)

### Action Components
1. **Name**: What customers see (e.g., "Find Products")
2. **Description**: Helps the AI understand when to use this action
3. **Category**: Groups similar actions (search, cart, customer service)
4. **Parameters**: Information needed to complete the action

## Basic Configuration

### Simple Product Search Configuration

```yaml
# config/actions/search-products.yaml
name: "Product Search"
description: "Help customers find products in our catalog"
enabled: true

settings:
  maxResults: 20
  showOutOfStock: false
  defaultSort: "relevance"  # Options: relevance, price-low, price-high, newest

responses:
  noResults: "I couldn't find any products matching your search. Would you like to try different keywords?"
  tooManyResults: "I found many products! Here are the most relevant ones. You can refine your search by adding more details."
```

### Cart Management Configuration

```yaml
# config/actions/cart-management.yaml
name: "Shopping Cart"
description: "Manage items in the shopping cart"
enabled: true

settings:
  allowGuestCheckout: true
  maxItemsPerCart: 50
  enableSaveForLater: true

features:
  suggestRelatedProducts: true
  showStockWarnings: true
  enableBulkActions: false  # Set to true for B2B

messages:
  itemAdded: "✓ Added {productName} to your cart"
  stockWarning: "⚠️ Only {quantity} left in stock"
  cartEmpty: "Your cart is empty. Would you like me to help you find something?"
```

## Common Use Cases

### 1. Seasonal Promotions

Configure the assistant to highlight seasonal products:

```yaml
# config/seasonal/holiday-2024.yaml
name: "Holiday Shopping Assistant"
active: 
  from: "2024-11-15"
  to: "2024-12-31"

promotions:
  - category: "gifts"
    message: "🎁 Check out our holiday gift guide!"
    discount: "20% off with code HOLIDAY20"
  
  - products: ["SKU123", "SKU456", "SKU789"]
    message: "🎄 These items are perfect for the holidays!"
    freeShipping: true

autoSuggestions:
  - "Show me gift ideas under $50"
  - "What are your most popular holiday items?"
  - "Do you have gift wrapping options?"
```

### 2. Customer Service Integration

```yaml
# config/actions/customer-service.yaml
name: "Order Support"
description: "Help customers with order-related questions"
enabled: true

features:
  orderTracking: true
  returnRequests: true
  faq: true

commonQuestions:
  - question: "Where is my order?"
    action: "track-order"
    requiresAuth: true
    
  - question: "What's your return policy?"
    response: "We offer 30-day returns on all items. [View full policy](/returns)"
    
  - question: "How do I contact support?"
    response: "You can reach our support team at support@company.com or call 1-800-EXAMPLE"

escalation:
  enabled: true
  message: "Would you like me to connect you with a human agent?"
  availableHours: "Mon-Fri 9AM-6PM EST"
```

### 3. Product Recommendations

```yaml
# config/actions/recommendations.yaml
name: "Smart Recommendations"
description: "Provide personalized product suggestions"
enabled: true

strategies:
  newCustomers:
    show: "bestsellers"
    message: "Here are our most popular items:"
    
  returningCustomers:
    show: "personalized"
    basedOn: ["purchase-history", "browsing-history"]
    message: "Based on your interests, you might like:"
    
  cartAbandonment:
    enabled: true
    reminderAfter: "1 hour"
    message: "You left some items in your cart. Would you like to complete your purchase?"

crossSell:
  enabled: true
  maxSuggestions: 3
  message: "Customers who bought this also liked:"
```

## Managing B2B Features

### Enabling B2B Mode

```yaml
# config/b2b/settings.yaml
b2bMode:
  enabled: true
  requiresApproval: true  # Customers need approval for B2B features
  
features:
  bulkOrdering: true
  customPricing: true
  quoteGeneration: true
  purchaseOrders: true
  multiUserAccounts: true

permissions:
  viewer:
    - browse_catalog
    - view_prices
  buyer:
    - all_viewer_permissions
    - create_orders
    - view_order_history
  manager:
    - all_buyer_permissions
    - approve_orders
    - manage_users
    - generate_quotes
```

### Bulk Order Configuration

```yaml
# config/b2b/bulk-orders.yaml
bulkOrdering:
  enabled: true
  
csvUpload:
  enabled: true
  maxFileSize: "10MB"
  requiredColumns: ["SKU", "Quantity"]
  optionalColumns: ["Notes", "Delivery Date"]
  
  validation:
    minQuantity: 1
    maxQuantity: 10000
    allowBackorders: false
  
  errorHandling:
    invalidSKU: "Skip and note in summary"
    outOfStock: "Add to cart with warning"
    
pricing:
  tiers:
    - minQuantity: 50
      discount: 5
    - minQuantity: 100
      discount: 10
    - minQuantity: 500
      discount: 15
    - minQuantity: 1000
      discount: 20
      
  showSavings: true
  allowNegotiation: true
```

### Quote Management

```yaml
# config/b2b/quotes.yaml
quoteGeneration:
  enabled: true
  
settings:
  validityPeriod: 30  # days
  requiresApproval: true
  allowRevisions: true
  maxRevisionsn: 3
  
workflow:
  draft:
    actions: ["edit", "delete", "submit"]
  submitted:
    actions: ["approve", "reject", "revise"]
  approved:
    actions: ["convert-to-order", "extend-validity"]
    
notifications:
  onSubmit: ["sales-team@company.com"]
  onApprove: ["customer", "account-manager"]
  expiryWarning: 5  # days before expiry
  
templates:
  header: "Quote #{quoteNumber} - {companyName}"
  footer: "This quote is valid until {expiryDate}"
```

## Monitoring & Analytics

### Performance Dashboard Configuration

```yaml
# config/analytics/dashboard.yaml
dashboard:
  refreshInterval: 300  # seconds
  
  metrics:
    - id: "chat-sessions"
      name: "Active Conversations"
      type: "realtime"
      
    - id: "conversion-rate"
      name: "Assistant Conversion Rate"
      type: "percentage"
      calculation: "completed-purchases / total-sessions"
      
    - id: "avg-order-value"
      name: "Average Order Value"
      type: "currency"
      filter: "assistant-assisted-orders"
      
    - id: "popular-queries"
      name: "Top Customer Questions"
      type: "list"
      limit: 10

  alerts:
    - metric: "response-time"
      threshold: 3000  # milliseconds
      action: "email-tech-team"
      
    - metric: "error-rate"
      threshold: 5  # percentage
      action: "disable-feature-flag"
```

### Customer Insights

```yaml
# config/analytics/insights.yaml
insights:
  trackingEnabled: true
  anonymizeData: true
  
  events:
    - name: "product_searched"
      properties: ["query", "results_count", "category"]
      
    - name: "product_viewed"
      properties: ["product_id", "source", "time_spent"]
      
    - name: "cart_modified"
      properties: ["action", "product_id", "quantity", "value"]
      
    - name: "purchase_completed"
      properties: ["order_id", "total", "items_count", "assistant_used"]

  reports:
    weekly:
      - "top-search-terms"
      - "conversion-funnel"
      - "assistant-effectiveness"
      
    monthly:
      - "customer-journey-analysis"
      - "product-performance"
      - "b2b-account-summary"
```

## Troubleshooting

### Common Issues and Solutions

#### Mode-Specific Issues

**Issue: "Products look different than our catalog"**
- **Cause**: You're in demo mode
- **Solution**: Switch to production mode to see real products

**Issue: "Orders aren't appearing in our system"**
- **Cause**: Demo mode doesn't create real orders
- **Solution**: Verify you're in production mode for real transactions

**Issue: "Can't test without affecting real data"**
- **Cause**: You're in production mode
- **Solution**: Switch to demo mode for safe testing

#### Assistant Not Understanding Customers

**Problem**: Customers report the assistant doesn't understand their requests

**Solution**: Review and update action descriptions
```yaml
# Make descriptions more specific
# Bad:
description: "Handle products"

# Good:
description: "Search for products by name, category, brand, or features. Understands queries like 'blue running shoes', 'laptops under $1000', or 'waterproof jackets'"
```

#### Slow Response Times

**Problem**: Assistant takes too long to respond

**Solution**: Adjust performance settings
```yaml
performance:
  caching:
    enabled: true
    duration: 300  # 5 minutes
    
  searchOptimization:
    maxResults: 10  # Reduce from 50
    enableFacets: false  # Disable if not needed
    
  parallelQueries: true
  timeout: 5000  # 5 seconds max
```

#### Incorrect Product Recommendations

**Problem**: Assistant suggests irrelevant products

**Solution**: Fine-tune recommendation logic
```yaml
recommendations:
  relevanceThreshold: 0.7  # Increase from 0.5
  
  filters:
    excludeCategories: ["discontinued", "internal-use"]
    priceRange: "within-20-percent"
    onlyInStock: true
    
  weights:
    purchaseHistory: 0.4
    browsingHistory: 0.3
    categoryMatch: 0.2
    popularity: 0.1
```

### Testing Configuration Changes

Before applying changes to production:

1. **Use Test Mode**
```yaml
testMode:
  enabled: true
  testUsers: ["test@company.com", "qa-team@company.com"]
  logLevel: "debug"
```

2. **Gradual Rollout**
```yaml
rollout:
  strategy: "percentage"
  stages:
    - percentage: 10
      duration: "1 day"
    - percentage: 50
      duration: "3 days"
    - percentage: 100
```

3. **Monitor Impact**
```yaml
monitoring:
  compareMetrics: true
  baseline: "last-30-days"
  alerts:
    - metric: "conversion-rate"
      changeThreshold: -5  # Alert if drops by 5%
```

## Best Practices

### 1. Start Simple
- Enable basic features first
- Add complexity gradually
- Monitor customer feedback

### 2. Use Clear Language
- Write descriptions as if explaining to a person
- Avoid technical jargon
- Be specific about capabilities

### 3. Regular Updates
- Review configuration monthly
- Update seasonal content
- Remove outdated promotions

### 4. Test Thoroughly
- Try common customer queries
- Test edge cases
- Verify B2B features separately

### 5. Monitor Performance
- Check analytics weekly
- Act on customer feedback
- Optimize based on data

## Getting Help

### Resources
- **Documentation**: `/docs/ai-assistant`
- **Video Tutorials**: Available in the admin panel
- **Support**: ai-assistant-support@company.com
- **Demo Environment**: `https://demo.your-store.com/ai-assistant`
- **Mode Switching Guide**: `/docs/demo-to-production`

### Common Questions

**Q: Can I have different configurations for different stores?**
A: Yes, use the multistore configuration:
```yaml
stores:
  us-store:
    currency: "USD"
    language: "en"
    features: ["standard"]
  eu-store:
    currency: "EUR"
    language: ["en", "de", "fr"]
    features: ["standard", "gdpr-mode"]
```

**Q: How do I temporarily disable a feature?**
A: Simply set `enabled: false` in the configuration:
```yaml
features:
  smartRecommendations:
    enabled: false  # Temporarily disabled
    # Other settings remain unchanged
```

**Q: Can I schedule configuration changes?**
A: Yes, use scheduled configurations:
```yaml
scheduled:
  - name: "Black Friday Sale"
    startsAt: "2024-11-29 00:00"
    endsAt: "2024-11-29 23:59"
    changes:
      promotions.enabled: true
      messages.welcome: "🛍️ Black Friday Sale - Up to 50% off!"
```

**Q: Is it safe to let customers use demo mode?**
A: Yes! Demo mode is designed to be customer-safe:
- No real orders or charges
- Clear indication it's a demo
- Same features as production
- Great for trials or demonstrations

**Q: Do I need different API keys for demo and production?**
A: No for OpenAI (same API key works). Yes for your backend:
- Demo mode: No backend API key needed
- Production mode: Requires your commerce platform API credentials

**Q: Can I run both modes simultaneously?**
A: Yes, common patterns include:
- Demo at `demo.yourstore.com`
- Production at `www.yourstore.com`
- Internal testing at `test.yourstore.com` (demo mode)

**Q: What happens to demo data when switching to production?**
A: Demo data is completely separate:
- Conversations can be preserved
- Mock products/orders are not migrated
- User preferences transfer seamlessly
- Analytics continue uninterrupted