"""Verifica a fronteira entre os materiais privados e a publicação estática."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

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

    def test_january_has_mental_health_references_and_its_review_date(self):
        january = json.loads((self.output / 'data/campaigns/1.json').read_text())
        self.assertEqual([s['id'] for s in january['sources']], [17, 18])
        self.assertEqual(january['reviewed_on'], '2026-10-16')
        self.assertEqual(january['sources'][0]['url'],
                         'https://revistasaude.editoraiberoamericana.com/saude/pt_BR/article/view/1/3')
        self.assertIn('10.47519/risi.v1i00.1', january['sources'][0]['reference'])
        september = json.loads((self.output / 'data/campaigns/9.json').read_text())
        self.assertEqual(september['reviewed_on'], '2026-10-16')

    def test_published_review_dates_match_the_project_review(self):
        for month in range(1, 13):
            campaign = json.loads((self.output / f'data/campaigns/{month}.json').read_text())
            self.assertEqual(campaign['reviewed_on'], '2026-10-16')
        self.assertIn('Conteúdo revisado em 16/10/2026.', (self.output / 'index.html').read_text())

    def test_public_build_preserves_a_month_specific_review_date(self):
        with tempfile.TemporaryDirectory() as folder:
            temporary = Path(folder)
            (temporary / 'database').mkdir()
            content = json.loads((ROOT / 'database/content.json').read_text())
            february = next(c for c in content['campaigns'] if c['month'] == 2)
            february['reviewed_on'] = '2026-10-15'
            (temporary / 'database/content.json').write_text(json.dumps(content))
            with patch.object(publication, 'ROOT', temporary):
                output = publication.build(temporary / 'site')
            campaign = json.loads((output / 'data/campaigns/2.json').read_text())
            self.assertEqual(campaign['reviewed_on'], '2026-10-15')
            march = json.loads((output / 'data/campaigns/3.json').read_text())
            self.assertEqual(march['reviewed_on'], '2026-10-16')

    def test_existing_unrelated_directory_is_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            file = Path(folder) / 'material.txt'
            file.write_text('preservar')
            with self.assertRaises(ValueError):
                publication.build(folder)
            self.assertEqual(file.read_text(), 'preservar')


if __name__ == '__main__':
    unittest.main()
