# ==============================
#   NOTES APP - PYTHON BACKEND
#   Using Flask Framework
# ==============================

from flask import Flask, request, jsonify
from datetime import datetime
import json
import os

app = Flask(__name__)

# Notes storage file
NOTES_FILE = "notes_data.json"

# ===== LOAD NOTES FROM FILE =====
def load_notes():
    if os.path.exists(NOTES_FILE):
        with open(NOTES_FILE, "r") as f:
            return json.load(f)
    return []

# ===== SAVE NOTES TO FILE =====
def save_notes(notes):
    with open(NOTES_FILE, "w") as f:
        json.dump(notes, f, indent=4)

# ===== GET ALL NOTES =====
@app.route("/api/notes", methods=["GET"])
def get_notes():
    notes = load_notes()
    return jsonify({
        "success": True,
        "count": len(notes),
        "notes": notes
    })

# ===== ADD NEW NOTE =====
@app.route("/api/notes", methods=["POST"])
def add_note():
    data  = request.get_json()
    notes = load_notes()

    new_note = {
        "id":      len(notes) + 1,
        "title":   data.get("title", "Untitled"),
        "content": data.get("content", ""),
        "color":   data.get("color", "yellow"),
        "pinned":  False,
        "date":    datetime.now().strftime("%b %d, %Y %I:%M %p")
    }

    notes.insert(0, new_note)
    save_notes(notes)

    return jsonify({
        "success": True,
        "message": "Note added successfully!",
        "note":    new_note
    }), 201

# ===== UPDATE A NOTE =====
@app.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    data  = request.get_json()
    notes = load_notes()

    for note in notes:
        if note["id"] == note_id:
            note["title"]   = data.get("title",   note["title"])
            note["content"] = data.get("content", note["content"])
            note["color"]   = data.get("color",   note["color"])
            note["pinned"]  = data.get("pinned",  note["pinned"])
            save_notes(notes)
            return jsonify({
                "success": True,
                "message": "Note updated!",
                "note":    note
            })

    return jsonify({"success": False, "message": "Note not found!"}), 404

# ===== DELETE A NOTE =====
@app.route("/api/notes/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    notes = load_notes()
    original_count = len(notes)
    notes = [n for n in notes if n["id"] != note_id]

    if len(notes) == original_count:
        return jsonify({"success": False, "message": "Note not found!"}), 404

    save_notes(notes)
    return jsonify({
        "success": True,
        "message": f"Note #{note_id} deleted!"
    })

# ===== SEARCH NOTES =====
@app.route("/api/notes/search", methods=["GET"])
def search_notes():
    query = request.args.get("q", "").lower()
    notes = load_notes()

    results = [
        n for n in notes
        if query in n["title"].lower() or query in n["content"].lower()
    ]

    return jsonify({
        "success": True,
        "count":   len(results),
        "results": results
    })

# ===== CLEAR ALL NOTES =====
@app.route("/api/notes/clear", methods=["DELETE"])
def clear_all():
    save_notes([])
    return jsonify({
        "success": True,
        "message": "All notes cleared!"
    })

# ===== RUN SERVER =====
if __name__ == "__main__":
    print("🚀 Notes Server Running at http://localhost:5000")
    app.run(debug=True, port=5000)
