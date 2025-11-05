import subprocess, sys

steps = [
    "python tasks/01_build_master_list.py",
    "python tasks/02_fetch_literature.py",
    "python tasks/03_generate_summaries.py"
]

for cmd in steps:
    print(f"\n▶ {cmd}")
    code = subprocess.call(cmd, shell=True)
    if code != 0:
        sys.exit(code)
print("\n🎉 Pipeline finished")
