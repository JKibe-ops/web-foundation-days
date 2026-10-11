# SnapShare Scaling Plan

## Assumptions

- The 10 million registered users and 10% daily-active rate produce 1 million active users per day.
- Each active user uploads one original photo and views 50 feed pages per day; a feed page view is counted as one feed request.
- Average rates spread daily activity evenly across 24 hours; peak feed views are estimated at 5 times the average rate.
- A year has 365 days, every original and thumbnail is retained, and storage figures use decimal units (1 TB = 1,000,000 MB).
- Storage estimates include only original photos and thumbnails, not replicas, backups, metadata, or temporary files.

## Traffic and storage estimates

| Measure | Calculation | Estimate |
|---|---|---:|
| Daily uploads | 1,000,000 active users × 1 photo | 1,000,000 photos/day |
| Average uploads per second | 1,000,000 ÷ 86,400 seconds | About 11.6 uploads/second |
| Daily feed page views | 1,000,000 active users × 50 pages | 50,000,000 pages/day |
| Average feed views per second | 50,000,000 ÷ 86,400 seconds | About 579 feed views/second |
| Peak feed views per second | (50,000,000 ÷ 86,400) × 5 | About 2,894 feed views/second |
| Original-photo storage per year | 365,000,000 photos × 2 MB | 730 TB/year |
| Thumbnail storage per year | 365,000,000 thumbnails × 0.05 MB | 18.25 TB/year |
| Total new photo storage per year | 730 TB + 18.25 TB | About 748.25 TB/year |

SnapShare is **read-heavy**: it has 50 million feed-page reads per day versus 1 million uploads per day, or 50 feed reads per upload. The design should therefore scale feed reads independently, use the cache and CDN to absorb repeat traffic, and direct database reads to a replica; the primary database still handles writes.

## Photo file storage

Photo files should not be stored as binary data inside the database because large files increase database size and backup/restore time, consume database resources, and make high-volume media delivery less efficient. Store originals and thumbnails in object storage, which is designed for durable, scalable file storage; keep ownership, captions, timestamps, and object keys in the database, and serve the files through the CDN.

## Architecture

```text
 +------------------+   feed / API   +-----+   cache miss / API   +----------------+
 | Feed and upload  |--------------->| CDN |-------------------->| Load balancer  |
 | clients          |<---------------|     |                     +-------+--------+
 +--------+---------+  photo files   +--+--+                             |
          |                               ^                              v
          | authorized direct upload      | photo files          +------+------+
          v                               |                       | App servers |
 +--------+----------------+              |                       +--+--+--+--+-+
 |     Object storage      |--------------+                          |  |  |  |
 | originals and thumbnails|                                         |  |  |  |
 +-----------+-------------+                                         |  |  |  |
             ^                                                       |  |  |  |
             | read original / write thumbnail                       |  |  |
     +-------+--------+                                               |  |  |
     | Thumbnail      |<--- jobs---+                                  |  |  |
     | worker         |            |                                  |  |  |
     +----------------+       +----+-----+                            |  |  |
                              |  Queue   |<----------------------------+  |  |
                              +----------+                       enqueue job |
                                                                         |  |
                                                       +-----------------+  +-----------------+
                                                       v                                    v
                                                  +----+-----+                      +------+------+
                                                  |  Cache   |                      |  Primary    |
                                                  +----------+                      |  database   |
                                                                                    +------+------+
                                                                                           |
                                                                                      replication
                                                                                           v
                                                                                    +------+------+
                                                                                    | Read replica|
                                                                                    +-------------+

 Feed reads use the cache and read replica; app servers authorize direct client uploads.
```

## What each component solves

- **CDN:** Serves cached photos and thumbnails close to viewers, reducing origin traffic and download latency.
- **Load balancer:** Distributes incoming API requests across healthy app-server instances.
- **App servers:** Authenticate users and handle upload coordination, feed requests, and application logic without keeping user session state on one server.
- **Cache:** Keeps frequently requested feed data and other hot lookup results out of the database's critical path.
- **Primary database:** Stores authoritative user, follow, photo metadata, and feed-related records and accepts writes.
- **Read replica:** Handles read queries such as feed assembly so they do not compete directly with database writes.
- **Object storage:** Stores the large original photo and thumbnail files durably outside the relational database.
- **Queue:** Buffers thumbnail jobs so upload requests do not have to wait for image processing and jobs can be retried.
- **Thumbnail worker:** Reads queued jobs, creates the 50 KB thumbnail, writes it to object storage, and makes it available through the CDN.

## Photo upload flow

1. The client sends an authenticated upload request to the load balancer, which routes it to an app server.
2. The app server validates the request and records a pending photo and its owner in the primary database.
3. The client uploads the 2 MB original to object storage using an upload authorization issued by the app server.
4. After the original is stored, the app server marks the photo as uploaded and puts a thumbnail-generation job on the queue.
5. A thumbnail worker consumes the job, reads the original from object storage, and creates the 50 KB thumbnail.
6. The worker stores the thumbnail in object storage and updates the photo metadata; the CDN can then cache and serve the original and thumbnail to feed viewers.
7. Feed requests use cached data when available, otherwise app servers read the necessary metadata from the read replica and return photo URLs served by the CDN.

## Trade-offs

- **Asynchronous thumbnails improve upload latency but delay thumbnail availability:** Users can finish uploads without waiting for image processing, but a newly uploaded photo may briefly appear without its thumbnail if the queue is backed up.
- **A read replica and cache improve feed throughput but can serve stale data:** Replication lag and cache expiry mean a new upload or follow change may not immediately appear in every feed.
- **Object storage and a CDN scale photo delivery but add operational components and costs:** They reduce application-server bandwidth and improve global delivery, while requiring cache invalidation, access controls, and monitoring across additional services.
- **The average-rate estimates simplify capacity planning but hide bursts:** The system needs load testing and headroom for peak upload/view rates, which will cost more than provisioning for the averages alone.
