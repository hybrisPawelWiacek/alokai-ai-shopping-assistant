# AI Shopping Assistant Documentation Index

*Version: v1.0*  
*Last Updated: 25 June 2025*

This index provides a complete map of all documentation for the AI Shopping Assistant project.

## 📂 Documentation Structure

The documentation is organized in the following locations:
- **`./docs/`** - Essential documentation for humans (7 focused guides)
- **`./docs/reference/`** - Comprehensive reference documentation (10 detailed guides, primarily for LLMs)
- **`./docs/imp/`** - Implementation working documents (internal tracking)
- **`./docs/external/`** - External source documents and strategic materials
- **`./docs/archive/`** - Archived documentation
- **`./docs/unified-data-model/`** - UDL technical specifications

### Why This Structure?
- **Humans** start with the 7 essential docs in `/docs/` - these are what you actually need to read
- **LLMs** can consume all 17 docs including the detailed references
- **Clear mental model**: Start simple, dive deep only when needed

## 📚 Essential Documentation (Start Here!)

### 🚀 Getting Started
The core documents you actually need to read.

| Document | Purpose | Audience |
|----------|---------|----------|
| [README.md](../README.md) | Project overview and executive summary | Everyone |
| [GETTING_STARTED.md](./GETTING_STARTED.md) | Quick setup and first interaction guide | Developers |
| [DEMO_VS_PRODUCTION.md](./DEMO_VS_PRODUCTION.md) | Understanding mock vs real implementation | Business & Technical |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Current implementation status and progress | Project Managers |

### 💼 Business Documentation
For business users, product managers, and stakeholders.

| Document | Purpose | Audience |
|----------|---------|----------|
| [FEATURE_SHOWCASE.md](./FEATURE_SHOWCASE.md) | Interactive demos and capabilities | Business Users |
| [BUSINESS_USER_GUIDE.md](./BUSINESS_USER_GUIDE.md) | Configuration without coding | Business Users |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions | Support & Developers |

## 📖 Reference Documentation (Deep Dives)

*These comprehensive guides are in `/docs/reference/` - great for LLMs and when you need detailed information.*

### 🏗️ Architecture & Technical References
| Document | Purpose | Audience |
|----------|---------|----------|
| [ARCHITECTURE.md](./reference/ARCHITECTURE.md) | System design and patterns | Architects |
| [AI_INTEGRATION_GUIDE.md](./reference/AI_INTEGRATION_GUIDE.md) | Extending with new actions | Developers |
| [DEVELOPMENT_WORKFLOW.md](./reference/DEVELOPMENT_WORKFLOW.md) | How to add new features | Developers |
| [INFRASTRUCTURE_GUIDE.md](./reference/INFRASTRUCTURE_GUIDE.md) | Deployment and scaling | DevOps |

### 🔧 Configuration & Operations References
| Document | Purpose | Audience |
|----------|---------|----------|
| [CONFIGURATION_COOKBOOK.md](./reference/CONFIGURATION_COOKBOOK.md) | Configuration examples and patterns | Developers |
| [PERFORMANCE_TUNING.md](./reference/PERFORMANCE_TUNING.md) | Optimization strategies | DevOps & Developers |
| [SECURITY_BEST_PRACTICES.md](./reference/SECURITY_BEST_PRACTICES.md) | Security implementation guide | Security & Developers |

### 💰 Business & Planning References
| Document | Purpose | Audience |
|----------|---------|----------|
| [COST_ANALYSIS.md](./reference/COST_ANALYSIS.md) | OpenAI API costs and ROI analysis | Finance & Management |
| [MIGRATION_GUIDE.md](./reference/MIGRATION_GUIDE.md) | Moving from legacy to new system | Technical & Business |
| [FUTURE_ROADMAP.md](./reference/FUTURE_ROADMAP.md) | Post-launch roadmap and Prompts 22-25 | Planning |

## 🔬 Implementation Documentation

*Internal working documents in `./docs/imp/` - for implementation tracking.*

> **Note**: These documents were previously located in `@docs/claude/` and have been moved to `@shopping-assistant/docs/imp/` (renamed from 'claude' to 'imp'). These are working documents that may be updated or merged as the project evolves.

> **Update (25 June 2025)**: Several implementation documents have been consolidated to eliminate duplication and improve maintainability. The content from API_ROUTE_SUMMARY.md, CUSTOM_EXTENSIONS_SPEC.md, ERROR_HANDLING_INTEGRATION_TODOS.md, and VERIFICATION_INSIGHTS.md has been merged into the three primary implementation documents below.

| Document | Purpose | Location |
|----------|---------|----------|
| [IMPLEMENTATION_GUIDE.md](./imp/IMPLEMENTATION_GUIDE.md) | 28-prompt implementation roadmap (expanded with new prompts) | Working Docs |
| [ARCHITECTURE_AND_PATTERNS.md](./imp/ARCHITECTURE_AND_PATTERNS.md) | Validated patterns and designs (now includes API routes, B2B extensions, error handling) | Working Docs |
| [LEARNINGS_AND_ISSUES.md](./imp/LEARNINGS_AND_ISSUES.md) | Implementation discoveries and fixes (expanded with verification insights and failed approaches) | Working Docs |

### 🔄 API & Integration
API documentation and integration guides.

| Document | Purpose | Audience |
|----------|---------|----------|
| [API Routes](../apps/storefront-unified-nextjs/app/api/ai-shopping-assistant/) | API endpoint documentation | Backend Developers |
| [API Routes README](../apps/storefront-unified-nextjs/app/api/ai-shopping-assistant/README.md) | API implementation guide | Backend Developers |
| [Action Definitions](../config/ai-assistant-actions.json) | Available AI actions configuration | Developers |
| [Config README](../config/README.md) | Configuration documentation | Developers |
| [UDL Documentation](./unified-data-model/) | Unified Data Layer reference | Integration Developers |

### 🧩 Component & Module Documentation
Module-specific documentation and READMEs.

| Document | Purpose | Location |
|----------|---------|----------|
| [Storefront App README](../apps/storefront-unified-nextjs/README.md) | Next.js app documentation | Apps |
| [Playwright README](../apps/playwright/README.md) | E2E testing guide | Apps |
| [Playwright CONTRIBUTING](../apps/playwright/CONTRIBUTING.md) | Test contribution guide | Apps |
| [Frontend Summary](../apps/storefront-unified-nextjs/components/ai-shopping-assistant/FRONTEND_SUMMARY.md) | Frontend component overview | Components |
| [Test Summary](../apps/storefront-unified-nextjs/features/ai-shopping-assistant/testing/TEST_SUMMARY.md) | Testing overview and results | Features |
| [Errors README](../apps/storefront-unified-nextjs/features/ai-shopping-assistant/errors/README.md) | Error handling documentation | Features |
| [Graphs README](../apps/storefront-unified-nextjs/features/ai-shopping-assistant/graphs/README.md) | LangGraph implementation | Features |
| [Mocks README](../apps/storefront-unified-nextjs/features/ai-shopping-assistant/mocks/README.md) | Mock SDK documentation | Features |
| [Observability README](../apps/storefront-unified-nextjs/features/ai-shopping-assistant/observability/README.md) | Monitoring and logging | Features |
| [State README](../apps/storefront-unified-nextjs/features/ai-shopping-assistant/state/README.md) | State management docs | Features |

### 📝 Changelogs & Development
Version history and development setup documentation.

| Document | Purpose | Location |
|----------|---------|----------|
| [Middleware CHANGELOG](../apps/storefront-middleware/CHANGELOG.md) | Middleware version history | Apps |
| [Frontend CHANGELOG](../apps/storefront-unified-nextjs/CHANGELOG.md) | Frontend version history | Apps |
| [GitHub Copilot Instructions](../.github/copilot-instructions.md) | AI pair programming setup | GitHub |

## 📦 Additional Resources

### External Documents
*Strategic and planning documents in `./docs/external/`*

| Folder | Contents | Purpose |
|--------|----------|---------|
| `high_level/` | Strategic framework documents | Team alignment and planning |
| `imp/` | Implementation resources | LangGraph TypeScript guides |

### Unified Data Model Documentation
*Technical specifications in `./docs/unified-data-model/`*

Contains comprehensive UDL documentation including:
- Unified methods reference
- Platform-specific normalizers
- Integration guides
- Legacy version documentation

## 🗺️ Quick Navigation Guide

### For Business Users
1. Start with [FEATURE_SHOWCASE.md](./FEATURE_SHOWCASE.md) to see what's possible
2. Read [BUSINESS_USER_GUIDE.md](./BUSINESS_USER_GUIDE.md) to learn configuration
3. Review [COST_ANALYSIS.md](./reference/COST_ANALYSIS.md) for budget planning
4. Check [DEMO_VS_PRODUCTION.md](./DEMO_VS_PRODUCTION.md) to understand deployment options

### For Developers
1. Begin with [GETTING_STARTED.md](./GETTING_STARTED.md) for setup
2. Study [ARCHITECTURE.md](./reference/ARCHITECTURE.md) for system design
3. Follow [DEVELOPMENT_WORKFLOW.md](./reference/DEVELOPMENT_WORKFLOW.md) to add features
4. Use [AI_INTEGRATION_GUIDE.md](./reference/AI_INTEGRATION_GUIDE.md) for extensions

### For DevOps/Infrastructure
1. Review [INFRASTRUCTURE_GUIDE.md](./reference/INFRASTRUCTURE_GUIDE.md) for deployment
2. Optimize with [PERFORMANCE_TUNING.md](./reference/PERFORMANCE_TUNING.md)
3. Secure with [SECURITY_BEST_PRACTICES.md](./reference/SECURITY_BEST_PRACTICES.md)
4. Monitor using guidance in [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### For Project Managers
1. Check [PROJECT_STATUS.md](./PROJECT_STATUS.md) for current state
2. Review [IMPLEMENTATION_GUIDE.md](./imp/IMPLEMENTATION_GUIDE.md) for roadmap
3. Plan migration with [MIGRATION_GUIDE.md](./reference/MIGRATION_GUIDE.md)
4. Understand costs via [COST_ANALYSIS.md](./reference/COST_ANALYSIS.md)

## 📋 Document Status

### ✅ Completed (Verified June 2025)
- All core architecture documentation
- Configuration guides and cookbooks
- Security and performance documentation
- Business user guides
- Cost analysis and ROI

### 🔄 Living Documents (Regularly Updated)
- PROJECT_STATUS.md - Weekly updates
- TROUBLESHOOTING.md - As issues discovered
- CONFIGURATION_COOKBOOK.md - New patterns added
- LEARNINGS_AND_ISSUES.md - Ongoing discoveries

### 📅 Planned Documentation
- PRODUCTION_DEPLOYMENT_GUIDE.md - After Prompt 22-23
- MONITORING_PLAYBOOK.md - With production metrics
- ADVANCED_AI_PATTERNS.md - After more usage data
- VIDEO_TUTORIALS.md - Screen recordings planned

## 🔍 Finding Information

### By Topic
- **Setup & Installation**: GETTING_STARTED.md
- **How It Works**: ARCHITECTURE.md, DEMO_VS_PRODUCTION.md
- **Adding Features**: DEVELOPMENT_WORKFLOW.md, AI_INTEGRATION_GUIDE.md
- **Configuration**: CONFIGURATION_COOKBOOK.md, BUSINESS_USER_GUIDE.md
- **Performance**: PERFORMANCE_TUNING.md, COST_ANALYSIS.md
- **Security**: SECURITY_BEST_PRACTICES.md
- **Deployment**: INFRASTRUCTURE_GUIDE.md
- **Problems**: TROUBLESHOOTING.md
- **Planning**: PROJECT_STATUS.md, MIGRATION_GUIDE.md

### By Role
- **Business Owner**: FEATURE_SHOWCASE → BUSINESS_USER_GUIDE → COST_ANALYSIS
- **Developer**: GETTING_STARTED → ARCHITECTURE → DEVELOPMENT_WORKFLOW
- **DevOps**: INFRASTRUCTURE_GUIDE → PERFORMANCE_TUNING → SECURITY_BEST_PRACTICES
- **Support**: TROUBLESHOOTING → DEMO_VS_PRODUCTION → BUSINESS_USER_GUIDE

## 📝 Documentation Standards

All documentation follows these standards:
- **Markdown Format**: GitHub-flavored markdown
- **Clear Headers**: Hierarchical structure with TOC
- **Code Examples**: Practical, working examples
- **Visual Aids**: Diagrams where helpful
- **Version Info**: Last updated date
- **Audience**: Clearly stated target audience

## 🤝 Contributing to Documentation

To add or update documentation:
1. Follow the existing format and standards
2. Include practical examples
3. Update this index
4. Add to appropriate category
5. Include "Last Updated" date
6. Get review from relevant team

### 📊 Documentation Stats
- **Essential Docs**: 7 (what humans actually read)
- **Reference Docs**: 10 (comprehensive guides for deep dives)
- **Working Docs**: 3 (implementation tracking - consolidated from 7)
- **Component/Module Docs**: 10 (module-specific READMEs)
- **Changelogs/Dev**: 3 (version history and dev setup)
- **API/Config**: 2 (implementation guides)
- **Total**: 35 documents (plus external and UDL docs)

💡 **Pro Tip**: If you're human, you probably only need the 7 essential docs. The reference folder is there when you need specifics.

---

📧 **Questions?** Contact the AI Assistant team or check the [main README](../README.md) for support channels.