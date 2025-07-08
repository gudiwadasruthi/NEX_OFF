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
let pdfDoc = null;

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
    const uploadFolder = path.resolve(__dirname, '..', '..', 'uploaded_pdfs');
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
                currentPdfPaths = { chunks: outputJsonlPath, embeddings: embeddingsPath, pdf: savePath };
                setTimeout(() => { pdfStatus.style.display = 'none'; }, 3000);
                // Render the PDF in the left panel
                renderPDF(savePath);
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
                    // Use the improved renderAnswers for clickable answer-to-page navigation
                    renderAnswers(data);
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

// Sidebar toggle for new layout
const menuToggleBtn = document.getElementById('menuToggleBtn');
const pdfSidebar = document.getElementById('pdfSidebar');
if (menuToggleBtn && pdfSidebar) {
    menuToggleBtn.addEventListener('click', () => {
        pdfSidebar.classList.toggle('sidebar-hidden');
        // If hidden, expand pdfPanel and chatPanel
        if (pdfSidebar.classList.contains('sidebar-hidden')) {
            document.getElementById('pdfPanel').style.marginLeft = '32px';
        } else {
            document.getElementById('pdfPanel').style.marginLeft = '';
        }
    });
}

async function renderPDF(fileUrl) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../../lib/pdfjs/pdf.worker.js';

    const scale = 2.5; // Fixed high scale for clarity
    const loadingTask = pdfjsLib.getDocument(fileUrl);
    pdfDoc = await loadingTask.promise;

    const viewer = document.getElementById('pdf-viewer');
    viewer.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.classList.add('pdf-page-canvas');
        canvas.dataset.page = pageNum;
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Set CSS size for retina clarity
        canvas.style.width = (viewport.width / scale) + 'px';
        canvas.style.height = (viewport.height / scale) + 'px';

        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;

        viewer.appendChild(canvas);
    }
}

function scrollToPage(pageNum) {
    const canvas = document.querySelector(`canvas[data-page="${pageNum}"]`);
    if (canvas) {
        canvas.scrollIntoView({ behavior: 'smooth', block: 'start' });
        canvas.style.boxShadow = '0 0 10px 2px #4a90e2';
        setTimeout(() => (canvas.style.boxShadow = ''), 2000);
    }
}

// Update answer rendering to support click-to-scroll
function renderAnswers(data) {
    const answerContent = document.getElementById('answer-content');
    let html = "<div class='chatgpt-answer'>";
    data.forEach(chunk => {
        const point = sanitizeText(chunk.content.trim());
        if (!point) return;
        html += `<div class='answer-bubble' onclick='scrollToPage(${chunk.page})'>
            <b style='display:block; text-align:left; margin-bottom:8px;'>${chunk.section_title}</b><br>${point}
        </div>`;
    });
    html += "</div>";
    answerContent.innerHTML = html;
}

// --- Resizable Panels Logic for Three-Column Layout ---
function setupResizablePanels() {
    const sidebar = document.getElementById('pdfSidebar');
    const sidebarResizer = document.getElementById('sidebarResizer');
    const pdfPanel = document.getElementById('pdfPanel');
    const pdfResizer = document.getElementById('pdfResizer');
    const chatPanel = document.getElementById('chatPanel');

    // Sidebar <-> PDF Panel
    let isResizingSidebar = false;
    sidebarResizer.addEventListener('mousedown', function(e) {
        isResizingSidebar = true;
        document.body.style.cursor = 'col-resize';
    });
    document.addEventListener('mousemove', function(e) {
        if (!isResizingSidebar) return;
        let newWidth = e.clientX - sidebar.parentElement.getBoundingClientRect().left;
        newWidth = Math.max(120, Math.min(400, newWidth));
        sidebar.style.width = newWidth + 'px';
    });
    document.addEventListener('mouseup', function() {
        isResizingSidebar = false;
        document.body.style.cursor = '';
    });

    // PDF Panel <-> Chat Panel
    let isResizingPdf = false;
    pdfResizer.addEventListener('mousedown', function(e) {
        isResizingPdf = true;
        document.body.style.cursor = 'col-resize';
    });
    document.addEventListener('mousemove', function(e) {
        if (!isResizingPdf) return;
        const flexRowRect = pdfPanel.parentElement.getBoundingClientRect();
        let newWidth = e.clientX - pdfPanel.getBoundingClientRect().left;
        newWidth = Math.max(180, Math.min(900, newWidth));
        pdfPanel.style.width = newWidth + 'px';
    });
    document.addEventListener('mouseup', function() {
        isResizingPdf = false;
        document.body.style.cursor = '';
    });
}
window.addEventListener('DOMContentLoaded', setupResizablePanels); 