import os
import numpy as np
import csv
import secrets
import math
from PIL import Image
from stego_engine import embed_payload_into_image, MAGIC
from adaptive_engine import embed_file_adaptive
from metrics import calculate_mse, calculate_psnr, calculate_ssim

def run_evaluation():
    image_folder = "test_images"
    results_file = "results.csv"
    password = "ResearchPassword"
    percentages = [0.05, 0.10, 0.20] # 5%, 10%, 20%
    
    if not os.path.exists(image_folder):
        print(f"Error: Folder '{image_folder}' not found.")
        return

    # Get images from the folder
    valid_exts = (".png", ".jpg", ".jpeg", ".pgm", ".bmp")
    image_files = [f for f in os.listdir(image_folder) if f.lower().endswith(valid_exts)]
    
    if not image_files:
        print(f"Error: No images found in '{image_folder}'.")
        return

    print("-" * 90)
    print(f"{'Image Name':<25} | {'Load %':<8} | {'Method':<10} | {'PSNR (dB)':<10} | {'SSIM':<10}")
    print("-" * 90)

    all_results = []

    for img_name in image_files:
        img_path = os.path.join(image_folder, img_name)
        try:
            cover_img = Image.open(img_path).convert("RGB")
        except Exception as e:
            print(f"Failed to load {img_name}: {e}")
            continue

        w, h = cover_img.size
        # Capacity calculation: W * H * 3 (total bits available in LSB)
        total_capacity_bits = w * h * 3
        total_capacity_bytes = total_capacity_bits // 8

        for pct in percentages:
            target_payload_bytes = int(total_capacity_bytes * pct)
            
            # --- 1. LSB Embedding ---
            lsb_data_size = max(0, target_payload_bytes - 9)
            lsb_random_payload = secrets.token_bytes(lsb_data_size)
            
            lsb_header = MAGIC + bytes([1]) + len(lsb_random_payload).to_bytes(4, 'big')
            lsb_full_payload = lsb_header + lsb_random_payload
            
            try:
                stego_lsb = embed_payload_into_image(cover_img, lsb_full_payload)
                psnr_lsb = calculate_psnr(cover_img, stego_lsb)
                mse_lsb = calculate_mse(cover_img, stego_lsb)
                ssim_lsb = calculate_ssim(cover_img, stego_lsb)
                
                all_results.append({
                    "image": img_name, 
                    "load_pct": f"{pct*100:.0f}%", 
                    "method": "LSB", 
                    "mse": mse_lsb, 
                    "psnr": psnr_lsb,
                    "ssim": ssim_lsb
                })
                
                print(f"{img_name[:25]:<25} | {pct*100:>2.0f}%    | {'LSB':<10} | {psnr_lsb:<10.2f} | {ssim_lsb:<10.4f}")
            except Exception as e:
                print(f"{img_name[:25]:<25} | {pct*100:>2.0f}%    | LSB Failed: {e}")

            # --- 2. Adaptive Engine Embedding ---
            adaptive_data_size = max(0, target_payload_bytes - 20)
            adaptive_random_payload = secrets.token_bytes(adaptive_data_size)
            
            try:
                stego_adaptive, _ = embed_file_adaptive(cover_img, adaptive_random_payload, "test.bin", password)
                psnr_adaptive = calculate_psnr(cover_img, stego_adaptive)
                mse_adaptive = calculate_mse(cover_img, stego_adaptive)
                ssim_adaptive = calculate_ssim(cover_img, stego_adaptive)
                
                all_results.append({
                    "image": img_name, 
                    "load_pct": f"{pct*100:.0f}%", 
                    "method": "Adaptive", 
                    "mse": mse_adaptive, 
                    "psnr": psnr_adaptive,
                    "ssim": ssim_adaptive
                })
                
                print(f"{'':<25} | {'':<8} | {'Adaptive':<10} | {psnr_adaptive:<10.2f} | {ssim_adaptive:<10.4f}")
            except Exception as e:
                print(f"{'':<25} | {'':<8} | Adaptive Failed: {e}")

        print("-" * 90)

    # Calculate and display averages
    lsb_psnrs = [r['psnr'] for r in all_results if r['method'] == 'LSB']
    adap_psnrs = [r['psnr'] for r in all_results if r['method'] == 'Adaptive']
    lsb_ssims = [r['ssim'] for r in all_results if r['method'] == 'LSB']
    adap_ssims = [r['ssim'] for r in all_results if r['method'] == 'Adaptive']

    print("\n" + "=" * 40)
    print("FINAL SUMMARY STATISTICS")
    print("=" * 40)
    if lsb_psnrs:
        print(f"LSB Average PSNR:      {sum(lsb_psnrs)/len(lsb_psnrs):.2f} dB")
        print(f"LSB Average SSIM:      {sum(lsb_ssims)/len(lsb_ssims):.4f}")
    if adap_psnrs:
        print(f"Adaptive Average PSNR: {sum(adap_psnrs)/len(adap_psnrs):.2f} dB")
        print(f"Adaptive Average SSIM: {sum(adap_ssims)/len(adap_ssims):.4f}")
    print("=" * 40)

    # Export to CSV
    with open(results_file, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["image", "load_pct", "method", "mse", "psnr", "ssim"])
        writer.writeheader()
        writer.writerows(all_results)
    
    print(f"\nExperimental results exported to {results_file}")

    # Generate Visualization
    try:
        import matplotlib.pyplot as plt
        import pandas as pd
        df = pd.DataFrame(all_results)
        df['load_num'] = df['load_pct'].str.replace('%', '').astype(float)
        
        plt.figure(figsize=(10, 6))
        for method in ['LSB', 'Adaptive']:
            subset = df[df['method'] == method]
            avg_by_load = subset.groupby('load_num')['psnr'].mean()
            plt.plot(avg_by_load.index, avg_by_load.values, marker='o', label=method)
            
        plt.title('Average PSNR vs Embedding Load')
        plt.xlabel('Load (%)')
        plt.ylabel('PSNR (dB)')
        plt.legend()
        plt.grid(True, linestyle='--', alpha=0.7)
        plot_path = "psnr_plot.png"
        plt.savefig(plot_path)
        print(f"Visualization saved to {plot_path}")
    except Exception as e:
        print(f"Could not generate plot: {e}")

if __name__ == "__main__":
    run_evaluation()
