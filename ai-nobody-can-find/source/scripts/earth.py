"""Natural Earth (public domain) -> src/earth.json: land points on a Fibonacci sphere + city lights."""
import json, math, os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
W, H = 2048, 1024
land = json.load(open(os.path.join(ROOT, 'data', 'geo', 'ne_110m_land.geojson' if os.path.exists(os.path.join(ROOT, 'data', 'geo', 'ne_110m_land.geojson')) else 'land.geojson')))
im = Image.new('L', (W, H), 0); d = ImageDraw.Draw(im)
xy = lambda lon, lat: ((lon + 180) / 360 * W, (90 - lat) / 180 * H)
for f in land['features']:
    g = f['geometry']; polys = g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]
    for poly in polys:
        d.polygon([xy(*p[:2]) for p in poly[0]], fill=255)
        for hole in poly[1:]: d.polygon([xy(*p[:2]) for p in hole], fill=0)
N = 90000; pts = []; ga = math.pi * (3 - math.sqrt(5))
for i in range(N):
    y = 1 - 2 * (i + 0.5) / N; lat = math.degrees(math.asin(y)); lon = math.degrees((i * ga) % (2 * math.pi)) - 180
    px, py = xy(lon, lat)
    if im.getpixel((min(W - 1, int(px)), min(H - 1, int(py)))) > 0: pts.append([round(lat, 2), round(lon, 2)])
pl = json.load(open(os.path.join(ROOT, 'data', 'geo', 'places.geojson')))
cities = sorted([[round(f['properties']['latitude'], 2), round(f['properties']['longitude'], 2), int(f['properties'].get('pop_max') or 0)] for f in pl['features']], key=lambda c: -c[2])[:4000]
json.dump({'land': pts, 'cities': cities}, open(os.path.join(ROOT, 'src', 'earth.json'), 'w'), separators=(',', ':'))
print('land pts', len(pts), 'cities', len(cities))
