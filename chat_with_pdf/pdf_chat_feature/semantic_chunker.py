import fitz  # PyMuPDF
import os
import re
import json
import tiktoken

# Configurable
CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
MIN_HEADING_SIZE = 14  # minimum font size to consider as heading

# Tokenizer
encoding = tiktoken.get_encoding("cl100k_base")  # works well with OpenAI models

def count_tokens(text):
    return len(encoding.encode(text))

def extract_sections(pdf_path):
    doc = fitz.open(pdf_path)
    sections = []
    pdf_filename = os.path.basename(pdf_path)

    for page_num, page in enumerate(doc):
        blocks = page.get_text("dict")["blocks"]
        current_section = {
            "title": f"Page_{page_num + 1}",
            "level": 0,
            "paragraphs": [],
            "page": page_num + 1
        }

        for block in blocks:
            if "lines" not in block:
                continue

            for line in block["lines"]:
                spans = line.get("spans", [])
                if not spans:
                    continue

                line_text = " ".join(span["text"].strip() for span in spans).strip()
                max_font = max(span["size"] for span in spans)
                is_bold = any("Bold" in span.get("font", "") for span in spans)

                # Heading detection
                if len(line_text.split()) <= 10 and (max_font >= MIN_HEADING_SIZE or is_bold):
                    if current_section["paragraphs"]:
                        sections.append(current_section)
                    heading_level = 1 if max_font >= 17 else 2 if max_font >= 15 else 3
                    current_section = {
                        "title": line_text,
                        "level": heading_level,
                        "paragraphs": [],
                        "page": page_num + 1
                    }
                else:
                    current_section["paragraphs"].append(line_text)

        if current_section["paragraphs"]:
            sections.append(current_section)

    doc.close()
    return sections, pdf_filename

def clean_paragraphs(paragraphs):
    cleaned = []
    for p in paragraphs:
        if not p.strip():
            continue
        parts = re.split(r'\n{2,}', p.strip())
        for part in parts:
            line = part.strip().replace('\n', ' ')
            if len(line.split()) > 0:
                cleaned.append(line)
    return cleaned

def chunk_by_tokens(text, section_title, page, chunk_type, source, chunk_id_start=0):
    tokens = encoding.encode(text)
    chunks = []
    start = 0
    chunk_id = chunk_id_start

    while start < len(tokens):
        end = start + CHUNK_SIZE
        chunk_tokens = tokens[start:end]
        chunk_text = encoding.decode(chunk_tokens)

        chunks.append({
            "id": f"{os.path.splitext(source)[0]}_chunk_{chunk_id}",
            "content": chunk_text,
            "section_title": section_title,
            "page": page,
            "tokens": len(chunk_tokens),
            "chunk_type": chunk_type
        })

        start += CHUNK_SIZE - CHUNK_OVERLAP
        chunk_id += 1

    return chunks, chunk_id

def process_pdf(pdf_path, output_path):
    sections, pdf_filename = extract_sections(pdf_path)
    all_chunks = []
    chunk_counter = 0

    for section in sections:
        title = section["title"]
        page = section["page"]
        paras = clean_paragraphs(section["paragraphs"])
        full_text = " ".join(paras)

        if count_tokens(full_text) <= CHUNK_SIZE:
            chunk = {
                "id": f"{os.path.splitext(pdf_filename)[0]}_chunk_{chunk_counter}",
                "content": full_text,
                "section_title": title,
                "page": page,
                "tokens": count_tokens(full_text),
                "chunk_type": "single"
            }
            all_chunks.append(chunk)
            chunk_counter += 1
        else:
            token_chunks, chunk_counter = chunk_by_tokens(
                full_text, title, page, "paragraph_window", pdf_filename, chunk_counter
            )
            all_chunks.extend(token_chunks)

    with open(output_path, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print(f"Created {len(all_chunks)} structured chunks in: {output_path}")

if __name__ == "__main__":
    import sys

    if len(sys.argv) != 3:
        print("Usage: python semantic_chunker.py <input_pdf> <output_jsonl>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    process_pdf(pdf_path, output_path) 