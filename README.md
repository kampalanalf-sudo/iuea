# Gateway Revival Glory Church (GRGC) — Website

Official website for **Gateway Revival Glory Church**, Kampala, Uganda —
led by **Pastor Agatha Idusso**, with branches in **Tema Village**, **Kikyusa** and **Kayabwe (Masaka Road)**.

## Features
- ★ Main feature: **Anniversary Celebrations & Glory Conference 2026** (Tema Branch) with photo gallery
- Branches section with service times, maps & directions
- **Word from Pastor Agatha Idusso**
- **Projects**: Gayaza Youth Home (former street children) + 6 ministries
- **Videos**: Sunday services & event videos (YouTube)
- **Testimonies**: carousel + submission form
- **Prayer requests**: form + WhatsApp prayer hotline
- **Give**: Mobile Money (MTN/Airtel), bank transfer & card checkout (demo)
- Floating **WhatsApp button** → +256 772 421 488
- Events, newsletter signup, contact footer

## Run locally
Just open `index.html` in a browser, or:
```bash
cd /home/user/iuea && python3 -m http.server 8080
# visit http://localhost:8080
```

## Customize
| Task | File |
|---|---|
| Add sermon videos (YouTube IDs) | `js/main.js` → `VIDEOS` array |
| Bank / MoMo details | `index.html` → `#give` section |
| Branch info & service times | `index.html` → `#branches` |
| Photos | replace files in `assets/images/` |
| Styling / colours | `css/styles.css` |

> Note: the Google Drive file `recovered.pdf` mentioned in the request was not found
> in the connected Drive (only 9 other files exist). The site ships with original
> content + AI-generated placeholder imagery. Drop the real photos/text in and the
> site updates instantly — no code changes needed beyond the files above.

## Deploy
Static site — host anywhere: GitHub Pages, Netlify, Vercel, cPanel, etc.
