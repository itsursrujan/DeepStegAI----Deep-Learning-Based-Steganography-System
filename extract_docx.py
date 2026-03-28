import docx
import os
import sys

def extract_docx(file_path, output_path):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        sys.exit(1)
        
    doc = docx.Document(file_path)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(f"--- Document Content ({file_path}) ---\n")
        for i, para in enumerate(doc.paragraphs):
            text = para.text.strip()
            if text:
                f.write(f"[{i:03d}] {text}\n")
    print(f"Extraction complete. Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: extract_docx.py <in_path> <out_path>")
    else:
        extract_docx(sys.argv[1], sys.argv[2])
