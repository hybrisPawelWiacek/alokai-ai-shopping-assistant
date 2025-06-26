# Comprehensive UDL Documentation Guide

This guide helps you navigate the extensive Unified Data Layer (UDL) documentation available in the `@shopping-assistant/docs/unified-data-model/` directory.

> **Quick Links:**
> - [UDL Contract](./UDL_CONTRACT.md) - Understanding UDL as a contract
> - [SAPCC Specific Data Access](./SAPCC_SPECIFIC_DATA_ACCESS.md) - Accessing platform-specific features
> - [Full UDL Documentation](../unified-data-model/) - Complete technical reference

## Overview

The unified-data-model directory contains comprehensive documentation covering:
- **Core UDL concepts** - Data models, normalizers, unified methods
- **Platform-specific implementations** - SAPCC, Magento, BigCommerce, commercetools, SFCC
- **Integration patterns** - Creating custom methods, overriding defaults
- **Advanced features** - B2B functionality, platform switching

## Documentation Structure

### 📚 Core Documentation

| Document | Purpose | Path |
|----------|---------|------|
| UDL Overview | Introduction to Unified Data Layer | [`1.index.md`](../unified-data-model/1.index.md) |
| Data Model Reference | Complete data structure definitions | [`1.unified-data-model.md`](../unified-data-model/1.unified-data-model.md) |
| Normalizers Guide | How normalizers transform platform data | [`2.normalizers.md`](../unified-data-model/2.normalizers.md) |

### 🔧 Integration & Setup

| Document | Purpose | Path |
|----------|---------|------|
| Creating API Methods | Add new custom methods | [`3.integration-&-setup/0.creating-new-api-methods.md`](../unified-data-model/3.integration-&-setup/0.creating-new-api-methods.md) |
| Overriding API Methods | Customize existing methods | [`3.integration-&-setup/1.overriding-api-methods.md`](../unified-data-model/3.integration-&-setup/1.overriding-api-methods.md) |
| SDK Module Usage | Integrate with SDK | [`3.integration-&-setup/2.utilising-sdk-modules.md`](../unified-data-model/3.integration-&-setup/2.utilising-sdk-modules.md) |

### 📋 Unified Methods Reference

| Category | Methods | Path |
|----------|---------|------|
| Product | Search, details, reviews | [`3.unified-methods/3.product.md`](../unified-data-model/3.unified-methods/3.product.md) |
| Cart | Add, update, remove items | [`3.unified-methods/4.cart.md`](../unified-data-model/3.unified-methods/4.cart.md) |
| Category | Query by ID or slug | [`3.unified-methods/5.category.md`](../unified-data-model/3.unified-methods/5.category.md) |
| Checkout | Shipping, payment, orders | [`3.unified-methods/6.checkout.md`](../unified-data-model/3.unified-methods/6.checkout.md) |
| Customer | Addresses, profile, orders | [`3.unified-methods/7.customer.md`](../unified-data-model/3.unified-methods/7.customer.md) |

### 🏪 Platform-Specific References

#### SAPCC (SAP Commerce Cloud)
| Component | Purpose | Path |
|-----------|---------|------|
| Product Normalizer | Transform SAPCC products to UDL | [`5.reference/sapcc/normalizers/product-normalizers.md`](../unified-data-model/5.reference/sapcc/normalizers/product-normalizers.md) |
| Cart Normalizer | Transform SAPCC cart to UDL | [`5.reference/sapcc/normalizers/cart-normalizer.md`](../unified-data-model/5.reference/sapcc/normalizers/cart-normalizer.md) |
| Customer Normalizer | Transform SAPCC customer to UDL | [`5.reference/sapcc/normalizers/customer-normalizer.md`](../unified-data-model/5.reference/sapcc/normalizers/customer-normalizer.md) |
| B2B Features | SAPCC B2B-specific functionality | [`4.features/4.advanced/4.b2b-sapcc.md`](../unified-data-model/4.features/4.advanced/4.b2b-sapcc.md) |

#### Other Platforms
- **Magento**: See [`5.reference/magento/normalizers/`](../unified-data-model/5.reference/magento/normalizers/)
- **BigCommerce**: See [`5.reference/bigcommerce/normalizers/`](../unified-data-model/5.reference/bigcommerce/normalizers/)
- **commercetools**: See [`5.reference/commercetools/normalizers/`](../unified-data-model/5.reference/commercetools/normalizers/)
- **SFCC**: See [`5.reference/sfcc/normalizers/`](../unified-data-model/5.reference/sfcc/normalizers/)

### 🚀 Advanced Features

| Feature | Purpose | Path |
|---------|---------|------|
| Platform Switching | Swap e-commerce backends | [`4.features/4.advanced/2.swap-ecommerce-platform.md`](../unified-data-model/4.features/4.advanced/2.swap-ecommerce-platform.md) |
| Custom Queries | Advanced query patterns | [`4.features/4.advanced/5.custom-queries.md`](../unified-data-model/4.features/4.advanced/5.custom-queries.md) |
| Dynamic Facets | Configurable product filtering | [`4.features/2.product/6.dynamic-facets.md`](../unified-data-model/4.features/2.product/6.dynamic-facets.md) |

## Common Use Cases

### 🎯 "I need to understand UDL basics"
1. Start with [UDL Overview](../unified-data-model/1.index.md)
2. Read [UDL Contract](./UDL_CONTRACT.md)
3. Review [Data Model Reference](../unified-data-model/1.unified-data-model.md)

### 🎯 "I need to access SAPCC-specific data"
1. Read [SAPCC Specific Data Access](./SAPCC_SPECIFIC_DATA_ACCESS.md)
2. Check [SAPCC Normalizers](../unified-data-model/5.reference/sapcc/normalizers/)
3. Review [B2B SAPCC Features](../unified-data-model/4.features/4.advanced/4.b2b-sapcc.md)

### 🎯 "I need to create custom methods"
1. Read [Creating API Methods](../unified-data-model/3.integration-&-setup/0.creating-new-api-methods.md)
2. Review [Normalizers Guide](../unified-data-model/2.normalizers.md)
3. Check platform-specific examples in `5.reference/`

### 🎯 "I need to extend normalizers"
1. Read [Normalizers Guide](../unified-data-model/2.normalizers.md)
2. Check platform-specific normalizer docs (e.g., [SAPCC Product Normalizer](../unified-data-model/5.reference/sapcc/normalizers/product-normalizers.md))
3. Review examples of extending with `$custom` fields

### 🎯 "I need to switch e-commerce platforms"
1. Read [Swap E-commerce Platform](../unified-data-model/4.features/4.advanced/2.swap-ecommerce-platform.md)
2. Review normalizers for both platforms
3. Check [UDL Contract](./UDL_CONTRACT.md) for guaranteed compatibility

## Key Concepts Summary

### Normalizers
- Transform platform-specific data to UDL format
- Located in `5.reference/[platform]/normalizers/`
- Can be extended with custom fields via `$custom`

### Unified Methods
- Standardized operations across all platforms
- Same signature regardless of backend
- Located in `3.unified-methods/`

### Custom Extensions
- Add platform-specific features
- Maintain UDL compatibility
- Use `getNormalizers()` for consistency

## Version Information

The unified-data-model directory includes:
- **Current version**: Main documentation
- **Legacy versions**: `legacy-v0/` and `legacy-v1/` for historical reference
- **Changelogs**: `6.change-log/` for version history

## Tips for Navigation

1. **Use the numbered prefixes** - Files are organized by topic (1.intro, 2.setup, etc.)
2. **Check platform references** - Each platform has its own normalizer documentation
3. **Review examples** - Most documents include practical code examples
4. **Follow cross-references** - Documents link to related content

## Related Documentation

- [CLAUDE.md](../../CLAUDE.md) - Project-specific guidelines mentioning UDL
- [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - Complete documentation map
- [Alokai Docs](https://docs.alokai.com/unified-data-layer) - Official external documentation