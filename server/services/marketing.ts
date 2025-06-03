import { db } from "../db";
import { 
  marketingCampaigns, 
  campaignAnalytics,
  customerOrders,
  newsletterSegments,
  newsletterCampaigns,
  type MarketingCampaign, 
  type InsertMarketingCampaign,
  type CampaignAnalytics 
} from "@shared/schema";
import { eq, and, gte, lte, desc, sql, sum } from "drizzle-orm";

export interface CampaignPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  clickThroughRate: number;
  conversionRate: number;
  costPerClick: number;
  returnOnAdSpend: number;
}

export interface TrackingPixelData {
  campaignId: number;
  visitorId: string;
  event: 'impression' | 'click' | 'conversion' | 'purchase';
  value?: number;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export class MarketingService {
  /**
   * Creates a new marketing campaign
   */
  static async createCampaign(campaignData: InsertMarketingCampaign): Promise<MarketingCampaign> {
    const [campaign] = await db
      .insert(marketingCampaigns)
      .values(campaignData)
      .returning();

    return campaign;
  }

  /**
   * Gets all campaigns for a tenant
   */
  static async getCampaigns(tenantId: number): Promise<MarketingCampaign[]> {
    return await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.tenantId, tenantId))
      .orderBy(desc(marketingCampaigns.createdAt));
  }

  /**
   * Gets campaign by ID
   */
  static async getCampaign(campaignId: number): Promise<MarketingCampaign | null> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId))
      .limit(1);

    return campaign || null;
  }

  /**
   * Tracks campaign event (impression, click, conversion, purchase)
   */
  static async trackEvent(data: TrackingPixelData): Promise<void> {
    await db
      .insert(campaignAnalytics)
      .values({
        tenantId: 0, // Will be set from campaign
        campaignId: data.campaignId,
        visitorId: data.visitorId,
        event: data.event,
        value: data.value?.toString(),
        metadata: data.metadata,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrer: data.referrer,
      });

    // Update campaign counters
    const updateData: any = {};
    
    switch (data.event) {
      case 'impression':
        updateData.impressions = sql`${marketingCampaigns.impressions} + 1`;
        break;
      case 'click':
        updateData.clicks = sql`${marketingCampaigns.clicks} + 1`;
        break;
      case 'conversion':
        updateData.conversions = sql`${marketingCampaigns.conversions} + 1`;
        break;
      case 'purchase':
        updateData.conversions = sql`${marketingCampaigns.conversions} + 1`;
        updateData.revenue = sql`${marketingCampaigns.revenue} + ${data.value || 0}`;
        break;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      
      await db
        .update(marketingCampaigns)
        .set(updateData)
        .where(eq(marketingCampaigns.id, data.campaignId));
    }
  }

  /**
   * Gets campaign performance metrics
   */
  static async getCampaignPerformance(campaignId: number): Promise<CampaignPerformance> {
    const [campaign] = await db
      .select()
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    const impressions = campaign.impressions;
    const clicks = campaign.clicks;
    const conversions = campaign.conversions;
    const revenue = parseFloat(campaign.revenue);
    const spent = parseFloat(campaign.spent);

    const clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const costPerClick = clicks > 0 ? spent / clicks : 0;
    const returnOnAdSpend = spent > 0 ? (revenue / spent) * 100 : 0;

    return {
      impressions,
      clicks,
      conversions,
      revenue,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      costPerClick: Math.round(costPerClick * 100) / 100,
      returnOnAdSpend: Math.round(returnOnAdSpend * 100) / 100,
    };
  }

  /**
   * Updates campaign spending
   */
  static async updateCampaignSpent(campaignId: number, amount: number): Promise<void> {
    await db
      .update(marketingCampaigns)
      .set({
        spent: sql`${marketingCampaigns.spent} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, campaignId));
  }

  /**
   * Gets campaign analytics data
   */
  static async getCampaignAnalytics(
    campaignId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<CampaignAnalytics[]> {
    let query = db
      .select()
      .from(campaignAnalytics)
      .where(eq(campaignAnalytics.campaignId, campaignId));

    if (startDate) {
      query = query.where(gte(campaignAnalytics.createdAt, startDate));
    }

    if (endDate) {
      query = query.where(lte(campaignAnalytics.createdAt, endDate));
    }

    return await query.orderBy(desc(campaignAnalytics.createdAt));
  }

  /**
   * Generates UTM tracking URL
   */
  static generateTrackingUrl(
    baseUrl: string,
    campaign: MarketingCampaign,
    additionalParams?: Record<string, string>
  ): string {
    const url = new URL(baseUrl);
    
    if (campaign.utmSource) url.searchParams.set('utm_source', campaign.utmSource);
    if (campaign.utmMedium) url.searchParams.set('utm_medium', campaign.utmMedium);
    if (campaign.utmCampaign) url.searchParams.set('utm_campaign', campaign.utmCampaign);
    if (campaign.utmTerm) url.searchParams.set('utm_term', campaign.utmTerm);
    if (campaign.utmContent) url.searchParams.set('utm_content', campaign.utmContent);

    // Add campaign ID for internal tracking
    url.searchParams.set('cid', campaign.id.toString());

    // Add additional parameters
    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.toString();
  }

  /**
   * Updates campaign status
   */
  static async updateCampaignStatus(campaignId: number, isActive: boolean): Promise<void> {
    await db
      .update(marketingCampaigns)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(marketingCampaigns.id, campaignId));
  }

  /**
   * Gets campaign ROI report
   */
  static async getCampaignROI(tenantId: number): Promise<{
    totalSpent: number;
    totalRevenue: number;
    totalROI: number;
    campaigns: Array<{
      id: number;
      name: string;
      spent: number;
      revenue: number;
      roi: number;
    }>;
  }> {
    const campaigns = await db
      .select({
        id: marketingCampaigns.id,
        name: marketingCampaigns.name,
        spent: marketingCampaigns.spent,
        revenue: marketingCampaigns.revenue,
      })
      .from(marketingCampaigns)
      .where(eq(marketingCampaigns.tenantId, tenantId));

    const campaignROI = campaigns.map(campaign => {
      const spent = parseFloat(campaign.spent);
      const revenue = parseFloat(campaign.revenue);
      const roi = spent > 0 ? ((revenue - spent) / spent) * 100 : 0;

      return {
        id: campaign.id,
        name: campaign.name,
        spent,
        revenue,
        roi: Math.round(roi * 100) / 100,
      };
    });

    const totalSpent = campaignROI.reduce((sum, c) => sum + c.spent, 0);
    const totalRevenue = campaignROI.reduce((sum, c) => sum + c.revenue, 0);
    const totalROI = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

    return {
      totalSpent,
      totalRevenue,
      totalROI: Math.round(totalROI * 100) / 100,
      campaigns: campaignROI,
    };
  }

  /**
   * Creates tracking pixel for campaign
   */
  static generateTrackingPixel(campaignId: number, event: string = 'impression'): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    return `${baseUrl}/api/track/pixel/${campaignId}?event=${event}&t=${Date.now()}`;
  }

  /**
   * Gets top referring sources
   */
  static async getTopReferrers(
    tenantId: number,
    limit: number = 10
  ): Promise<Array<{
    referrer: string;
    visits: number;
    conversions: number;
    conversionRate: number;
  }>> {
    const referrers = await db
      .select({
        referrer: campaignAnalytics.referrer,
        visits: sql<number>`COUNT(*)`,
        conversions: sql<number>`COUNT(CASE WHEN ${campaignAnalytics.event} = 'conversion' THEN 1 END)`,
      })
      .from(campaignAnalytics)
      .leftJoin(marketingCampaigns, eq(campaignAnalytics.campaignId, marketingCampaigns.id))
      .where(
        and(
          eq(marketingCampaigns.tenantId, tenantId),
          sql`${campaignAnalytics.referrer} IS NOT NULL`,
          sql`${campaignAnalytics.referrer} != ''`
        )
      )
      .groupBy(campaignAnalytics.referrer)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(limit);

    return referrers.map(r => ({
      referrer: r.referrer || 'Direct',
      visits: r.visits,
      conversions: r.conversions,
      conversionRate: r.visits > 0 ? Math.round((r.conversions / r.visits) * 100 * 100) / 100 : 0,
    }));
  }
}

export class NewsletterService {
  /**
   * Creates a customer segment
   */
  static async createSegment(
    tenantId: number,
    name: string,
    description: string,
    criteria: any
  ) {
    const [segment] = await db
      .insert(newsletterSegments)
      .values({
        tenantId,
        name,
        description,
        criteria,
      })
      .returning();

    return segment;
  }

  /**
   * Creates a newsletter campaign
   */
  static async createNewsletterCampaign(
    tenantId: number,
    segmentId: number,
    subject: string,
    content: string,
    htmlContent?: string,
    scheduledAt?: Date
  ) {
    const [campaign] = await db
      .insert(newsletterCampaigns)
      .values({
        tenantId,
        segmentId,
        subject,
        content,
        htmlContent,
        scheduledAt,
      })
      .returning();

    return campaign;
  }

  /**
   * Gets newsletter campaigns
   */
  static async getNewsletterCampaigns(tenantId: number) {
    return await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.tenantId, tenantId))
      .orderBy(desc(newsletterCampaigns.createdAt));
  }
}