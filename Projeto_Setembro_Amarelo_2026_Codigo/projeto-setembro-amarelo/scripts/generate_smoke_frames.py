#!/usr/bin/env python3
"""Etapa editorial local: gera máscaras sem o vídeo, fundo ou cores originais.

Exige ffmpeg, Pillow e NumPy. A publicação usa somente as máscaras já geradas.
"""
import argparse
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'frontend/assets/smoke'
WIDTH, HEIGHT, COUNT, PER_SHEET = 704, 992, 375, 4


def generate_stream(metadata):
    """Empacota só iluminação e densidade; não inclui imagem ou áudio originais."""
    filename = 'folds-stream-v1.mp4'
    width, height = metadata['width'], metadata['height']
    command = ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'yuv420p',
               '-video_size', f'{width * 2}x{height}', '-framerate', str(metadata['fps']),
               '-color_range', 'pc', '-i', 'pipe:0', '-an', '-c:v', 'libx264',
               '-preset', 'fast', '-crf', '10', '-pix_fmt', 'yuv420p', '-color_range', 'pc',
               '-g', str(metadata['fps']), '-threads', '4', '-movflags', '+faststart',
               str(OUTPUT / filename)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    # Neutros U/V: os dois canais são planos cinza, sem cor da referência.
    neutral = bytes([128]) * (width * height)
    try:
        frame = 0
        for name in metadata['sheets']:
            with Image.open(OUTPUT / name) as image:
                sheet = np.asarray(image.convert('RGB'))
            for position in range(min(metadata['framesPerSheet'], metadata['frames'] - frame)):
                x = (position % metadata['columns']) * width
                y = (position // metadata['columns']) * height
                tile = sheet[y:y + height, x:x + width]
                planes = np.concatenate((tile[:, :, 0], tile[:, :, 1]), axis=1)
                process.stdin.write(planes.tobytes())
                process.stdin.write(neutral)
                frame += 1
        process.stdin.close()
        if process.wait() != 0:
            raise RuntimeError('Falha ao gerar máscara progressiva.')
    finally:
        if not process.stdin.closed:
            process.stdin.close()
        if process.poll() is None:
            process.terminate()
            process.wait()
    metadata['stream'] = {'file': filename, 'mime': 'video/mp4',
                          'channels': 'lighting-density-grayscale',
                          'bytes': (OUTPUT / filename).stat().st_size}
    (OUTPUT / 'manifest.json').write_text(json.dumps(metadata) + '\n')
    print(f'Máscara progressiva: {metadata["stream"]["bytes"] / 1024 / 1024:.2f} MiB; sem áudio.')


def generate():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    video = ROOT / 'frontend/assets/pinterest-savepin-onl.mp4'
    command = ['ffmpeg', '-v', 'error', '-i', str(video), '-frames:v', str(COUNT),
               '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']
    process = subprocess.Popen(command, stdout=subprocess.PIPE)
    names = []
    try:
        for start in range(0, COUNT, PER_SHEET):
            sheet = Image.new('RGB', (WIDTH * 2, HEIGHT * 2))
            for position in range(min(PER_SHEET, COUNT - start)):
                raw = process.stdout.read(WIDTH * HEIGHT * 3)
                if len(raw) != WIDTH * HEIGHT * 3:
                    raise RuntimeError('Referência incompleta.')
                frame = np.frombuffer(raw, dtype=np.uint8).reshape(HEIGHT, WIDTH, 3)
                green = frame[:, :, 1].astype(np.int32)
                padded = np.pad(green, 1, mode='edge')
                neighbours = (padded[1:-1, :-2] + padded[1:-1, 2:] +
                              padded[:-2, 1:-1] + padded[2:, 1:-1])
                sharpened = np.clip(np.floor(green + (4 * green - neighbours) * .16 + .5), 0, 255)
                # A partir de 74 a densidade original já está saturada em 250.
                chroma = np.minimum(frame.max(2) - frame.min(2), 74)
                mask = np.stack([np.where(chroma > 4, sharpened, 0),
                                 np.where(chroma > 4, chroma, 0), np.zeros_like(chroma)], 2).astype(np.uint8)
                sheet.paste(Image.fromarray(mask), ((position % 2) * WIDTH, (position // 2) * HEIGHT))
            filename = f'folds-{start // PER_SHEET:03}.webp'
            sheet.save(OUTPUT / filename, lossless=True, method=4)
            names.append(filename)
            if len(names) % 10 == 0:
                print(f'{min(start + PER_SHEET, COUNT)}/{COUNT} quadros processados', flush=True)
        if process.wait() != 0:
            raise RuntimeError('Falha ao decodificar referência local.')
    finally:
        process.stdout.close()
        if process.poll() is None:
            process.terminate()
            process.wait()
    metadata = {'width': WIDTH, 'height': HEIGHT, 'fps': 30, 'duration': 12.5,
                'frames': COUNT, 'framesPerSheet': PER_SHEET, 'columns': 2, 'sheets': names}
    generate_stream(metadata)
    total = sum((OUTPUT / name).stat().st_size for name in names)
    print(f'{len(names)} imagens sem perdas: {total / 1024 / 1024:.1f} MiB; vídeo original preservado.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stream-only', action='store_true',
                        help='Empacota os WebP existentes, sem acessar o vídeo original.')
    if parser.parse_args().stream_only:
        generate_stream(json.loads((OUTPUT / 'manifest.json').read_text()))
    else:
        generate()
