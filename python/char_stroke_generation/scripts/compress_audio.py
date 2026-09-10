#!/usr/bin/env python3
"""
compress_audio.py: Compress all Gujarati pronunciation WAV audio files to MP3 using ffmpeg.
"""

import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path


def get_repo_root() -> Path:
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "resources").exists() and (parent / "fonts").exists():
            return parent
    return p.parent.parent.parent.parent


def convert_wav_to_mp3(src_wav: str, dest_mp3: str) -> bool:
    os.makedirs(os.path.dirname(dest_mp3), exist_ok=True)
    if os.path.exists(dest_mp3):
        if os.path.getsize(dest_mp3) > 100:
            return True

    cmd = [
        "ffmpeg",
        "-y",
        "-v", "error",
        "-i", src_wav,
        "-codec:a", "libmp3lame",
        "-b:a", "64k",
        "-ar", "24000",
        dest_mp3
    ]
    res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    if res.returncode != 0:
        print(f"Error converting {src_wav}: {res.stderr.decode()}", flush=True)
        return False
    return True


def main():
    root = get_repo_root()
    res_dir = root / "resources"
    out_dir = root / "docs" / "assets" / "audio"

    tasks = []

    # 1. Kakko audio
    kakko_src = res_dir / "kakko" / "audio"
    if kakko_src.exists():
        for f in os.listdir(kakko_src):
            if f.endswith(".wav"):
                src = str(kakko_src / f)
                dest = str(out_dir / "kakko" / f.replace(".wav", ".mp3"))
                tasks.append((src, dest))

    # 2. Barakhadi audio
    barakhdi_src = res_dir / "barakhdi" / "audio"
    if barakhdi_src.exists():
        for d in os.listdir(barakhdi_src):
            d_path = barakhdi_src / d
            if d_path.is_dir():
                for f in os.listdir(d_path):
                    if f.endswith(".wav"):
                        src = str(d_path / f)
                        dest = str(out_dir / "barakhadi" / d / f.replace(".wav", ".mp3"))
                        tasks.append((src, dest))

    # 3. Numerals audio
    numerals_src = res_dir / "numerals" / "audio"
    if numerals_src.exists():
        for f in os.listdir(numerals_src):
            if f.endswith(".wav"):
                src = str(numerals_src / f)
                dest = str(out_dir / "numbers" / f.replace(".wav", ".mp3"))
                tasks.append((src, dest))

    print(f"🎵 Found {len(tasks)} audio files to compress into {out_dir}...")
    t0 = time.time()
    success = 0

    with ThreadPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
        futures = {executor.submit(convert_wav_to_mp3, s, d): s for s, d in tasks}
        for f in as_completed(futures):
            if f.result():
                success += 1

    dt = time.time() - t0
    print(f"✓ Converted {success}/{len(tasks)} audio files in {dt:.2f}s!")

    # Calculate total size
    total_size = sum(os.path.getsize(d) for s, d in tasks if os.path.exists(d))
    print(f"📦 Total compressed audio size: {total_size / (1024 * 1024):.2f} MB")


if __name__ == "__main__":
    main()
