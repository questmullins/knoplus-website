"""Build/re-render six art-directed RoseWave website plates with Blender 5.1+.

Build: blender -b --python render.py -- --source G:/Code/rose-wave-opening/assets --output /path/to/pngs
Re-render: blender -b rosewave-web.blend --python render.py -- --output /path/to/pngs
The saved scene packs the original watercolor and sun; no app files are needed to re-render.
"""
import argparse
import math
import sys
from pathlib import Path
import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
args.output.mkdir(parents=True, exist_ok=True)
HERE = Path(__file__).resolve().parent

def linear(v):
    return v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4

def color(h):
    return tuple(linear(int(h[i:i+2], 16) / 255) for i in (0, 2, 4)) + (1,)

def pigment(name, dark, light, paper, seed=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    uv = nodes.new('ShaderNodeTexCoord')
    mapping = nodes.new('ShaderNodeVectorMath')
    mapping.operation = 'MULTIPLY_ADD'
    # Sample only the uninterrupted paper wash above the original painted sun.
    mapping.inputs[1].default_value = (.65, .12, 1)
    mapping.inputs[2].default_value = (seed * .03, .87, 0)
    links.new(uv.outputs['UV'], mapping.inputs[0])
    tex = nodes.new('ShaderNodeTexImage')
    tex.image, tex.extension = paper, 'MIRROR'
    links.new(mapping.outputs[0], tex.inputs[0])
    bw = nodes.new('ShaderNodeRGBToBW')
    links.new(tex.outputs['Color'], bw.inputs[0])
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = .2
    ramp.color_ramp.elements[0].color = color(dark)
    ramp.color_ramp.elements[1].position = .85
    ramp.color_ramp.elements[1].color = color(light)
    links.new(bw.outputs[0], ramp.inputs[0])
    em = nodes.new('ShaderNodeEmission')
    links.new(ramp.outputs['Color'], em.inputs[0])
    out = nodes.new('ShaderNodeOutputMaterial')
    links.new(em.outputs[0], out.inputs[0])
    return mat

def mesh(scene, name, points, material, width, height, z):
    vertices = [((x - .5) * width, (y - .5) * height, z) for x, y in points]
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], [tuple(range(len(vertices)))])
    data.update()
    uv = data.uv_layers.new(name='Watercolor proportions')
    for loop in data.loops:
        uv.data[loop.index].uv = points[loop.vertex_index]
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    data.materials.append(material)
    return ob

if args.source:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    paper = bpy.data.images.load(str(args.source / 'watercolor.png'))
    sun = bpy.data.images.load(str(args.source / 'sun.png'))
    paper.pack()
    sun.pack()
    sun_mat = bpy.data.materials.new('Original RoseWave watercolor sun')
    sun_mat.use_nodes = True
    n, l = sun_mat.node_tree.nodes, sun_mat.node_tree.links
    n.clear()
    tex = n.new('ShaderNodeTexImage')
    tex.image = sun
    em = n.new('ShaderNodeEmission')
    l.new(tex.outputs['Color'], em.inputs['Color'])
    transparent = n.new('ShaderNodeBsdfTransparent')
    mix = n.new('ShaderNodeMixShader')
    l.new(tex.outputs['Alpha'], mix.inputs[0])
    l.new(transparent.outputs[0], mix.inputs[1])
    l.new(em.outputs[0], mix.inputs[2])
    out = n.new('ShaderNodeOutputMaterial')
    l.new(mix.outputs[0], out.inputs[0])
    palette = [('EDC0AC', 'FAE2CA'), ('E6AB99', 'F3CFB6'), ('D58D80', 'E9B09A'),
               ('C27A73', 'DB9788'), ('A96465', 'C28179'), ('85545F', 'A56D74'),
               ('694350', '895665'), ('5D3C49', '5D3C49')]
    wave_mats = [pigment(f'Wave {i+1} — RoseWave pigment', a, b, paper, i) for i, (a, b) in enumerate(palette)]
    for kind, desktop, mobile in [('intro', (1920, 600), (900, 900)), ('about', (1920, 800), (900, 1200)), ('footer', (1920, 320), (900, 360))]:
        for device, resolution in [('desktop', desktop), ('mobile', mobile)]:
            name = f'{kind}-{device}'
            scene = bpy.data.scenes.new(name)
            w, h = 16, 16 * resolution[1] / resolution[0]
            scene.render.engine = 'CYCLES'
            scene.cycles.samples = 16
            scene.cycles.use_denoising = False
            scene.cycles.device = 'GPU'
            scene.render.resolution_x, scene.render.resolution_y = resolution
            scene.render.resolution_percentage = 100
            scene.render.image_settings.file_format = 'PNG'
            scene.render.image_settings.color_mode = 'RGB'
            scene.view_settings.view_transform = 'Standard'
            scene.view_settings.look = 'None'
            sky = '5D3C49' if kind == 'about' else 'FFF1E1'
            mesh(scene, 'Unbroken copy-safe background', [(-.1, -.1), (1.1, -.1), (1.1, 1.1), (-.1, 1.1)], pigment(name+' paper', sky, sky, paper), w, h, -1)
            is_mobile = device == 'mobile'
            if kind == 'intro':
                sx, sy, radius, rise = (.84, .25, .12, .23) if is_mobile else (.82, .47, .21, .48)
            elif kind == 'about':
                sx, sy, radius, rise = (.82, .19, .095, .20) if is_mobile else (.86, .48, .17, .46)
            else:
                sx, sy, radius, rise = (.79, .63, .23, .65) if is_mobile else (.82, .66, .27, .72)
            # The disc remains circular in both camera formats.
            rx, ry = radius * h / w, radius
            sun_ob = mesh(scene, 'Sun — independently composed', [(sx-rx, sy-ry), (sx+rx, sy-ry), (sx+rx, sy+ry), (sx-rx, sy+ry)], sun_mat, w, h, 0)
            for loop in sun_ob.data.loops:
                sun_ob.data.uv_layers.active.data[loop.index].uv = [(0,0), (1,0), (1,1), (0,1)][loop.vertex_index]
            for i, mat in enumerate(wave_mats):
                points = []
                for j in range(301):
                    x = -.1 + j * 1.2 / 300
                    # Rise at the right on wide screens, low all across on phones.
                    right = .18 + .82 / (1 + math.exp(-(x-.67)*12)) if not is_mobile and kind != 'footer' else 1
                    base = rise * (1-i/8) * right
                    y = base + (rise * .12) * math.sin(x * 9 + i * .7) + rise * .055 * math.sin(x * 16 + i)
                    y += .0005 * math.sin(x * 800 + i)
                    points.append((x, y))
                points.extend([(1.1, -.2), (-.1, -.2)])
                mesh(scene, f'{i+1:02d} — editable watercolor ridge', points, mat, w, h, .1+i*.1)
            camera_data = bpy.data.cameras.new(name+' camera')
            camera_data.type = 'ORTHO'
            camera_data.ortho_scale = w
            camera_data.sensor_fit = 'HORIZONTAL'
            camera = bpy.data.objects.new(name+' camera', camera_data)
            scene.collection.objects.link(camera)
            camera.location = (0, 0, 30)
            scene.camera = camera
            scene['composition'] = 'Copy-safe upper/left field; independent mobile proportions; original packed watercolor and sun.'
    bpy.data.scenes.remove(bpy.data.scenes['Scene'])
    bpy.context.window.scene = bpy.data.scenes['intro-desktop']
    bpy.ops.wm.save_as_mainfile(filepath=str(HERE / 'rosewave-web.blend'))

try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'OPTIX'
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type != 'CPU'
    if not any(d.use for d in prefs.devices):
        raise RuntimeError('No GPU')
except Exception:
    for scene in bpy.data.scenes:
        scene.cycles.device = 'CPU'

for scene in bpy.data.scenes:
    if scene.name.endswith(('-desktop', '-mobile')):
        scene.render.filepath = str(args.output / (scene.name + '.png'))
        bpy.ops.render.render(write_still=True, scene=scene.name)
