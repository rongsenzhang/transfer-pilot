"""Render the fictional transfer deck with NumPy and Pillow.

Run python tools/render_deck.py from a checkout. Geometry and lighting are
defined here. The dimensions and materials are illustrative.
"""

from pathlib import Path

import numpy as np
from PIL import Image


WIDTH, HEIGHT = 1600, 992
CAMERA = np.array([6.8, 5.3, 8.2])
TARGET = np.array([0.0, 0.04, 0.0])
ROOT = Path(__file__).resolve().parents[1]


def normalise(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


forward = normalise(TARGET - CAMERA)
right = normalise(np.cross(forward, [0.0, 1.0, 0.0]))
up = np.cross(right, forward)
focal = 2230.0
py, px = np.indices((HEIGHT, WIDTH), dtype=float)
rays = normalise(forward + ((px - WIDTH * 0.5) / focal)[..., None] * right
                 - ((py - HEIGHT * 0.40) / focal)[..., None] * up)
depth = np.full((HEIGHT, WIDTH), np.inf)
centres_x = np.linspace(-2.38, 2.38, 5)
centres_z = np.linspace(-1.14, 1.14, 3)


def project(points):
    relative = np.asarray(points) - CAMERA
    distance = relative @ forward
    return np.column_stack([WIDTH * 0.5 + focal * (relative @ right) / distance,
                            HEIGHT * 0.40 - focal * (relative @ up) / distance])


def bounds(points):
    projected = project(points)
    left, top = np.floor(projected.min(axis=0) - 2).astype(int)
    stop, bottom = np.ceil(projected.max(axis=0) + 2).astype(int)
    return np.s_[max(top, 0):min(bottom, HEIGHT), max(left, 0):min(stop, WIDTH)]


def box_corners(x, y, z, radius, low, high):
    return [[x + dx, y + dy, z + dz] for dx in (-radius, radius)
            for dy in (low, high) for dz in (-radius, radius)]


ground_dist = (-0.75 - CAMERA[1]) / rays[..., 1]
ground = CAMERA + ground_dist[..., None] * rays
# A studio sweep and a contact shadow keep the cassette separate from the ground.
haze = np.exp(-((px / WIDTH - 0.48) ** 2 / 0.22
                + (py / HEIGHT - 0.45) ** 2 / 0.45))
shadow = np.exp(-((ground[..., 0] - 0.1) / 3.25) ** 4
                - ((ground[..., 2] - 0.10) / 1.98) ** 4)
image = (np.array([13, 25, 37]) + haze[..., None] * [16, 21, 24]
         - shadow[..., None] * [15, 18, 20])
key_light = normalise(np.array([-0.45, 0.81, 0.39]))


def softbox(direction, centre, length, thickness, softness):
    axis = normalise(np.asarray(centre))
    tangent = normalise(np.cross([0.0, 1.0, 0.0], axis))
    vertical = np.cross(axis, tangent)
    facing = direction @ axis
    scale = np.maximum(0.015, facing)
    x = np.abs(direction @ tangent) / scale
    y = np.abs(direction @ vertical) / scale
    edge = np.maximum((x - length) / softness, (y - thickness) / softness)
    return np.clip(0.5 - edge, 0, 1) * (facing > 0)


def studio(direction):
    y = direction[:, 1]
    sky = np.clip(y, 0, 1)
    colour = np.array([42, 56, 70]) + sky[:, None] * [80, 87, 92]
    horizon = np.exp(-((y + .10) / .13) ** 2)
    colour -= horizon[:, None] * [29, 33, 37]
    floor = np.clip(-y, 0, 1)
    colour += floor[:, None] * [16, 26, 33]
    boxes = [
        ([-.78, .88, -.25], 1.65, .19, .12, [157, 148, 134]),
        ([-.78, 1.38, -.25], 1.42, .032, .075, [59, 61, 65]),
        ([.85, .50, -.60], .97, .20, .14, [82, 106, 134]),
        ([-.35, .52, .98], .86, .14, .16, [115, 114, 104]),
        ([.80, .11, .34], .73, .055, .075, [112, 73, 31]),
    ]
    for axis, length, thickness, softness, rgb in boxes:
        energy = softbox(direction, axis, length, thickness, softness)
        colour += energy[:, None] * rgb
    return colour


def shade(material, normal, point, direction):
    x, _, z = point.T
    reflected = direction - 2 * np.sum(direction * normal, axis=1)[:, None] * normal
    light = np.maximum(normal @ key_light, 0)
    grain = (np.sin(1543 * x + 61 * z) + np.sin(1370 * z + 27 * x)) * 0.5
    if material == 'ball':
        env = studio(reflected)
        # The ball's lower hemisphere looks into its steel recess.
        recess = np.clip((-reflected[:, 1] - .03) * 2.8, 0, 1)
        return env * (1 - .38 * recess[:, None]) + grain[:, None] * .55
    if material == 'top':
        colour = np.tile([53., 74., 89.], (len(x), 1))
        # The grazing fill and brushed texture run along the plate.
        wash = np.clip(.4 - x * .09 - z * .16, 0, 1)
        colour += wash[:, None] * [14, 17, 18]
        colour += grain[:, None] * 1.4
        cx = np.clip(np.rint(x / 1.19), -2, 2) * 1.19
        cz = np.clip(np.rint(z / 1.14), -1, 1) * 1.14
        radial = np.sqrt((x - cx - .065)**2 + (z - cz + .035)**2)
        ao = np.exp(-np.maximum(radial - .36, 0) * 15)
        colour *= (1 - .65 * ao[:, None])
        return colour
    env = studio(reflected)
    base, diffuse, strength = {
        'edge': ([27, 40, 49], 19, .14),
        'bevel': ([47, 61, 69], 18, .48),
        'frame': ([18, 29, 39], 18, .10),
        'gasket': ([8, 15, 22], 4, .025),
        'collar': ([32, 45, 53], 14, .30),
        'lip': ([53, 62, 67], 12, .54),
        'bolt': ([26, 37, 45], 6, .42),
    }[material]
    return np.array(base) + light[:, None] * diffuse + env * strength + grain[:, None]


def paint(area, times, valid, material, normal_at):
    local = depth[area]
    visible = valid & (times > 0) & (times < local)
    if not np.any(visible):
        return
    dist = times[visible]
    direction = rays[area][visible]
    point = CAMERA + dist[:, None] * direction
    normal = normal_at(point)
    image[area][visible] = shade(material, normal, point, direction)
    local[visible] = dist


def face(points, material):
    vertices = np.asarray(points)
    normal = normalise(np.cross(vertices[1] - vertices[0], vertices[2] - vertices[0]))
    if np.dot(normal, CAMERA - vertices[0]) < 0:
        normal = -normal
    area = bounds(vertices)
    direction = rays[area]
    t = np.dot(vertices[0] - CAMERA, normal) / (direction @ normal)
    point = CAMERA + t[..., None] * direction
    signs = [np.sum(np.cross(b - a, point - a) * normal, axis=-1)
             for a, b in zip(vertices, np.roll(vertices, -1, axis=0))]
    valid = (np.min(signs, axis=0) >= -1e-7) | (np.max(signs, axis=0) <= 1e-7)
    paint(area, t, valid, material, lambda p: np.broadcast_to(normal, p.shape))


def outline(width, length, y, chamfer):
    return np.array([[-width + chamfer, y, -length], [width - chamfer, y, -length],
                     [width, y, -length + chamfer], [width, y, length - chamfer],
                     [width - chamfer, y, length], [-width + chamfer, y, length],
                     [-width, y, length - chamfer], [-width, y, -length + chamfer]])


def plate(width, length, bottom, top, edge, face_material, top_material):
    lower = outline(width - edge, length - edge, bottom, .13)
    mid_low = outline(width, length, bottom + edge, .13)
    mid_high = outline(width, length, top - edge, .13)
    upper = outline(width - edge, length - edge, top, .13)
    for low, high, mat in [(lower, mid_low, face_material), (mid_low, mid_high, face_material),
                            (mid_high, upper, 'bevel')]:
        for k in range(8):
            j = (k + 1) % 8
            face([low[k], low[j], high[j], high[k]], mat)
    face(upper, top_material)


def annulus(x, z, height, outer, inner, material):
    area = bounds(box_corners(x, height, z, outer, 0, 0))
    direction = rays[area]
    t = (height - CAMERA[1]) / direction[..., 1]
    dx = CAMERA[0] + t * direction[..., 0] - x
    dz = CAMERA[2] + t * direction[..., 2] - z
    radial = dx * dx + dz * dz
    paint(area, t, (radial <= outer * outer) & (radial >= inner * inner), material,
          lambda p: np.broadcast_to([0., 1., 0.], p.shape))


def bevel(x, z, bottom, top, r0, r1, material):
    area = bounds(box_corners(x, bottom, z, max(r0, r1), 0, top - bottom))
    direction = rays[area]
    dx, dy, dz = np.moveaxis(direction, -1, 0)
    ox, oy, oz = CAMERA - [x, bottom, z]
    slope = (r1 - r0) / (top - bottom)
    base = r0 + slope * oy
    a = dx*dx + dz*dz - (slope*dy)**2
    b = dx*ox + dz*oz - slope*dy*base
    c = ox*ox + oz*oz - base*base
    disc = b*b - a*c
    root = np.sqrt(np.maximum(disc, 0))
    for t in [(-b - root) / a, (-b + root) / a]:
        y = CAMERA[1] + t * dy
        def normals(p):
            dx, dz = p[:, 0] - x, p[:, 2] - z
            return normalise(np.column_stack([dx, -slope * np.hypot(dx, dz), dz]))
        paint(area, t, (disc >= 0) & (y >= bottom) & (y <= top), material, normals)


def sphere(x, y, z, radius):
    centre = np.array([x, y, z])
    area = bounds(box_corners(x, y, z, radius, -radius, radius))
    direction = rays[area]
    offset = CAMERA - centre
    b = direction @ offset
    disc = b*b - (offset @ offset - radius*radius)
    t = -b - np.sqrt(np.maximum(disc, 0))
    paint(area, t, disc >= 0, 'ball', lambda p: (p - centre) / radius)


plate(3.06, 1.81, -.58, -.19, .034, 'frame', 'frame')
plate(3.17, 1.92, -.225, -.115, .018, 'gasket', 'gasket')
plate(3.20, 1.95, -.13, .025, .021, 'edge', 'top')
for x in centres_x:
    for z in centres_z:
        bevel(x, z, .025, .065, .412, .397, 'gasket')
        bevel(x, z, .065, .104, .397, .362, 'lip')
        annulus(x, z, .104, .362, 0., 'collar')
        bevel(x, z, .104, .133, .287, .27, 'lip')
        annulus(x, z, .133, .27, .235, 'gasket')
        sphere(x, .113, z, .231)
        for theta in (0.45, 2.54, 4.64):
            sx, sz = x + .328 * np.cos(theta), z + .328 * np.sin(theta)
            annulus(sx, sz, .105, .024, 0, 'gasket')
            annulus(sx, sz, .106, .018, .008, 'bolt')

for x in [-2.91, 2.91]:
    for z in [-1.63, 1.63]:
        annulus(x, z, .026, .064, 0, 'gasket')
        annulus(x, z, .027, .054, .023, 'bolt')

# A tiny deterministic grain gives the broad studio gradients a continuous tone.
rng = np.random.default_rng(91)
image += rng.normal(0, .45, (HEIGHT, WIDTH, 1))
result = Image.fromarray(np.uint8(np.clip(image, 0, 255)))
result = result.resize((1000, 620), Image.Resampling.LANCZOS)
result.save(ROOT / 'assets' / 'deck.jpg', quality=94, subsampling=0, optimize=True)
