const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const pdfDropArea = document.getElementById('pdf-drop-area');
const pdfBrowseBtn = document.getElementById('pdf-browse-btn');
const pdfFileInput = document.getElementById('pdf-file-input');
const pdfFileList = document.getElementById('pdf-file-list');
const pdfStatus = document.getElementById('pdf-status');
const pdfSubmitBtn = document.getElementById('pdf-submit-btn');
const askQuestionBtn = document.getElementById('ask-question-btn');
const pdfChatInput = document.getElementById('pdf-chat-input');
const answerDisplay = document.getElementById('answer-display');
const answerContent = document.getElementById('answer-content');

let pdfFiles = [];
let currentPdfPaths = {}; // To store paths for chunks and embeddings

pdfDropArea.addEventListener('click', () => pdfFileInput.click());
pdfBrowseBtn.addEventListener('click', (e) => { e.stopPropagation(); pdfFileInput.click(); });
pdfFileInput.addEventListener('change', (e) => {
    for (const file of e.target.files) {
        if (!pdfFiles.some(f => f.name === file.name)) {
            pdfFiles.push(file);
        }
    }
    renderPdfFileList();
});
pdfDropArea.addEventListener('dragover', (e) => { e.preventDefault(); pdfDropArea.style.background = '#f0f0f0'; });
pdfDropArea.addEventListener('dragleave', (e) => { e.preventDefault(); pdfDropArea.style.background = '#fff'; });
pdfDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    pdfDropArea.style.background = '#fff';
    for (const file of e.dataTransfer.files) {
        if (file.type === 'application/pdf' && !pdfFiles.some(f => f.name === file.name)) {
            pdfFiles.push(file);
        }
    }
    renderPdfFileList();
});
function renderPdfFileList() {
    pdfFileList.innerHTML = '';
    pdfFiles.forEach((file, idx) => {
        const fileDiv = document.createElement('div');
        fileDiv.innerHTML = `<span style='font-size:1.2rem; margin-right:8px;'>📄</span> <span style='flex:1;'>${file.name}</span> <span style='color:#888; font-size:0.95rem; margin-right:8px;'>${(file.size/1024/1024).toFixed(1)}MB</span> <button class='remove-btn' onclick='removePdfFile(${idx})'>✕</button>`;
        pdfFileList.appendChild(fileDiv);
    });
}
window.removePdfFile = function(idx) {
    pdfFiles.splice(idx, 1);
    renderPdfFileList();
}

pdfSubmitBtn.addEventListener('click', async () => {
    if (pdfFiles.length === 0) {
        alert('Please select a PDF file to upload.');
        return;
    }
    const file = pdfFiles[0];
    const uploadFolder = path.resolve(__dirname, '..', 'uploaded_pdfs');
    console.log('Resolved upload folder path:', uploadFolder);

    // Guarantee the folder exists right before saving
    try {
        if (!fs.existsSync(uploadFolder)) {
            console.log('Upload folder does not exist. Creating it...');
            fs.mkdirSync(uploadFolder, { recursive: true });
        }
    } catch (err) {
        console.error('Failed to create upload folder:', err);
        alert('Could not create upload folder. Please check permissions.');
        return;
    }

    const savePath = path.join(uploadFolder, file.name);
    const outputJsonlPath = savePath.replace(/\.pdf$/i, '_chunks.jsonl');
    const embeddingsPath = savePath.replace(/\.pdf$/i, '_embeddings.npy');

    // Save the PDF file
    try {
        console.log('Saving PDF to:', savePath);
        const arrayBuffer = await file.arrayBuffer();
        fs.writeFileSync(savePath, Buffer.from(arrayBuffer));

        const pythonPath = 'python';
        const chunkerScriptPath = path.join(__dirname, 'semantic_chunker.py');
        const ragScriptPath = path.join(__dirname, 'rag_handler.py');

        // --- New Two-Stage Pipeline ---
        // Stage 1a: Extract and Chunk PDF
        pdfStatus.textContent = 'Step 1/2: Extracting text and creating chunks...';
        pdfStatus.style.display = 'block';
        pdfStatus.style.color = 'green';

        execFile(pythonPath, [chunkerScriptPath, savePath, outputJsonlPath], (error, stdout, stderr) => {
            if (error) {
                console.error('Extraction error:', error);
                console.error('Extraction stderr:', stderr);
                pdfStatus.textContent = 'Extraction failed. Check console.';
                pdfStatus.style.color = 'red';
                setTimeout(() => { pdfStatus.style.display = 'none'; }, 4000);
                return;
            }
            console.log('Extraction stdout:', stdout);
            console.log('Extraction stderr:', stderr);

            // Check if the output files were created
            if (!fs.existsSync(outputJsonlPath)) {
                console.error('Chunks file was not created:', outputJsonlPath);
                pdfStatus.textContent = 'Chunking failed - no chunks file created.';
                pdfStatus.style.color = 'red';
                setTimeout(() => { pdfStatus.style.display = 'none'; }, 4000);
                return;
            }

            // Stage 1b: Compute and Save Embeddings
            pdfStatus.textContent = 'Step 2/2: Computing embeddings (may take a moment)...';
            execFile(pythonPath, [ragScriptPath, "embed", outputJsonlPath, embeddingsPath], (err, out, serr) => {
                if (err) {
                    console.error('Embedding error:', err);
                    console.error('Embedding stderr:', serr);
                    pdfStatus.textContent = 'Embedding failed. Check console.';
                    pdfStatus.style.color = 'red';
                    setTimeout(() => { pdfStatus.style.display = 'none'; }, 4000);
                    return;
                }
                console.log('Embedding stdout:', out);
                console.log('Embedding stderr:', serr);
                pdfStatus.textContent = 'Done! Ready for questions.';
                currentPdfPaths = { chunks: outputJsonlPath, embeddings: embeddingsPath };
                setTimeout(() => { pdfStatus.style.display = 'none'; }, 3000);
            });
        });
    } catch (err) {
        console.error('Failed to save or process PDF:', err);
        alert(`An error occurred while trying to save the PDF. Please check the console for details.\n\nError: ${err.message}`);
        pdfStatus.textContent = 'File processing failed.';
        pdfStatus.style.color = 'red';
        pdfStatus.style.display = 'block';
    }
});

// --- Fast Question Answering ---
askQuestionBtn.addEventListener('click', async () => {
    const question = pdfChatInput.value.trim();
    if (!question) {
        alert('Please enter a question.');
        return;
    }
    
    if (!currentPdfPaths.chunks || !fs.existsSync(currentPdfPaths.chunks)) {
        alert('Please upload and process a PDF first.');
        return;
    }

    askQuestionBtn.textContent = 'Thinking...';
    askQuestionBtn.disabled = true;
    answerDisplay.style.display = 'none';

    const pythonPath = 'python';
    const ragScriptPath = path.join(__dirname, 'rag_handler.py');

    execFile(pythonPath, [ragScriptPath, "answer", currentPdfPaths.chunks, currentPdfPaths.embeddings, question], (error, stdout, stderr) => {
        askQuestionBtn.textContent = 'Ask Question';
        askQuestionBtn.disabled = false;
        answerDisplay.style.display = 'block';

        try {
            const data = JSON.parse(stdout);
            if (Array.isArray(data)) {
                if (data.length === 0) {
                    answerContent.innerHTML = "<div class='chatgpt-answer'>No relevant answer found in the document.</div>";
                } else {
                    // Merge all top chunks into a single answer
                    const merged = data.map(chunk => chunk.content).join('\n\n');
                    // Split into points (by line or bullet)
                    const points = merged
                        .split(/\n+/)
                        .map(line => sanitizeText(line.trim()))
                        .filter(line => line.length > 0);

                    // --- Render each answer point as a chat bubble ---
                    let html = "<div class='chatgpt-answer'>";
                    points.forEach(point => {
                        let isHeading = /(:$|definition|what is|explain|advantages|disadvantages|purpose|use of)/i.test(point);
                        html += `<div class='answer-bubble'>${isHeading ? "<b>" + point + "</b>" : point}</div>`;
                    });
                    html += "</div>";
                    answerContent.innerHTML = html;
                }
            } else if (data && data.message) {
                answerContent.innerHTML = `<div class='chatgpt-answer'>${data.message}</div>`;
            } else if (data && data.error) {
                answerContent.innerHTML = `<div class='chatgpt-answer' style=\"color:red;\">${data.error}</div>`;
            } else {
                answerContent.innerHTML = "<div class='chatgpt-answer'>Unexpected response format.</div>";
            }
        } catch (e) {
            answerContent.textContent = stdout.trim() || "Sorry, an error occurred. Please check the console.";
            console.error('Answering error:', stderr || error || e);
        }
    });
});

pdfChatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        askQuestionBtn.click();
    }
});

// Helper to remove non-ASCII/unprintable characters
function sanitizeText(text) {
  return text.replace(/[^\x20-\x7E\n.,;:!?'"()\[\]{}<>@#$%^&*_+=|/\\-]/g, "");
}

// Theme toggle logic
const themeToggle = document.getElementById('themeToggle');
let isLight = false;
themeToggle.addEventListener('click', () => {
    isLight = !isLight;
    document.body.classList.toggle('light-mode', isLight);
    themeToggle.textContent = isLight ? '☀️' : '🌙';
}); 