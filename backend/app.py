"""
spotNgo Backend – Flask + SQLite
Handles: map data, A* pathfinding, search-history persistence,
         route records, admin auth (via DB), and map editing.
"""

import os, math, json, heapq, hashlib, sqlite3
from collections import defaultdict
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MAP_FILE    = os.path.join(BASE_DIR, 'college_map.json')
INSTANCE    = os.path.join(BASE_DIR, 'instance')
DATABASE    = os.path.join(INSTANCE, 'spotngo.db')

# ─── Admin credentials (override via env vars) ────────────────────────────────
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@gmail.com')
ADMIN_PASS  = os.environ.get('ADMIN_PASSWORD', 'admin')
ADMIN_HASH  = hashlib.sha256(ADMIN_PASS.encode()).hexdigest()

# ─── DB helpers ───────────────────────────────────────────────────────────────
def get_db():
    db = getattr(g, '_db', None)
    if db is None:
        os.makedirs(INSTANCE, exist_ok=True)
        db = g._db = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_db(exc):
    db = getattr(g, '_db', None)
    if db: db.close()

def init_db():
    os.makedirs(INSTANCE, exist_ok=True)
    with app.app_context():
        db = get_db()
        db.executescript("""
            CREATE TABLE IF NOT EXISTS search_history (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                from_id      TEXT    NOT NULL,
                from_label   TEXT    NOT NULL,
                to_id        TEXT    NOT NULL,
                to_label     TEXT    NOT NULL,
                distance_m   REAL,
                walk_min     REAL,
                floor_changes INTEGER,
                path_json    TEXT,
                searched_at  TEXT    DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS route_records (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                from_id      TEXT    NOT NULL,
                to_id        TEXT    NOT NULL,
                distance_m   REAL,
                walk_min     REAL,
                floor_changes INTEGER,
                path_json    TEXT,
                created_at   TEXT    DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_hist_date ON search_history(searched_at);
            CREATE INDEX IF NOT EXISTS idx_rec_date  ON route_records(created_at);
        """)
        db.commit()
    print("[spotNgo] Database ready →", DATABASE)

# ─── Map helpers ──────────────────────────────────────────────────────────────
def load_map():
    if not os.path.exists(MAP_FILE):
        raise FileNotFoundError(f"Map not found: {MAP_FILE}")
    with open(MAP_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def build_graph(data):
    nodes = {n['id']: n for n in data.get('nodes', [])}
    graph = defaultdict(dict)
    for e in data.get('edges', []):
        u, v, w = e['from'], e['to'], e['weight']
        if u in nodes and v in nodes:
            graph[u][v] = w
            graph[v][u] = w
    return graph, nodes

# ─── A* ───────────────────────────────────────────────────────────────────────
def heuristic(n1, n2, nd):
    a, b = nd[n1], nd[n2]
    dx, dy = a['x']-b['x'], a['y']-b['y']
    df = abs(a['floor']-b['floor']) * 120.0
    return math.sqrt(dx*dx + dy*dy + df*df)

def astar(graph, nodes, start, end):
    open_q  = [(0.0, start)]
    came    = {}
    g_score = {start: 0.0}
    open_s  = {start}
    while open_q:
        _, cur = heapq.heappop(open_q)
        open_s.discard(cur)
        if cur == end:
            path = []
            while cur in came:
                path.append(cur); cur = came[cur]
            path.append(start)
            return path[::-1]
        for nb, w in graph[cur].items():
            tg = g_score[cur] + w
            if tg < g_score.get(nb, float('inf')):
                came[nb] = cur
                g_score[nb] = tg
                f = tg + heuristic(nb, end, nodes)
                heapq.heappush(open_q, (f, nb))
                open_s.add(nb)
    return []

def make_directions(path, graph, nodes):
    steps = []
    for i in range(len(path)-1):
        a, b = nodes[path[i]], nodes[path[i+1]]
        w    = graph[path[i]].get(path[i+1], 0)
        if a['floor'] != b['floor']:
            t = b.get('type','')
            act = "Take Lift/Stairs" if 'stairs' in t or 'lift' in t else "Change floor"
            steps.append({"step": i+1, "instruction": f"{act}: {a['label']} (F{a['floor']}) → {b['label']} (F{b['floor']})", "distance": w, "floor": a['floor']})
        else:
            steps.append({"step": i+1, "instruction": f"Walk from {a['label']} to {b['label']} ({w} m)", "distance": w, "floor": a['floor']})
    return steps

# ─── API ──────────────────────────────────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "spotNgo", "version": "2.0.0"})

# ── Map ───────────────────────────────────────────────────────────────────────
@app.route('/api/map')
def get_map():
    try:
        return jsonify(load_map())
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ── Pathfinding ───────────────────────────────────────────────────────────────
@app.route('/api/find-path', methods=['POST'])
def find_path():
    try:
        body   = request.json or {}
        s, e   = body.get('from'), body.get('to')
        if not s or not e:
            return jsonify({"error": "Missing 'from' or 'to'"}), 400
        if s == e:
            return jsonify({"success": False, "same_location": True,
                            "message": "You are already at that location."}), 200

        data           = load_map()
        graph, nodes   = build_graph(data)

        if s not in nodes: return jsonify({"error": f"Start '{s}' not found"}), 404
        if e not in nodes: return jsonify({"error": f"End '{e}' not found"}), 404

        path = astar(graph, nodes, s, e)
        if not path:
            return jsonify({"success": False,
                            "message": "No path found between the selected points."}), 200

        dist   = sum(graph[path[i]][path[i+1]] for i in range(len(path)-1))
        dirs   = make_directions(path, graph, nodes)
        floors = sum(1 for i in range(len(path)-1)
                     if nodes[path[i]]['floor'] != nodes[path[i+1]]['floor'])
        walk_min = round(dist / 80, 2)   # ~80 m/min walking speed

        # Save to DB
        db = get_db()
        db.execute("""
            INSERT INTO search_history
              (from_id, from_label, to_id, to_label, distance_m, walk_min, floor_changes, path_json)
              VALUES (?,?,?,?,?,?,?,?)""",
            (s, nodes[s]['label'], e, nodes[e]['label'],
             round(dist,1), walk_min, floors, json.dumps(path)))
        db.execute("""
            INSERT INTO route_records
              (from_id, to_id, distance_m, walk_min, floor_changes, path_json)
              VALUES (?,?,?,?,?,?)""",
            (s, e, round(dist,1), walk_min, floors, json.dumps(path)))
        db.commit()

        return jsonify({
            "success":        True,
            "path":           path,
            "nodes":          [nodes[n] for n in path],
            "total_distance": round(dist, 1),
            "walk_min":       walk_min,
            "floor_changes":  floors,
            "directions":     dirs
        })
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

# ── Search history ─────────────────────────────────────────────────────────────
@app.route('/api/history')
def get_history():
    limit = int(request.args.get('limit', 20))
    rows  = get_db().execute(
        "SELECT * FROM search_history ORDER BY searched_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    db = get_db()
    db.execute("DELETE FROM search_history")
    db.commit()
    return jsonify({"success": True})

# ── Route records & stats ──────────────────────────────────────────────────────
@app.route('/api/records')
def get_records():
    limit = int(request.args.get('limit', 50))
    rows  = get_db().execute(
        "SELECT * FROM route_records ORDER BY created_at DESC LIMIT ?", (limit,)
    ).fetchall()
    return jsonify([dict(r) for r in rows])

@app.route('/api/records/stats')
def get_stats():
    db      = get_db()
    total   = db.execute("SELECT COUNT(*) FROM route_records").fetchone()[0]
    avg_d   = db.execute("SELECT AVG(distance_m) FROM route_records").fetchone()[0] or 0
    popular = db.execute("""
        SELECT from_id, to_id, COUNT(*) cnt
        FROM route_records GROUP BY from_id,to_id
        ORDER BY cnt DESC LIMIT 5
    """).fetchall()
    try:
        nd = {n['id']: n['label'] for n in load_map().get('nodes', [])}
    except Exception:
        nd = {}
    return jsonify({
        "total_routes":   total,
        "avg_distance_m": round(avg_d, 1),
        "popular_routes": [
            {"from": nd.get(r['from_id'], r['from_id']),
             "to":   nd.get(r['to_id'],   r['to_id']),
             "count": r['cnt']} for r in popular
        ]
    })

# ── Admin login ────────────────────────────────────────────────────────────────
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    body = request.json or {}
    email = body.get('email', '').strip().lower()
    pw_h  = hashlib.sha256(body.get('password', '').encode()).hexdigest()
    if email == ADMIN_EMAIL.lower() and pw_h == ADMIN_HASH:
        return jsonify({"success": True,
                        "token":   "adm-" + pw_h[:16],
                        "message": "Login successful"})
    return jsonify({"success": False, "error": "Invalid credentials"}), 401

# ── Admin save map ─────────────────────────────────────────────────────────────
@app.route('/api/admin/save-map', methods=['POST'])
def save_map():
    try:
        body  = request.json or {}
        nodes = body.get('nodes')
        edges = body.get('edges')
        if nodes is None or edges is None:
            return jsonify({"error": "Missing nodes or edges"}), 400
        with open(MAP_FILE, 'w', encoding='utf-8') as f:
            json.dump({"nodes": nodes, "edges": edges}, f, indent=2, ensure_ascii=False)
        return jsonify({"success": True,
                        "message": f"Saved {len(nodes)} nodes, {len(edges)} edges."})
    except Exception as ex:
        return jsonify({"error": str(ex)}), 500

# ─── Bootstrap ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    print("[spotNgo] Starting on http://0.0.0.0:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
