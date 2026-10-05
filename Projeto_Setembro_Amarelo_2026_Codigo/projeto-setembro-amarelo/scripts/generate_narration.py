"""Generate local MP3 narration; this tool is not needed to run the website.

Install edge-tts==7.2.8 in an isolated environment before running this script.
Only the public editorial text is submitted to the speech service.
"""
import argparse
import asyncio
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICES = {
    'pt-BR': 'pt-BR-FranciscaNeural', 'en': 'en-US-JennyNeural',
    'es': 'es-ES-ElviraNeural', 'de': 'de-DE-KatjaNeural',
    'fr': 'fr-FR-DeniseNeural', 'ja': 'ja-JP-NanamiNeural',
    'zh-CN': 'zh-CN-XiaoxiaoNeural', 'ko': 'ko-KR-SunHiNeural',
}
FIELDS = ('name', 'color', 'theme', 'summary', 'purpose', 'history', 'evidence_note', 'care')


def snapshot(campaign):
    return {key: campaign.get(key) for key in FIELDS}


def transcript(campaign, ui, lang):
    parts = [f"{campaign['name']}. {campaign['color']}.", campaign['theme'],
             campaign['summary'], ui['purposeTitle'], campaign['purpose']]
    if campaign.get('history'):
        parts.append(ui['historyTitle'])
        for item in campaign['history']:
            parts.extend([item['year'], item['text']])
        parts.extend([ui['evidenceTitle'], campaign['evidence_note'], ui['careTitle']])
        parts.extend(campaign['care'])
    text = '\n\n'.join(part.rstrip('.。') + ('。' if lang in {'ja', 'zh-CN'} else '.') for part in parts)
    text = re.sub(r'\[\d+\]', '', text)
    text = re.sub(r'\.{2,}|…+', '. ', text)
    text = re.sub(r'\.\s*\.', '.', text)
    if lang == 'pt-BR':
        terms = {'OMS': 'Organização Mundial da Saúde', 'BVS': 'Biblioteca Virtual em Saúde',
                 'IASP': 'Associação Internacional para a Prevenção do Suicídio',
                 'CVV': 'Centro de Valorização da Vida', 'ABP': 'Associação Brasileira de Psiquiatria',
                 'CFM': 'Conselho Federal de Medicina', 'IST': 'infecções sexualmente transmissíveis'}
        for short, full in terms.items():
            text = re.sub(r'\b' + short + r'\b', full, text)
        text = text.replace('Live Life', 'Laiv Laif')
        text = text.replace('Changing the narrative on suicide,', '')
    return text


async def generate(languages):
    import edge_tts
    content = json.loads((ROOT / 'database/content.json').read_text())
    directory = ROOT / 'frontend/assets/audio'
    directory.mkdir(parents=True, exist_ok=True)
    manifest_path = directory / 'manifest.json'
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    semaphore = asyncio.Semaphore(2)

    async def record(lang, original, locale):
        c = original if lang == 'pt-BR' else {**original, **locale['campaigns'][str(original['month'])]}
        source = snapshot(c)
        text = transcript(c, locale['ui'], lang)
        filename = f"{lang}/{c['month']:02}.mp3"
        file = directory / filename
        previous = manifest.get(lang, {}).get(str(c['month']))
        if previous and previous['source'] == source and previous['transcript'] == text and file.is_file():
            return
        file.parent.mkdir(exist_ok=True)
        async with semaphore:
            for attempt in range(3):
                try:
                    await edge_tts.Communicate(text, VOICES[lang], rate='-8%').save(str(file))
                    if file.stat().st_size < 1000:
                        raise RuntimeError('Empty recording')
                    break
                except Exception:
                    if attempt == 2: raise
                    await asyncio.sleep(1)
        manifest.setdefault(lang, {})[str(c['month'])] = {
            'source': source, 'transcript': text, 'voice': VOICES[lang],
            'file': '/assets/audio/' + filename,
        }
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
        print(f"Recorded {lang} {c['month']:02}", flush=True)

    for lang in languages:
        locale = json.loads((ROOT / 'frontend/locales' / f'{lang}.json').read_text())
        await asyncio.gather(*(record(lang, c, locale) for c in content['campaigns']))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--languages', nargs='+', choices=VOICES, default=list(VOICES))
    asyncio.run(generate(parser.parse_args().languages))
