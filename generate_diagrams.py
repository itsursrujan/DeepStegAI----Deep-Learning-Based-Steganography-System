import matplotlib.pyplot as plt
import matplotlib.patches as patches

FONT_NAME = 'Times New Roman'
FONT_SIZE = 12

def setup_plot(height=6, width=6):
    fig, ax = plt.subplots(figsize=(width, height))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    return fig, ax

def draw_box(ax, x, y, w, h, text, is_group=False, font_size=FONT_SIZE):
    if is_group:
        box = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h, 
            boxstyle="square,pad=0", fc="#fdfdfd", ec="#888888", lw=1.2, ls='--', zorder=1
        )
        ax.add_patch(box)
        ax.text(x - w/2 + 2, y + h/2 - 3, text, ha="left", va="top", fontsize=font_size-2, 
                fontfamily=FONT_NAME, style='italic', color="#444444", zorder=2)
    else:
        box = patches.FancyBboxPatch(
            (x - w/2, y - h/2), w, h, 
            boxstyle="round,pad=0.2,rounding_size=0.4", fc="#ffffff", ec="#000000", lw=1.2, zorder=3
        )
        ax.add_patch(box)
        ax.text(x, y, text, ha="center", va="center", fontsize=font_size, 
                fontfamily=FONT_NAME, zorder=4)

def draw_arrow(ax, x1, y1, x2, y2):
    # Added shrink to prevent touching the boxes
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", lw=1.2, color="#000000", mutation_scale=12, shrinkA=3, shrinkB=3),
                zorder=2)

def draw_ortho_arrow(ax, x1, y1, x2, y2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="-|>", lw=1.2, color="#000000", mutation_scale=12, connectionstyle="angle,angleA=0,angleB=90,rad=0", shrinkA=3, shrinkB=3),
                zorder=2)

def draw_poly_arrow(ax, x1, y1, xm, ym, x2, y2):
    # Draw line from x1, y1 to xm, ym, then arrow to x2, y2
    ax.plot([x1, xm], [y1, ym], color="#000000", lw=1.2, zorder=2)
    ax.plot([xm, x2], [ym, y2], color="#000000", lw=1.2, zorder=2)
    # Arrow head at the end
    ax.annotate('', xy=(x2, y2), xytext=(xm, ym),
                arrowprops=dict(arrowstyle="-|>", lw=1.2, color="#000000", mutation_scale=12, shrinkB=3),
                zorder=2)

# ==========================================
# FIG 1: System Architecture
# ==========================================
fig, ax = setup_plot(height=7)

draw_box(ax, 45, 87, 60, 16, "Client Layer", is_group=True)
draw_box(ax, 45, 52, 60, 36, "Backend Layer", is_group=True)
draw_box(ax, 45, 17, 60, 16, "AI Layer", is_group=True)

draw_box(ax, 45, 84, 50, 7, "React Frontend")
draw_box(ax, 45, 62, 50, 7, "API Layer")
draw_box(ax, 45, 42, 50, 7, "Stego Engine")
draw_box(ax, 45, 14, 50, 7, "StegoCNN")

draw_box(ax, 85, 62, 16, 7, "Database", font_size=11)

draw_arrow(ax, 45, 80.5, 45, 65.5) 
draw_arrow(ax, 45, 58.5, 45, 45.5) 
draw_arrow(ax, 45, 38.5, 45, 17.5) 
draw_arrow(ax, 70, 62, 77, 62) 

plt.savefig('fig1.png', dpi=600, bbox_inches='tight', transparent=False)
plt.close()

# ==========================================
# FIG 2: Standard LSB Embedding Workflow
# ==========================================
fig, ax = setup_plot(height=6)

draw_box(ax, 25, 85, 30, 8, "Cover Image")
draw_box(ax, 75, 85, 30, 8, "Secret Data")

draw_box(ax, 50, 60, 45, 8, "Binary Encoding")
draw_box(ax, 50, 35, 45, 8, "LSB Substitution")
draw_box(ax, 50, 10, 45, 8, "Stego Image")

# Inputs perfectly merge at EXACT center top of Binary Encoding (50, 64)
# Cover Image bottom is 81. Secret bottom is 81.
ax.plot([25, 25], [81, 72.5], color="#000000", lw=1.2, zorder=2)
ax.plot([75, 75], [81, 72.5], color="#000000", lw=1.2, zorder=2)
ax.plot([25, 75], [72.5, 72.5], color="#000000", lw=1.2, zorder=2)
ax.annotate('', xy=(50, 64), xytext=(50, 72.5),
            arrowprops=dict(arrowstyle="-|>", lw=1.2, color="#000000", mutation_scale=12, shrinkB=3),
            zorder=2)

draw_arrow(ax, 50, 56, 50, 39)
draw_arrow(ax, 50, 31, 50, 14)

plt.savefig('fig2.png', dpi=600, bbox_inches='tight', transparent=False)
plt.close()

# ==========================================
# FIG 3: Adaptive Edge-Based Embedding Mechanism
# ==========================================
fig, ax = setup_plot(height=8)

draw_box(ax, 55, 92, 45, 7, "Cover Image")
draw_box(ax, 55, 78, 45, 7, "Green MSB Extraction")
draw_box(ax, 55, 64, 45, 7, "Canny Detection (100–200)")
draw_box(ax, 55, 50, 45, 7, "Edge Map Generation")
draw_box(ax, 55, 36, 55, 7, "Capacity Allocator\n(Edge: 3 BPC | Smooth: 1 BPC)")
draw_box(ax, 55, 22, 45, 7, "Adaptive Engine")
draw_box(ax, 55, 8, 45, 7, "Stego Image")

draw_box(ax, 15, 22, 28, 7, "Encrypted Data", font_size=11)

draw_arrow(ax, 55, 88.5, 55, 81.5)
draw_arrow(ax, 55, 74.5, 55, 67.5)
draw_arrow(ax, 55, 60.5, 55, 53.5)
draw_arrow(ax, 55, 46.5, 55, 39.5)
draw_arrow(ax, 55, 32.5, 55, 25.5)
draw_arrow(ax, 55, 18.5, 55, 11.5)

draw_arrow(ax, 29, 22, 32.5, 22)

plt.savefig('fig3.png', dpi=600, bbox_inches='tight', transparent=False)
plt.close()

# ==========================================
# FIG 4: Cryptographic Pipeline
# ==========================================
fig, ax = setup_plot(height=6, width=7)

draw_box(ax, 25, 95, 42, 95, "KEY FLOW", is_group=True)
draw_box(ax, 75, 95, 42, 95, "DATA FLOW", is_group=True)

# Spacing vertical
draw_box(ax, 25, 82, 35, 8, "User Password")
draw_box(ax, 25, 55, 35, 8, "PBKDF2 (480k)")
draw_box(ax, 25, 28, 35, 8, "AES-256 Key")

draw_box(ax, 75, 82, 35, 8, "Plaintext")
draw_box(ax, 75, 55, 38, 8, "Fernet (AES-CBC+HMAC)")
draw_box(ax, 75, 28, 35, 8, "Ciphertext")

draw_arrow(ax, 25, 78, 25, 59)
draw_arrow(ax, 25, 51, 25, 32)
draw_arrow(ax, 75, 78, 75, 59)
draw_arrow(ax, 75, 51, 75, 32)

# Orthogonal Arrow from AES Key to Fernet Encryption
ax.plot([42.5, 56], [28, 28], color="#000000", lw=1.2, zorder=2)
ax.plot([56, 56], [28, 55], color="#000000", lw=1.2, zorder=2)
ax.annotate('', xy=(56, 55), xytext=(56, 40), # Dummy start
            arrowprops=dict(arrowstyle="-|>", lw=1.2, color="#000000", mutation_scale=12, shrinkB=3),
            zorder=2)
ax.plot([56, 56], [28, 55], color="#000000", lw=1.2, zorder=2) # Hide annotation mess

# Cleaner Cross Flow from Key to Encryption
# Just draw an arrow from (42.5, 28) -> (48, 28) -> (48, 55) -> (56, 55)
ax.plot([42.5, 48], [28, 28], color="#000000", lw=1.2, zorder=2)
ax.plot([48, 48], [28, 55], color="#000000", lw=1.2, zorder=2)
ax.annotate('', xy=(56, 55), xytext=(48, 55),
            arrowprops=dict(arrowstyle="-|>", lw=1.2, color="#000000", mutation_scale=12, shrinkB=3),
            zorder=2)


plt.savefig('fig4.png', dpi=600, bbox_inches='tight', transparent=False)
plt.close()

# ==========================================
# FIG 5: StegoCNN Architecture
# ==========================================
fig, ax = setup_plot(height=10, width=6)

draw_box(ax, 50, 95, 45, 5, "Input Image")

draw_box(ax, 50, 60, 56, 56, "Feature Extraction", is_group=True)
draw_box(ax, 50, 83, 40, 5, "SRM Filter Layer")
draw_box(ax, 50, 71, 40, 5, "Conv Block 1")
draw_box(ax, 50, 59, 40, 5, "Conv Block 2")
draw_box(ax, 50, 47, 40, 5, "Conv Block 3")
draw_box(ax, 50, 35, 40, 5, "Conv Block 4")

draw_box(ax, 50, 16, 56, 21, "Classification", is_group=True)
draw_box(ax, 50, 21, 40, 5, "Fully Connected")
draw_box(ax, 50, 9, 40, 5, "Softmax Classifier")

draw_arrow(ax, 50, 92.5, 50, 85.5)
draw_arrow(ax, 50, 80.5, 50, 73.5)
draw_arrow(ax, 50, 68.5, 50, 61.5)
draw_arrow(ax, 50, 56.5, 50, 49.5)
draw_arrow(ax, 50, 44.5, 50, 37.5)
# Wide gap from Conv 4 to FC
draw_arrow(ax, 50, 32.5, 50, 23.5) 
draw_arrow(ax, 50, 18.5, 50, 11.5)

plt.savefig('fig5.png', dpi=600, bbox_inches='tight', transparent=False)
plt.close()

print("Micro-level visual audit applied. Diagrams exported.")
