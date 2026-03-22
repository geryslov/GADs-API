"""
Google Ads MCC Dashboard — FastAPI Backend
"""
import warnings
warnings.filterwarnings("ignore")

import os
import json
from pathlib import Path

# Load .env from project root
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

YAML_PATH = os.environ.get(
    "GOOGLE_ADS_YAML",
    "/Users/gery/Library/Application Support/Claude/local-agent-mode-sessions/"
    "99f5b8af-9a18-4bf2-8fc7-48b6c1c6d63a/5b46e3e4-a3e7-4623-ae9b-6699d3b0f0a1/"
    "local_50274263-508c-4d11-9cfc-9390d4e11bfe/outputs/google-ads-api-setup/google-ads.yaml"
)

app = FastAPI(title="Google Ads Dashboard API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Init clients once at startup
gads = GoogleAdsClient.load_from_storage(YAML_PATH)
anthropic_client = anthropic.Anthropic()
MCC_ID = str(gads.login_customer_id).replace("-", "")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def run_gaql(customer_id: str, query: str) -> list[dict]:
    """Execute a GAQL query and return rows as dicts via __dict__ or field_mask."""
    ga = gads.get_service("GoogleAdsService")
    try:
        response = ga.search(customer_id=customer_id, query=query)
        rows = []
        for row in response:
            rows.append(row)
        return rows
    except GoogleAdsException as ex:
        raise HTTPException(status_code=400, detail=str(ex.failure.errors[0].message))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/accounts")
def list_accounts():
    """List all non-manager client accounts under the MCC."""
    ga = gads.get_service("GoogleAdsService")
    query = """
        SELECT
            customer_client.id,
            customer_client.descriptive_name,
            customer_client.currency_code,
            customer_client.status
        FROM customer_client
        WHERE customer_client.manager = FALSE
          AND customer_client.status = 'ENABLED'
        ORDER BY customer_client.descriptive_name
    """
    try:
        response = ga.search(customer_id=MCC_ID, query=query)
        accounts = []
        for row in response:
            cc = row.customer_client
            accounts.append({
                "id": str(cc.id),
                "name": cc.descriptive_name,
                "currency": cc.currency_code,
            })
        return accounts
    except GoogleAdsException as ex:
        raise HTTPException(status_code=400, detail=str(ex.failure.errors[0].message))


@app.get("/api/accounts/{account_id}/overview")
def account_overview(account_id: str, days: int = 30):
    """KPI summary + campaign breakdown for the account."""
    date_range = f"LAST_{days}_DAYS" if days in (7, 14, 30) else "LAST_30_DAYS"
    ga = gads.get_service("GoogleAdsService")

    # --- Top-level metrics ---
    kpi_query = f"""
        SELECT
            metrics.impressions,
            metrics.clicks,
            metrics.ctr,
            metrics.cost_micros,
            metrics.conversions,
            metrics.cost_per_conversion,
            metrics.conversions_from_interactions_rate
        FROM customer
        WHERE segments.date DURING {date_range}
    """
    kpi = {"impressions": 0, "clicks": 0, "cost": 0.0, "conversions": 0.0}
    try:
        for row in ga.search(customer_id=account_id, query=kpi_query):
            m = row.metrics
            kpi["impressions"] += m.impressions
            kpi["clicks"] += m.clicks
            kpi["cost"] += m.cost_micros / 1_000_000
            kpi["conversions"] += m.conversions
    except GoogleAdsException:
        pass

    kpi["ctr"] = round(kpi["clicks"] / kpi["impressions"] * 100, 2) if kpi["impressions"] else 0
    kpi["cpa"] = round(kpi["cost"] / kpi["conversions"], 2) if kpi["conversions"] else None

    # --- Campaign breakdown ---
    camp_query = f"""
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion
        FROM campaign
        WHERE segments.date DURING {date_range}
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    campaigns = []
    try:
        for row in ga.search(customer_id=account_id, query=camp_query):
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
                "ctr": round(m.ctr * 100, 2),
                "avg_cpc": round(m.average_cpc / 1_000_000, 2),
                "cpa": round(m.cost_per_conversion / 1_000_000, 2) if m.conversions > 0 else None,
            })
    except GoogleAdsException:
        pass

    return {"kpi": kpi, "campaigns": campaigns, "date_range": date_range}


@app.get("/api/accounts/{account_id}/search-terms")
def search_terms(account_id: str, days: int = 7, limit: int = 100):
    """Top search terms for the account."""
    date_range = f"LAST_{days}_DAYS" if days in (7, 14, 30) else "LAST_7_DAYS"
    ga = gads.get_service("GoogleAdsService")

    query = f"""
        SELECT
            search_term_view.search_term,
            search_term_view.status,
            campaign.name,
            ad_group.name,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr
        FROM search_term_view
        WHERE segments.date DURING {date_range}
        ORDER BY metrics.impressions DESC
        LIMIT {limit}
    """
    results = []
    try:
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
    except GoogleAdsException as ex:
        raise HTTPException(status_code=400, detail=str(ex.failure.errors[0].message))

    return results


@app.get("/api/accounts/{account_id}/search-terms/analyze")
def analyze_search_terms(account_id: str, days: int = 30, limit: int = 500):
    """Fetch search terms from active campaigns (clicks > 0) and classify relevance for Reindeer AI."""
    from analyze_search_terms import (
        get_search_terms_active_campaigns,
        get_active_campaigns,
        classify_relevance,
    )
    try:
        campaigns = get_active_campaigns(gads, account_id, days)
        search_terms_data = get_search_terms_active_campaigns(gads, account_id, days, limit)
        classified = classify_relevance(search_terms_data)

        irrelevant = [c for c in classified if c["verdict"] == "IRRELEVANT"]
        uncertain = [c for c in classified if c["verdict"] == "UNCERTAIN"]
        relevant = [c for c in classified if c["verdict"] == "RELEVANT"]

        return {
            "summary": {
                "active_campaigns": len(campaigns),
                "total_terms": len(classified),
                "relevant": len(relevant),
                "irrelevant": len(irrelevant),
                "uncertain": len(uncertain),
                "total_cost": sum(c["cost"] for c in classified),
                "wasted_cost": sum(c["cost"] for c in irrelevant),
            },
            "campaigns": campaigns,
            "irrelevant_terms": sorted(irrelevant, key=lambda x: x["cost"], reverse=True),
            "uncertain_terms": sorted(uncertain, key=lambda x: x["cost"], reverse=True),
            "relevant_terms": sorted(relevant, key=lambda x: x["cost"], reverse=True),
        }
    except GoogleAdsException as ex:
        raise HTTPException(status_code=400, detail=str(ex.failure.errors[0].message))


# ---------------------------------------------------------------------------
# NL Query
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str
    account_name: str


GAQL_SYSTEM_PROMPT = """You are a Google Ads API expert. Translate the user's question into a GAQL query.

Available resources (each query uses ONE resource in FROM):
- `campaign` — campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type + metrics
- `ad_group` — ad_group.id, ad_group.name, ad_group.status + metrics
- `search_term_view` — search_term_view.search_term, search_term_view.status, campaign.name, ad_group.name + metrics (NEVER include ad_group_criterion fields here)
- `keyword_view` — ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, campaign.name, ad_group.name + metrics
- `customer` — account-level metrics only

IMPORTANT: `ad_group_criterion` fields (keyword.text, keyword.match_type) are ONLY available when FROM clause is `keyword_view`. Never use them with `search_term_view`.

Available metrics (on any resource):
metrics.impressions, metrics.clicks, metrics.ctr, metrics.cost_micros (divide by 1M for $),
metrics.conversions, metrics.cost_per_conversion, metrics.average_cpc,
metrics.conversions_from_interactions_rate, metrics.search_impression_share,
metrics.search_top_impression_share, metrics.search_absolute_top_impression_share

Date segments: segments.date DURING LAST_7_DAYS | LAST_14_DAYS | LAST_30_DAYS | THIS_MONTH | LAST_MONTH

Respond ONLY with valid JSON:
{
  "gaql": "SELECT ... FROM ... WHERE ... ORDER BY ... LIMIT ..."
}

Rules: Never include segments.date in SELECT. Use LIMIT 50-200 for search terms.
"""

ANALYST_SYSTEM_PROMPT = """You are a senior Google Ads performance analyst. You have just retrieved live data from a client's Google Ads account in response to their question.

Write a clear, conversational answer based on the data. Be specific — reference actual numbers, campaign names, and trends from the data. Give a concrete recommendation or insight where relevant. Keep it concise (2-4 short paragraphs max). Use markdown for emphasis where helpful."""


@app.post("/api/accounts/{account_id}/query")
def nl_query(account_id: str, req: QueryRequest):
    """Translate a natural language question into GAQL, run it, then have Claude interpret the results."""

    # Step 1: Generate GAQL
    try:
        gaql_msg = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=GAQL_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"Account: {req.account_name}\n\nQuestion: {req.question}"}],
        )
        raw = gaql_msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        gaql = json.loads(raw.strip())["gaql"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GAQL generation error: {str(e)}")

    # Step 2: Execute GAQL
    ga = gads.get_service("GoogleAdsService")
    try:
        response = ga.search(customer_id=account_id, query=gaql)
        rows = []
        for row in response:
            row_dict = {}
            if hasattr(row, "campaign") and row.campaign.name:
                row_dict["campaign"] = row.campaign.name
                row_dict["status"] = row.campaign.status.name if row.campaign.status else ""
                row_dict["channel"] = row.campaign.advertising_channel_type.name if row.campaign.advertising_channel_type else ""
            if hasattr(row, "ad_group") and row.ad_group.name:
                row_dict["ad_group"] = row.ad_group.name
            if hasattr(row, "search_term_view") and row.search_term_view.search_term:
                row_dict["search_term"] = row.search_term_view.search_term
                row_dict["match_status"] = row.search_term_view.status.name
            if hasattr(row, "ad_group_criterion"):
                try:
                    row_dict["keyword"] = row.ad_group_criterion.keyword.text
                    row_dict["match_type"] = row.ad_group_criterion.keyword.match_type.name
                except Exception:
                    pass
            if hasattr(row, "metrics"):
                m = row.metrics
                if m.impressions: row_dict["impressions"] = m.impressions
                if m.clicks: row_dict["clicks"] = m.clicks
                if m.cost_micros: row_dict["cost"] = round(m.cost_micros / 1_000_000, 2)
                if m.conversions: row_dict["conversions"] = round(m.conversions, 1)
                if m.ctr: row_dict["ctr"] = f"{m.ctr:.2%}"
                if m.average_cpc: row_dict["avg_cpc"] = round(m.average_cpc / 1_000_000, 2)
                if m.cost_per_conversion and m.conversions > 0:
                    row_dict["cpa"] = round(m.cost_per_conversion / 1_000_000, 2)
                if m.search_impression_share:
                    row_dict["impression_share"] = f"{m.search_impression_share:.2%}"
            if row_dict:
                rows.append(row_dict)
    except GoogleAdsException as ex:
        raise HTTPException(status_code=400, detail=f"GAQL error: {ex.failure.errors[0].message}\n\nQuery: {gaql}")

    # Step 3: Send results back to Claude for a natural language answer
    data_summary = json.dumps(rows[:100], indent=2)  # cap at 100 rows to stay within context
    try:
        answer_msg = anthropic_client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=ANALYST_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Account: {req.account_name}\n"
                        f"Question: {req.question}\n\n"
                        f"Data retrieved ({len(rows)} rows):\n{data_summary}"
                    ),
                }
            ],
        )
        answer = answer_msg.content[0].text.strip()
    except Exception as e:
        answer = f"(Could not generate analysis: {str(e)})"

    return {
        "question": req.question,
        "answer": answer,
        "gaql": gaql,
        "rows": rows,
        "count": len(rows),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
