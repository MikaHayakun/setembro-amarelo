#!/usr/bin/env python3
"""Gera somente os arquivos autorizados para a versão pública do site."""
import argparse
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'
REPOSITORY = ROOT.parent.parent
LANGUAGES = ('pt-BR', 'en', 'es', 'de', 'fr', 'ja', 'zh-CN', 'ko')


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False) + '\n', encoding='utf-8')


def build(output):
    output = Path(output).resolve()
    marker = output / '.public-build'
    if output.exists():
        if not marker.is_file():
            raise ValueError('A pasta de saída existe e não é uma publicação gerada por este script.')
        shutil.rmtree(output)
    output.mkdir(parents=True)
    marker.write_text('Somente conteúdo público gerado.\n', encoding='utf-8')
    files = ['styles.css', 'app.js', 'narration.js', 'assets/audio/manifest.json',
             'assets/emblema-setembro-amarelo.png',
             'assets/fonts/bricolage-grotesque.woff2', 'assets/fonts/cuidado-sans.woff2',
             'assets/fonts/BricolageGrotesque-OFL.txt', 'assets/fonts/SourceSans3-OFL.txt']
    for lang in LANGUAGES:
        files.append(f'locales/{lang}.json')
        files.extend(f'assets/audio/{lang}/{month:02}.mp3' for month in range(1, 13))
    smoke = json.loads((FRONTEND / 'assets/smoke/manifest.json').read_text(encoding='utf-8'))
    files.append('assets/smoke/manifest.json')
    for name in smoke['sheets']:
        if not re.fullmatch(r'folds-\d{3}\.webp', name):
            raise ValueError('Nome inesperado de imagem processada.')
        files.append('assets/smoke/' + name)
    for filename in files:
        target = output / filename
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(FRONTEND / filename, target)
    shutil.copyfile(FRONTEND / 'smoke-public.js', output / 'smoke.js')
    html = (FRONTEND / 'index.html').read_text(encoding='utf-8')
    html = html.replace('<html lang="pt-BR">', '<html lang="pt-BR" data-content="static">', 1)
    (output / 'index.html').write_text(html, encoding='utf-8')
    content = json.loads((ROOT / 'database/content.json').read_text(encoding='utf-8'))
    sources = {s['id']: s for s in content['sources']}
    months = []
    for campaign in content['campaigns']:
        c = dict(campaign)
        ids = c.pop('source_ids')
        c['reviewed_on'] = content['reviewed_on']
        c['sources'] = [sources[sid] for sid in sorted(ids)]
        write_json(output / 'data/campaigns' / f"{c['month']}.json", c)
        months.append({key: c[key] for key in ('month', 'name', 'color', 'theme')})
    write_json(output / 'data/campaigns.json', months)
    write_json(output / 'data/sources.json', content['sources'])
    write_json(output / 'data/health.json', {'status': 'ok', 'campaigns': len(months), 'mode': 'static'})
    print(f'Publicação gerada em {output}: 12 meses, 8 idiomas e 96 áudios; emblema autorizado; sem documentos ou vídeos originais.')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=REPOSITORY / 'dist')
    args = parser.parse_args()
    build(args.output)
