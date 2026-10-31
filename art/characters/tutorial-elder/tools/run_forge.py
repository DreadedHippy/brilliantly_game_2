"""Run an installed Forge tool with a Windows-safe, no-overwrite publication fallback.

Some Forge review images retain read handles while publishing a staged folder.
On Windows those handles prevent directory renaming. Copy a completed stage to
an exclusively created destination after all the tool's validation has run.
Installed skill files are never edited.
"""

from pathlib import Path
import os
import runpy
import shutil
import sys


def main():
    if len(sys.argv) < 3:
        raise SystemExit('Usage: run_forge.py SKILL TOOL.py [tool arguments]')
    skill, tool, *arguments = sys.argv[1:]
    if skill not in {'generate2dsprite', 'video2dsprite'} or Path(tool).name != tool:
        raise SystemExit('Expected an installed sprite skill and a plain script filename')
    script = Path.home() / '.codex' / 'skills' / skill / 'scripts' / tool
    if not script.is_file():
        raise SystemExit(f'Tool not found: {script}')
    sys.path.insert(0, str(script.parent))
    import forge_core
    project = Path.cwd().resolve()
    original = forge_core.publish_directory_no_replace

    def publish(stage, destination):
        try:
            original(stage, destination)
            return
        except PermissionError:
            if os.name != 'nt':
                raise
        stage, destination = Path(stage).resolve(), Path(destination).resolve()
        if not stage.is_relative_to(project) or not destination.is_relative_to(project):
            raise ValueError('Publication must remain inside the current project')
        destination.mkdir(exist_ok=False)
        try:
            for child in stage.iterdir():
                target = destination / child.name
                if child.is_dir():
                    shutil.copytree(child, target)
                else:
                    shutil.copy2(child, target)
        except BaseException:
            # Only remove the new, exclusively owned directory verified above.
            shutil.rmtree(destination)
            raise
        print('Completed staged output published using the Windows copy fallback.', file=sys.stderr)

    forge_core.publish_directory_no_replace = publish
    sys.argv = [str(script), *arguments]
    runpy.run_path(str(script), run_name='__main__')


if __name__ == '__main__':
    main()
