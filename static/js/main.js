document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const filenameDisplay = document.getElementById('filename');
    const removeFileBtn = document.getElementById('remove-file');
    const convertBtn = document.getElementById('convert-btn');

    // Sections
    const uploadSection = document.getElementById('upload-section');
    const processingSection = document.getElementById('processing-section');
    const successSection = document.getElementById('success-section');
    const errorSection = document.getElementById('error-section');
    const downloadLink = document.getElementById('download-link');
    const previewBtn = document.getElementById('preview-btn');
    const previewContainer = document.getElementById('preview-container');
    const convertAnotherBtn = document.getElementById('convert-another');
    const tryAgainBtn = document.getElementById('try-again');
    const errorMsg = document.getElementById('error-msg');

    let currentFile = null;
    let convertedBlob = null;

    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Click to upload
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        const file = files[0];
        if (file && file.type === 'application/pdf') {
            currentFile = file;
            updateUIForFile(file);
        } else if (file) {
            alert('Please upload a valid PDF file.');
        }
    }

    function updateUIForFile(file) {
        filenameDisplay.textContent = file.name;
        dropZone.classList.add('hidden');
        fileInfo.classList.remove('hidden');
        convertBtn.classList.remove('hidden');
    }

    removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetUpload();
    });

    function resetUpload() {
        currentFile = null;
        convertedBlob = null;
        fileInput.value = '';
        dropZone.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        convertBtn.classList.add('hidden');

        // Hide other sections
        [processingSection, successSection, errorSection].forEach(el => el.classList.add('hidden'));
        uploadSection.classList.remove('hidden');

        // Reset preview
        previewContainer.innerHTML = '';
        previewContainer.classList.add('hidden');
        previewBtn.textContent = 'Preview';
    }

    // Convert Logic
    convertBtn.addEventListener('click', uploadAndConvert);

    function uploadAndConvert() {
        if (!currentFile) return;

        showSection(processingSection);

        const formData = new FormData();
        formData.append('file', currentFile);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
            .then(response => {
                if (!response.ok) return response.json().then(e => { throw new Error(e.error || 'Conversion failed') });
                return response.json();
            })
            .then(data => {
                if (data.download_url) {
                    downloadLink.href = data.download_url;
                    downloadLink.download = `${currentFile.name.replace('.pdf', '')}.docx`;

                    // Fetch the converted file for preview
                    fetch(data.download_url)
                        .then(res => res.blob())
                        .then(blob => {
                            convertedBlob = blob;
                            showSection(successSection);
                        });
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
            })
            .catch(error => {
                console.error(error);
                errorMsg.textContent = error.message || "An error occurred during conversion.";
                showSection(errorSection);
            });
    }

    // Preview Logic
    previewBtn.addEventListener('click', () => {
        if (previewContainer.classList.contains('hidden')) {
            if (convertedBlob) {
                renderPreview(convertedBlob);
            }
        } else {
            previewContainer.classList.add('hidden');
            previewBtn.textContent = 'Preview';
        }
    });

    function renderPreview(blob) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const arrayBuffer = event.target.result;
            mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                .then(displayResult)
                .catch(handleError);
        };
        reader.readAsArrayBuffer(blob);
    }

    function displayResult(result) {
        previewContainer.innerHTML = result.value;
        previewContainer.classList.remove('hidden');
        previewBtn.textContent = 'Close Preview';
    }

    function handleError(err) {
        console.warn(err);
        alert('Could not generate preview.');
    }

    function showSection(section) {
        [uploadSection, processingSection, successSection, errorSection].forEach(el => el.classList.add('hidden'));
        section.classList.remove('hidden');
        section.classList.add('flex');
    }

    convertAnotherBtn.addEventListener('click', () => {
        resetUpload();
    });

    tryAgainBtn.addEventListener('click', () => {
        resetUpload();
    });
});
