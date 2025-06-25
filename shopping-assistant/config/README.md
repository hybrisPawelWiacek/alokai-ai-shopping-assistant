# AI Assistant Configuration System

*Version: v1.0*  
*Last Updated: 25 June 2025*

This directory contains configuration files for the AI Shopping Assistant actions.

## Configuration Structure

The configuration system supports:
- **JSON format** (YAML support available with js-yaml package)
- **Environment-specific overrides**
- **Hot-reload in development**
- **Full type validation with Zod**
- **Caching and performance optimization**

## Files

- `ai-assistant-actions.json` - Main configuration file with all action definitions
- `ai-assistant-actions.production.json` - Production environment overrides
- `ai-assistant-actions.staging.json` - Staging environment overrides (create as needed)

## Configuration Schema

```typescript
{
  "version": "1.0.0",
  "environment": "development" | "staging" | "production",
  "globals": {
    // Global settings applied to all actions
    "security": { ... },
    "performance": { ... },
    "observability": { ... },
    "udl": { ... }
  },
  "actions": [
    {
      "id": "unique_action_id",
      "name": "Human Readable Name",
      "description": "What this action does",
      "category": "search" | "cart" | "customer" | "checkout" | "b2b" | "support",
      "enabled": true,
      "parameters": {
        // Zod-compatible parameter definitions
      },
      "implementation": {
        "type": "function",
        "handler": "implementationFunctionName"
      },
      "modes": {
        "b2c": { "enabled": true },
        "b2b": { "enabled": true }
      },
      "security": { ... },
      "udl": { ... },
      "performance": { ... },
      "observability": { ... }
    }
  ]
}
```

## Key Features

### 1. Parameter Validation
Define parameters with full validation:
```json
"parameters": {
  "productId": {
    "type": "string",
    "required": true,
    "pattern": "^[A-Z0-9-]+$"
  },
  "quantity": {
    "type": "number",
    "min": 1,
    "max": 9999,
    "default": 1
  }
}
```

### 2. Mode-Specific Configuration
Different settings for B2C and B2B:
```json
"modes": {
  "b2c": {
    "enabled": true,
    "overrides": {
      "parameters": {
        "quantity": { "max": 99 }
      }
    }
  },
  "b2b": {
    "enabled": true,
    "overrides": {
      "parameters": {
        "quantity": { "max": 9999 }
      }
    }
  }
}
```

### 3. UDL Integration
Specify which SDK methods the action uses:
```json
"udl": {
  "methods": ["sdk.unified.searchProducts"],
  "dataFlow": "read",
  "caching": {
    "enabled": true,
    "ttlSeconds": 300
  }
}
```

### 4. Security Settings
Configure authentication and rate limiting:
```json
"security": {
  "requiresAuth": true,
  "requiredPermissions": ["create_quote"],
  "rateLimit": {
    "requests": 100,
    "windowMs": 60000
  }
}
```

### 5. Performance Tuning
Set timeouts and retry policies:
```json
"performance": {
  "timeoutMs": 5000,
  "retries": 2,
  "backoffMs": 1000
}
```

## Environment Overrides

Environment-specific files override the base configuration:

1. Base config: `ai-assistant-actions.json`
2. Production overrides: `ai-assistant-actions.production.json`

The system deep-merges configurations, allowing you to:
- Change global settings per environment
- Disable specific actions in production
- Adjust rate limits and timeouts
- Modify security requirements

## Hot Reload

In development mode, the configuration automatically reloads when files change:
- No server restart required
- Tools rebuild automatically
- Console logs show reload status

## Usage

```typescript
import { initializeAIAssistant } from '@/features/ai-shopping-assistant/config';

const { registry, configManager } = await initializeAIAssistant(state, {
  configPath: 'config/ai-assistant-actions.json',
  environment: 'production',
  watch: true // Enable hot-reload
});

// Get all tools
const tools = registry.getTools();

// Get tools for specific mode
const b2bTools = registry.getToolsForMode('b2b');

// Check if action is enabled
const isEnabled = configManager.isActionEnabled('checkout', 'b2c');
```

## Adding New Actions

1. Add action definition to `ai-assistant-actions.json`
2. Implement the handler function in `actions/implementations/`
3. Add the handler to `IMPLEMENTATION_MAP` in `registry-v2.ts`
4. The action will be automatically loaded on next reload

## Best Practices

1. **Start with restrictive settings** and loosen as needed
2. **Use environment overrides** for production-specific settings
3. **Set appropriate timeouts** based on UDL method performance
4. **Configure caching** for read-only operations
5. **Use parameter validation** to prevent invalid inputs
6. **Document security requirements** clearly
7. **Test mode-specific behavior** thoroughly