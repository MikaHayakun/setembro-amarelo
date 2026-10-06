#!/usr/bin/env python3
"""Etapa editorial local: gera máscaras sem o vídeo, fundo ou cores originais.

Exige ffmpeg, Pillow e NumPy. A publicação usa somente os WebP já gerados.
"""
import json
from pathlib import Path
import subprocess

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'frontend/assets/smoke'
WIDTH, HEIGHT, COUNT, PER_SHEET = 704, 992, 375, 4


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
    (OUTPUT / 'manifest.json').write_text(json.dumps(metadata) + '\n')
    total = sum((OUTPUT / name).stat().st_size for name in names)
    print(f'{len(names)} imagens sem perdas: {total / 1024 / 1024:.1f} MiB; vídeo original preservado.')


if __name__ == '__main__':
    generate()
