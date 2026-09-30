# BudgetPlanner

**How much money can I actually spend right now, without touching what I've already planned for?**

Most finance apps only show your balance. The balance does not tell you what you can
really spend: part of it is already committed to next month's rent, to the car
insurance due in October, or to the grocery budget you set yourself. BudgetPlanner
takes this into account and answers the question directly.

It is a **planning tool**, not a copy of your bank account. You manage one real pot of
money, and the app splits it into virtual reservations for budgets and fixed costs.
What is left over is money you can spend without worrying.

## Features

### Dashboard: "Free to Use" at a glance

The dashboard shows the most important number first:

> **Free to Use = Balance − (fixed-cost reserves + remaining budgets)**

Alongside it you see your current balance, how much is still set aside in budgets,
how much should already be reserved for fixed costs, and your latest transactions.
Pick any date to see how things looked (or will look) on that day.

**Your benefit:** you don't have to do the maths in your head. If "Free to Use" is
positive, you can spend that money without risking an upcoming bill or breaking a budget.

### Transactions: record income and expenses

- Record **income** and **expenses** with name, amount, date, category and an optional note.
- Record your **starting balance** once as an initial balance. From then on the app calculates your balance itself.
- The balance **carries over** automatically from month to month.
- Link a payment to a **fixed cost** (e.g. the rent transfer to "Rent"), so the app knows that fixed cost is paid this month.
- **Void** instead of delete: a wrong entry stops counting but stays visible, so your history remains traceable.
- For each date you see the balance, the income and the expenses.

**Your benefit:** a complete, honest record of where your money went. Nothing disappears silently.

### Category suggestions with AI

While you enter a transaction, the app can suggest a category based on its name and
description, for example "Supermarket" for "Groceries".

- If the category field is empty, the suggestion fills it in. The app **asks you first** before it replaces a category you have chosen yourself.
- If none of your categories fits, the app suggests a **new category** and creates it only if you agree.
- **You choose the AI:** a local model on your own computer (e.g. via LM Studio), so your transaction data never leaves it, or an external provider such as OpenAI or Z.AI.
- If no AI model is configured or reachable, the app works exactly the same, just without suggestions.

**Your benefit:** less typing and more consistent categories. You still decide which category a transaction gets.

### Fixed costs: never be surprised by a bill again

- Enter recurring costs such as rent, insurance, subscriptions or memberships with any **interval**: every n days, weeks, months or years (e.g. "every 3 months" or "once a year").
- The **monthly preview** shows which fixed costs are due in a given month and how much they add up to.
- The app calculates a **reserve** for every fixed cost: how much you should already have put aside by today so the next payment is covered. A yearly insurance of €600 therefore counts as €50 per month, instead of hitting you all at once.
- As soon as a fixed cost is paid in a month, its reserve for that month no longer counts.

**Your benefit:** large, rare bills are spread across the months in advance and are already subtracted from "Free to Use".

### Budgets: set limits per category

- Set a monthly **spending limit** for any category, e.g. €400 for groceries.
- For each budget you see how much you have **spent** and how much is **left**, with a progress bar that changes colour as you get close to the limit.
- Whatever is left in your budgets counts as reserved and is subtracted from "Free to Use".
- Switch between months to plan ahead or look back.

**Your benefit:** you notice early in the month when a category is getting tight, not only when the money is gone.

### Categories: your own structure

- Create, rename and delete your own categories. A category is simply a label and works for income and expenses alike.
- Names are unique regardless of upper and lower case ("Rent" and "rent" count as the same).
- Deleted categories can be **restored**. If you create a category with the name of a deleted one, the app offers to bring the old one back, including its transactions, budgets and fixed costs.

**Your benefit:** your data is organised the way you think about money, and nothing is lost by deleting too quickly.

### Your own account

- **Register** and start right away. You are logged in immediately after registration.
- Secure login. All data belongs to your account only.

## How It Works

The app is built around a few clear terms (full glossary in [`CONTEXT.md`](CONTEXT.md)):

| Term | Meaning |
|---|---|
| **Balance** | The money you actually have, calculated from all transactions that are not voided. |
| **Allocated money** | Money that is still in your account but already committed: remaining budgets and fixed-cost reserves. |
| **Free to Use** | Balance minus allocated money: what you can spend without touching your plans. |
| **Fixed-cost reserve** | How much should already be set aside for a fixed cost so its next payment is covered. |

**Planned:** savings goals as virtual pots, and a month-end review where leftover budget can be moved into a savings goal.

## Tech Stack

| Part | Technology |
|---|---|
| Frontend | Angular 21, TypeScript, Angular Material |
| Backend | Python 3.13, Flask 3.1, SQLAlchemy 2.0, Alembic |
| Database | PostgreSQL |
| Authentication | JWT |
| AI (category suggestions) | Any OpenAI-compatible LLM endpoint of your choice (local or external) |

## Project Structure

```
BudgetPlanner/
├── backend/      # Flask REST API        → see backend/README.md
├── frontend/     # Angular single-page app → see frontend/README.md
├── docs/         # Planning documents and ADRs
└── CONTEXT.md    # Domain glossary
```

## Getting Started

You need **Python 3.13**, **Node.js** with npm, and a running **PostgreSQL** server.
For category suggestions you also need an AI model, either locally (e.g. [LM Studio](https://lmstudio.ai/))
or an API key from an external provider. This is optional.

### Before the first start: configure `backend/.env`

Copy [`backend/.env.example`](backend/.env.example) to `backend/.env` and adjust it:

| What | Variables | Required |
|---|---|---|
| PostgreSQL connection | `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME` | Yes |
| Secret for signing login tokens (a long random string) | `JWT_SECRET_KEY` | Yes |
| AI for category suggestions | `LLM_BASE_URL`, `LLM_MODEL`, `LLM_API_KEY`, `LLM_TIMEOUT_SECONDS` | No |

**Choosing the AI for category suggestions.** The app does not come with a preset
provider. Pick the option that suits you and fill in its `LLM_*` lines in `.env`:

| Option | Good for | Suggested model | Data leaves your computer? | Cost |
|---|---|---|---|---|
| **Local model** via LM Studio | Privacy, no rate limits | `gemma-4-e4b-it-qat` (Gemma 4 E4B) or Qwen 3.5 4B | No | Free, but the model must be running |
| **OpenAI** | Reliable, fast answers without local hardware | `gpt-4.1-mini` | Yes | Paid per request (very little per suggestion) |
| **Z.AI** | Trying it out with a free tier | `glm-4.7-flash` | Yes | Free tier, often rate-limited |
| Any other OpenAI-compatible provider | Your own preference | — | Depends | Depends |

Leave the `LLM_*` lines out and the app runs without suggestions. Step-by-step
instructions for each option are in the
[Backend README → Category Suggestions: Choosing an LLM](backend/README.md#category-suggestions-choosing-an-llm).

### Start

1. Set up and start the backend: [Backend README → Setup](backend/README.md#setup).
   The API runs at `http://localhost:5000`.
2. Set up and start the frontend: [Frontend README → Setup](frontend/README.md#setup).
   The app runs at `http://localhost:4200`.
3. Open `http://localhost:4200`, register, and record your starting balance as your first transaction.

## Further Documentation

- [Backend README](backend/README.md): architecture, database models, all API endpoints, migrations, tests, LLM configuration
- [Frontend README](frontend/README.md): structure, routing, auth flow, development commands, code conventions
- [`CONTEXT.md`](CONTEXT.md): domain glossary
- [`docs/adr/`](docs/adr/): architecture decision records
