# BudgetPlanner

A personal-finance **planning** tool, not a banking mirror. It manages one real
pot of money split into virtual reservations, and its headline question is
"how much can I actually spend right now?".

## Language

### Money on hand

**Balance**:
The actual money available, computed from all non-voided transactions
(`INITIAL` + `INCOME` − `EXPENSE`). Never stored.
_Avoid_: account balance (as a stored value), Kontostand, real balance

**Transaction**:
A real movement of money — income, an expense, or the opening balance.
Carries a type (`INCOME` / `EXPENSE` / `INITIAL`) and a positive amount.
_Avoid_: booking, entry, payment, Buchung

**Initial Balance**:
The money that existed before tracking began, recorded as one transaction of
type `INITIAL` rather than a separate field.
_Avoid_: starting capital, Startkapital

**Void**:
Marking a transaction so it no longer counts, without deleting it.
_Avoid_: delete, cancel, remove

**Carryover**:
The balance rolled forward from the end of the previous month into the
current month's view.
_Avoid_: rollover (that word belongs to budgets)

### Reservations

**Allocated Money**:
Money that is logically committed — this month's remaining budgets, fixed-cost
reserves (later: savings goals) — even though it has not left the account.
_Avoid_: locked money, blocked money

**Free to Use**:
The headline figure: Balance minus Allocated Money. Answers "what can I spend
without touching anything I've planned for?".
_Avoid_: disposable income, available balance, spendable

### Categories & budgets

**Category**:
A user-defined label for grouping transactions, budgets and fixed costs. It has
no income/expense meaning of its own.
_Avoid_: tag, group, category type

**Category Suggestion**:
A non-binding proposal for a transaction's category, derived from a transaction's
name, description and type. It either pre-fills an empty category field, or asks
the user to confirm — before replacing a category they already set, and before
creating a new category. A transaction's category is set by the user, never by
the suggestion alone.
_Avoid_: auto-categorization, automatic assignment

**Budget**:
A spending limit for one category in one calendar month. Stores only the limit.
_Avoid_: envelope, allowance, Budgettopf

**Spent / Remaining**:
Derived budget figures — the month's expenses in that category, and limit minus
spent. Never stored.

### Fixed costs

**Fixed Cost**:
A recurring financial obligation (rent, insurance, subscription) modelled as a
standalone plan, never as a stream of transactions.
_Avoid_: recurring transaction, subscription, standing order, Dauerauftrag

**Interval**:
How often a fixed cost recurs — a unit (`DAY` / `WEEK` / `MONTH` / `YEAR`) and a
positive count, e.g. every 4 `MONTH`s.
_Avoid_: frequency, schedule

**Occurrence**:
A computed future instance of a fixed cost falling in a given month. Not stored.
_Avoid_: due transaction, projected transaction

**Fixed-Cost Reserve**:
How much money should already be set aside for a fixed cost by a given date so
its next payment is covered. The central fixed-cost calculation.
_Avoid_: depot, buffer, savings

**Monthly Contribution**:
The share of a fixed cost to set aside each month, regardless of its interval.
_Avoid_: installment, Rate

**Coverage Status**:
Whether a fixed cost's reserve is currently sufficient. Derived.

### Actor

**User**:
The account holder. The app serves a single user today; multi-user is prepared
for but out of scope.

## Planned vocabulary (agreed, not yet built)

**Savings Goal**:
A named virtual pot with a target amount. Its current amount is derived from
allocations; it is never a real account.

**Allocation**:
A logged, non-monetary assignment of reservation — e.g. a leftover budget moved
to a Savings Goal. Real money does not move.
_Avoid_: transfer, transaction

**Month-End Process**:
The periodic review where leftover budget is optionally allocated to Savings
Goals. Manual — the app informs, it does not auto-book.
