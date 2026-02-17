document.addEventListener("DOMContentLoaded", () => {
    // Initial Setup
    setupDragAndDrop();
    setupForms();
});

// --- Navigation ---

function showSection(sectionId) {
    document.querySelectorAll('section').forEach(sec => sec.classList.add('hidden-section'));
    document.querySelector('section').classList.remove('active-section');

    const target = document.getElementById(sectionId + '-section');
    target.classList.remove('hidden-section');
    target.classList.add('active-section');

    // Update Nav
    document.querySelectorAll('.nav-links a').forEach(a => {
        if (a.innerText.toLowerCase().includes(sectionId)) a.style.color = 'var(--primary)';
        else a.style.color = 'var(--text-muted)';
    });
}

function enterApp() {
    showSection('app');
}

function switchTab(tabName) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');

    // Views
    document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
    document.getElementById(`view-${tabName}`).classList.add('active');
}

function setBatchMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-batch-mode-${mode}`).classList.add('active');

    document.querySelectorAll('.batch-form').forEach(f => f.classList.remove('active'));
    document.getElementById(`form-batch-${mode}`).classList.add('active');
}


// --- File Handling ---

function setupDragAndDrop() {
    const zones = [
        { drop: 'drop-cover', input: 'file-cover', preview: 'preview-cover', type: 'single' },
        { drop: 'drop-stego', input: 'file-stego', preview: 'preview-stego', type: 'single' },
        { drop: 'drop-analyze', input: 'file-analyze', preview: 'preview-analyze', type: 'single' },
        { drop: 'drop-batch-covers', input: 'file-batch-covers', preview: 'preview-batch-covers', type: 'multiple' },
        { drop: 'drop-batch-stegos', input: 'file-batch-stegos', preview: 'preview-batch-stegos', type: 'multiple' }
    ];

    zones.forEach(z => {
        const dropZone = document.getElementById(z.drop);
        const input = document.getElementById(z.input);
        const preview = document.getElementById(z.preview);

        // Drag Events
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            });
        });

        // Drop
        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileSelect(files[0], dropZone, preview);
            }
        });

        // Click - Only if NOT clicking the input itself
        dropZone.addEventListener('click', (e) => {
            if (e.target !== input) {
                input.click();
            }
        });

        // Change
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                if (z.type === 'multiple') {
                    preview.innerHTML = `<div class="file-icon"><i class="fa-solid fa-copy"></i> ${input.files.length} Files Selected</div>`;
                    dropZone.classList.add('has-file');
                } else {
                    handleFileSelect(input.files[0], dropZone, preview);
                }
            }
        });
    });

    // Secret File (Simple Label Update)
    const secInput = document.getElementById('file-secret');
    secInput.addEventListener('change', () => {
        if (secInput.files.length > 0) {
            document.getElementById('lbl-secret').innerText = secInput.files[0].name;
        }
    });

}

function handleFileSelect(file, zone, preview) {
    zone.classList.add('has-file');

    let content = '';
    if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        content = `<img src="${url}" alt="Preview" class="preview-img">`;
        // Clean up memory later if needed, but for single page app URL.revokeObjectURL is good practice
    } else {
        content = `<div class="file-icon"><i class="fa-solid fa-file"></i> ${file.name}</div>`;
    }

    // Add Clear Button
    content += `<button type="button" class="btn-clear" onclick="clearFile('${zone.id}', '${preview.id}', '${zone.querySelector('input').id}')"><i class="fa-solid fa-times"></i> Remove</button>`;

    preview.innerHTML = content;
}

window.clearFile = function (zoneId, previewId, inputId) {
    document.getElementById(zoneId).classList.remove('has-file');
    document.getElementById(previewId).innerHTML = '';
    document.getElementById(inputId).value = '';

    // Stop propagation if inside drop zone
    event.stopPropagation();
}


// --- API Interaction ---

function setupForms() {

    // 1. EMBED
    document.getElementById('form-embed').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-embed');
        setLoading(btn, true);

        try {
            const formData = new FormData();
            formData.append('cover', document.getElementById('file-cover').files[0]);
            formData.append('secret', document.getElementById('file-secret').files[0]);
            formData.append('method', document.getElementById('sel-method').value);
            formData.append('password', document.getElementById('inp-pass-embed').value);

            const res = await fetch('/api/embed', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok && data.success) {
                // Determine file extension from base64 if needed, but we saved as .png
                // Convert Base64 to Blob for download
                const byteCharacters = atob(data.image_data);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: "image/png" });

                triggerDownload(blob, data.filename);
                showToast('Data embedded successfully!', 'success');

                // Show Recovery Token if available
                if (data.recovery_token) {
                    showRecoveryModal(data.recovery_token);
                }
            } else {
                showToast(data.error || 'Embedding failed', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Network error', 'error');
        } finally {
            setLoading(btn, false);
        }
    });

    // 2. EXTRACT
    document.getElementById('form-extract').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-extract');
        setLoading(btn, true);

        try {
            const formData = new FormData();
            formData.append('stego', document.getElementById('file-stego').files[0]);

            // Check if using Token or Password
            const useToken = document.getElementById('chk-forgot-pass').checked;
            if (useToken) {
                formData.append('recovery_token', document.getElementById('inp-token-extract').value);
            } else {
                formData.append('password', document.getElementById('inp-pass-extract').value);
            }

            const res = await fetch('/api/extract', { method: 'POST', body: formData });

            if (res.ok) {
                // Get filename from header if possible, else default
                // Content-Disposition: attachment; filename="extracted.txt"
                let filename = "extracted_file";
                const disposition = res.headers.get('Content-Disposition');
                if (disposition && disposition.indexOf('attachment') !== -1) {
                    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                    const matches = filenameRegex.exec(disposition);
                    if (matches != null && matches[1]) {
                        filename = matches[1].replace(/['"]/g, '');
                    }
                }

                const blob = await res.blob();
                triggerDownload(blob, filename);
                showToast('Data extracted successfully!', 'success');
            } else {
                const err = await res.json();
                showToast(err.error || 'Extraction failed', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setLoading(btn, false);
        }
    });

    // 3. ANALYZE
    document.getElementById('btn-analyze').addEventListener('click', async () => {
        const fileInput = document.getElementById('file-analyze');
        if (!fileInput.files.length) {
            showToast('Please select an image first', 'error');
            return;
        }

        const btn = document.getElementById('btn-analyze');
        btn.innerText = 'Scanning...';
        btn.disabled = true;

        try {
            const formData = new FormData();
            formData.append('image', fileInput.files[0]);

            const res = await fetch('/api/analyze', { method: 'POST', body: formData });
            const data = await res.json();

            if (res.ok) {
                displayAnalysisResult(data);
                showToast('Analysis complete', 'success');
            } else {
                showToast(data.error || 'Analysis failed', 'error');
            }

        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            btn.innerText = 'Run Analysis';
            btn.disabled = false;
        }
    });

    // 6. CONTACT FORM
    const formContact = document.getElementById('form-contact');
    if (formContact) {
        formContact.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    name: document.getElementById('inp-contact-name').value,
                    email: document.getElementById('inp-contact-email').value,
                    message: document.getElementById('inp-contact-msg').value
                };

                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    showToast('Message sent successfully!', 'success');
                    formContact.reset();
                } else {
                    showToast('Failed to send message', 'error');
                }
            } catch (e) {
                showToast('Network error', 'error');
            }
        });
    }

    // 4. BATCH HIDE
    const formBatchHide = document.getElementById('form-batch-hide');
    if (formBatchHide) {
        formBatchHide.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-batch-hide');
            setLoading(btn, true);

            try {
                const formData = new FormData();
                formData.append('mode', 'hide');
                const files = document.getElementById('file-batch-covers').files;
                for (let i = 0; i < files.length; i++) {
                    formData.append('covers', files[i]);
                }
                formData.append('secret', document.getElementById('file-batch-secret').files[0]);
                formData.append('password', document.getElementById('inp-pass-batch-hide').value);

                const res = await fetch('/api/batch', { method: 'POST', body: formData });

                if (res.ok) {
                    const blob = await res.blob();
                    triggerDownload(blob, 'batch_stego.zip');
                    showToast('Batch processing complete!', 'success');
                } else {
                    const err = await res.json();
                    showToast(err.error || 'Batch failed', 'error');
                }
            } catch (error) {
                showToast('Network error', 'error');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // 5. BATCH EXTRACT
    const formBatchExtract = document.getElementById('form-batch-extract');
    if (formBatchExtract) {
        formBatchExtract.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-batch-extract');
            setLoading(btn, true);

            try {
                const formData = new FormData();
                formData.append('mode', 'extract');
                const files = document.getElementById('file-batch-stegos').files;
                for (let i = 0; i < files.length; i++) {
                    formData.append('stegos', files[i]);
                }
                formData.append('password', document.getElementById('inp-pass-batch-extract').value);

                const res = await fetch('/api/batch', { method: 'POST', body: formData });

                if (res.ok) {
                    const blob = await res.blob();
                    triggerDownload(blob, 'batch_extracted.zip');
                    showToast('Batch extraction complete!', 'success');
                } else {
                    const err = await res.json();
                    showToast(err.error || 'Batch failed', 'error');
                }
            } catch (error) {
                showToast('Network error', 'error');
            } finally {
                setLoading(btn, false);
            }
        });
    }
}

// --- Helpers ---

function setLoading(btn, isLoading) {
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

function triggerDownload(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check' : 'triangle-exclamation'}"></i> ${msg}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function displayAnalysisResult(data) {
    const placeholder = document.getElementById('result-placeholder');
    const content = document.getElementById('result-content');

    placeholder.style.display = 'none';
    content.classList.remove('hidden');
    content.classList.remove('result-box'); // Reset valid classes
    content.classList.add('result-box');

    const verdictBadge = document.getElementById('res-verdict');

    if (data.detected) {
        verdictBadge.innerText = 'DETECTED';
        verdictBadge.className = 'verdict-badge DETECTED';
        document.getElementById('res-title').innerText = "Steganography Found";
    } else {
        verdictBadge.innerText = 'CLEAN';
        verdictBadge.className = 'verdict-badge CLEAN';
        document.getElementById('res-title').innerText = "Safe Image";
    }

    document.getElementById('res-desc').innerText = data.description;

    // Stats
    let methodText = "None";
    if (data.static_analysis.detected) methodText = "Static Signature";
    else if (data.ai_analysis.available && data.ai_analysis.score > 0.5) methodText = "Deep Learning (SRM)";

    document.getElementById('res-method').innerText = methodText;

    if (data.ai_analysis.available) {
        const conf = ((data.detected ? data.ai_analysis.score : (1 - data.ai_analysis.score)) * 100).toFixed(1);
        document.getElementById('res-conf').innerText = `${conf}%`;
    } else {
        document.getElementById('res-conf').innerText = "Model N/A";
    }
}

// --- New UI Helpers ---

function toggleRecoveryInput() {
    const isChecked = document.getElementById('chk-forgot-pass').checked;
    const passInput = document.getElementById('inp-pass-extract');
    const tokenInput = document.getElementById('inp-token-extract');

    if (isChecked) {
        passInput.style.display = 'none';
        tokenInput.style.display = 'block';
    } else {
        passInput.style.display = 'block';
        tokenInput.style.display = 'none';
    }
}

function showRecoveryModal(token) {
    const modal = document.getElementById('modal-token');
    const display = document.getElementById('display-token');
    display.innerText = token;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-token').classList.add('hidden');
}

function copyToken() {
    const token = document.getElementById('display-token').innerText;
    navigator.clipboard.writeText(token).then(() => {
        showToast('Token copied to clipboard', 'success');
    });
}
