// ==== GANTI DUA NILAI INI ====
const SECRET_TOKEN = 'kza8EidGGt6YGUFIQugQ9TjZv4sfaLOp'; // harus sama dengan yang ada di URL ?key=
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwQc-vtoXmrb_DdUXfafhilxZ7THPpCgPXJ1BzvGtcfRjfxJHPM_J5edDhMZDYppLK4/exec';
// ==============================

const params = new URLSearchParams(window.location.search);
const key = params.get('key');

const gate = document.getElementById('gate');
const app = document.getElementById('app');

if (key === SECRET_TOKEN) {
  gate.classList.add('hidden');
  app.classList.remove('hidden');
  initApp();
} else {
  gate.classList.remove('hidden');
  app.classList.add('hidden');
}

function initApp() {
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const dropzoneText = document.getElementById('dropzoneText');
  const preview = document.getElementById('preview');
  const pinInput = document.getElementById('pinInput');
  const submitBtn = document.getElementById('submitBtn');
  const form = document.getElementById('uploadForm');
  const statusBox = document.getElementById('status');
  const resultBox = document.getElementById('resultBox');
  const resultLink = document.getElementById('resultLink');
  const copyBtn = document.getElementById('copyBtn');
  const history = document.getElementById('history');
  const historyList = document.getElementById('historyList');

  let selectedFile = null;

  fileInput.addEventListener('change', () => {
    handleFile(fileInput.files[0]);
  });

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    })
  );

  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    })
  );

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    if (!file) return;
    selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      preview.classList.remove('hidden');
      dropzoneText.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    updateSubmitState();
  }

  pinInput.addEventListener('input', updateSubmitState);

  function updateSubmitState() {
    submitBtn.disabled = !(selectedFile && pinInput.value.trim().length > 0);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setStatus('Mengunggah...', null);
    submitBtn.disabled = true;

    try {
      const base64 = await fileToBase64(selectedFile);

      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          pin: pinInput.value.trim(),
          filename: selectedFile.name,
          mimeType: selectedFile.type,
          data: base64
        })
      });

      const result = await response.json();

      if (result.success) {
        setStatus('Berhasil diunggah.', 'ok');
        resultBox.classList.remove('hidden');
        resultLink.value = result.url;
        addToHistory(result.url);
        resetForm();
      } else {
        setStatus(result.error || 'Gagal mengunggah.', 'err');
      }
    } catch (err) {
      setStatus('Terjadi kesalahan koneksi.', 'err');
    } finally {
      updateSubmitState();
    }
  });

  copyBtn.addEventListener('click', () => {
    resultLink.select();
    navigator.clipboard.writeText(resultLink.value);
    copyBtn.textContent = 'Tersalin';
    setTimeout(() => (copyBtn.textContent = 'Salin'), 1500);
  });

  function resetForm() {
    selectedFile = null;
    fileInput.value = '';
    pinInput.value = '';
    preview.classList.add('hidden');
    dropzoneText.classList.remove('hidden');
  }

  function setStatus(text, kind) {
    statusBox.textContent = text;
    statusBox.classList.remove('hidden', 'ok', 'err');
    if (kind) statusBox.classList.add(kind);
  }

  function addToHistory(url) {
    history.classList.remove('hidden');
    const li = document.createElement('li');
    li.textContent = url;
    historyList.prepend(li);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
