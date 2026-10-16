# TicketHub System Design

## 1. Requirements

### Functional requirements

- Visitors can browse and search events, view event details, and see seat availability and prices.
- Registered users can sign in, select seats, temporarily hold them, pay, and receive tickets.
- Users can view their orders and tickets and cancel or request a refund where the event's policy allows it.
- Organizers can create events, configure seat prices, and view sales.
- The system expires unpaid holds and makes those seats available again.
- A user can safely retry an order or payment request without accidentally creating duplicate orders or charges.

### Non-functional requirements

- **Correctness:** A seat can be held or sold to at most one order for a particular event. The database, not a cache, is the source of truth for inventory.
- **Fairness:** A buyer must not gain priority by refreshing or opening many tabs. At the announced sale start, the waiting room assigns a randomized, auditable order to the people already waiting; later arrivals join the end of the queue. Signed queue tokens, per-account limits, and a published seat limit reduce queue jumping and bulk buying.
- **Availability:** Browsing should remain available during a sale surge even if checkout is slowed or queued. Target 99.9% monthly availability for browsing and checkout, excluding planned maintenance.
- **Performance:** Target p95 under 2 seconds for event and seat-map pages and under 1 second for an order/hold response, excluding time spent waiting in the virtual queue and at the payment provider.
- **Scalability:** Handle the calculated 333 sale attempts per second as a sustained average during a major on-sale event, with additional headroom established through burst load testing.
- **Security:** Require authentication to reserve or buy; authorize access to orders by their owner; validate inputs; use HTTPS; and avoid storing card numbers or security codes. Use a compliant payment provider.
- **Durability and auditability:** Persist orders, payment outcomes, and ticket issuance so that retries and support investigations can establish what happened.

## 2. Traffic estimates

Assumptions: daily activity is spread evenly across 24 hours for average-rate calculations. A page view is one page request; the CDN serves cacheable page assets, so origin traffic will be lower for those assets. Peak bursts are not specified by the given facts and must be measured with load tests.

| Measure | Calculation | Estimate |
|---|---|---:|
| Registered users | Given | 2,000,000 |
| Normal daily page views | 50,000 visitors × 10 pages | 500,000 page views/day |
| Normal average page-view rate | 500,000 ÷ 86,400 seconds | About 5.8 page views/second |
| Normal daily tickets sold | Given | 5,000 tickets/day |
| Normal average ticket-sale rate | 5,000 ÷ 86,400 seconds | About 0.058 tickets/second, or 1 every 17 seconds |
| Popular-sale attempts | 200,000 people ÷ 600 seconds | About 333 people/attempts per second for 10 minutes |
| Popular-sale inventory | Given | 20,000 seats |
| Popular-sale average sales needed to sell out | 20,000 ÷ 600 seconds | About 33 seats/second |
| Big-sale attempts vs normal ticket sales | 333 attempts/second ÷ 0.058 tickets/second | About 5,740 times the normal average ticket-sale rate |
| Demand compared with inventory | 200,000 people ÷ 20,000 seats | 10 people per seat; at least 180,000 people cannot get a seat if each person makes one attempt |

The big-sale attempt rate is about 5,740 times the normal average ticket-sale rate. Its 333 attempts per second also exceeds the normal average page-view rate of about 5.8 per second, although those are different kinds of requests and are not a direct like-for-like comparison. Every attempted purchase can generate several API calls, and many other visitors will browse, so the queue and load tests must account for more than 333 total requests per second. A virtual waiting room smooths the arrival burst and admits buyers at a controlled rate. Event details and static content can be cached, but seat availability and order decisions must be checked against authoritative inventory. Averages are not peak limits: burst capacity needs to be set from load tests and live monitoring.

## 3. API

All endpoints use HTTPS and JSON. Authenticated endpoints require a bearer token. Order creation and payment accept an `Idempotency-Key` so a client retry returns the original result rather than creating a duplicate.

| Method and path | Purpose | Success response |
|---|---|---|
| `GET /api/events?query=&date=` | Search upcoming events; supports pagination and filters. | `200 OK` with event summaries |
| `GET /api/events/{eventId}` | Get event details, venue, and sale information. | `200 OK` with event |
| `GET /api/events/{eventId}/seats` | Get a seat map with current availability and prices. This is an advisory view; a seat may change before a hold is created. | `200 OK` with seats |
| `POST /api/events/{eventId}/orders` | Hold one or more selected seats for the signed-in user. The body contains `seatIds`; the idempotency key identifies retries. | `201 Created` with order ID and hold expiry, or `409 Conflict` if any requested seat is unavailable |
| `POST /api/orders/{orderId}/payment` | Pay for an unexpired hold. The payment provider token is supplied, not raw card details. | `200 OK` with order status, or `402 Payment Required` if payment fails |
| `GET /api/orders/{orderId}` | Get the signed-in user's order and status. | `200 OK`, or `404 Not Found` if the order does not exist or is not visible to that user |
| `GET /api/me/tickets` | List the signed-in user's issued tickets, with event details and ticket codes. | `200 OK` with tickets |
| `DELETE /api/orders/{orderId}` | Cancel an unpaid hold and release its seats. | `204 No Content` |

Common errors include `400 Bad Request` for invalid input, `401 Unauthorized` for missing or invalid authentication, `403 Forbidden` for a disallowed action, `404 Not Found` for an unknown resource, `409 Conflict` for unavailable seats or an expired hold, and `429 Too Many Requests` when rate-limited.

## 4. Data model

Use a relational database for the authoritative inventory and order records. Foreign keys, unique constraints, and transactions protect relationships and prevent duplicate sales.

| Table | Important columns and constraints |
|---|---|
| `users` | `user_id` primary key, unique email, password hash, account status |
| `venues` | `venue_id` primary key, name, address |
| `seats` | `seat_id` primary key, `venue_id` foreign key, section and seat label; unique (`venue_id`, `section`, `seat_label`) |
| `events` | `event_id` primary key, `venue_id` foreign key, title, start time, sale status |
| `event_seats` | `event_id` and `seat_id` foreign keys, status (`AVAILABLE`, `HELD`, `SOLD`), nullable `order_id` foreign key when held; hold expiry; primary key (`event_id`, `seat_id`) |
| `orders` | `order_id` primary key, `user_id` and `event_id` foreign keys, status (`HELD`, `PAYMENT_PENDING`, `PAID`, `CANCELLED`, `EXPIRED`), expiry, idempotency key; unique (`user_id`, `idempotency_key`) and (`order_id`, `event_id`) |
| `order_items` | `order_id`, `event_id`, and `seat_id`; composite foreign keys to the matching order and `event_seats` row; primary key (`order_id`, `event_id`, `seat_id`) |
| `payments` | `payment_id` primary key, `order_id` foreign key, provider reference, amount, status; unique provider reference and idempotency key |
| `tickets` | `ticket_id` primary key, `order_id`, `event_id`, and `seat_id`; foreign key to its `order_items` row, unique ticket code; unique (`event_id`, `seat_id`) |

An event is held at one venue; a venue has many seats and events. `event_seats` creates one inventory record for each seat at each event, so the same physical seat can be sold at different events while only once per event. A user can have many orders, an order can contain many seats through `order_items`, and a paid order can issue tickets and have payment records. The order record also represents the temporary hold before payment; expired or cancelled order history remains available without retaining ownership of the seat.

### Preventing two buyers from purchasing the same seat

The database is the final authority; cached seat maps are only informational. When creating an order, the application opens a database transaction, locks the requested `event_seats` rows in a consistent order, and changes each seat from `AVAILABLE` to `HELD` with the order ID and expiry. It creates the order and its items in the same transaction. If any selected seat is not available, it rolls back the entire transaction and returns `409 Conflict`; no partial multi-seat hold is left behind. The row lock serializes simultaneous attempts for the same seat, so only one transaction can make the successful state change.

The database also enforces the unique (`event_id`, `seat_id`) key on inventory and tickets. These constraints are a second line of defense against application bugs or retries. Payment first changes the order to `PAYMENT_PENDING`, so the expiry worker cannot release its seats while a payment result is being resolved. Payment uses the same idempotency key on retries. When the provider confirms payment, a database transaction rechecks the held seats, changes them to `SOLD`, marks the order `PAID`, and issues ticket records. If payment fails, a transaction marks it failed and releases the seats. If the provider outcome is unknown or TicketHub is temporarily unavailable, the seats remain unavailable until an idempotent retry or reconciliation job checks the provider and resolves the order; this avoids releasing seats for a payment that may have succeeded.

## 5. Architecture

```text
 Visitors and buyers
          |
          v
 +-------------------------+
 | CDN and static content  |<----------------------+
 +------------+------------+                       |
              | API requests                       | cached event pages/assets
              v                                     |
 +-------------------------+                        |
 | API gateway / rate limit|                        |
 +------------+------------+                        |
              |                                     |
       +------+-------+                              |
       |              |                              |
       v              v                              |
 +-----------+  +----------------+                   |
 | Event and |  | Virtual waiting|                   |
 | browse API|  | room / admission|                  |
 +-----+-----+  +-------+--------+                   |
       |                 | admitted requests         |
       |                 v                           |
       |         +------------------+                 |
       +-------->| Order services   |                 |
                 +----+--------+---+                 |
                      |        |                     |
                      |        +------> +------------------+
                      |                 | Payment provider |
                      |                 +------------------+
                      v
              +---------------+       +------------------+
              | Inventory and |------>| Read cache       |
              | order database|       | browse data only |
              +-------+-------+       +------------------+
                      |
                      +------> +------------------+
                               | Job queue         |
                               +----+----------+--+
                                    |          |
                                    v          v
                             +----------+  +----------------+
                             | Hold      |  | Ticket/email  |
                             | expiry job|  | notifications|
                             +----------+  +----------------+
```

### Component responsibilities

- **CDN:** Serves static assets and cacheable event content close to users, reducing origin load. It does not decide whether a seat is available.
- **API gateway and rate limiter:** Routes requests, checks authentication tokens, enforces request limits, and rejects abusive traffic.
- **Event and browse API:** Serves event search and details; uses the CDN and read cache for high-volume, non-authoritative reads.
- **Virtual waiting room:** Queues buyers during a high-demand sale and admits a controlled number of requests, smoothing bursts before they reach inventory.
- **Order services:** Enforce business rules, create holds, coordinate checkout, and return order and ticket information. Signed queue tokens prevent refreshing or opening extra tabs from changing a buyer's place; account and seat limits help discourage bulk purchasing.
- **Inventory and order database:** Stores canonical seat status and transactional orders, payments, and ticket issuance. Seat writes go to the primary database; stale replicas or caches are never used to authorize a sale.
- **Read cache:** Holds browse data and may accelerate seat-map reads. Cache entries can be stale and are bypassed for order and checkout decisions.
- **Payment provider:** Processes payment data and returns authorization/capture results. TicketHub stores provider references and outcomes, not card details.
- **Job queue and workers:** Retry non-interactive tasks such as hold expiry and ticket email delivery without blocking browsing. The expiry worker rechecks seat state and expiry in the database before releasing inventory.
- **Failure handling:** Run multiple stateless API instances behind the gateway, monitor queue depth and database lock/latency metrics, and apply back-pressure by slowing queue admission when checkout is unhealthy. Durable queued work can be retried; payment retries use idempotency and reconciliation before a pending hold is released.

## 6. Trade-offs

- **Virtual queue versus immediate access:** A queue reduces overload and gives buyers a more orderly sale, but users may wait and the admission policy adds complexity. It must communicate queue status and avoid promising a seat before a successful hold.
- **Randomized initial admission versus pure first-come-first-served:** Randomizing among buyers present at the published start time reduces advantages from faster connections and refresh scripts, but buyers arriving just after the draw wait longer and need a clear, auditable policy.
- **Strongly consistent database writes versus faster cached reads:** Transactional primary-database checks protect seat ownership, but add latency and concentrate write load. Caching improves browse performance, but cached availability can be stale; therefore checkout always revalidates in the database.
- **Temporary holds versus immediate purchase-only allocation:** Holds give buyers time to pay and reduce abandoned checkout confusion, but temporarily hide seats from other buyers. Short expirations, visible countdowns, and safe expiry processing limit that cost.
- **Relational transactions versus a more distributed inventory design:** A relational database makes seat uniqueness and multi-seat rollback straightforward, but a single hot event can create lock contention. Partitioning inventory by event and queueing admission can help later, but splitting seat ownership across services/databases would make atomic multi-seat reservations and correctness harder.
