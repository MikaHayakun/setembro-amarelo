#!/usr/bin/env python3
"""PoC acadêmica local: interface web, API de leitura e SQLite persistente."""
import argparse
import json
import mimetypes
import os
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
FRONTEND = ROOT / 'frontend'
DB = Path(os.environ.get('CAMPAIGN_DB', str(ROOT / 'database' / 'campaigns.sqlite3')))


def connect():
    connection = sqlite3.connect(DB)
    connection.row_factory = sqlite3.Row
    connection.execute('PRAGMA foreign_keys = ON')
    return connection


def initialize():
    DB.parent.mkdir(parents=True, exist_ok=True)
    with connect() as connection:
        connection.executescript((ROOT / 'database' / 'schema.sql').read_text(encoding='utf-8'))
        if connection.execute('SELECT COUNT(*) FROM campaign').fetchone()[0]:
            return
        content = json.loads((ROOT / 'database' / 'content.json').read_text(encoding='utf-8'))
        for s in content['sources']:
            connection.execute('INSERT INTO source VALUES (?, ?, ?, ?, ?, ?)',
                               (s['id'], s['institution'], s['title'], s['year'], s['url'], s['reference']))
        for c in content['campaigns']:
            details = {k: v for k, v in c.items() if k not in {
                'month', 'name', 'color', 'hex', 'theme', 'summary', 'purpose', 'source_ids'}}
            connection.execute('INSERT INTO campaign VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                (c['month'], c['name'], c['color'], c['hex'], c['theme'], c['summary'],
                 c['purpose'], json.dumps(details, ensure_ascii=False), content['reviewed_on']))
            connection.executemany('INSERT INTO campaign_source VALUES (?, ?)',
                                  [(c['month'], sid) for sid in c['source_ids']])


def get_campaign(month):
    with connect() as connection:
        row = connection.execute('SELECT * FROM campaign WHERE month = ?', (month,)).fetchone()
        if row is None:
            return None
        result = dict(row)
        result.update(json.loads(result.pop('details_json')))
        result['sources'] = [dict(s) for s in connection.execute(
            'SELECT s.* FROM source s JOIN campaign_source cs ON s.id = cs.source_id '
            'WHERE cs.month = ? ORDER BY s.id', (month,))]
        return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass  # O protótipo não registra endereços IP nem histórico de navegação.

    def respond(self, payload, status=200, content_type='application/json; charset=utf-8'):
        body = (json.dumps(payload, ensure_ascii=False).encode('utf-8')
                if isinstance(payload, (dict, list)) else payload)
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Referrer-Policy', 'no-referrer')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; "
            "style-src 'self'; img-src 'self' data:; connect-src 'self'; "
            "frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlsplit(self.path).path
        try:
            if path == '/api/health':
                with connect() as connection:
                    count = connection.execute('SELECT COUNT(*) FROM campaign').fetchone()[0]
                return self.respond({'status': 'ok', 'campaigns': count, 'database': 'SQLite'})
            if path == '/api/campaigns':
                with connect() as connection:
                    rows = connection.execute('SELECT month, name, color, theme FROM campaign ORDER BY month')
                    return self.respond([dict(row) for row in rows])
            if path.startswith('/api/campaigns/'):
                value = path.removeprefix('/api/campaigns/')
                if not value.isdigit() or not 1 <= int(value) <= 12:
                    return self.respond({'error': 'Mês inválido. Use um número de 1 a 12.'}, 400)
                result = get_campaign(int(value))
                return self.respond(result if result else {'error': 'Conteúdo não encontrado.'}, 200 if result else 404)
            if path == '/api/sources':
                with connect() as connection:
                    return self.respond([dict(row) for row in connection.execute('SELECT * FROM source ORDER BY id')])
            # Apenas arquivos públicos conhecidos são acessíveis.
            public = {'/': 'index.html', '/index.html': 'index.html',
                      '/app.js': 'app.js', '/styles.css': 'styles.css',
                      '/assets/emblema-setembro-amarelo.png': 'assets/emblema-setembro-amarelo.png'}
            if path in public:
                file = FRONTEND / public[path]
                mime = mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
                return self.respond(file.read_bytes(), content_type=(
                    mime if mime.startswith('image/') else mime + '; charset=utf-8'))
            return self.respond({'error': 'Página não encontrada.'}, 404)
        except (sqlite3.Error, OSError, json.JSONDecodeError):
            return self.respond({'error': 'Conteúdo temporariamente indisponível. Tente novamente.'}, 503)

    def do_POST(self):
        self.respond({'error': 'Este protótipo não recebe dados pessoais.'}, 405)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--host', default='127.0.0.1')
    parser.add_argument('--port', default=8000, type=int)
    parser.add_argument('--init-only', action='store_true')
    args = parser.parse_args()
    initialize()
    if args.init_only:
        print('SQLite inicializado com 12 meses e fontes verificadas.')
    else:
        server = ThreadingHTTPServer((args.host, args.port), Handler)
        print(f'Projeto disponível em http://{args.host}:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
