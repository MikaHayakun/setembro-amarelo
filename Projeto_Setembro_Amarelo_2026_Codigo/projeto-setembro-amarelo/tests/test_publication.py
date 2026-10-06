"""Verifica a fronteira entre os materiais privados e a publicação estática."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('publication', ROOT / 'scripts/build_public_site.py')
publication = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publication)


class PublicationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.output = publication.build(Path(cls.temp.name) / 'site')

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_private_materials_and_original_animation_are_absent(self):
        forbidden = {'.pdf', '.docx', '.mp4', '.mov', '.webm', '.png', '.sqlite3'}
        allowed_media = {'assets/emblema-setembro-amarelo.png', 'assets/smoke/folds-stream-v1.mp4'}
        for path in self.output.rglob('*'):
            if path.relative_to(self.output).as_posix() not in allowed_media:
                self.assertNotIn(path.suffix.lower(), forbidden, str(path))
        html = (self.output / 'index.html').read_text()
        self.assertIn('src="/assets/emblema-setembro-amarelo.png"', html)
        self.assertIn('intro-art', html)
        self.assertNotIn('intro--public', html)
        smoke = (self.output / 'smoke.js').read_text()
        self.assertNotIn('pinterest-savepin', smoke)
        self.assertNotIn('WhatsApp', smoke)
        mask = json.loads((self.output / 'assets/smoke/manifest.json').read_text())
        self.assertEqual(mask['stream']['file'], 'folds-stream-v1.mp4')
        self.assertEqual(mask['stream']['channels'], 'lighting-density-grayscale')
        self.assertEqual((self.output / 'assets/smoke' / mask['stream']['file']).stat().st_size,
                         mask['stream']['bytes'])
        self.assertIn('mikaweiai.com.br', html)
        self.assertIn('findahelpline.com', html)
        self.assertIn('data-content="static"', html)

    def test_all_languages_and_recordings_match_published_campaigns(self):
        manifest = json.loads((self.output / 'assets/audio/manifest.json').read_text())
        sources = {s['id'] for s in json.loads((self.output / 'data/sources.json').read_text())}
        for lang in publication.LANGUAGES:
            locale = json.loads((self.output / f'locales/{lang}.json').read_text())
            for month in range(1, 13):
                original = json.loads((self.output / f'data/campaigns/{month}.json').read_text())
                self.assertTrue({s['id'] for s in original['sources']} <= sources)
                c = original if lang == 'pt-BR' else {**original, **locale['campaigns'][str(month)]}
                recording = manifest[lang][str(month)]
                self.assertEqual(recording['source'], {k: c.get(k) for k in recording['source']})
                self.assertGreater((self.output / recording['file'].lstrip('/')).stat().st_size, 1000)

    def test_existing_unrelated_directory_is_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / 'material.txt'
            file.write_text('preservar')
            with self.assertRaises(ValueError):
                publication.build(folder)
            self.assertEqual(file.read_text(), 'preservar')


if __name__ == '__main__':
    unittest.main()
