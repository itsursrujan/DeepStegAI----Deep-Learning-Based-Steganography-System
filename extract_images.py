import docx
import os
import sys

def extract_images_from_docx(file_path, output_dir):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
        
    doc = docx.Document(file_path)
    os.makedirs(output_dir, exist_ok=True)
    
    img_count = 0
    for rel in doc.part.rels.values():
        if "image" in rel.target_ref:
            img_count += 1
            img_ext = rel.target_ref.split('.')[-1]
            img_name = f"image_{img_count}.{img_ext}"
            img_path = os.path.join(output_dir, img_name)
            with open(img_path, "wb") as f:
                f.write(rel.target_part.blob)
            print(f"Extracted {img_name}")
            
    print(f"Total images extracted: {img_count}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: extract_images.py <in_path> <out_dir>")
    else:
        extract_images_from_docx(sys.argv[1], sys.argv[2])
