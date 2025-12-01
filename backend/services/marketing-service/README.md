# Marketing Service

Marketing and campaign management service for MetaPharm Connect. Enables pharmacists to create, manage, and track marketing campaigns across multiple channels with support for promotions, A/B testing, and detailed analytics.

## Features

### Campaign Management
- **Multi-channel campaigns**: Email, SMS, In-app notifications, Push notifications
- **Scheduling & Automation**: Schedule campaigns in advance with recurring patterns
- **Targeting**: Advanced audience targeting with demographic and behavioral rules
- **A/B Testing**: Test campaign variants and track performance differences
- **Campaign Analytics**: Track opens, clicks, conversions, bounces, and more
- **Campaign Templates**: Reusable templates with variable substitution

### Promotion Management
- **Multiple Promotion Types**:
  - Percentage discounts
  - Fixed amount discounts
  - Buy X Get Y offers
  - Free shipping
  - Loyalty points bonuses
- **Validation**: Real-time promotion code validation with business rules
- **Usage Limits**: Control total usage and per-customer usage limits
- **Eligibility Rules**: Target specific customer segments

### Campaign Analytics & Reporting
- **Engagement Metrics**: Open rates, click rates, conversion rates
- **Device & Geographic Data**: Understand audience reach and preferences
- **Conversion Tracking**: Monitor purchase conversions from campaigns
- **Trend Analysis**: Track campaign performance over time
- **Link Tracking**: See which links generate the most engagement

## API Endpoints

### Campaigns
```
POST   /pharmacies/:pharmacyId/campaigns           - Create campaign
GET    /campaigns/:campaignId                      - Get campaign details
GET    /pharmacies/:pharmacyId/campaigns           - List campaigns (with optional status filter)
PUT    /campaigns/:campaignId                      - Update campaign
DELETE /campaigns/:campaignId                      - Delete campaign
POST   /campaigns/:campaignId/execute              - Start sending campaign
GET    /campaigns/:campaignId/analytics            - Get campaign analytics
```

### Promotions
```
POST   /pharmacies/:pharmacyId/promotions          - Create promotion
GET    /promotions/:promotionId                    - Get promotion details
GET    /pharmacies/:pharmacyId/promotions          - List promotions
POST   /promotions/validate/:code                  - Validate promotion code
PUT    /promotions/:promotionId                    - Update promotion
DELETE /promotions/:promotionId                    - Delete promotion
```

### Templates
```
POST   /pharmacies/:pharmacyId/templates           - Create template
GET    /templates/:templateId                      - Get template details
GET    /pharmacies/:pharmacyId/templates           - List templates
PUT    /templates/:templateId                      - Update template
POST   /templates/:templateId/render               - Render template with variables
DELETE /templates/:templateId                      - Delete template
```

## Installation

```bash
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials and service configuration.

## Running the Service

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Watch Mode
```bash
npm run dev
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch

# With coverage
npm test -- --coverage
```

## Linting

```bash
# Check for linting issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

## Database Schema

### Campaigns Table
- **id**: UUID primary key
- **pharmacyId**: Pharmacy identifier
- **name**: Campaign name
- **type**: EMAIL, SMS, IN_APP, PUSH
- **status**: DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED
- **subject**: Campaign subject/title
- **content**: Campaign message body
- **targetAudience**: Array of audience segments
- **targetingRules**: JSON with demographic/behavioral rules
- **scheduledAt**: When to send campaign
- **startDate/endDate**: Campaign active period
- **metrics**: Open count, click count, conversion count, etc.
- **createdAt/updatedAt**: Timestamps

### Promotions Table
- **id**: UUID primary key
- **pharmacyId**: Pharmacy identifier
- **code**: Unique promotion code
- **type**: PERCENTAGE_DISCOUNT, FIXED_AMOUNT, BUY_X_GET_Y, FREE_SHIPPING, LOYALTY_POINTS
- **status**: ACTIVE, INACTIVE, EXPIRED, ARCHIVED
- **startDate/expiryDate**: Promotion validity period
- **discountValue**: Amount or percentage
- **eligibilityRules**: Customer eligibility conditions
- **usedCount**: Number of times used
- **maxUsageCount**: Usage limit

### Templates Table
- **id**: UUID primary key
- **pharmacyId**: Pharmacy identifier
- **name**: Template name
- **channel**: EMAIL, SMS, IN_APP, PUSH
- **subject**: For email/push notifications
- **body**: Template text content
- **htmlContent**: HTML version for emails
- **variables**: Array of template variables like {{firstName}}, {{discount}}
- **metadata**: Additional template configuration

### Campaign Analytics Table
- **id**: UUID primary key
- **campaignId**: Reference to campaign
- **recipientId**: Recipient user ID
- **sent**: Whether message was sent successfully
- **opened**: Whether message was opened
- **clicked**: Whether any link was clicked
- **converted**: Whether conversion happened
- **conversionValue**: Revenue from conversion
- **bounced**: Whether email bounced
- **unsubscribed**: Whether recipient unsubscribed
- **deviceType**: mobile, desktop, tablet
- **country/city**: Geographic information

## Campaign Types

### Email Campaigns
- HTML and plain text support
- Subject lines
- Unsubscribe links
- Tracking pixels for opens
- Link tracking for clicks

### SMS Campaigns
- Character-limited messages
- Delivery tracking
- Opt-in/opt-out compliance

### In-App Notifications
- Rich message content
- Deep linking
- Impression tracking

### Push Notifications
- Title and body
- Deep linking
- Device token management

## Promotion Types

### Percentage Discount
Discount as percentage of order total
- Example: 20% off

### Fixed Amount Discount
Flat discount amount in currency
- Example: CHF 10 off

### Buy X Get Y
Quantity-based promotions
- Example: Buy 2 get 1 free

### Free Shipping
Waive shipping costs
- Used for orders meeting minimum amount

### Loyalty Points Bonus
Extra loyalty points
- Example: Double points on orders

## A/B Testing

Create campaign variants to test different approaches:

```json
{
  "aBTestConfig": {
    "enabled": true,
    "variants": [
      {
        "id": "variant-a",
        "name": "Urgent offer",
        "subject": "Limited time: 20% off ends tonight!",
        "content": "...",
        "percentage": 50
      },
      {
        "id": "variant-b",
        "name": "Personal offer",
        "subject": "We saved 20% just for you",
        "content": "...",
        "percentage": 50
      }
    ]
  }
}
```

## Error Handling

The service returns appropriate HTTP status codes:

- **200**: Success
- **201**: Resource created
- **400**: Bad request / validation error
- **404**: Resource not found
- **500**: Internal server error

Error responses include:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Performance Considerations

- **Batch Operations**: Send campaigns in batches for better performance
- **Indexes**: Database indexes on pharmacyId, campaignId, recipientId, timestamps
- **Caching**: Template and promotion caching for frequently used items
- **Analytics**: Analytics data is aggregated incrementally

## Security

- **Data Privacy**: Customer data handled according to GDPR/HIPAA
- **Validation**: All inputs validated before processing
- **SQL Injection Prevention**: Parameterized queries via TypeORM
- **Rate Limiting**: Recommended to implement rate limiting at API gateway

## Architecture

```
src/
├── entities/              # TypeORM entities
│   ├── Campaign.ts
│   ├── Promotion.ts
│   ├── CampaignTemplate.ts
│   └── CampaignAnalytics.ts
├── services/              # Business logic
│   ├── campaign.service.ts
│   ├── promotion.service.ts
│   ├── template.service.ts
│   └── analytics.service.ts
├── controllers/           # HTTP request handlers
│   └── marketing.controller.ts
├── routes/                # API route definitions
│   └── marketing.routes.ts
├── config/                # Configuration
│   └── database.ts
├── types/                 # TypeScript types
│   └── marketing.types.ts
└── __tests__/             # Unit tests
```

## Contributing

1. Create a feature branch
2. Follow TypeScript/linting rules
3. Write tests for new features
4. Submit pull request with description

## License

Private - MetaPharm Connect
