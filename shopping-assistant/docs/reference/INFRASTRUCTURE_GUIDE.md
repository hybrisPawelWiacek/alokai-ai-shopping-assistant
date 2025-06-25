# Infrastructure & Deployment Guide

*Version: v1.0*  
*Last Updated: 25 June 2025*

This guide covers deploying the AI Shopping Assistant to various environments and infrastructure requirements.

## Table of Contents
1. [Infrastructure Requirements](#infrastructure-requirements)
2. [Deployment Options](#deployment-options)
3. [Environment Configuration](#environment-configuration)
4. [Production Deployment](#production-deployment)
5. [Monitoring & Observability](#monitoring--observability)
6. [Scaling Considerations](#scaling-considerations)
7. [Disaster Recovery](#disaster-recovery)
8. [Cost Optimization](#cost-optimization)

## Infrastructure Requirements

### Minimum Requirements

#### Frontend (Next.js Application)
```yaml
CPU: 2 vCPUs
Memory: 2GB RAM
Storage: 10GB SSD
Node.js: 18.x or higher
Network: SSE support required
```

#### Middleware (Alokai Middleware)
```yaml
CPU: 4 vCPUs
Memory: 4GB RAM
Storage: 20GB SSD
Node.js: 18.x or higher
Redis: 6.x (optional but recommended)
```

#### External Services
```yaml
OpenAI API: GPT-4 or GPT-3.5 access
Commerce Backend: SAP CC, Shopify, etc.
CDN: CloudFlare or similar (recommended)
Monitoring: Datadog, New Relic, or similar
```

### Recommended Production Setup

```mermaid
graph TB
    subgraph "Edge Network"
        CDN[CloudFlare CDN]
        WAF[Web Application Firewall]
    end
    
    subgraph "Application Layer"
        LB[Load Balancer]
        FE1[Frontend Instance 1]
        FE2[Frontend Instance 2]
        MW1[Middleware Instance 1]
        MW2[Middleware Instance 2]
    end
    
    subgraph "Data Layer"
        Redis[Redis Cache]
        PG[PostgreSQL]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI API]
        Backend[Commerce Backend]
        S3[Object Storage]
    end
    
    CDN --> WAF
    WAF --> LB
    LB --> FE1
    LB --> FE2
    FE1 --> MW1
    FE2 --> MW2
    MW1 --> Redis
    MW2 --> Redis
    MW1 --> PG
    MW2 --> PG
    MW1 --> OpenAI
    MW2 --> Backend
```

## Deployment Options

### Option 1: Vercel + GCP Cloud Run (Recommended)

#### Frontend on Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd apps/storefront-unified-nextjs
vercel --prod

# Environment variables to set in Vercel
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=https://middleware.your-domain.com
NEXT_PUBLIC_ALOKAI_MULTISTORE_ENABLED=false
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
OPENAI_API_KEY=sk-...
```

#### Middleware on GCP Cloud Run
```dockerfile
# Dockerfile for middleware
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/storefront-middleware/package*.json ./apps/storefront-middleware/

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY apps/storefront-middleware ./apps/storefront-middleware

# Build
RUN npm run build:middleware

# Expose port
EXPOSE 4000

# Start server
CMD ["npm", "run", "start:middleware"]
```

```bash
# Deploy to Cloud Run
gcloud run deploy ai-shopping-middleware \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,REDIS_URL=redis://..."
```

### Option 2: AWS ECS Fargate

#### Task Definition
```json
{
  "family": "ai-shopping-assistant",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-registry/ai-assistant-frontend:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "OPENAI_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:openai-key"
        }
      ]
    }
  ]
}
```

### Option 3: Kubernetes (GKE/EKS/AKS)

#### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-assistant-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-assistant-frontend
  template:
    metadata:
      labels:
        app: ai-assistant-frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/project/ai-assistant-frontend:v1.0.0
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-assistant-secrets
              key: openai-api-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: ai-assistant-frontend
spec:
  selector:
    app: ai-assistant-frontend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Environment Configuration

### Development Environment
```bash
# .env.development
NODE_ENV=development
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=http://localhost:4000
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_AI_ASSISTANT_DEBUG=true
OPENAI_API_KEY=sk-development-key
LOG_LEVEL=debug
```

### Staging Environment
```bash
# .env.staging
NODE_ENV=staging
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=https://staging-middleware.your-domain.com
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
OPENAI_API_KEY=sk-staging-key
REDIS_URL=redis://staging-redis:6379
DATABASE_URL=postgresql://user:pass@staging-db:5432/ai_assistant
LOG_LEVEL=info
SENTRY_DSN=https://staging@sentry.io/project
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_ALOKAI_MIDDLEWARE_URL=https://middleware.your-domain.com
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
OPENAI_API_KEY=${SECRET_OPENAI_API_KEY}
REDIS_URL=${SECRET_REDIS_URL}
DATABASE_URL=${SECRET_DATABASE_URL}
LOG_LEVEL=warn
SENTRY_DSN=${SECRET_SENTRY_DSN}
DD_API_KEY=${SECRET_DATADOG_API_KEY}
```

## Production Deployment

### Pre-Deployment Checklist

```bash
#!/bin/bash
# pre-deploy.sh

echo "🔍 Running pre-deployment checks..."

# 1. Run tests
echo "Running tests..."
yarn test:all || exit 1

# 2. Build check
echo "Building application..."
yarn build || exit 1

# 3. Security audit
echo "Running security audit..."
yarn audit --level=high || exit 1

# 4. Environment check
echo "Checking environment variables..."
./scripts/check-env.sh || exit 1

# 5. Database migrations
echo "Running migrations..."
yarn migrate:up || exit 1

echo "✅ All checks passed!"
```

### Deployment Script

```bash
#!/bin/bash
# deploy.sh

ENVIRONMENT=$1
VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$VERSION" ]; then
  echo "Usage: ./deploy.sh <environment> <version>"
  exit 1
fi

echo "🚀 Deploying version $VERSION to $ENVIRONMENT..."

# 1. Build and tag images
docker build -t ai-assistant-frontend:$VERSION -f Dockerfile.frontend .
docker build -t ai-assistant-middleware:$VERSION -f Dockerfile.middleware .

# 2. Push to registry
docker tag ai-assistant-frontend:$VERSION gcr.io/project/ai-assistant-frontend:$VERSION
docker tag ai-assistant-middleware:$VERSION gcr.io/project/ai-assistant-middleware:$VERSION
docker push gcr.io/project/ai-assistant-frontend:$VERSION
docker push gcr.io/project/ai-assistant-middleware:$VERSION

# 3. Deploy to Kubernetes
kubectl set image deployment/ai-assistant-frontend frontend=gcr.io/project/ai-assistant-frontend:$VERSION
kubectl set image deployment/ai-assistant-middleware middleware=gcr.io/project/ai-assistant-middleware:$VERSION

# 4. Wait for rollout
kubectl rollout status deployment/ai-assistant-frontend
kubectl rollout status deployment/ai-assistant-middleware

# 5. Run smoke tests
yarn test:smoke --env=$ENVIRONMENT

echo "✅ Deployment complete!"
```

### Blue-Green Deployment

```yaml
# blue-green-deploy.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-assistant-frontend
spec:
  selector:
    app: ai-assistant-frontend
    version: blue  # Switch to green for deployment
  ports:
  - port: 80
    targetPort: 3000
```

## Monitoring & Observability

### Application Metrics

```typescript
// Setup Prometheus metrics
import { register, Counter, Histogram } from 'prom-client';

export const metrics = {
  requestCount: new Counter({
    name: 'ai_assistant_requests_total',
    help: 'Total number of AI assistant requests',
    labelNames: ['action', 'status']
  }),
  
  requestDuration: new Histogram({
    name: 'ai_assistant_request_duration_seconds',
    help: 'Duration of AI assistant requests',
    labelNames: ['action'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  
  tokenUsage: new Counter({
    name: 'ai_assistant_tokens_total',
    help: 'Total tokens used',
    labelNames: ['model', 'type']
  })
};
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "AI Shopping Assistant",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [{
          "expr": "rate(ai_assistant_requests_total[5m])"
        }]
      },
      {
        "title": "Response Time (P95)",
        "targets": [{
          "expr": "histogram_quantile(0.95, ai_assistant_request_duration_seconds)"
        }]
      },
      {
        "title": "Error Rate",
        "targets": [{
          "expr": "rate(ai_assistant_requests_total{status='error'}[5m])"
        }]
      },
      {
        "title": "Token Usage",
        "targets": [{
          "expr": "rate(ai_assistant_tokens_total[1h])"
        }]
      }
    ]
  }
}
```

### Logging Configuration

```typescript
// Winston logging setup
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'ai-assistant' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.Http({
      host: 'logs.your-domain.com',
      port: 443,
      path: '/collect'
    })
  ]
});
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: await checkDatabase(),
    redis: await checkRedis(),
    openai: await checkOpenAI(),
    middleware: await checkMiddleware()
  };
  
  const allHealthy = Object.values(checks).every(status => status === 'ok');
  
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-assistant-frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-assistant-frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: ai_assistant_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
```

### Caching Strategy

```typescript
// Multi-level caching
const cacheConfig = {
  // L1: In-memory cache (fastest, limited size)
  memory: {
    max: 1000,
    ttl: 300 // 5 minutes
  },
  
  // L2: Redis cache (fast, larger size)
  redis: {
    ttl: 3600, // 1 hour
    keyPrefix: 'ai:assistant:'
  },
  
  // L3: CDN cache (for static responses)
  cdn: {
    public: true,
    maxAge: 86400, // 24 hours
    sMaxAge: 3600  // 1 hour at edge
  }
};
```

### Rate Limiting

```typescript
// Configure rate limiting
const rateLimitConfig = {
  // Global rate limit
  global: {
    windowMs: 60 * 1000, // 1 minute
    max: 1000 // requests per window
  },
  
  // Per-user rate limit
  user: {
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => req.user?.id || req.ip
  },
  
  // AI-specific rate limit
  ai: {
    windowMs: 60 * 1000,
    max: 30,
    skipSuccessfulRequests: false
  }
};
```

## Disaster Recovery

### Backup Strategy

```bash
#!/bin/bash
# backup.sh

# 1. Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d-%H%M%S).sql

# 2. Redis backup
redis-cli --rdb backup-redis-$(date +%Y%m%d-%H%M%S).rdb

# 3. Configuration backup
tar -czf config-backup-$(date +%Y%m%d-%H%M%S).tar.gz config/

# 4. Upload to S3
aws s3 cp backup-*.sql s3://backups/ai-assistant/
aws s3 cp backup-*.rdb s3://backups/ai-assistant/
aws s3 cp config-*.tar.gz s3://backups/ai-assistant/
```

### Recovery Procedures

```bash
#!/bin/bash
# restore.sh

BACKUP_DATE=$1

# 1. Restore database
psql $DATABASE_URL < s3://backups/ai-assistant/backup-$BACKUP_DATE.sql

# 2. Restore Redis
redis-cli --rdb s3://backups/ai-assistant/backup-redis-$BACKUP_DATE.rdb

# 3. Restore configuration
aws s3 cp s3://backups/ai-assistant/config-$BACKUP_DATE.tar.gz .
tar -xzf config-$BACKUP_DATE.tar.gz

# 4. Restart services
kubectl rollout restart deployment/ai-assistant-frontend
kubectl rollout restart deployment/ai-assistant-middleware
```

### Failover Configuration

```yaml
# Multi-region failover
regions:
  primary:
    name: us-central1
    endpoints:
      frontend: https://us-central1.your-domain.com
      middleware: https://api-us-central1.your-domain.com
  secondary:
    name: europe-west1
    endpoints:
      frontend: https://europe-west1.your-domain.com
      middleware: https://api-europe-west1.your-domain.com
  
failover:
  healthCheckInterval: 30s
  failoverThreshold: 3
  automatic: true
```

## Cost Optimization

### Resource Optimization

```yaml
# Right-sizing recommendations
development:
  frontend:
    cpu: 0.5
    memory: 1Gi
  middleware:
    cpu: 1
    memory: 2Gi

staging:
  frontend:
    cpu: 1
    memory: 2Gi
  middleware:
    cpu: 2
    memory: 4Gi

production:
  frontend:
    cpu: 2
    memory: 4Gi
    minReplicas: 2
    maxReplicas: 10
  middleware:
    cpu: 4
    memory: 8Gi
    minReplicas: 2
    maxReplicas: 5
```

### Cost Monitoring

```typescript
// Track costs per feature
const costTracking = {
  openai: {
    track: ['tokens', 'requests', 'model'],
    alert: { threshold: 100, period: 'daily' }
  },
  infrastructure: {
    track: ['cpu', 'memory', 'bandwidth'],
    alert: { threshold: 500, period: 'monthly' }
  },
  storage: {
    track: ['redis', 'database', 's3'],
    alert: { threshold: 50, period: 'monthly' }
  }
};
```

### Optimization Strategies

1. **Caching**: Reduce OpenAI API calls by 40-60%
2. **Model Selection**: Use GPT-3.5 for simple queries
3. **Request Batching**: Combine similar requests
4. **Static Generation**: Pre-generate common responses
5. **Edge Caching**: Use CDN for repeated queries

## Security Hardening

### Network Security

```yaml
# Network policies
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-assistant-network-policy
spec:
  podSelector:
    matchLabels:
      app: ai-assistant
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: redis
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 443  # HTTPS only
```

### Secrets Management

```bash
# Using Google Secret Manager
gcloud secrets create openai-api-key --data-file=key.txt
gcloud secrets add-iam-policy-binding openai-api-key \
  --member=serviceAccount:ai-assistant@project.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

## Maintenance

### Regular Tasks

```yaml
daily:
  - health_checks
  - backup_verification
  - log_rotation
  - metric_review

weekly:
  - security_patches
  - dependency_updates
  - performance_review
  - cost_analysis

monthly:
  - disaster_recovery_test
  - capacity_planning
  - security_audit
  - documentation_update
```

### Update Procedures

```bash
#!/bin/bash
# update.sh

# 1. Update dependencies
yarn upgrade-interactive

# 2. Run tests
yarn test:all

# 3. Build new version
yarn build

# 4. Deploy to staging
./deploy.sh staging v$(date +%Y%m%d-%H%M%S)

# 5. Run integration tests
yarn test:integration --env=staging

# 6. Deploy to production
./deploy.sh production v$(date +%Y%m%d-%H%M%S)
```

---

💡 **Key Takeaway**: Start with a simple deployment (Vercel + Cloud Run) and scale based on actual usage. The architecture supports growth from 100 to 1M+ users with minimal changes.