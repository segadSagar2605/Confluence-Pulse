import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DOCUMENTS } from "@/lib/data/documents";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Robust JSON extractor — handles fences, preamble text, and trailing text
function extractJSON(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`No JSON object found in response. Raw: ${raw.slice(0, 200)}`);
  }
  return JSON.parse(raw.slice(start, end + 1));
}

// Fallback answer when Gemini is unavailable or returns unparseable content.
// Three confidence tiers matched by specificity — low first, then medium, then high.
function buildFallback(query: string) {
  const q = query.toLowerCase();

  // ── LOW confidence: questions about conflicted or stale content ───────────
  const isLowConfidence =
    q.includes("runbook") || q.includes("troubleshoot") ||
    q.includes("which document should") || q.includes("up to date") ||
    q.includes("should i follow") || q.includes("should engineers follow");

  if (isLowConfidence) {
    return {
      answer:
        "The runbook for API authentication failures is critically outdated and should not be followed. It still instructs engineers to rotate API keys and use X-API-Key headers — directly contradicting the 2024 OAuth 2.0 mandate, which formally deprecated API keys in December 2024. Following this runbook will lead to using insecure, non-compliant authentication methods.",
      confidence: "low",
      confidenceReason:
        "The runbook directly contradicts the current Authentication Policy 2024 with no owner to resolve the conflict — both documents are live and actively referenced.",
      sources: [
        {
          id: "doc-006",
          title: "Runbook: Troubleshooting API Authentication Failures",
          relevance: "The runbook in question — score 18, no owner, never reviewed, actively conflicts with current policy.",
          freshness: "stale",
          trustScore: 18,
        },
        {
          id: "doc-002",
          title: "Authentication Policy 2024 — OAuth 2.0 Mandate",
          relevance: "The authoritative current policy — explicitly deprecates API keys and mandates OAuth 2.0.",
          freshness: "fresh",
          trustScore: 91,
        },
        {
          id: "doc-001",
          title: "Authentication & API Security Policy (2021)",
          relevance: "A second conflicting source — still live, still mandates API key auth.",
          freshness: "stale",
          trustScore: 24,
        },
      ],
      conflicts: [
        {
          summary:
            "The runbook instructs engineers to rotate API keys and use X-API-Key headers, while the 2024 policy mandates OAuth 2.0 tokens only and has disabled API keys.",
          docA: { id: "doc-006", title: "Runbook: Troubleshooting API Authentication Failures" },
          docB: { id: "doc-002", title: "Authentication Policy 2024 — OAuth 2.0 Mandate" },
        },
      ],
      recommendedAction:
        "Do not follow the runbook. Use the Authentication Policy 2024 for current standards. Assign an owner to the runbook urgently — original author Rahul Verma has left the company — and either archive it or update it to reflect OAuth 2.0.",
      peopleToAsk: [
        "Priya Nair (Security — Auth Policy owner)",
        "Arjun Sharma (Platform Architecture — ADR-007 owner)",
      ],
    };
  }

  // ── MEDIUM confidence: auth standard questions (conflict exists but answer is clear) ──
  const isMediumConfidence =
    q.includes("auth") || q.includes("api key") || q.includes("oauth") ||
    q.includes("security") || q.includes("token") || q.includes("stop using") ||
    q.includes("why did") || q.includes("current standard");

  if (isMediumConfidence) {
    return {
      answer:
        "The current API authentication standard is OAuth 2.0, mandated by the Authentication Policy 2024 and enacted following the October 2023 API key compromise. API key-based authentication is deprecated and was formally disabled in December 2024. All internal services should use the Client Credentials flow; third-party integrations use Authorization Code flow.",
      confidence: "medium",
      confidenceReason:
        "The 2024 policy and ADR-007 both confirm OAuth 2.0, but an older document (Authentication & API Security Policy 2021) still mandates API keys and remains live — creating an active conflict.",
      sources: [
        {
          id: "doc-002",
          title: "Authentication Policy 2024 — OAuth 2.0 Mandate",
          relevance: "Primary authoritative source establishing OAuth 2.0 as the mandatory standard from Q1 2024.",
          freshness: "fresh",
          trustScore: 91,
        },
        {
          id: "doc-003",
          title: "ADR-007: Adopt OAuth 2.0 for All API Authentication",
          relevance: "Architectural decision record with full rationale, alternatives considered, and consequences.",
          freshness: "fresh",
          trustScore: 88,
        },
        {
          id: "doc-004",
          title: "Incident Review — SEC-INC-2023-047: API Key Compromise",
          relevance: "The incident that triggered the move to OAuth 2.0; establishes root cause of API key risk.",
          freshness: "fresh",
          trustScore: 95,
        },
        {
          id: "doc-001",
          title: "Authentication & API Security Policy (2021)",
          relevance: "Older policy still referenced in some runbooks — conflicts with the 2024 mandate.",
          freshness: "stale",
          trustScore: 24,
        },
      ],
      conflicts: [
        {
          summary:
            "The 2021 Authentication Policy mandates API key-based auth, while the 2024 policy mandates OAuth 2.0 and has fully deprecated API keys.",
          docA: { id: "doc-001", title: "Authentication & API Security Policy (2021)" },
          docB: { id: "doc-002", title: "Authentication Policy 2024 — OAuth 2.0 Mandate" },
        },
      ],
      recommendedAction:
        "Archive the 2021 Authentication Policy — it is the root source of confusion. The 2024 mandate is authoritative.",
      peopleToAsk: [
        "Priya Nair (Security — Auth Policy owner)",
        "Arjun Sharma (Platform Architecture — ADR-007 owner)",
      ],
    };
  }

  // ── HIGH confidence: decisions, space overview, trusted pages ────────────
  return {
    answer:
      "There are 2 active decisions in this space. ADR-007 mandated OAuth 2.0 as the sole authentication standard, rejecting enhanced API key management. The Authentication Policy 2024 formally enacted this mandate across all Platform Engineering services. One decision (mTLS as a complementary security layer) is still Under Review and scheduled for 2025 reassessment.",
    confidence: "high",
    confidenceReason:
      "Both active decisions are sourced from validated, high-trust documents (scores 88 and 91) with no conflicting information between them.",
    sources: [
      {
        id: "doc-003",
        title: "ADR-007: Adopt OAuth 2.0 for All API Authentication",
        relevance: "Source of 2 active decisions and 1 under-review decision about authentication architecture.",
        freshness: "fresh",
        trustScore: 88,
      },
      {
        id: "doc-002",
        title: "Authentication Policy 2024 — OAuth 2.0 Mandate",
        relevance: "Policy document enacting the ADR-007 decision across all services.",
        freshness: "fresh",
        trustScore: 91,
      },
      {
        id: "doc-004",
        title: "Incident Review — SEC-INC-2023-047: API Key Compromise",
        relevance: "Root cause document that triggered the decision chain — all action items resolved.",
        freshness: "fresh",
        trustScore: 95,
      },
    ],
    conflicts: [],
    recommendedAction:
      "Review the mTLS Under Review decision in ADR-007 — it is approaching its 2025 deadline and may need a status update or formal acceptance.",
    peopleToAsk: [],
  };
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query?.trim()) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const docsContext = DOCUMENTS.map(
    (doc) => `
--- DOCUMENT ---
ID: ${doc.id}
Title: ${doc.title}
Type: ${doc.contentType}
Owner: ${doc.owner ?? "None"}
Last Updated: ${doc.lastUpdated}
Last Validated: ${doc.lastValidated ?? "Never"}
Trust Score: ${doc.trustScore}/100
Lifecycle: ${doc.lifecycleState}
Conflicts With: ${doc.conflictsWith.length > 0 ? doc.conflictsWith.join(", ") : "None"}

Content (excerpt):
${doc.content.slice(0, 1000)}
`
  ).join("\n");

  const prompt = `You are Rovo, an enterprise knowledge AI for Atlassian Confluence.

A user asked: "${query}"

Analyse the knowledge base documents and return ONLY a JSON object. No preamble, no explanation, no markdown fences — just the raw JSON object starting with { and ending with }.

The JSON object must have exactly these keys:
- answer: string (2-4 sentence direct answer)
- confidence: string, one of exactly: "high", "medium", or "low"
- confidenceReason: string (one sentence explaining confidence level)
- sources: array of objects, each with: id (string), title (string), relevance (string), freshness (one of "fresh", "aging", "stale"), trustScore (number)
- conflicts: array of objects, each with: summary (string), docA (object with id and title), docB (object with id and title)
- recommendedAction: string (one specific action)
- peopleToAsk: array of strings (names/roles if confidence is not high)

Confidence rules:
- Use "high" only when sources agree and are recently validated
- Use "medium" when sources mostly agree but some are stale or there is minor disagreement
- Use "low" when sources directly contradict each other or all sources are stale
- When confidence is medium or low, peopleToAsk must be non-empty

Conflict rules:
- If any two documents contain contradictory facts, include them in the conflicts array with a specific one-sentence description of the contradiction
- List both conflicting documents in the sources array regardless

DOCUMENTS:
${docsContext}`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let parsed: unknown;
    try {
      parsed = extractJSON(raw);
    } catch (parseErr) {
      console.warn("Gemini JSON parse failed, using fallback. Parse error:", parseErr);
      console.warn("Raw Gemini response (first 500 chars):", raw.slice(0, 500));
      return NextResponse.json(buildFallback(query));
    }

    return NextResponse.json(parsed);
  } catch (geminiErr) {
    console.warn("Gemini API call failed, using fallback. Error:", geminiErr);
    return NextResponse.json(buildFallback(query));
  }
}
