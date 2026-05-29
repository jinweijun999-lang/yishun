# YiShun 14-Day Launch Calendar

## Operating Rule

YiShun is the only product in scope until it proves consumer-grade launch readiness. Every growth action must use UTM links, preserve the self-reflection disclaimer, and route users toward the same first-value loop: start reading, view preview, save report, share card, and consider checkout.

## Daily Cadence

- 09:30 CST: generate YiShun daily report and review traffic, activation, saved_report, share_clicked, checkout_started, entitlement_granted, and webhook_failed.
- 10:00 CST: choose one conversion issue and one content angle for the day.
- 16:00 CST: publish or schedule content using the UTM table below.
- 21:00 CST: check comments, support tickets, failed checkout/webhook signals, and share-page traffic.

## UTM Rules

- `utm_source`: `seo`, `tiktok`, `instagram`, `youtube`, `reddit`, `xiaohongshu`, `share`.
- `utm_medium`: `organic`, `short_video`, `community`, `social`, `seo_page`.
- `utm_campaign`: `yishun_d01_timing`, `yishun_d02_love`, `yishun_d03_career`, etc.
- Never publish a link without UTM parameters.

## 14-Day Plan

| Day | Channel | Asset | Hook | CTA | Metric |
| --- | --- | --- | --- | --- | --- |
| 1 | SEO | Update free BaZi calculator intro | "Find today's timing signal from your birth chart" | Start free reading | reading_start_clicked |
| 1 | TikTok | 20s screen-record demo | "Before you text them, check your timing window" | Try the free YiShun reading | reading_preview_generated |
| 2 | Instagram | Carousel | "Three signs today is a planning day, not a forcing day" | Save your report | saved_report |
| 2 | Reddit | Soft post in astrology/self-improvement context | "I built a BaZi timing companion for reflection" | Try and critique | reading_preview_generated |
| 3 | YouTube Shorts | 25s demo | "Career move today: push, wait, or prepare?" | Generate career timing | reading_start_clicked |
| 3 | Xiaohongshu | Overseas Chinese note | "今日宜顺: 用八字看今天适合推进什么" | Open daily timing | daily_card_viewed |
| 4 | SEO | Sample report page internal links | "What a full YiShun report contains" | View sample | pricing_viewed |
| 5 | TikTok | Love timing script | "Do not ask the big question during the wrong hour" | Create relationship card | share_clicked |
| 6 | Instagram | Reels + story poll | "Which decision are you timing this week?" | Start free reading | reading_start_clicked |
| 7 | Reddit | Follow-up results post | "What changed after the first 100 timing readings" | Share feedback | share_page_viewed |
| 8 | SEO | Daily Chinese horoscope page refresh | "Today's practical timing, not generic luck" | View daily card | daily_card_viewed |
| 9 | TikTok | Money boundary script | "A money day can still mean: do less" | Save report | saved_report |
| 10 | Instagram | Before/after product walkthrough | "From birth time to one action plan in 90 seconds" | Start reading | birth_info_submitted |
| 11 | YouTube Shorts | Report library demo | "Why saving your timing card matters tomorrow" | Save your report | saved_report |
| 12 | Xiaohongshu | Decision companion post | "不是算命玩具, 是每日决策陪伴" | Try daily timing | reading_preview_generated |
| 13 | Reddit | Transparent builder update | "What I learned from YiShun conversion data" | Critique the flow | analyst_questions |
| 14 | All | Launch recap | "14 days of Eastern timing experiments" | Share your card | share_clicked |

## Review Thresholds

- Visitor to preview completion below 25%: fix onboarding copy or form friction before adding more content.
- Saved-report rate below 15% of previews: improve save CTA placement and report library value.
- Share-click rate below 8% of previews: improve share card preview and landing CTA.
- Checkout starts without entitlement grants: stop growth push and investigate Stripe webhook fulfillment.
- Any live webhook failure: alert and pause paid promotion until resolved.
