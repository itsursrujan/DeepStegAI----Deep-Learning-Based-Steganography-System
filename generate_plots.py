import matplotlib.pyplot as plt
import numpy as np
import os

def generate_psnr_comparison():
    labels = ['Standard LSB', 'Adaptive Edge (Ours)']
    psnr_values = [58.3, 62.1]
    
    plt.figure(figsize=(6, 4))
    bars = plt.bar(labels, psnr_values, color=['#3498db', '#e74c3c'])
    plt.ylabel('PSNR (dB)')
    plt.title('Image Quality Comparison')
    plt.ylim(50, 65)
    
    for bar in bars:
        yval = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2, yval + 0.2, yval, ha='center', va='bottom', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('fig9_psnr.png')
    plt.close()

def generate_accuracy_benchmarks():
    methods = ['Hou [27]', 'Al-Rawashdeh [8]', 'DDS_SE-NB [2]', 'VidaFormer [1]', 'DeepStegAI (Ours)']
    accuracy = [94.0, 96.0, 96.1, 98.2, 99.98]
    
    plt.figure(figsize=(7, 4))
    plt.barh(methods, accuracy, color='teal')
    plt.xlabel('Detection Accuracy (%)')
    plt.title('Steganalysis Accuracy Comparison')
    plt.xlim(90, 101)
    
    for i, v in enumerate(accuracy):
        plt.text(v + 0.1, i, str(v) + '%', va='center', fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('fig10_accuracy.png')
    plt.close()

def generate_pixel_histogram():
    # Simulated data for visual representation
    np.random.seed(42)
    clean = np.random.normal(128, 20, 10000)
    stego = clean + np.random.randint(0, 2, 10000) * 0.5 # Subtle shifts
    
    plt.figure(figsize=(6, 4))
    plt.hist(clean, bins=50, alpha=0.5, label='Clean Pixels', color='blue')
    plt.hist(stego, bins=50, alpha=0.5, label='Stego Pixels', color='red')
    plt.xlabel('Pixel Intensity')
    plt.ylabel('Frequency')
    plt.title('Pixel Intensity Distribution Analysis')
    plt.legend()
    plt.tight_layout()
    plt.savefig('fig11_histogram.png')
    plt.close()

def generate_module_pie():
    labels = ['Adaptive Embedding', 'Crypto Layer', 'SRM-CNN Steganalysis', 'API & UI']
    sizes = [40, 25, 25, 10]
    colors = ['#ff9999','#66b3ff','#99ff99','#ffcc99']
    
    plt.figure(figsize=(5, 5))
    plt.pie(sizes, labels=labels, autopct='%1.1f%%', startangle=140, colors=colors, explode=(0.05, 0, 0, 0))
    plt.title('System Resource & Logic Distribution')
    plt.tight_layout()
    plt.savefig('fig12_pie.png')
    plt.close()

if __name__ == "__main__":
    generate_psnr_comparison()
    generate_accuracy_benchmarks()
    generate_pixel_histogram()
    generate_module_pie()
    print("Plots generated successfully.")
