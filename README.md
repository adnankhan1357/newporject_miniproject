# spotNgo – Smart Campus Indoor Navigator

> Heritage Institute of Technology · A* Pathfinding · Flask + SQLite Backend

---

## Project Structure

```
newporject_miniproject/
├── frontend/
│   ├── index.html          # Main UI
│   ├── app.js              # Canvas renderer + API client
│   ├── style.css           # Glassmorphism styles
│   └── vercel.json         # Vercel SPA routing config
├── backend/
│   ├── app.py              # Flask API + SQLite database
│   └── requirements.txt    # Python dependencies
├── instance/               # Auto-created: holds spotngo.db (gitignored)
├── college_map.json        # Campus graph: 70 nodes, 74 edges
├── render.yaml             # One-click Render.com deployment
└── README.md
```

---

## Running Locally

### Backend (Flask)
```bash
cd backend
pip install -r requirements.txt
python app.py
# → http://localhost:5000
```

### Frontend
Open `frontend/index.html` in a browser, or serve with:
```bash
cd frontend
npx serve .
```

The frontend auto-connects to `http://localhost:5000` and falls back to offline mode if the backend is unreachable.

---

## Database

SQLite database auto-created at `instance/spotngo.db` on first run.

| Table | Purpose |
|-------|---------|
| `search_history` | Every route query with results |
| `route_records` | Full path logs for analytics |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/map` | Full map (nodes + edges) |
| POST | `/api/find-path` | A* pathfinding |
| GET | `/api/history` | Search history (last 20) |
| DELETE | `/api/history` | Clear history |
| GET | `/api/records` | All route records |
| GET | `/api/records/stats` | Usage statistics |
| POST | `/api/admin/login` | Admin authentication |
| POST | `/api/admin/save-map` | Save edited map |

### Find Path – Request/Response
```json
// POST /api/find-path
{ "from": "ext_f0_gate_number_9", "to": "cb_f1_uc_lab" }

// Response
{
  "success": true,
  "path": ["ext_f0_gate_number_9", "..."],
  "total_distance": 320.5,
  "walk_min": 4.0,
  "floor_changes": 1,
  "directions": [{ "step": 1, "instruction": "Walk from Gate 9 to ...", "distance": 45 }]
}
```

---

## Deployment

### Frontend → Vercel (already deployed)
[https://newporject-miniproject-9ip5.vercel.app](https://newporject-miniproject-9ip5.vercel.app)

### Backend → Render (free tier)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New Web Service**
3. Connect this GitHub repo — Render auto-detects `render.yaml`
4. Set env var `ADMIN_PASSWORD` to your chosen password
5. Copy the Render URL, then in `frontend/app.js` change:
   ```js
   const API_BASE_URL = "https://your-app.onrender.com/api";
   ```
6. Redeploy frontend on Vercel

### Admin Credentials
- Default email: `admin@gmail.com`
- Default password: `admin`
- Change via env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`

---

## Team
Tapasya Basu · Shaily Kumari · Tapabrata Dutta · Md Numan Ashraf · Qaem Hussain Rizvi · Ankit Kunwar
