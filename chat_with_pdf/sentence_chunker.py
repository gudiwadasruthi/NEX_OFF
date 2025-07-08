import os
import json
import re

def split_into_sentences(text):
    if not isinstance(text, str):
        if isinstance(text, list):
            text = ' '.join(str(item) for item in text)
        else:
            text = str(text)
    
    # Replace newlines with spaces and clean up multiple spaces
    text = text.replace("\n", " ")
    text = re.sub(r'\s+', ' ', text)
    
    # Basic regex-based sentence tokenizer
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if len(s.strip()) > 0]

def chunk_knowledge_files(knowledge_folder, output_file):
    sentence_chunks = []

    for filename in os.listdir(knowledge_folder):
        if filename.endswith(".json"):
            filepath = os.path.join(knowledge_folder, filename)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                topic = data.get("title", filename.replace(".json", ""))
                
                # Process each section
                for section in data.get("sections", []):
                    heading = section.get("heading", "")
                    content = section.get("content", "")
                    
                    sentences = split_into_sentences(content)
                    for i, sentence in enumerate(sentences):
                        # Skip empty sentences and markdown formatting
                        if not sentence.strip() or sentence.strip().startswith('**'):
                            continue
                        sentence_chunks.append({
                            "id": f"{filename}_{heading}_{i}",
                            "topic": topic,
                            "section": heading,
                            "content": sentence
                        })
            except Exception as e:
                print(f"Error processing {filename}: {str(e)}")
                continue

    # Save as a JSONL file (1 JSON object per line)
    with open(output_file, 'w', encoding='utf-8') as f:
        for chunk in sentence_chunks:
            json.dump(chunk, f)
            f.write("\n")

    print(f"✅ Saved {len(sentence_chunks)} sentence chunks to '{output_file}'")

# Example usage
if __name__ == "__main__":
    chunk_knowledge_files("knowledge", "sentence_chunks.jsonl")
