**LMSense**

Bias Mitigation Platform

Product Requirements Document --- UI Scope \| v1.0

  -----------------------------------------------------------------------
  **Field**             **Value**
  --------------------- -------------------------------------------------
  Product               LMSense UI

  Version               1.0 --- MVP

  Authors               Founding Team

  Status                Draft --- Ready for Review

  Target                Enterprise SaaS + Embeddable Widget + API

  Primary Users         Enterprise decision-makers + ML/AI Engineers
  -----------------------------------------------------------------------

# 1. Overview & Problem Statement

Large Language Models used in critical enterprise decisions --- hiring,
lending, healthcare, compliance --- routinely produce biased outputs
because they inherit flawed historical data. Organisations have no easy
way to detect, measure, or correct this bias without retraining entire
models.

LMSense is a three-layer bias mitigation stack (QLoRA + CDA, RLDF, RL
post-processing) that sits over any LLM. The UI is the control plane for
this stack --- it lets enterprise teams audit, configure, test, and
deploy the debiasing layer without touching a single line of model code.

# 2. User Personas

### Persona A --- Enterprise Decision-Maker (non-technical)

-   Role: CHROs, CROs, Compliance Leads, Heads of AI Ethics

-   Goal: Prove to auditors and regulators that AI decisions are fair
    and documented

-   Needs: Dashboard reports, bias scores, audit trails, one-click
    exports

-   Pain: Cannot interpret model internals; needs plain-language
    summaries

### Persona B --- ML / AI Engineer (technical)

-   Role: AI engineers, MLOps teams integrating LLMs into product

-   Goal: Configure the pipeline, fine-tune layer parameters, connect
    via API

-   Needs: API key management, pipeline config UI, prompt testing
    sandbox, metrics

-   Pain: Existing debiasing tools require full retraining; no modular
    solution

# 3. Deployment Modes

LMSense ships in three complementary modes that share the same backend
but serve different integration contexts.

  ------------------------------------------------------------------------
  **Mode**         **Description**                    **Primary User**
  ---------------- ---------------------------------- --------------------
  Web SaaS         Full-featured hosted platform at   Both personas
  Dashboard        app.LMSense.ai --- the main        
                   product                            

  Embeddable       Drop-in JS snippet that overlays   Engineers
  Widget           LMSense onto any LLM chat          
                   interface                          

  REST API         Headless access --- pass any LLM   Engineers
                   response, receive debiased +       
                   scored output                      
  ------------------------------------------------------------------------

# 4. Information Architecture

The web dashboard is structured around five top-level sections
accessible from a persistent left sidebar.

  ------------------------------------------------------------------------
  **Section**     **URL**          **Description**
  --------------- ---------------- ---------------------------------------
  Home /          /dashboard       Real-time bias score overview, recent
  Dashboard                        activity, system health

  Bias Audit      /audit           Upload datasets, run bias scans, view
                                   flagged outputs

  Prompt Sandbox  /sandbox         Live test any prompt --- see raw vs
                                   debiased output side-by-side

  Pipeline Config /pipeline        Configure QLoRA, RLDF, and RL
                                   post-processing settings

  Integrations    /integrations    Connect LLM providers, embed widget,
                                   manage API keys

  Reports         /reports         Generate compliance-ready PDF/CSV audit
                                   reports

  Settings        /settings        Team, billing, notifications, data
                                   retention
  ------------------------------------------------------------------------

# 5. Screen-by-Screen Requirements

## 5.1 Home Dashboard

The landing screen after login. Designed for the decision-maker ---
gives an instant health read on all connected LLM systems.

-   **Overall fairness score (0--100) across all connected models,
    updated in real time. Color coded: green ≥ 80, amber 60--79, red \<
    60.:** Bias score card

-   **7 / 30 / 90-day line chart of bias score over time per connected
    model:** Trend chart

-   **Ranked pills: Gender, Race, Age, Socioeconomic, Geography ---
    clicking drills into Audit view:** Top bias categories detected

-   **Last 20 flagged outputs with model name, timestamp, bias type, and
    severity:** Recent activity feed

-   **Cards for each connected LLM (GPT-4, Gemini, Claude, custom)
    showing status and score:** Active connections widget

-   **Run New Audit · Open Sandbox · Download Last Report:** Quick
    action buttons

## 5.2 Bias Audit

Core feature for both personas. Allows uploading a dataset or live query
log and running it through the bias detection pipeline.

### 5.2.1 Upload & Scan

-   File upload zone: drag-and-drop CSV / JSONL / plain text (max 50 MB)

-   Or: connect live query log from integrated LLM provider via API

-   Model selector: choose which connected LLM produced this data

-   Scan configuration: select bias dimensions to check (gender, race,
    age, all)

-   Run Audit button --- triggers async job with progress bar

### 5.2.2 Audit Results

-   Summary card: total queries scanned, % flagged, top bias type,
    overall score

-   Flagged outputs table: columns --- Query, Raw Response, Bias Type,
    Severity (High / Medium / Low), Debiased Preview

-   Each row expandable: shows side-by-side raw vs debiased diff with
    changed tokens highlighted

-   Filter bar: by severity, bias type, date range, model

-   Export button: downloads flagged outputs as CSV or PDF compliance
    report

## 5.3 Prompt Sandbox

A live testing environment. Engineers and decision-makers can type any
prompt and instantly see what the connected LLM returns vs what
LMSense\'s stack produces.

-   Model selector dropdown at top (GPT-4o, Gemini 1.5, Claude Sonnet,
    custom endpoint)

-   Prompt input textarea with char counter and example prompt library

-   **Left = Raw LLM output · Right = LMSense debiased output:**
    Split-pane output view:

-   Diff overlay toggle: highlights added/removed/changed tokens between
    the two outputs

-   Bias score badge on each pane: numeric score + top detected bias
    category

-   Layer trace panel (collapsible): shows which of the three layers
    triggered and what was changed

-   Save to Audit Log button: adds this test to the team\'s audit
    history

-   Share link: generates a shareable URL of this sandbox session
    (read-only)

## 5.4 Pipeline Configuration

For ML engineers. Exposes controls for each of the three debiasing
layers. Non-technical users see a simplified \'sensitivity\' slider that
maps to these settings internally.

### 5.4.1 Layer 1 --- QLoRA + CDA settings

-   Toggle: enable / disable Layer 1 for this deployment

-   CDA term pairs: editable table of swap pairs (he ↔ she, doctor ↔
    nurse, etc.) with add/remove

-   LoRA rank (r): integer slider 4--64, default 16

-   Alpha multiplier: float input, default 32

-   Training dataset: upload custom debiasing pairs or use LMSense
    default set

### 5.4.2 Layer 2 --- RLDF settings

-   Toggle: enable / disable RLDF layer

-   Reward model: select AI judge (GPT-4o recommended, or custom
    endpoint)

-   Fairness shaping coefficient (λ): slider 0.0--1.0, tooltip
    explaining trade-off with fluency

-   Debate rounds: integer 1--5 (more = slower but more thorough)

-   PPO clip range: advanced field, collapsible under \'Expert
    settings\'

### 5.4.3 Layer 3 --- RL Post-processing settings

-   Toggle: enable / disable runtime guard

-   Action on detection: Rewrite / Flag & Pass / Block with explanation
    --- radio buttons

-   Projection strength: slider 0--100, controls how far output is moved
    along neutral embedding axis

-   Bias sensitivity threshold: Low / Medium / High --- affects how
    aggressively outputs are flagged

-   Custom blocklist: text input for domain-specific biased phrases to
    always catch

### 5.4.4 Simplified view (decision-maker mode)

-   Single \'Bias Aggressiveness\' slider: Low / Balanced / Strict, maps
    to sensible presets across all three layers

-   Toggle appears in top-right of Pipeline Config: \'Switch to simple
    view\'

## 5.5 Integrations

Connects LMSense to LLM providers and surfaces the embeddable widget
config.

### 5.5.1 LLM Provider Connections

-   Cards for: OpenAI, Anthropic, Google Gemini, Mistral, Azure OpenAI,
    custom endpoint

-   Each card: Connect button → modal asking for API key + model name +
    optional org ID

-   Status indicator: Connected (green) / Disconnected / Error

-   Test Connection button: sends a sample prompt and shows latency +
    response

### 5.5.2 Embeddable Widget

Allows any team to drop LMSense into an existing LLM-powered interface
(internal tool, customer-facing chat, etc.) with zero backend changes.

-   Widget preview: live preview of the badge/overlay as it would appear
    on a page

-   Embed code snippet: one-line JS tag with the team\'s API key
    pre-filled, copy button

-   Configuration options: position (bottom-right / bottom-left /
    custom), theme (auto / light / dark), badge style (minimal / full)

-   Domains whitelist: input to restrict which origins the widget will
    activate on

-   Widget behaviour: toggle whether to show raw vs debiased comparison,
    or silently debias only

### 5.5.3 API Access

-   API key management: generate, rotate, revoke keys with labels and
    scopes

-   Usage stats: requests today / this month, tokens processed, quota
    bar

-   Quickstart code: copy-paste snippet in Python, Node.js, curl ---
    pre-filled with user\'s key

-   Webhook config: post-debias webhook URL to receive debiased outputs
    asynchronously

-   Link to full API docs

# 6. Cross-Cutting UI Features

### 6.1 Model-Agnostic Chat Integration

Any chat interface using LMSense (via widget or embedded SDK) gets these
features regardless of the underlying LLM:

-   Bias badge: small indicator on every response showing live bias
    score (0--100)

-   Toggle overlay: user can tap the badge to expand a diff showing what
    LMSense changed

-   Feedback loop: thumbs-up / thumbs-down on each debiased response
    feeds back as RL signal

-   Layer trace: expandable panel showing which layer triggered and what
    rule fired

### 6.2 Audit Trail & Compliance

-   Every debiased response is logged with: timestamp, model, original
    text hash, debiased text, layers triggered, bias score before/after

-   Tamper-evident log: SHA-256 hash chain so enterprise auditors can
    verify no post-hoc edits

-   Export formats: PDF (formatted compliance report), CSV (raw data),
    JSON (API-friendly)

-   Data retention policy: configurable 30 / 90 / 365 days or custom,
    with auto-purge

### 6.3 Role-Based Access Control

  -----------------------------------------------------------------------
  **Role**           **Permissions**
  ------------------ ----------------------------------------------------
  Admin              Full access --- billing, API keys, pipeline config,
                     team management

  Engineer           Pipeline config, integrations, sandbox, audit --- no
                     billing

  Analyst /          Dashboard, audit results, reports --- read-only
  Decision-maker     config

  Viewer             Dashboard and reports only --- no config access
  -----------------------------------------------------------------------

### 6.4 Notifications & Alerts

-   Bias score drops below threshold → email + in-app alert with
    drill-down link

-   Audit job completed → in-app notification with summary

-   API quota at 80% / 100% → email alert

-   New high-severity flagged output in live mode → optional Slack
    webhook

# 7. Non-Functional Requirements

  -----------------------------------------------------------------------
  **Requirement**           **Target**
  ------------------------- ---------------------------------------------
  Response latency          \< 2s for debiased output including all 3
  (sandbox)                 layers

  Dashboard load time       \< 1.5s Time to Interactive on 4G connection

  Uptime SLA                99.9% for SaaS dashboard; 99.95% for API
                            gateway

  Audit log throughput      Support 10,000 queries/minute per enterprise
                            tenant

  Accessibility             WCAG 2.1 AA --- screen reader support,
                            keyboard nav, 4.5:1 contrast

  Security                  SOC 2 Type II target; all data encrypted at
                            rest (AES-256) and in transit (TLS 1.3)

  Mobile responsiveness     Dashboard and sandbox fully usable on tablet;
                            reports readable on mobile

  Browser support           Chrome, Edge, Firefox, Safari --- last 2
                            major versions
  -----------------------------------------------------------------------

# 8. MVP vs Post-MVP Scope

  ------------------------------------------------------------------------
  **Feature**                        **MVP**       **Post-MVP**
  ---------------------------------- ------------- -----------------------
  Web SaaS Dashboard (all 5          ✓             
  sections)                                        

  Embeddable widget (basic)          ✓             

  REST API + API key management      ✓             

  OpenAI + Anthropic connector       ✓             

  Prompt Sandbox --- split pane +    ✓             
  diff                                             

  Bias Audit --- upload + scan +     ✓             
  results table                                    

  Layer 3 RL post-processing config  ✓             

  Layer 1 QLoRA + CDA config         ✓             

  Layer 2 RLDF config                ✓             

  PDF compliance report export       ✓             

  RBAC (4 roles)                     ✓             

  Gemini, Mistral, Azure connectors                ✓

  Slack / Teams bot integration                    ✓

  Tamper-evident audit hash chain                  ✓

  Custom fine-tuning via UI (upload                ✓
  your own data)                                   

  White-label embeddable widget                    ✓

  SOC 2 Type II certification                      ✓

  Mobile app (iOS / Android)                       ✓
  ------------------------------------------------------------------------

# 9. Success Metrics

-   Activation: 70% of signups connect at least one LLM within 48 hours

-   Core action: 60% of activated users run at least one audit in week 1

-   Retention: 40% week-4 retention among enterprise trial accounts

-   Widget embed: 30% of engineer users deploy the embeddable widget
    within 30 days

-   NPS: \> 40 among enterprise decision-maker persona at 90-day mark

# 10. Open Questions

-   Pricing model: per-API-call vs per-seat vs per-query-volume --- to
    be decided before beta

-   Data residency: do enterprise clients require on-prem or regional
    deployment options?

-   Reward model costs: RLDF uses GPT-4o as AI judge --- pass-through
    cost or absorb into platform pricing?

-   Feedback loop privacy: user thumbs-up/down on debiased outputs ---
    is that data used to retrain? Needs explicit consent UX.

-   White-label: should the embeddable widget expose the LMSense brand
    or be fully white-labelled for enterprise?

*--- End of Document ---*
