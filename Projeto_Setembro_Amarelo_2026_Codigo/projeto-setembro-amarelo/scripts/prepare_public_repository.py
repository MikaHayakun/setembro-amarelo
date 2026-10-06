#!/usr/bin/env python3
"""Exporta apenas o histórico de arquivos permitidos, sem alterar a cópia privada."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[3]
APP = 'Projeto_Setembro_Amarelo_2026_Codigo/projeto-setembro-amarelo/'
EMBLEM = APP + 'frontend/assets/emblema-setembro-amarelo.png'
ROOT_FILES = {'.gitignore', '.vercelignore', 'README.md', 'vercel.json'}
EXTENSIONS = {'.py', '.js', '.html', '.css', '.json', '.sql', '.md', '.txt', '.woff2', '.mp3', '.webp'}
PRIVATE_EXTENSIONS = {'.pdf', '.docx', '.mp4', '.mov', '.webm', '.png', '.sqlite3'}


def git(*args, cwd=ROOT, **kwargs):
    return subprocess.check_output(['git', *args], cwd=cwd, **kwargs)


def allowed(name):
    if name in ROOT_FILES or name == EMBLEM:
        return True
    if not name.startswith(APP):
        return False
    relative = Path(name[len(APP):])
    return (relative.parts[0] in {'frontend', 'backend', 'database', 'scripts', 'tests', 'docs'}
            or str(relative) == 'README.md') and relative.suffix.lower() in EXTENSIONS


def prepare():
    if git('status', '--porcelain').strip():
        raise RuntimeError('Revise e registre as alterações antes de exportar o histórico público.')
    head = git('rev-parse', 'main').decode().strip()
    output = ROOT / '.cache/public-repositories' / head
    if output.exists():
        raise RuntimeError(f'Checkout já existe: {output}. Não será sobrescrito.')
    paths = [p for p in git('ls-tree', '-r', '--name-only', 'main').decode().splitlines() if allowed(p)]
    output.mkdir(parents=True)
    git('init', '--initial-branch=main', cwd=output)
    # Exporta somente main e caminhos explicitamente permitidos, sem tags ou refs privadas.
    with (output.parent / f'{head}.export').open('wb') as stream:
        subprocess.run(['git', 'fast-export', '--signed-tags=strip', 'main', '--', *paths],
                       cwd=ROOT, stdout=stream, check=True)
    with (output.parent / f'{head}.export').open('rb') as stream:
        subprocess.run(['git', 'fast-import', '--quiet'], cwd=output, stdin=stream, check=True)
    git('restore', '--source=main', '--staged', '--worktree', '.', cwd=output)
    public_objects = {row.split(' ', 1)[0] for row in git('rev-list', '--objects', '--all', cwd=output).decode().splitlines()}
    private_objects = set()
    for row in git('rev-list', '--objects', 'main').decode().splitlines():
        parts = row.split(' ', 1)
        if len(parts) == 2 and parts[1] != EMBLEM and Path(parts[1]).suffix.lower() in PRIVATE_EXTENSIONS:
            private_objects.add(parts[0])
    for name in git('ls-files', '--others', '--ignored', '--exclude-standard').decode().splitlines():
        path = ROOT / name
        if name != EMBLEM and path.is_file() and path.suffix.lower() in PRIVATE_EXTENSIONS:
            private_objects.add(git('hash-object', str(path)).decode().strip())
    # Cópias geradas do único PNG autorizado podem existir em dist/ ou caches locais.
    private_objects.discard(git('rev-parse', 'main:' + EMBLEM).decode().strip())
    if public_objects & private_objects:
        raise RuntimeError('Um objeto de material privado entrou no histórico exportado. Não publique.')
    historical_paths = set(git('log', '--all', '--format=', '--name-only', cwd=output).decode().splitlines()) - {''}
    if any(not allowed(path) for path in historical_paths):
        raise RuntimeError('Caminho inesperado no histórico público. Não publique.')
    git('fsck', '--no-reflogs', cwd=output)
    print(f'Checkout público verificado: {output}')
    print(f'{len(paths)} arquivos atuais; {len(historical_paths)} caminhos históricos; nenhum material privado.')
    return output


if __name__ == '__main__':
    prepare()
