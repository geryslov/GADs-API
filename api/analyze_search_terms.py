#!/usr/bin/env python3
"""
Reindeer AI — Search Term Relevance Analyzer

Connects to Google Ads API, pulls search terms from ACTIVE campaigns only
(clicks > 0), and classifies each as relevant or irrelevant based on
Reindeer AI's core business.

Usage:
  GOOGLE_ADS_YAML=/path/to/google-ads.yaml python analyze_search_terms.py [--account ACCOUNT_NAME] [--days 30]
"""
import os
import sys
import json
import argparse

sys.path.insert(0, os.path.dirname(__file__))

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# ---------------------------------------------------------------------------
# Reindeer AI context for relevance classification
# ---------------------------------------------------------------------------
REINDEER_AI_CONTEXT = """
Reindeer AI is a B2B enterprise SaaS company that provides AI-driven back-office
automation. Their core offerings include:

RELEVANT topics/keywords:
- AI automation, AI agents, AI workflows, intelligent automation
- Back-office automation, business process automation (BPA/BPM)
- Document processing, document classification, data extraction
- Invoice processing, invoice automation, accounts payable automation
- Payment approvals, payment processing automation
- Quote management, quote generation, order processing
- KYC (Know Your Customer), AML (Anti-Money Laundering), compliance automation
- Ledger reconciliation, accounting automation, financial operations
- Shipment tracking, logistics automation, track and trace
- Enterprise AI, AI for enterprise, AI operations
- RPA replacement, robotic process automation alternative
- ERP integration, CRM integration, legacy system automation
- Unstructured data processing, OCR, intelligent document processing (IDP)
- AI-native operations, AI-powered workflows
- Operational efficiency, reduce manual work, workforce automation
- Custom AI models, AI customization

IRRELEVANT topics/keywords:
- Consumer AI products (AI art generators, AI chatbots for personal use, AI music)
- AI for marketing/advertising/SEO/content creation
- AI for coding/software development tools
- Unrelated animals/reindeer/Christmas themes
- Generic tech terms with no B2B back-office connection
- AI for healthcare/medical (unless back-office related)
- AI for gaming/entertainment
- Hardware/chips/semiconductors
- Academic/research AI
- Specific competitor brand names being searched for non-comparison reasons
- Personal finance, consumer banking
- Social media management, social media AI
- AI image/video generation
- Job searching, career related queries
- General "what is AI" educational queries
"""


def get_accounts(gads_client, mcc_id):
    """List all enabled non-manager accounts under the MCC."""
    ga = gads_client.get_service("GoogleAdsService")
    query = """
        SELECT
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.currency_code
        FROM customer_client
        WHERE customer_client.manager = FALSE
          AND customer_client.status = 'ENABLED'
        ORDER BY customer_client.descriptive_name
    """
    response = ga.search(customer_id=mcc_id, query=query)
    accounts = []
    for row in response:
        cc = row.customer_client
        accounts.append({
            "id": str(cc.id),
            "name": cc.descriptive_name,
            "currency": cc.currency_code,
        })
    return accounts


def find_reindeer_account(accounts, account_name=None):
    """Find the Reindeer AI account by name (partial match)."""
    search = (account_name or "reindeer").lower()
    for acc in accounts:
        if search in acc["name"].lower():
            return acc
    return None


def get_active_campaigns(gads_client, account_id, days=30):
    """Get only ENABLED (active) campaigns."""
    ga = gads_client.get_service("GoogleAdsService")
    date_range = f"LAST_{days}_DAYS" if days in (7, 14, 30) else "LAST_30_DAYS"
    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions
        FROM campaign
        WHERE segments.date DURING {date_range}
          AND campaign.status = 'ENABLED'
        ORDER BY metrics.cost_micros DESC
    """
    campaigns = []
    for row in ga.search(customer_id=account_id, query=query):
        c = row.campaign
        m = row.metrics
        campaigns.append({
            "id": str(c.id),
            "name": c.name,
            "status": c.status.name,
            "channel": c.advertising_channel_type.name,
            "impressions": m.impressions,
            "clicks": m.clicks,
            "cost": round(m.cost_micros / 1_000_000, 2),
            "conversions": round(m.conversions, 1),
        })
    return campaigns


def get_search_terms_active_campaigns(gads_client, account_id, days=30, limit=500):
    """
    Fetch search terms from ACTIVE campaigns only, with clicks > 0.
    """
    ga = gads_client.get_service("GoogleAdsService")
    date_range = f"LAST_{days}_DAYS" if days in (7, 14, 30) else "LAST_30_DAYS"
    query = f"""
        SELECT
            search_term_view.search_term,
            search_term_view.status,
            campaign.name,
            campaign.status,
            ad_group.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM search_term_view
        WHERE segments.date DURING {date_range}
          AND campaign.status = 'ENABLED'
          AND metrics.clicks > 0
        ORDER BY metrics.clicks DESC
        LIMIT {limit}
    """
    results = []
    for row in ga.search(customer_id=account_id, query=query):
        st = row.search_term_view
        m = row.metrics
        results.append({
            "term": st.search_term,
            "status": st.status.name,
            "campaign": row.campaign.name,
            "ad_group": row.ad_group.name,
            "impressions": m.impressions,
            "clicks": m.clicks,
            "cost": round(m.cost_micros / 1_000_000, 2),
            "conversions": round(m.conversions, 1),
            "ctr": round(m.ctr * 100, 2),
        })
    return results


def classify_relevance(search_terms):
    """
    Classify each search term as relevant or irrelevant to Reindeer AI's business.
    Uses keyword-based heuristics for fast local classification.
    """
    # Relevant keyword signals
    relevant_signals = [
        "automation", "automate", "automated", "ai agent", "ai workflow",
        "back office", "back-office", "backoffice",
        "invoice", "invoicing", "accounts payable", "ap automation",
        "payment approv", "payment process", "payment automat",
        "quote manag", "quote generat", "order process",
        "kyc", "aml", "compliance", "know your customer", "anti money",
        "reconcil", "ledger", "accounting automat", "financial operation",
        "shipment track", "track and trace", "logistics automat", "load track",
        "document process", "document classif", "data extract", "ocr",
        "intelligent document", "idp",
        "enterprise ai", "ai for enterprise", "ai operations", "ai ops",
        "rpa", "robotic process", "process automation", "bpa", "bpm",
        "erp integrat", "crm integrat", "legacy system",
        "unstructured data", "workflow automat",
        "operational efficien", "reduce manual", "workforce automat",
        "custom ai", "ai model", "ai platform",
        "reindeer", "reindr",
        "ai native", "ai-native", "ai driven", "ai-driven",
        "back office ai", "office automation",
        "ai software", "ai solution", "ai tool",
        "business process", "digital transform",
        "saas ai", "b2b ai", "enterprise software",
        "ai startup", "ai company",
    ]

    # Irrelevant keyword signals
    irrelevant_signals = [
        "christmas", "santa", "rudolph", "holiday", "decoration",
        "ai art", "ai image", "ai photo", "ai video", "ai music",
        "ai girlfriend", "ai chat", "chatgpt", "chat gpt",
        "ai writing", "ai content", "ai copywriting", "ai seo",
        "ai marketing", "ai advertising",
        "ai coding", "ai programming", "copilot", "code assist",
        "ai game", "ai gaming",
        "ai chip", "nvidia", "semiconductor",
        "ai stock", "ai invest", "crypto ai",
        "ai job", "ai career", "ai salary", "ai hiring",
        "what is ai", "ai definition", "ai meaning",
        "openai", "midjourney", "stable diffusion", "dall-e", "dalle",
        "ai detector", "ai checker",
        "personal ai", "ai assistant personal",
        "ai diet", "ai fitness", "ai health",
        "ai dating", "ai relationship",
        "social media ai", "instagram ai", "tiktok ai",
        "deer", "animal", "wildlife", "hunting",
    ]

    classified = []
    for st in search_terms:
        term_lower = st["term"].lower()
        relevance_score = 0
        irrelevance_score = 0
        matched_relevant = []
        matched_irrelevant = []

        for signal in relevant_signals:
            if signal in term_lower:
                relevance_score += 1
                matched_relevant.append(signal)

        for signal in irrelevant_signals:
            if signal in term_lower:
                irrelevance_score += 1
                matched_irrelevant.append(signal)

        # Classification logic
        if irrelevance_score > 0 and relevance_score == 0:
            verdict = "IRRELEVANT"
            reason = f"Matched irrelevant signals: {', '.join(matched_irrelevant)}"
        elif relevance_score > 0 and irrelevance_score == 0:
            verdict = "RELEVANT"
            reason = f"Matched relevant signals: {', '.join(matched_relevant)}"
        elif relevance_score > 0 and irrelevance_score > 0:
            verdict = "RELEVANT" if relevance_score >= irrelevance_score else "IRRELEVANT"
            reason = f"Mixed signals — relevant: {', '.join(matched_relevant)}; irrelevant: {', '.join(matched_irrelevant)}"
        else:
            # No signals matched — classify as UNCERTAIN (likely irrelevant)
            verdict = "UNCERTAIN"
            reason = "No clear signal — review manually"

        classified.append({
            **st,
            "verdict": verdict,
            "reason": reason,
        })

    return classified


def print_results(classified, campaigns):
    """Print a formatted report of the analysis."""
    irrelevant = [c for c in classified if c["verdict"] == "IRRELEVANT"]
    uncertain = [c for c in classified if c["verdict"] == "UNCERTAIN"]
    relevant = [c for c in classified if c["verdict"] == "RELEVANT"]

    total_cost = sum(c["cost"] for c in classified)
    irrelevant_cost = sum(c["cost"] for c in irrelevant)
    uncertain_cost = sum(c["cost"] for c in uncertain)

    print("\n" + "=" * 80)
    print("REINDEER AI — SEARCH TERM RELEVANCE ANALYSIS")
    print("=" * 80)

    print(f"\n📊 SUMMARY")
    print(f"  Active campaigns analyzed: {len(campaigns)}")
    print(f"  Total search terms (clicks > 0): {len(classified)}")
    print(f"  Relevant: {len(relevant)}")
    print(f"  Irrelevant: {len(irrelevant)}")
    print(f"  Uncertain (needs review): {len(uncertain)}")
    print(f"\n  Total spend on analyzed terms: ${total_cost:,.2f}")
    print(f"  Wasted spend (irrelevant): ${irrelevant_cost:,.2f}")
    print(f"  Uncertain spend: ${uncertain_cost:,.2f}")

    if irrelevant:
        print(f"\n{'=' * 80}")
        print("❌ IRRELEVANT SEARCH TERMS (recommend adding as negative keywords)")
        print(f"{'=' * 80}")
        print(f"\n{'Search Term':<50} {'Clicks':>7} {'Cost':>10} {'Conv':>6} Campaign")
        print("-" * 110)
        for st in sorted(irrelevant, key=lambda x: x["cost"], reverse=True):
            print(f"  {st['term']:<48} {st['clicks']:>7} ${st['cost']:>8,.2f} {st['conversions']:>5.1f}  {st['campaign']}")
        print(f"\n  TOTAL WASTED: ${irrelevant_cost:,.2f} across {len(irrelevant)} terms")

    if uncertain:
        print(f"\n{'=' * 80}")
        print("⚠️  UNCERTAIN SEARCH TERMS (review manually)")
        print(f"{'=' * 80}")
        print(f"\n{'Search Term':<50} {'Clicks':>7} {'Cost':>10} {'Conv':>6} Campaign")
        print("-" * 110)
        for st in sorted(uncertain, key=lambda x: x["cost"], reverse=True):
            print(f"  {st['term']:<48} {st['clicks']:>7} ${st['cost']:>8,.2f} {st['conversions']:>5.1f}  {st['campaign']}")

    if relevant:
        print(f"\n{'=' * 80}")
        print("✅ RELEVANT SEARCH TERMS")
        print(f"{'=' * 80}")
        print(f"\n{'Search Term':<50} {'Clicks':>7} {'Cost':>10} {'Conv':>6} Campaign")
        print("-" * 110)
        for st in sorted(relevant, key=lambda x: x["cost"], reverse=True)[:30]:
            print(f"  {st['term']:<48} {st['clicks']:>7} ${st['cost']:>8,.2f} {st['conversions']:>5.1f}  {st['campaign']}")
        if len(relevant) > 30:
            print(f"  ... and {len(relevant) - 30} more relevant terms")

    # Export to JSON
    output_path = os.path.join(os.path.dirname(__file__), "search_term_analysis.json")
    with open(output_path, "w") as f:
        json.dump({
            "summary": {
                "total_terms": len(classified),
                "relevant": len(relevant),
                "irrelevant": len(irrelevant),
                "uncertain": len(uncertain),
                "total_cost": total_cost,
                "wasted_cost": irrelevant_cost,
            },
            "irrelevant_terms": irrelevant,
            "uncertain_terms": uncertain,
            "relevant_terms": relevant,
        }, f, indent=2)
    print(f"\n📁 Full results exported to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Reindeer AI Search Term Relevance Analyzer")
    parser.add_argument("--account", type=str, help="Account name to search for (default: 'reindeer')")
    parser.add_argument("--account-id", type=str, help="Specific account ID to use")
    parser.add_argument("--days", type=int, default=30, help="Lookback period (7, 14, or 30 days)")
    parser.add_argument("--limit", type=int, default=500, help="Max search terms to fetch")
    args = parser.parse_args()

    yaml_path = os.environ.get("GOOGLE_ADS_YAML")
    if yaml_path:
        gads_client = GoogleAdsClient.load_from_storage(yaml_path)
    else:
        gads_client = GoogleAdsClient.load_from_storage()

    mcc_id = str(gads_client.login_customer_id).replace("-", "")
    print(f"Connected to MCC: {mcc_id}")

    # Find the Reindeer AI account
    if args.account_id:
        account_id = args.account_id
        account_name = args.account_id
    else:
        accounts = get_accounts(gads_client, mcc_id)
        print(f"\nAvailable accounts:")
        for acc in accounts:
            print(f"  {acc['id']} — {acc['name']} ({acc['currency']})")

        target = find_reindeer_account(accounts, args.account)
        if not target:
            print(f"\nCould not find account matching '{args.account or 'reindeer'}'. "
                  "Use --account-id to specify directly.")
            sys.exit(1)

        account_id = target["id"]
        account_name = target["name"]

    print(f"\nAnalyzing account: {account_name} ({account_id})")

    # Get active campaigns
    print(f"\nFetching active campaigns (last {args.days} days)...")
    campaigns = get_active_campaigns(gads_client, account_id, args.days)
    print(f"Found {len(campaigns)} active campaigns:")
    for c in campaigns:
        print(f"  [{c['channel']}] {c['name']} — {c['clicks']} clicks, ${c['cost']:,.2f} spend, {c['conversions']} conv")

    if not campaigns:
        print("No active campaigns found.")
        sys.exit(0)

    # Get search terms with clicks > 0 from active campaigns
    print(f"\nFetching search terms with clicks > 0 from active campaigns...")
    search_terms = get_search_terms_active_campaigns(gads_client, account_id, args.days, args.limit)
    print(f"Found {len(search_terms)} search terms with clicks > 0")

    if not search_terms:
        print("No search terms found.")
        sys.exit(0)

    # Classify relevance
    print("\nClassifying search term relevance...")
    classified = classify_relevance(search_terms)

    # Print results
    print_results(classified, campaigns)


if __name__ == "__main__":
    main()
