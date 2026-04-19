// ===========================
//   NOTES APP - JAVASCRIPT
// ===========================

// Global Array to Store Notes
let notes = [];
let noteIdCounter = 0;

// ===== LOAD NOTES ON START =====
window.onload = function () {
    loadFromStorage();
    updateDisplay();
    showToast("Welcome Back! 👋");
};

// ===== ADD NEW NOTE =====
function addNote() {
    const color = document.getElementById("colorPicker").value;
    const now = new Date();

    const note = {
        id: noteIdCounter++,
        title: "",
        content: "",
        color: color,
        date: formatDate(now),
        pinned: false
    };

    notes.unshift(note); // Add to beginning
    renderNotes();
    updateCount();
    updateStatus("unsaved");
    showToast("New Note Created! 📝");
}

// ===== RENDER ALL NOTES =====
function renderNotes(filteredNotes = null) {
    const container = document.getElementById("notesContainer");
    const emptyMsg  = document.getElementById("emptyMessage");
    const displayNotes = filteredNotes || notes;

    container.innerHTML = "";

    if (displayNotes.length === 0) {
        emptyMsg.style.display = "block";
        return;
    }

    emptyMsg.style.display = "none";

    // Sort: Pinned notes first
    const sorted = [...displayNotes].sort((a, b) => b.pinned - a.pinned);

    sorted.forEach(note => {
        const card = document.createElement("div");
        card.className = `note-card note-${note.color} ${note.pinned ? 'pinned' : ''}`;
        card.id = `note-${note.id}`;

        card.innerHTML = `
            ${note.pinned ? '<span class="pin-icon">📌</span>' : ''}

            <input 
                type="text" 
                class="note-title" 
                placeholder="📌 Note Title..."
                value="${escapeHtml(note.title)}"
                oninput="updateNote(${note.id}, 'title', this.value)"
                maxlength="50"
            />

            <textarea 
                class="note-content"
                placeholder="Write your note here..."
                oninput="updateNote(${note.id}, 'content', this.value)"
            >${escapeHtml(note.content)}</textarea>

            <div class="word-count" id="wc-${note.id}">
                ${countWords(note.content)} words | ${note.content.length} chars
            </div>

            <div class="note-actions">
                <button class="btn btn-pin" onclick="togglePin(${note.id})">
                    ${note.pinned ? '📌 Unpin' : '📍 Pin'}
                </button>
                <button class="btn btn-save" 
                        onclick="openModal(${note.id})"
                        style="padding:5px 12px;font-size:12px;">
                    👁️ View
                </button>
                <button class="btn btn-delete" onclick="deleteNote(${note.id})">
                    🗑️ Delete
                </button>
            </div>

            <div class="note-footer">
                <span>🕐 ${note.date}</span>
                <span>Note #${note.id + 1}</span>
            </div>
        `;

        container.appendChild(card);
    });
}

// ===== UPDATE NOTE DATA =====
function updateNote(id, field, value) {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex][field] = value;

        // Update word count live
        if (field === "content") {
            const wc = document.getElementById(`wc-${id}`);
            if (wc) {
                wc.textContent = `${countWords(value)} words | ${value.length} chars`;
            }
        }

        updateStatus("unsaved");
        saveToStorage(); // Auto-save
    }
}

// ===== DELETE NOTE =====
function deleteNote(id) {
    if (confirm("Are you sure you want to delete this note?")) {
        const card = document.getElementById(`note-${id}`);

        // Animate out
        card.style.transition = "all 0.3s ease";
        card.style.transform  = "scale(0) rotate(10deg)";
        card.style.opacity    = "0";

        setTimeout(() => {
            notes = notes.filter(n => n.id !== id);
            renderNotes();
            updateCount();
            saveToStorage();
            showToast("Note Deleted! 🗑️");
        }, 300);
    }
}

// ===== TOGGLE PIN =====
function togglePin(id) {
    const noteIndex = notes.findIndex(n => n.id === id);
    if (noteIndex !== -1) {
        notes[noteIndex].pinned = !notes[noteIndex].pinned;
        renderNotes();
        saveToStorage();
        const status = notes[noteIndex].pinned ? "📌 Pinned!" : "📍 Unpinned!";
        showToast(status);
    }
}

// ===== SAVE ALL NOTES =====
function saveAllNotes() {
    saveToStorage();
    updateStatus("saved");
    showToast("All Notes Saved! 💾");
}

// ===== CLEAR ALL NOTES =====
function clearAll() {
    if (notes.length === 0) {
        showToast("No notes to clear! 😅");
        return;
    }
    if (confirm(`Delete ALL ${notes.length} notes? This cannot be undone!`)) {
        notes = [];
        noteIdCounter = 0;
        renderNotes();
        updateCount();
        localStorage.removeItem("myNotes");
        showToast("All Notes Cleared! 🗑️");
    }
}

// ===== SEARCH NOTES =====
function searchNotes() {
    const query = document.getElementById("searchBox").value.toLowerCase();

    if (query === "") {
        renderNotes();
        return;
    }

    const filtered = notes.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
    );

    renderNotes(filtered);

    const count = filtered.length;
    showToast(`Found ${count} note(s) 🔍`);
}

// ===== OPEN MODAL =====
function openModal(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById("modalTitle").textContent   = note.title || "Untitled Note";
    document.getElementById("modalContent").textContent = note.content || "No content written.";
    document.getElementById("modalDate").textContent    = "📅 Created: " + note.date;

    document.getElementById("noteModal").classList.add("active");
}

// ===== CLOSE MODAL =====
function closeModal() {
    document.getElementById("noteModal").classList.remove("active");
}

// Click outside modal to close
document.addEventListener("click", function (e) {
    const modal = document.getElementById("noteModal");
    if (e.target === modal) {
        closeModal();
    }
});

// ===== SAVE TO LOCAL STORAGE =====
function saveToStorage() {
    const data = {
        notes: notes,
        counter: noteIdCounter
    };
    localStorage.setItem("myNotes", JSON.stringify(data));
}

// ===== LOAD FROM LOCAL STORAGE =====
function loadFromStorage() {
    const saved = localStorage.getItem("myNotes");
    if (saved) {
        const data   = JSON.parse(saved);
        notes        = data.notes || [];
        noteIdCounter = data.counter || notes.length;
        renderNotes();
        updateCount();
    }
}

// ===== UPDATE NOTES COUNT =====
function updateCount() {
    document.getElementById("notesCount").textContent =
        `📌 Total Notes: ${notes.length}`;
}

// ===== UPDATE SAVE STATUS =====
function updateStatus(status) {
    const el = document.getElementById("savedStatus");
    if (status === "saved") {
        el.textContent = "✅ All Saved";
        el.style.color = "#90ee90";
    } else {
        el.textContent = "⚠️ Unsaved Changes";
        el.style.color = "#ffff00";
    }
}

// ===== UPDATE DISPLAY =====
function updateDisplay() {
    updateCount();
    if (notes.length === 0) {
        document.getElementById("emptyMessage").style.display = "block";
    }
}

// ===== SHOW TOAST NOTIFICATION =====
function showToast(message) {
    // Remove existing toast
    const existingToast = document.getElementById("toast");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.id = "toast";
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: linear-gradient(45deg, #764ba2, #667eea);
        color: white;
        padding: 12px 25px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s";
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ===== HELPER: COUNT WORDS =====
function countWords(text) {
    if (!text || text.trim() === "") return 0;
    return text.trim().split(/\s+/).length;
}

// ===== HELPER: FORMAT DATE =====
function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        year:   "numeric",
        month:  "short",
        day:    "numeric",
        hour:   "2-digit",
        minute: "2-digit"
    });
}

// ===== HELPER: ESCAPE HTML =====
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g,  "&amp;")
        .replace(/</g,  "&lt;")
        .replace(/>/g,  "&gt;")
        .replace(/"/g,  "&quot;");
}

// ===== KEYBOARD SHORTCUT =====
document.addEventListener("keydown", function (e) {
    // Ctrl + N = New Note
    if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        addNote();
    }
    // Ctrl + S = Save All
    if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        saveAllNotes();
    }
    // ESC = Close Modal
    if (e.key === "Escape") {
        closeModal();
    }
});
