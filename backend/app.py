import os
import math
import json
import heapq
from collections import defaultdict
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for all routes

# Locate and load the college map JSON file
MAP_FILE_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), '..', 'college_map.json')
)

def load_map_data():
    if not os.path.exists(MAP_FILE_PATH):
        raise FileNotFoundError(f"College map data file not found at {MAP_FILE_PATH}")
    with open(MAP_FILE_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

# Helper to build adjacency list graph and nodes lookup dictionary
def build_graph(map_data):
    graph = defaultdict(dict)
    nodes_dict = {}
    
    # Process nodes
    for node in map_data.get('nodes', []):
        nodes_dict[node['id']] = node
        
    # Process edges (Treat as bidirectional / undirected graph)
    for edge in map_data.get('edges', []):
        u = edge['from']
        v = edge['to']
        weight = edge['weight']
        
        # Ensure nodes exist in map before linking
        if u in nodes_dict and v in nodes_dict:
            graph[u][v] = weight
            graph[v][u] = weight
            
    return graph, nodes_dict

# Heuristic function for A* (Euclidean distance with floor change penalty)
def heuristic(n1, n2, nodes_dict):
    node1 = nodes_dict[n1]
    node2 = nodes_dict[n2]
    
    dx = node1['x'] - node2['x']
    dy = node1['y'] - node2['y']
    # If there is a floor change, apply a steep penalty to represent the climbing effort
    df = (node1['floor'] - node2['floor']) * 120.0
    
    return math.sqrt(dx * dx + dy * dy + df * df)

# A* Pathfinding Algorithm
def astar(graph, nodes_dict, start, end):
    # Priority queue stores tuples of (f_score, current_node)
    open_set = []
    heapq.heappush(open_set, (0.0, start))
    
    came_from = {}
    g_score = {start: 0.0}
    f_score = {start: heuristic(start, end, nodes_dict)}
    
    # Store visited node tracking set to avoid redundant queue push operations
    open_set_hash = {start}
    
    while open_set:
        # Get the node with the lowest f(n)
        _, current = heapq.heappop(open_set)
        
        if current in open_set_hash:
            open_set_hash.remove(current)
            
        if current == end:
            # Reconstruct the shortest path from end back to start
            path = []
            while current in came_from:
                path.append(current)
                current = came_from[current]
            path.append(start)
            return path[::-1] # Reverse path to get start -> end
            
        for neighbor, weight in graph[current].items():
            tentative_g = g_score[current] + weight
            
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                
                f = tentative_g + heuristic(neighbor, end, nodes_dict)
                f_score[neighbor] = f
                
                if neighbor not in open_set_hash:
                    heapq.heappush(open_set, (f, neighbor))
                    open_set_hash.add(neighbor)
                    
    return [] # Return empty if no path was found

# Turn-by-turn text directions generator
def generate_directions(path, graph, nodes_dict):
    directions = []
    for i in range(len(path) - 1):
        curr_id = path[i]
        next_id = path[i + 1]
        
        n_curr = nodes_dict[curr_id]
        n_next = nodes_dict[next_id]
        weight = graph[curr_id].get(next_id, 0)
        
        # Check if there is a floor change between these two nodes
        if n_curr['floor'] != n_next['floor']:
            # If transitioning stairs or lift
            node_type = n_next.get('type', '')
            action = "Take the Lift or Stairs" if 'stairs' in node_type or 'lift' in node_type else "Go to next floor"
            instruction = f"{action} from {n_curr['label']} (Floor {n_curr['floor']}) to {n_next['label']} (Floor {n_next['floor']})"
        else:
            # Normal traversal on same floor
            instruction = f"Walk from {n_curr['label']} to {n_next['label']} ({weight} meters)"
            
        directions.append({
            "step": i + 1,
            "instruction": instruction,
            "distance": weight,
            "floor": n_curr['floor']
        })
    return directions

@app.route('/api/map', methods=['GET'])
def get_map():
    """Retrieve full map data (nodes and edges) directly from JSON source."""
    try:
        data = load_map_data()
        return jsonify(data)
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": "Failed to read map data: " + str(e)}), 500

@app.route('/api/find-path', methods=['POST'])
def find_path():
    """Find the shortest path using A* and return steps & coordinates."""
    try:
        body = request.json or {}
        start_id = body.get('from')
        end_id = body.get('to')
        
        if not start_id or not end_id:
            return jsonify({"error": "Missing 'from' or 'to' node IDs in request body"}), 400

        # Same node check
        if start_id == end_id:
            return jsonify({
                "success": False,
                "same_location": True,
                "message": "You are already at the selected location."
            }), 200
            
        map_data = load_map_data()
        graph, nodes_dict = build_graph(map_data)
        
        if start_id not in nodes_dict:
            return jsonify({"error": f"Starting point ID '{start_id}' not found in map data."}), 404
        if end_id not in nodes_dict:
            return jsonify({"error": f"Destination ID '{end_id}' not found in map data."}), 404
            
        # Execute routing algorithm
        path = astar(graph, nodes_dict, start_id, end_id)
        
        if not path:
            return jsonify({
                "success": False,
                "message": "No path could be found between the selected points."
            }), 200
            
        # Generate metrics
        total_distance = sum(graph[path[i]][path[i+1]] for i in range(len(path) - 1))
        directions = generate_directions(path, graph, nodes_dict)
        
        # Collate path details (coords, labels, floors) for frontend visualizer
        path_nodes = [nodes_dict[nid] for nid in path]
        
        return jsonify({
            "success": True,
            "path": path,
            "nodes": path_nodes,
            "total_distance": total_distance,
            "directions": directions
        })
        
    except Exception as e:
        return jsonify({"error": "An error occurred during path calculation: " + str(e)}), 500


@app.route('/api/admin/save-map', methods=['POST'])
def save_map():
    """Admin endpoint: persist updated nodes and edges to college_map.json on disk."""
    try:
        body = request.json or {}
        nodes = body.get('nodes')
        edges = body.get('edges')
        
        if nodes is None or edges is None:
            return jsonify({"error": "Missing 'nodes' or 'edges' in payload"}), 400

        map_data = {
            "nodes": nodes,
            "edges": edges
        }

        with open(MAP_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(map_data, f, indent=2, ensure_ascii=False)

        return jsonify({"success": True, "message": f"Map saved successfully. {len(nodes)} nodes, {len(edges)} edges."})

    except Exception as e:
        return jsonify({"error": "Failed to save map: " + str(e)}), 500


if __name__ == '__main__':
    # Start the local development server on port 5000
    app.run(host='0.0.0.0', port=5000, debug=True)

