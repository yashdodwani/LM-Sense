# LM-Sense

<!-- Purpose: Project overview, setup guide, and architecture reference for all contributors and enterprise evaluators -->

> **Bias mitigation as a layer — not a replacement.**  
> Drop LM-Sense over any LLM to detect, debias, and audit outputs in real time.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: MVP](https://img.shields.io/badge/Status-MVP%20Build-orange)]()
[![PRD](https://img.shields.io/badge/Docs-PRD%20v1.0-purple)]()

---

## What is LM-Sense?

LLMs trained on historical internet data inherit the biases embedded in that data — gender stereotypes in job descriptions, racial bias in medical risk assessments, geographic discrimination in safety scores. LM-Sense is a **three-layer debiasing stack** that sits between your application and any LLM, correcting outputs before they reach users.

```
Your App  →  LM-Sense API  →  LLM (GPT-4, Gemini, Claude, ...)
                  ↓
          Debiased · Scored · Audited
```

No retraining. No model replacement. Just plug it in.

---

## How it works

LM-Sense applies three independent layers at different stages of the pipeline:

| Layer | Stage | Method | What it does |
|---|---|---|---|
| **Layer 1** | Training-time | QLoRA + CDA | Fine-tunes a lightweight adapter using counterfactual data augmentation — swaps gendered/racial terms in training pairs to teach the model neutrality |
| **Layer 2** | Alignment | RLDF | Reinforcement learning from multi-role debates — an AI judge scores biased vs debiased response pairs, PPO updates the policy toward fairness |
| **Layer 3** | Inference-time | RL Post-processing | Runtime guard on every output — rewrites, flags, or blocks biased content using projection-based embedding correction |

Each layer catches what the previous one misses. Failure of one does not compromise the output.

---

## Product Modes

- **Web SaaS Dashboard** — full control plane at `app.lm-sense.ai` for auditing, sandbox testing, pipeline config, and compliance reporting
- **Embeddable Widget** — one-line JS snippet that overlays LM-Sense onto any existing LLM chat interface
- **REST API** — headless access: pass any LLM response, receive debiased + scored output

---

## Project Structure

```
lm-sense/
├── apps/
│   ├── web/                  # Next.js SaaS dashboard (TypeScript)
│   │   ├── app/              # App router pages
│   │   │   ├── dashboard/    # Home dashboard — bias score overview
│   │   │   ├── audit/        # Bias audit — upload, scan, results
│   │   │   ├── sandbox/      # Prompt sandbox — raw vs debiased split view
│   │   │   ├── pipeline/     # Pipeline config — Layer 1/2/3 settings
│   │   │   ├── integrations/ # LLM connectors, widget config, API keys
│   │   │   └── reports/      # Compliance report generation
│   │   └── components/       # Shared UI components
│   └── widget/               # Embeddable JS widget (Vanilla TS, zero deps)
│
├── services/
│   ├── api-gateway/          # FastAPI gateway — entry point for all requests
│   ├── debias-engine/        # Core debiasing pipeline (Layers 1, 2, 3)
│   ├── bias-scorer/          # Bias detection and scoring service
│   ├── audit-logger/         # Tamper-evident audit trail (hash chain)
│   ├── reward-model/         # RLDF reward model service (AI judge)
│   └── report-generator/     # PDF / CSV compliance report generation
│
├── ml/
│   ├── qlora/                # QLoRA adapter training scripts
│   ├── cda/                  # Counterfactual data augmentation pipeline
│   ├── rldf/                 # RLDF training — debate generation + PPO
│   └── postprocess/          # RL post-processing layer — projection methods
│
├── infra/
│   ├── docker/               # Dockerfiles per service
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Cloud infrastructure (AWS / GCP)
│
├── packages/
│   ├── lm-sense-sdk/        # Node.js SDK for API integration
│   └── lm-sense-types/      # Shared TypeScript types across monorepo
│
└── docs/
    ├── PRD_UI_v1.0.docx      # Product requirements document
    ├── api-reference.md      # REST API reference
    └── architecture.md       # System architecture deep-dive
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| **Widget** | Vanilla TypeScript, zero runtime dependencies |
| **API Gateway** | FastAPI (Python), async, OpenAPI auto-docs |
| **Debias Engine** | Python, PyTorch, Hugging Face Transformers |
| **ML Training** | QLoRA via `peft` + `bitsandbytes`, PPO via `trl` |
| **Database** | PostgreSQL (audit logs, config) + Redis (cache, queue) |
| **Message Queue** | Celery + Redis (async audit jobs) |
| **Auth** | Clerk / Auth.js with RBAC middleware |
| **Infra** | Docker, Kubernetes, Terraform (AWS EKS) |
| **Observability** | OpenTelemetry, Grafana, Sentry |

---

## Quickstart

### Prerequisites

- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- An API key for at least one LLM provider (OpenAI, Anthropic, or Gemini)

### 1. Clone & install

```bash
git clone https://github.com/your-org/lm-sense.git
cd lm-sense

# Install Python dependencies
pip install -r requirements.txt

# Install JS dependencies
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

```env
# LLM Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lm-sense
REDIS_URL=redis://localhost:6379

# Auth
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...

# LM-Sense internals
REWARD_MODEL=gpt-4o          # AI judge for RLDF layer
FAIRNESS_LAMBDA=0.7          # Fairness shaping coefficient (0.0–1.0)
BIAS_THRESHOLD=0.6           # Flag outputs with bias score below this
```

### 3. Start with Docker Compose

```bash
docker compose up --build
```

Services will be available at:

| Service | URL |
|---|---|
| Web Dashboard | http://localhost:3000 |
| API Gateway | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Flower (queue monitor) | http://localhost:5555 |

### 4. Run without Docker (dev mode)

```bash
# Terminal 1 — API gateway
cd services/api-gateway
uvicorn main:app --reload --port 8000

# Terminal 2 — Web dashboard
cd apps/web
npm run dev

# Terminal 3 — Celery worker (async audit jobs)
celery -A services.audit-logger.worker worker --loglevel=info
```

---

## API Usage

### Debias a single response

```python
import requests

response = requests.post("https://api.lm-sense.ai/v1/debias", 
  headers={"Authorization": "Bearer fl_your_api_key"},
  json={
    "model": "gpt-4o",
    "prompt": "Write a job description for a software engineer",
    "raw_response": "He should have 5 years of experience...",
    "layers": ["postprocess"]   # or ["qlora", "rldf", "postprocess"] for all
  }
)

data = response.json()
print(data["debiased_response"])   # corrected output
print(data["bias_score"])          # 0–100, higher = more fair
print(data["bias_types"])          # ["gender"]
print(data["layer_trace"])         # which layers fired and what changed
```

### Embeddable Widget

```html
<!-- Add to any page with an LLM chat interface -->
<script 
  src="https://cdn.lm-sense.ai/widget.js"
  data-api-key="fl_your_api_key"
  data-theme="auto"
  data-position="bottom-right">
</script>
```

The widget auto-detects LLM response elements and overlays the bias badge + diff view.

---

## Architecture Overview

```
                         ┌─────────────────┐
                         │   Client Apps   │
                         │ Web · Widget · SDK│
                         └────────┬────────┘
                                  │ HTTPS
                         ┌────────▼────────┐
                         │  API Gateway    │
                         │   (FastAPI)     │
                         └─┬──────────┬───┘
                           │          │
              ┌────────────▼──┐  ┌───▼────────────┐
              │  Bias Scorer  │  │  Debias Engine  │
              │  (detection)  │  │  Layer 1/2/3    │
              └────────────┬──┘  └───┬────────────┘
                           │         │
                    ┌──────▼─────────▼──────┐
                    │     Audit Logger       │
                    │  (hash chain + PG)     │
                    └───────────────────────┘
```

Full architecture diagram: see `docs/architecture.md`

---

## Roles & Access

| Role | Access |
|---|---|
| **Admin** | Full — billing, API keys, pipeline config, team |
| **Engineer** | Pipeline config, integrations, sandbox, audit |
| **Analyst** | Dashboard, audit results, reports (read-only config) |
| **Viewer** | Dashboard and reports only |

---

## Roadmap

- [x] Three-layer debiasing pipeline (QLoRA + CDA, RLDF, RL post-processing)
- [x] REST API with OpenAPI docs
- [ ] Web SaaS dashboard (in progress)
- [ ] Embeddable widget MVP
- [ ] OpenAI + Anthropic connectors
- [ ] Bias audit — CSV/JSONL upload + scan
- [ ] PDF compliance report export
- [ ] Gemini, Mistral, Azure connectors
- [ ] Slack / Teams webhook alerts
- [ ] Tamper-evident audit hash chain
- [ ] SOC 2 Type II

---

## Contributing

1. Fork the repo and create a feature branch: `git checkout -b feat/your-feature`
2. Follow the coding standards in `CONTRIBUTING.md`
3. All ML changes require a bias benchmark run — see `ml/benchmarks/`
4. Open a PR with a clear description of what layer is affected

---

## License

MIT — see [LICENSE](LICENSE)

---

*Built for the Google Solution Challenge · LM-Sense Team · 2026*