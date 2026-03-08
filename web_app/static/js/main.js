/**
 * DeepStegAI - Production Grade Frontend Logic
 * Refactored for stability, performance, and cyber aesthetics.
 */

const DeepStegAI = (() => {
    // --- Constants & Config ---
    const CONFIG = {
        ANIMATION_DURATION: 1500,
        TOAST_DURATION: 4000,
        SCAN_STATUSES: [
            "Analyzing pixel patterns...",
            "Scrutinizing bitstream residuals...",
            "Running SRM-CNN inference...",
            "Validating heuristic signatures...",
            "Decrypting entropy layers...",
            "Executing neuralaudit.sh..."
        ]
    };

    // --- State Management ---
    const state = {
        progressInterval: null,
        activeSection: 'landing',
        isProcessing: false,
        initTabSet: false
    };

    // --- DOM Utilities ---
    const $ = (selector) => {
        const el = document.querySelector(selector);
        if (!el && !selector.startsWith('#scan-')) {
            // console.warn(`Element not found: ${selector}`);
        }
        return el;
    };

    const $$ = (selector) => document.querySelectorAll(selector);

    // --- Navigation Logic ---
    const navigation = {
        showSection(sectionId) {
            const target = $(`#${sectionId}-section`);
            if (!target) return;

            $$('section').forEach(s => {
                s.classList.remove('active-section');
                s.classList.add('hidden-section');
            });

            target.classList.remove('hidden-section');
            target.classList.add('active-section');
            target.scrollIntoView({ behavior: 'smooth' });

            // Update Nav links
            $$('.nav-links a').forEach(a => {
                const text = (a.textContent || "").toLowerCase();
                const matches = (text.includes('home') && sectionId === 'landing') ||
                    (text.includes('dashboard') && sectionId === 'app') ||
                    (text.includes('knowledge') && sectionId === 'docs');
                a.classList.toggle('active', matches);
            });

            state.activeSection = sectionId;

            // CRITICAL: If entering app, ensure default tab is set
            if (sectionId === 'app' && !state.initTabSet) {
                navigation.switchTab('hide');
                state.initTabSet = true;
            }
        },

        switchTab(tabName) {
            // Update Buttons - search for button containing the tabName in its click handler
            $$('.tab-btn').forEach(btn => {
                const isActive = btn.getAttribute('onclick')?.includes(`'${tabName}'`);
                btn.classList.toggle('active', isActive);
            });

            // Update Views
            $$('.app-view').forEach(v => v.classList.remove('active'));
            const target = $(`#view-${tabName}`);
            if (target) target.classList.add('active');

            console.log(`[DeepStegAI] View switched to: ${tabName}`);
        },

        setBatchMode(mode) {
            $$('.mode-btn').forEach(btn => btn.classList.remove('active'));
            const targetBtn = $(`#btn-batch-mode-${mode}`);
            if (targetBtn) targetBtn.classList.add('active');

            $$('.batch-form').forEach(f => f.classList.remove('active'));
            const targetForm = $(`#form-batch-${mode}`);
            if (targetForm) targetForm.classList.add('active');
        },

        setScanMode(mode) {
            // Update Views using classes
            $$('.scan-view').forEach(v => v.classList.remove('active'));
            const target = $(`#scan-${mode}`);
            if (target) target.classList.add('active');

            // Update Buttons
            $$('#view-analyze .mode-btn').forEach(b => b.classList.remove('active'));
            const btn = $(`#btn-scan-${mode}`);
            if (btn) btn.classList.add('active');
        }
    };

    // --- File Handling ---
    const files = {
        init() {
            const zones = [
                { drop: '#drop-cover', input: '#file-cover', preview: '#preview-cover', type: 'single' },
                { drop: '#drop-stego', input: '#file-stego', preview: '#preview-stego', type: 'single' },
                { drop: '#drop-analyze', input: '#file-analyze', preview: '#preview-analyze', type: 'single' },
                { drop: '#drop-batch-covers', input: '#file-batch-covers', preview: '#preview-batch-covers', type: 'multiple' },
                { drop: '#drop-batch-stegos', input: '#file-batch-stegos', preview: '#preview-batch-stegos', type: 'multiple' }
            ];

            zones.forEach(z => {
                const dropZone = $(z.drop);
                if (!dropZone) return;

                const input = $(z.input);
                const preview = $(z.preview);

                ['dragenter', 'dragover'].forEach(name => {
                    dropZone.addEventListener(name, (e) => {
                        e.preventDefault();
                        dropZone.classList.add('dragover');
                    });
                });

                ['dragleave', 'drop'].forEach(name => {
                    dropZone.addEventListener(name, (e) => {
                        e.preventDefault();
                        dropZone.classList.remove('dragover');
                    });
                });

                dropZone.addEventListener('drop', (e) => {
                    const droppedFiles = e.dataTransfer.files;
                    if (droppedFiles.length > 0) {
                        input.files = droppedFiles;
                        this.handleSelection(droppedFiles, dropZone, preview, z.type);
                    }
                });

                dropZone.addEventListener('click', (e) => {
                    if (e.target !== input && !e.target.closest('.btn-clear')) {
                        input.click();
                    }
                });

                input.addEventListener('change', () => {
                    if (input.files.length > 0) {
                        this.handleSelection(input.files, dropZone, preview, z.type);
                    }
                });
            });

            // Special handling for secret payload input
            const secInput = $('#file-secret');
            if (secInput) {
                secInput.addEventListener('change', () => {
                    const lbl = $('#lbl-secret');
                    if (lbl && secInput.files.length > 0) {
                        lbl.innerText = secInput.files[0].name;
                        lbl.style.color = 'var(--primary)';
                    }
                });
            }
        },

        handleSelection(inputFiles, zone, preview, type) {
            if (type === 'multiple') {
                preview.innerHTML = `<div class="file-icon"><i class="fa-solid fa-copy"></i> ${inputFiles.length} Targets Selected</div>`;
                zone.classList.add('has-file');
                ui.updateCapacity();
                return;
            }

            const file = inputFiles[0];
            zone.classList.add('has-file');

            let content = '';
            if (file.type?.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                content = `<img src="${url}" alt="Preview" class="preview-img">`;
            } else {
                content = `<div class="file-icon"><i class="fa-solid fa-file-shield"></i> ${file.name}</div>`;
            }

            content += `
                <button type="button" class="btn-clear" onclick="DeepStegAI.clearFile('${zone.id}', '${preview.id}', '${zone.querySelector('input').id}', event)">
                    <i class="fa-solid fa-times"></i> CLR
                </button>`;
            preview.innerHTML = content;
        },

        clear(zoneId, previewId, inputId, e) {
            if (e) e.stopPropagation();
            const zone = document.getElementById(zoneId);
            const preview = document.getElementById(previewId);
            const input = document.getElementById(inputId);

            if (zone) zone.classList.remove('has-file');
            if (preview) preview.innerHTML = '';
            if (input) input.value = '';
            ui.updateCapacity();
        }
    };

    // --- UI Helpers ---
    const ui = {
        showToast(msg, type = 'success') {
            const container = $('#toast-container');
            if (!container) return;

            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            const icon = type === 'success' ? 'check-double' : 'triangle-exclamation';
            toast.innerHTML = `<i class="fa-solid fa-${icon}"></i> <span>${msg}</span>`;

            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'toastOut 0.4s forwards';
                setTimeout(() => toast.remove(), 400);
            }, CONFIG.TOAST_DURATION);
        },

        setLoading(btn, isLoading) {
            if (!btn) return;
            btn.disabled = isLoading;
            const originalText = btn.getAttribute('data-text') || btn.innerText;
            if (isLoading) {
                btn.setAttribute('data-text', originalText);
                btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> PROCESSING...`;
            } else {
                btn.innerText = originalText;
            }
        },

        showProgress(label, subtext = '') {
            const overlay = $('#progress-overlay');
            if (!overlay) return;
            overlay.classList.add('active');

            const labelEl = $('#loader-text');
            const subEl = $('#loader-subtext');
            const bar = $('#loader-bar');

            if (labelEl) labelEl.innerText = label || "INITIALIZING...";
            if (subEl) subEl.innerText = subtext || "Accessing Core...";
            if (bar) bar.style.width = '0%';

            let idx = 0;
            if (state.progressInterval) clearInterval(state.progressInterval);
            state.progressInterval = setInterval(() => {
                if (subEl) subEl.innerText = CONFIG.SCAN_STATUSES[idx % CONFIG.SCAN_STATUSES.length];
                idx++;
            }, 1200);
        },

        updateProgress(percent, customSubtext) {
            const bar = $('#loader-bar');
            if (bar) bar.style.width = `${percent}%`;
            if (customSubtext) {
                const subEl = $('#loader-subtext');
                if (subEl) subEl.innerText = customSubtext;
            }
        },

        hideProgress() {
            const overlay = $('#progress-overlay');
            if (overlay) overlay.classList.remove('active');
            if (state.progressInterval) clearInterval(state.progressInterval);
        },

        animateValue(id, start, end, duration) {
            const obj = document.getElementById(id);
            if (!obj) return;
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerText = (progress * (end - start) + start).toFixed(1) + "%";
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        },

        updateCapacity() {
            const coversInput = $('#file-batch-covers');
            const secretInput = $('#file-batch-secret');
            const infoBox = $('#batch-capacity-info');
            const stat = $('#cap-stat-count');

            if (!coversInput?.files.length || !secretInput?.files.length) {
                if (infoBox) infoBox.style.display = 'none';
                return;
            }

            if (infoBox) infoBox.style.display = 'block';
            const secretSize = secretInput.files[0].size;
            let okCount = 0;

            Array.from(coversInput.files).forEach(f => {
                const estimatedCap = (f.size / 3) / 8;
                if (estimatedCap > secretSize + 512) okCount++;
            });

            if (stat) {
                stat.innerText = `${okCount}/${coversInput.files.length} CARRIERS VALID`;
                stat.className = `cap-badge ${okCount === coversInput.files.length ? 'cap-good' : 'cap-bad'}`;
            }
        }
    };

    // --- API Service ---
    const api = {
        async post(url, formData) {
            const response = await fetch(url, { method: 'POST', body: formData });
            if (!response.ok) {
                const error = await response.json().catch(() => ({ error: 'Connection failed' }));
                throw new Error(error.error || 'Operation failed');
            }
            return response;
        }
    };

    // --- Action Handlers ---
    const handlers = {
        async handleEmbed(e) {
            e.preventDefault();
            const btn = $('#btn-embed');
            const cover = $('#file-cover')?.files[0];
            const secret = $('#file-secret')?.files[0];

            if (!cover || !secret) return ui.showToast('Select all required files', 'error');

            ui.setLoading(btn, true);
            try {
                const formData = new FormData();
                formData.append('cover', cover);
                formData.append('secret', secret);
                formData.append('method', $('#sel-method').value);
                formData.append('password', $('#inp-pass-embed').value);

                const res = await api.post('/api/embed', formData);
                const data = await res.json();

                if (data.success) {
                    const byteCharacters = atob(data.image_data);
                    const byteNumbers = new Int8Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const blob = new Blob([byteNumbers], { type: "image/png" });

                    this.triggerDownload(blob, data.filename || 'stego.png');
                    ui.showToast('Carrier secured successfully', 'success');
                }
            } catch (err) {
                ui.showToast(err.message, 'error');
            } finally {
                ui.setLoading(btn, false);
            }
        },

        async handleExtract(e) {
            e.preventDefault();
            const btn = $('#btn-extract');
            const stego = $('#file-stego')?.files[0];
            if (!stego) return ui.showToast('Select stego image', 'error');

            ui.setLoading(btn, true);
            try {
                const formData = new FormData();
                formData.append('stego', stego);
                formData.append('password', $('#inp-pass-extract').value);

                const res = await api.post('/api/extract', formData);
                const blob = await res.blob();

                let filename = "extracted_data.bin";
                const disposition = res.headers.get('content-disposition');
                if (disposition?.includes('filename')) {
                    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                    if (matches?.[1]) filename = matches[1].replace(/['"]/g, '').trim();
                }

                this.triggerDownload(blob, filename);
                ui.showToast('Hidden payload recovered', 'success');
            } catch (err) {
                ui.showToast(err.message, 'error');
            } finally {
                ui.setLoading(btn, false);
            }
        },

        async handleAnalyze() {
            const btn = $('#btn-analyze');
            const file = $('#file-analyze')?.files[0];
            if (!file) return ui.showToast('Select target image', 'error');

            ui.setLoading(btn, true);
            try {
                const formData = new FormData();
                formData.append('image', file);

                const res = await api.post('/api/analyze', formData);
                const data = await res.json();
                this.displayResults(data);
                ui.showToast('Neural scan complete', 'success');
            } catch (err) {
                ui.showToast(err.message, 'error');
            } finally {
                ui.setLoading(btn, false);
            }
        },

        async handleBatchHide(e) {
            e.preventDefault();
            const covers = $('#file-batch-covers')?.files;
            const secret = $('#file-batch-secret')?.files[0];
            if (!covers?.length || !secret) return ui.showToast('Batch preparation incomplete', 'error');

            ui.showProgress('Initiating Mass Embed...', 'Encrypting payload...');
            try {
                const formData = new FormData();
                formData.append('mode', 'hide');
                formData.append('method', $('#sel-batch-method').value);
                formData.append('password', $('#inp-pass-batch-hide').value);
                formData.append('secret', secret);
                Array.from(covers).forEach(f => formData.append('covers', f));

                ui.updateProgress(20, 'Distributing data across batch...');
                const res = await api.post('/api/batch', formData);
                ui.updateProgress(80, 'Finalizing secure archive...');

                const blob = await res.blob();
                this.triggerDownload(blob, 'deepsteg_batch_secured.zip');
                ui.showToast('Batch protocol executed', 'success');
            } catch (err) {
                ui.showToast(err.message, 'error');
            } finally {
                ui.hideProgress();
            }
        },

        async handleBatchExtract(e) {
            e.preventDefault();
            const stegos = $('#file-batch-stegos')?.files;
            if (!stegos?.length) return ui.showToast('Selection pool empty', 'error');

            ui.showProgress('Processing Dataset...', 'Scanning for signatures...');
            try {
                const formData = new FormData();
                formData.append('mode', 'extract');
                formData.append('batch_keys', $('#inp-batch-keys').value);
                Array.from(stegos).forEach(f => formData.append('stegos', f));

                ui.updateProgress(40, 'Running trial decryption...');
                const res = await api.post('/api/batch', formData);
                ui.updateProgress(90, 'Packing recovery files...');

                const blob = await res.blob();
                this.triggerDownload(blob, 'deepsteg_batch_recovery.zip');
                ui.showToast('Dataset extraction complete', 'success');
            } catch (err) {
                ui.showToast(err.message, 'error');
            } finally {
                ui.hideProgress();
            }
        },

        async handleBatchAnalyze() {
            const files = $('#file-batch-scan')?.files;
            if (!files?.length) return ui.showToast('Target pool empty', 'error');

            ui.showProgress('Deep Neural Audit...', `Scanning ${files.length} targets`);
            const container = $('#batch-scan-results');
            if (container) container.innerHTML = '';

            try {
                const formData = new FormData();
                Array.from(files).forEach(f => formData.append('images', f));

                const res = await api.post('/api/batch_analyze', formData);
                const data = await res.json();

                if (data.results && container) {
                    data.results.forEach(r => {
                        const div = document.createElement('div');
                        div.className = 'scan-item';
                        const verdict = (r.verdict || 'UNKNOWN').toUpperCase();
                        const riskClass = verdict === 'CLEAN' ? 'risk-low' : (verdict === 'SUSPICIOUS' ? 'risk-warn' : 'risk-high');

                        div.innerHTML = `
                            <div>
                                <strong style="font-size:0.85rem">${r.filename}</strong>
                                <div style="font-size:0.75rem; color:var(--text-muted)">${r.heuristic || 'No signature found'}</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:12px">
                                <div style="text-align:right">
                                    <div style="font-size:0.6rem; opacity:0.6">AI SCORE</div>
                                    <div style="font-weight:700; color:var(--primary); font-size:0.9rem">${(r.ai_score || 0).toFixed(1)}%</div>
                                </div>
                                <span class="risk-tag ${riskClass}">${verdict}</span>
                            </div>
                        `;
                        container.appendChild(div);
                    });
                }
            } catch (err) {
                ui.showToast(err.message, 'error');
            } finally {
                ui.hideProgress();
            }
        },

        displayResults(data) {
            const ph = $('#result-placeholder');
            const ct = $('#result-content');
            if (!ph || !ct) return;

            ph.style.display = 'none';
            ct.classList.remove('hidden');
            ct.classList.add('active');

            const badge = $('#res-verdict');
            const title = $('#res-title');
            const desc = $('#res-desc');
            const eng = $('#res-method');

            const verdict = (data.verdict || 'CLEAN').toUpperCase();
            badge.innerText = verdict;
            badge.className = `verdict-badge ${verdict}`;

            if (verdict === 'DETECTED') {
                title.innerText = "MALICIOUS PAYLOAD DETECTED";
                title.style.color = "var(--danger)";
            } else if (verdict === 'SUSPICIOUS') {
                title.innerText = "ANOMALOUS ACTIVITY";
                title.style.color = "var(--warning)";
            } else {
                title.innerText = "SYSTEM CLEARANCE";
                title.style.color = "var(--success)";
            }

            desc.innerText = data.description || "Neutral pixel distribution verified.";

            let method = "ZERO-SIG";
            if (data.static_analysis?.detected) method = "STATIC SIGNATURE";
            else if (data.ai_analysis?.available) method = "SRM-CNN NEURAL";
            if (eng) eng.innerText = method;

            if (data.ai_analysis?.available) {
                const score = data.ai_analysis.score;
                const conf = ((data.detected ? score : (1 - score)) * 100);
                ui.animateValue('res-conf', 0, conf, CONFIG.ANIMATION_DURATION);
            }
        },

        triggerDownload(blob, filename) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(url);
                a.remove();
            }, 100);
        }
    };

    // --- Public API ---
    return {
        init() {
            files.init();
            this.bindEvents();
            // Ensure first tab is active
            navigation.switchTab('hide');
            console.log("DeepStegAI Core Protocol Activated");
        },

        bindEvents() {
            const b = (id, handler) => {
                const el = $(id);
                if (el) el.addEventListener('submit', handler.bind(handlers));
            };

            b('#form-embed', handlers.handleEmbed);
            b('#form-extract', handlers.handleExtract);
            b('#form-batch-hide', handlers.handleBatchHide);
            b('#form-batch-extract', handlers.handleBatchExtract);

            const btnClick = (id, handler) => {
                const el = $(id);
                if (el) el.addEventListener('click', handler.bind(handlers));
            };

            btnClick('#btn-analyze', handlers.handleAnalyze);
            btnClick('#btn-batch-scan', handlers.handleBatchAnalyze);

            // Special: Batch secret change listener
            const bsc = $('#file-batch-secret');
            if (bsc) bsc.addEventListener('change', ui.updateCapacity);
        },

        // Exported UI functions for HTML attributes
        showSection: navigation.showSection,
        enterApp: () => navigation.showSection('app'),
        switchTab: navigation.switchTab,
        setBatchMode: navigation.setBatchMode,
        setScanMode: navigation.setScanMode,
        clearFile: files.clear
    };
})();

// Initialization
document.addEventListener("DOMContentLoaded", () => DeepStegAI.init());
