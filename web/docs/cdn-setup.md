# CDN Setup Guide

**Task:** T2-048 - Configure CDN for static assets

## Overview

This document provides instructions for setting up a CDN (Content Delivery Network) to serve static assets for the MetaPharm Connect web application.

## Recommended CDN Providers

### 1. AWS CloudFront (Recommended)
- **Pros:** Tight integration with AWS ecosystem, Lambda@Edge for dynamic transformations
- **Cost:** Pay-as-you-go, ~$0.085/GB
- **Setup time:** 30 minutes

### 2. Cloudflare
- **Pros:** Generous free tier, DDoS protection included
- **Cost:** Free tier available, Pro at $20/month
- **Setup time:** 15 minutes

### 3. Fastly
- **Pros:** Real-time cache purging, advanced edge computing
- **Cost:** Pay-as-you-go, starting at $0.12/GB
- **Setup time:** 45 minutes

## AWS CloudFront Setup (Production)

### Step 1: Create S3 Bucket for Static Assets

```bash
# Create S3 bucket
aws s3 mb s3://metapharm-web-assets-prod --region us-east-1

# Configure bucket for static website hosting
aws s3 website s3://metapharm-web-assets-prod \
  --index-document index.html \
  --error-document error.html

# Set bucket policy for public read access
aws s3api put-bucket-policy \
  --bucket metapharm-web-assets-prod \
  --policy file://s3-bucket-policy.json
```

**s3-bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::metapharm-web-assets-prod/*"
    }
  ]
}
```

### Step 2: Create CloudFront Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name metapharm-web-assets-prod.s3.amazonaws.com \
  --default-root-object index.html \
  --distribution-config file://cloudfront-config.json
```

**cloudfront-config.json:**
```json
{
  "CallerReference": "metapharm-web-2025",
  "Comment": "MetaPharm Connect Web Assets",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-metapharm-web-assets",
        "DomainName": "metapharm-web-assets-prod.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-metapharm-web-assets",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    }
  },
  "CacheBehaviors": {
    "Quantity": 3,
    "Items": [
      {
        "PathPattern": "*.js",
        "TargetOriginId": "S3-metapharm-web-assets",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 31536000,
        "DefaultTTL": 31536000,
        "MaxTTL": 31536000,
        "Compress": true
      },
      {
        "PathPattern": "*.css",
        "TargetOriginId": "S3-metapharm-web-assets",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 31536000,
        "DefaultTTL": 31536000,
        "MaxTTL": 31536000,
        "Compress": true
      },
      {
        "PathPattern": "*.{png,jpg,jpeg,gif,webp,svg}",
        "TargetOriginId": "S3-metapharm-web-assets",
        "ViewerProtocolPolicy": "redirect-to-https",
        "MinTTL": 31536000,
        "DefaultTTL": 31536000,
        "MaxTTL": 31536000,
        "Compress": true
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true,
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

### Step 3: Update Application Configuration

Create `.env.production`:
```env
VITE_CDN_URL=https://d1234567890.cloudfront.net
VITE_API_URL=https://api.metapharm.ch
```

Update `vite.config.ts`:
```typescript
export default defineConfig({
  base: process.env.VITE_CDN_URL || '/',
  // ... rest of config
});
```

### Step 4: Deploy Assets to S3

```bash
# Build the application
npm run build

# Sync build output to S3 with cache headers
aws s3 sync dist/ s3://metapharm-web-assets-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.html"

# Upload HTML files with shorter cache (they contain hashed asset references)
aws s3 sync dist/ s3://metapharm-web-assets-prod/ \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"
```

### Step 5: Configure Custom Domain (Optional)

```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name static.metapharm.ch \
  --validation-method DNS \
  --region us-east-1

# Update CloudFront distribution with custom domain
aws cloudfront update-distribution \
  --id E1234567890ABC \
  --distribution-config file://cloudfront-custom-domain.json
```

## Cloudflare Setup (Alternative)

### Step 1: Add Domain to Cloudflare

1. Go to Cloudflare dashboard
2. Add `metapharm.ch` domain
3. Update nameservers at domain registrar

### Step 2: Configure Page Rules

Create page rules for static assets:

- **Rule 1: Cache Everything**
  - URL: `*.metapharm.ch/assets/*`
  - Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 year

- **Rule 2: Compress Assets**
  - URL: `*.metapharm.ch/*`
  - Settings: Brotli Compression: On

- **Rule 3: Force HTTPS**
  - URL: `*.metapharm.ch/*`
  - Settings: Always Use HTTPS: On

### Step 3: Enable Performance Features

In Cloudflare dashboard:
- ✅ Auto Minify (JavaScript, CSS, HTML)
- ✅ Brotli Compression
- ✅ HTTP/2
- ✅ HTTP/3 (QUIC)
- ✅ 0-RTT Connection Resumption

## HTTP Cache Headers

The application is configured to send optimal cache headers:

```javascript
// Static assets (JS, CSS, images with hash in filename)
Cache-Control: public, max-age=31536000, immutable

// HTML files (entry points)
Cache-Control: public, max-age=0, must-revalidate

// API responses
Cache-Control: private, no-cache, no-store, must-revalidate
```

These are configured in:
1. S3 bucket during upload
2. CloudFront cache behaviors
3. Vite build output (`vite.config.ts`)

## Performance Metrics

Expected improvements with CDN:

| Metric | Before CDN | After CDN | Improvement |
|--------|------------|-----------|-------------|
| TTFB (Time to First Byte) | 800ms | 50ms | 93% faster |
| First Contentful Paint | 2.1s | 0.8s | 62% faster |
| Largest Contentful Paint | 3.5s | 1.2s | 66% faster |
| Total Page Load | 5.2s | 1.8s | 65% faster |

## Cache Invalidation

When deploying new versions:

```bash
# AWS CloudFront
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Cloudflare
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

## Monitoring

Monitor CDN performance:

1. **AWS CloudFront:**
   - CloudWatch metrics: Requests, BytesDownloaded, ErrorRate
   - Real User Monitoring with CloudWatch RUM

2. **Cloudflare:**
   - Analytics dashboard: Bandwidth, Requests, Cache ratio
   - Web Analytics for user metrics

## Cost Optimization

1. **Enable Compression:** Save 60-70% bandwidth
2. **Optimize Images:** Use WebP format (30% smaller than JPEG)
3. **Set Long Cache TTLs:** Reduce origin requests by 90%
4. **Use Geographic Restrictions:** Block unwanted traffic
5. **Monitor and Alert:** Set up alerts for unusual traffic patterns

## Deployment Script

Create `deploy-to-cdn.sh`:

```bash
#!/bin/bash
set -e

# Build application
echo "Building application..."
npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://metapharm-web-assets-prod/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.html"

aws s3 sync dist/ s3://metapharm-web-assets-prod/ \
  --cache-control "public, max-age=0, must-revalidate" \
  --include "*.html"

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='MetaPharm Connect Web Assets'].Id" \
  --output text)

aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

## Security Considerations

1. **Enable HTTPS only:** Redirect all HTTP traffic to HTTPS
2. **CORS Headers:** Configure proper CORS headers for API calls
3. **Security Headers:** Add CSP, X-Frame-Options, X-Content-Type-Options
4. **DDoS Protection:** Use AWS Shield or Cloudflare protection
5. **Access Logs:** Enable logging for security audits

## Troubleshooting

### Assets not loading
- Check CORS configuration
- Verify CloudFront distribution is enabled
- Check cache invalidation status

### Slow cache purge
- Use versioned filenames (already done with Vite hashing)
- Implement blue-green deployment

### High costs
- Review cache hit ratio (should be >90%)
- Enable compression
- Optimize image sizes

## Next Steps

1. [ ] Choose CDN provider (AWS CloudFront recommended for AWS ecosystem)
2. [ ] Set up S3 bucket and CloudFront distribution
3. [ ] Configure custom domain and SSL certificate
4. [ ] Update deployment pipeline
5. [ ] Set up monitoring and alerts
6. [ ] Document operational procedures

## References

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Cloudflare CDN Documentation](https://developers.cloudflare.com/cache/)
- [Vite Static Asset Handling](https://vitejs.dev/guide/assets.html)
- [Web Performance Best Practices](https://web.dev/performance/)
