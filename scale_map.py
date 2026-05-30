import json
import re

FACTOR = 3

# 1. Update college_map.json
with open('c:/mini_project/college_map.json', 'r') as f:
    data = json.load(f)

for node in data['nodes']:
    node['x'] = int(node['x'] * FACTOR)
    node['y'] = int(node['y'] * FACTOR)

for edge in data['edges']:
    if 'weight' in edge:
        edge['weight'] = int(edge['weight'] * FACTOR)

with open('c:/mini_project/college_map.json', 'w') as f:
    json.dump(data, f, indent=2)

# 2. Update app.js FALLBACK_MAP_DATA
with open('c:/mini_project/frontend/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

def node_replacer(match):
    x_val = int(int(match.group(1)) * FACTOR)
    y_val = int(int(match.group(2)) * FACTOR)
    return f'"x": {x_val}, "y": {y_val}'

def weight_replacer(match):
    w_val = int(int(match.group(1)) * FACTOR)
    return f'"weight": {w_val}'

# Update node coordinates
new_app_js = re.sub(r'"x":\s*(-?\d+),\s*"y":\s*(-?\d+)', node_replacer, app_js)

# Update edge weights
new_app_js = re.sub(r'"weight":\s*(\d+)', weight_replacer, new_app_js)

with open('c:/mini_project/frontend/app.js', 'w', encoding='utf-8') as f:
    f.write(new_app_js)

print("Map scaled successfully by factor of", FACTOR)
