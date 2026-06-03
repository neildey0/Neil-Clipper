import os
import sys
import subprocess
import json
import shutil
import random
from PIL import Image, ImageDraw, ImageFilter
from rembg import remove, new_session
import numpy as np

def run_cmd(cmd):
    subprocess.run(cmd, shell=True, check=True)

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 scripts/replace_background.py input.mp4 output.mp4")
        return

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    frames_dir = "/tmp/rembg_frames"
    comp_dir = "/tmp/rembg_comp"
    
    if os.path.exists(frames_dir): shutil.rmtree(frames_dir)
    if os.path.exists(comp_dir): shutil.rmtree(comp_dir)
    os.makedirs(frames_dir)
    os.makedirs(comp_dir)

    # 1. Get info
    probe = subprocess.check_output(f'ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of json "{input_path}"', shell=True)
    info = json.loads(probe)
    width = info['streams'][0]['width']
    height = info['streams'][0]['height']
    fps_str = info['streams'][0]['r_frame_rate']
    fps = eval(fps_str)

    # 2. Extract frames
    print("Extracting frames...")
    run_cmd(f'ffmpeg -i "{input_path}" "{frames_dir}/frame_%04d.png"')

    # 3. Generate Space Background
    print("Generating space background...")
    bg = Image.new("RGB", (width, height), (5, 5, 15))
    draw = ImageDraw.Draw(bg)
    
    # Nebula blobs
    for _ in range(5):
        color = (random.randint(0, 50), random.randint(0, 30), random.randint(50, 100))
        blob = Image.new("RGBA", (width, height), (0,0,0,0))
        d = ImageDraw.Draw(blob)
        x, y = random.randint(0, width), random.randint(0, height)
        r = random.randint(200, 500)
        d.ellipse([x-r, y-r, x+r, y+r], fill=color + (100,))
        blob = blob.filter(ImageFilter.GaussianBlur(radius=100))
        bg.paste(blob, (0,0), blob)

    # Stars
    for _ in range(1800):
        x, y = random.randint(0, width), random.randint(0, height)
        draw.point((x, y), fill=(255, 255, 255))
    
    # Glints
    for _ in range(12):
        x, y = random.randint(0, width), random.randint(0, height)
        draw.ellipse([x-2, y-2, x+2, y+2], fill=(255, 255, 255))
        draw.line([x-10, y, x+10, y], fill=(255,255,255, 150), width=1)
        draw.line([x, y-10, x, y+10], fill=(255,255,255, 150), width=1)

    # 4. Process frames
    print("Processing frames (removing background)...")
    session = new_session("u2net")
    frame_files = sorted(os.listdir(frames_dir))
    
    for i, frame_file in enumerate(frame_files):
        if i % 10 == 0: print(f"Processing frame {i}/{len(frame_files)}...")
        input_image = Image.open(os.path.join(frames_dir, frame_file))
        output_image = remove(input_image, session=session)
        
        # Composite
        final_frame = bg.copy()
        final_frame.paste(output_image, (0, 0), output_image)
        final_frame.save(os.path.join(comp_dir, frame_file))

    # 5. Reassemble
    print("Reassembling video...")
    audio_temp = "/tmp/original_audio.mp3"
    run_cmd(f'ffmpeg -y -i "{input_path}" -vn -acodec libmp3lame "{audio_temp}"')
    run_cmd(f'ffmpeg -y -framerate {fps} -i "{comp_dir}/frame_%04d.png" -i "{audio_temp}" -c:v libx264 -pix_fmt yuv420p -movflags +faststart -c:a aac -shortest "{output_path}"')

    # Cleanup
    shutil.rmtree(frames_dir)
    shutil.rmtree(comp_dir)
    if os.path.exists(audio_temp): os.remove(audio_temp)
    print(f"Done! Saved to {output_path}")

if __name__ == "__main__":
    main()
