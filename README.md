# Hankin Availability

Front-end JavaScript for displaying live commercial property availability on
Hankin Group's Squarespace site. Pulls live data from a Yardi CommercialCafe
syndication feed via a Google Apps Script proxy.

## How it's wired up

```
Squarespace page
   └─ <script src="...jsdelivr.../availability.js">
        └─ fetches from Google Apps Script
             └─ pulls from Yardi CommercialCafe API
```

- **`availability.js`** — this file. Hosted on GitHub, served via jsDelivr,
  embedded once per property page on Squarespace.
- **Apps Script** — proxies the Yardi API, handles OAuth, caches the
  portfolio for 1 hour. The `API_URL` constant in `availability.js` points
  to its `/exec` URL.
- **Yardi CommercialCafe** — source of truth for available suites,
  square footage, and floor plan PDFs.

## Embedding on a Squarespace page

Each property page has a Code Block containing only:

```html
<script src="https://cdn.jsdelivr.net/gh/YOUR_USERNAME/hankin-availability@main/availability.js"></script>
```

The script reads the page's URL slug (e.g. `707-eagleview-boulevard`) and
displays that property's currently-available suites with floor plan links.

## Editing

1. Edit `availability.js` here on GitHub.
2. Commit.
3. jsDelivr serves the new version within ~12 hours (its cache window).
4. For immediate propagation, bump the `?v=N` query string on the embed in
   Squarespace (e.g. `availability.js?v=3`).

## Caching layers

- **jsDelivr** caches `availability.js` for ~12 hours.
- **Apps Script** caches the portfolio data for 1 hour, refreshed
  automatically by a time-based trigger.
- **Yardi** is hit only when the Apps Script cache expires.
