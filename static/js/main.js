function updateStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            // Update CPU
            const cpuText = document.getElementById('cpu-text');
            const cpuBar = document.getElementById('cpu-bar');
            if (cpuText && cpuBar) {
                cpuText.innerText = data.cpu + '%';
                cpuBar.style.width = data.cpu + '%';
            }

            // Update RAM
            const ramText = document.getElementById('ram-text');
            const ramBar = document.getElementById('ram-bar');
            if (ramText && ramBar) {
                ramText.innerText = data.ram + '%';
                ramBar.style.width = data.ram + '%';
            }

            // Update Disk
            const diskText = document.getElementById('disk-text');
            const diskBar = document.getElementById('disk-bar');
            if (diskText && diskBar) {
                diskText.innerText = data.disk + '%';
                diskBar.style.width = data.disk + '%';
            }

            // Update Temp
            const tempText = document.getElementById('temp-text');
            if (tempText) {
                tempText.innerText = data.temp !== "N/A" ? data.temp + '°C' : "N/A";
            }

            // Update IP
            const ipText = document.getElementById('ip-text');
            if (ipText) {
                ipText.innerText = data.ip;
            }
        })
        .catch(error => console.error('Error fetching stats:', error));
}

// Mission Notes Functionality
function loadNotes() {
    const notesList = document.getElementById('notes-list');
    if (!notesList) return;

    fetch('/api/notes')
        .then(response => response.json())
        .then(data => {
            notesList.innerHTML = '';
            if (data.length === 0) {
                notesList.innerHTML = '<p class="text-center opacity-50 py-3">No notes yet.</p>';
                return;
            }

            data.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.className = 'card bg-dark border-secondary mb-2 shadow-sm';
                noteEl.innerHTML = `
                    <div class="card-body p-2 d-flex justify-content-between align-items-start">
                        <div style="white-space: pre-wrap; word-break: break-all;" class="small text-light me-2">${escapeHtml(note.content)}</div>
                        <button class="btn btn-sm btn-outline-danger border-0 p-1" onclick="deleteNote('${note._id}')">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                    <div class="card-footer p-1 bg-transparent border-0 text-end">
                        <small class="text-muted" style="font-size: 0.7rem;">${new Date(note.created_at).toLocaleString()}</small>
                    </div>
                `;
                notesList.appendChild(noteEl);
            });
        })
        .catch(error => {
            console.error('Error loading notes:', error);
            notesList.innerHTML = '<p class="text-center text-danger py-3">Failed to load notes.</p>';
        });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveNotes() {
    const notesArea = document.getElementById('mission-notes');
    const saveBtn = document.getElementById('save-notes-btn');
    const statusDiv = document.getElementById('save-status');
    
    if (!notesArea || !saveBtn || !notesArea.value.trim()) return;

    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Adding...';

    fetch('/api/notes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: notesArea.value }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            notesArea.value = '';
            loadNotes();
            statusDiv.innerText = 'Note added!';
            statusDiv.className = 'small mt-1 text-success';
            statusDiv.style.display = 'block';
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 2000);
        }
    })
    .catch(error => {
        console.error('Error saving note:', error);
        statusDiv.innerText = 'Error adding note.';
        statusDiv.className = 'small mt-1 text-danger';
        statusDiv.style.display = 'block';
    })
    .finally(() => {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    });
}

function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;

    fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            loadNotes();
        }
    })
    .catch(error => console.error('Error deleting note:', error));
}

// Initial call
if (document.getElementById('cpu-text')) {
    updateStats();
    // Update every 3 seconds
    setInterval(updateStats, 3000);
}

// Event listeners for notes
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('mission-notes')) {
        loadNotes();
        document.getElementById('save-notes-btn').addEventListener('click', saveNotes);
    }
});
