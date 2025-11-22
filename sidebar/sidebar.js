/* ======================
      CREATE ROOM
====================== */
async function createRoom() {
  if (!this.newRoomName.trim()) return;

  try {
    const res = await fetch(`https://matrix.org/_matrix/client/r0/createRoom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({
        preset: "private_chat",
        name: this.newRoomName.trim()
      })
    });

    const data = await res.json();

    if (data.room_id) {
      this.newRoomId = data.room_id;
      this.roomId = data.room_id;
      this.messages = [];
      this.lastSyncToken = "";

      await this.fetchRoomsWithNames();
      alert(`Room created: ${this.newRoomName}`);

      this.newRoomName = "";
    }
  } catch (e) {
    console.error("Create room error:", e);
  }
}


/* ======================
   FETCH ROOMS
====================== */
async function fetchRoomsWithNames() {
  if (!this.accessToken) return;

  try {
    const res = await fetch(
      "https://matrix.org/_matrix/client/r0/joined_rooms",
      { headers: { "Authorization": `Bearer ${this.accessToken}` } }
    );

    const data = await res.json();

    if (data.joined_rooms) {
      const promises = data.joined_rooms.map(async (roomId) => {
        try {
          const nameRes = await fetch(
            `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/state/m.room.name`,
            { headers: { "Authorization": `Bearer ${this.accessToken}` } }
          );
          const name = await nameRes.json();

          return { roomId, name: name?.name || roomId };
        } catch {
          return { roomId, name: roomId };
        }
      });

      this.rooms = (await Promise.all(promises))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (!this.roomId && this.rooms.length > 0) {
        this.roomId = this.rooms[0].roomId;
      }
    }

  } catch (e) {
    console.error("Fetch rooms error:", e);
  }
}


/* ======================
   RENAME ROOM (КП2-10)
====================== */
async function renameRoom(roomId) {
  if (!this.renameText.trim()) return;

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/state/m.room.name`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({ name: this.renameText.trim() })
      }
    );

    if (res.ok) {
      await this.fetchRoomsWithNames();
      this.renameMode = null;
      this.renameText = "";
    }

  } catch (e) {
    console.error("Rename error:", e);
  }
}


/* ======================
   DELETE ROOM (КП2-10)
====================== */
async function deleteRoom(roomId) {
  const confirmDelete = confirm("Delete this room? This cannot be undone.");
  if (!confirmDelete) return;

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/leave`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${this.accessToken}` }
      }
    );

    if (res.ok) {
      await this.fetchRoomsWithNames();
      if (this.rooms.length > 0) {
        this.roomId = this.rooms[0].roomId;
      } else {
        this.roomId = "";
        this.messages = [];
      }
    }

  } catch (e) {
    console.error("Delete room error:", e);
  }
}


/* ======================
   RENAME MODE HELPERS
====================== */
function startRename(roomId, currentName) {
  this.renameMode = roomId;
  this.renameText = currentName;
}

function cancelRename() {
  this.renameMode = null;
  this.renameText = "";
}


/* ======================
   SWITCH ROOM
====================== */
function switchRoom(roomId) {
  this.roomId = roomId;
  this.messages = [];
  this.lastSyncToken = "";
  this.fetchMessages();
}


/* ======================
   EXPORT FOR ALPINE
====================== */
export {
  createRoom,
  fetchRoomsWithNames,
  switchRoom,
  renameRoom,
  deleteRoom,
  startRename,
  cancelRename
};
