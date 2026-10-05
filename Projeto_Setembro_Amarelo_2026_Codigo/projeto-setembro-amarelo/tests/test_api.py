"""Verificação de integração com HTTP real e um SQLite isolado."""
import json
import os
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]

class IntegrationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.db = Path(cls.temp.name) / 'test.sqlite3'
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            cls.port = sock.getsockname()[1]
        cls.base = f'http://127.0.0.1:{cls.port}'
        cls.start_server()

    @classmethod
    def start_server(cls):
        env = os.environ.copy()
        env['CAMPAIGN_DB'] = str(cls.db)
        cls.process = subprocess.Popen(
            [sys.executable, str(ROOT / 'backend/server.py'), '--port', str(cls.port)],
            env=env, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        for _ in range(60):
            try:
                with urlopen(cls.base + '/api/health', timeout=1) as response:
                    if response.status == 200:
                        return
            except (URLError, ConnectionError):
                if cls.process.poll() is not None:
                    raise RuntimeError(cls.process.stderr.read().decode())
                time.sleep(0.05)
        raise RuntimeError('Servidor não iniciou.')

    @classmethod
    def stop_server(cls):
        cls.process.terminate()
        cls.process.wait(timeout=5)
        cls.process.stderr.close()

    @classmethod
    def tearDownClass(cls):
        cls.stop_server()
        cls.temp.cleanup()

    def fetch(self, path, method='GET'):
        try:
            response = urlopen(Request(self.base + path, method=method), timeout=3)
        except HTTPError as error:
            response = error
        with response:
            data = response.read()
            content = json.loads(data) if 'application/json' in response.headers['Content-Type'] else data
            return response.status, content, response.headers

    def test_01_health_and_months(self):
        self.assertEqual(self.fetch('/api/health')[1]['campaigns'], 12)
        status, months, _ = self.fetch('/api/campaigns')
        self.assertEqual(status, 200)
        self.assertEqual([m['month'] for m in months], list(range(1, 13)))

    def test_02_every_month_has_resolvable_sources(self):
        all_sources = {s['id'] for s in self.fetch('/api/sources')[1]}
        self.assertEqual(len(all_sources), 16)
        for month in range(1, 13):
            status, campaign, _ = self.fetch(f'/api/campaigns/{month}')
            self.assertEqual(status, 200)
            self.assertEqual(campaign['month'], month)
            self.assertTrue(campaign['sources'])
            self.assertTrue({s['id'] for s in campaign['sources']} <= all_sources)
        september = self.fetch('/api/campaigns/9')[1]
        self.assertEqual([h['year'] for h in september['history']], ['1994', '2003', '2015', '2024 a 2026'])
        self.assertTrue(september['evidence_note'])

    def test_03_invalid_input(self):
        for value in ['0', '13', 'abc', '-1', '9/extra', '9%27OR1=1']:
            self.assertEqual(self.fetch('/api/campaigns/' + value)[0], 400)

    def test_04_private_files_not_served(self):
        for path in ['/database/campaigns.sqlite3', '/database/content.json', '/backend/server.py', '/../backend/server.py', '/unknown']:
            self.assertEqual(self.fetch(path)[0], 404)

    def test_05_post_rejected(self):
        self.assertEqual(self.fetch('/api/campaigns', 'POST')[0], 405)

    def test_06_static_page_and_headers(self):
        status, html, headers = self.fetch('/')
        self.assertEqual(status, 200)
        text = html.decode('utf-8')
        self.assertIn('188', text)
        self.assertIn('192', text)
        self.assertIn('lang="pt-BR"', text)
        self.assertEqual(headers['X-Content-Type-Options'], 'nosniff')
        self.assertIn("default-src 'self'", headers['Content-Security-Policy'])
        for path in ['/styles.css', '/app.js', '/smoke.js']:
            self.assertEqual(self.fetch(path)[0], 200)
        video_path = ROOT / 'frontend/assets/pinterest-savepin-onl.mp4'
        status, video, headers = self.fetch('/assets/pinterest-savepin-onl.mp4')
        self.assertEqual(status, 200)
        self.assertEqual(headers['Content-Type'], 'video/mp4')
        self.assertEqual(video, video_path.read_bytes())
        for font in ['bricolage-grotesque.woff2', 'cuidado-sans.woff2']:
            status, data, headers = self.fetch('/assets/fonts/' + font)
            self.assertEqual(status, 200)
            self.assertEqual(headers['Content-Type'], 'font/woff2')
            self.assertTrue(data.startswith(b'wOF2'))
        image_path = ROOT / 'frontend/assets/emblema-setembro-amarelo.png'
        status, image, headers = self.fetch('/assets/emblema-setembro-amarelo.png')
        if image_path.is_file():
            self.assertEqual(status, 200)
            self.assertEqual(headers['Content-Type'], 'image/png')
            self.assertEqual(image, image_path.read_bytes())
        else:
            self.assertEqual(status, 503)

    def test_07_database_integrity(self):
        with sqlite3.connect(self.db) as connection:
            self.assertEqual(connection.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
            self.assertEqual(connection.execute('PRAGMA foreign_key_check').fetchall(), [])
            self.assertGreater(connection.execute('SELECT COUNT(*) FROM campaign_source').fetchone()[0], 12)

    def test_08_persistence_on_server_restart(self):
        before = self.fetch('/api/campaigns/9')[1]['reviewed_on']
        with sqlite3.connect(self.db) as connection:
            connection.execute("UPDATE campaign SET reviewed_on = 'TESTE-PERSISTENCIA' WHERE month = 9")
        self.stop_server()
        self.start_server()
        try:
            self.assertEqual(self.fetch('/api/campaigns/9')[1]['reviewed_on'], 'TESTE-PERSISTENCIA')
        finally:
            with sqlite3.connect(self.db) as connection:
                connection.execute('UPDATE campaign SET reviewed_on = ? WHERE month = 9', (before,))

if __name__ == '__main__':
    unittest.main(verbosity=2)
