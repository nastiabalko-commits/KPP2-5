async function sendMessage() {
  if (!this.newMessage.trim() || !this.roomId) return;

  const body = this.newMessage.trim();
  this.newMessage = "";

  try {
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${this.roomId}/send/m.room.message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          msgtype: "m.text",
          body
        })
      }
    );

    const data = await res.json();

    if (data.event_id) {
      this.messages.push({
        id: data.event_id,
        body,
        sender: this.userId,
        edited: false
      });
    }

  } catch (e) {
    console.error("Send message error:", e);
  }
}



async function fetchMessages() {
  if (!this.accessToken || !this.roomId) return;

  try {
    const url = this.lastSyncToken
      ? `https://matrix.org/_matrix/client/r0/sync?since=${this.lastSyncToken}`
      : `https://matrix.org/_matrix/client/r0/sync`;

    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${this.accessToken}` }
    });

    const data = await res.json();

    if (data.next_batch)
      this.lastSyncToken = data.next_batch;

    const room = data.rooms?.join?.[this.roomId];
    if (!room) return;

    room.timeline?.events?.forEach(ev => {

    
      if (ev.type === "m.room.redaction") {
        this.messages = this.messages.filter(m => m.id !== ev.redacts);
        return;
      }

      
      if (
        ev.type === "m.room.message" &&
        ev.content?.["m.relates_to"]?.rel_type === "m.replace"
      ) {
        const target = ev.content["m.relates_to"].event_id;
        const msg = this.messages.find(m => m.id === target);
        if (msg) {
          msg.body = ev.content["m.new_content"].body;
          msg.edited = true;
        }
        return;
      }

      /* === NEW MESSAGE + ЗВУК === */
      if (
        ev.type === "m.room.message" &&
        ev.content?.msgtype === "m.text" &&
        !this.messages.find(m => m.id === ev.event_id)
      ) {

        // 🔊 ЗВУК ДЛЯ ЧУЖИХ ПОВІДОМЛЕНЬ
        if (ev.sender !== this.userId) {
          new Audio("./chat_assets/ping.mp3").play();
        }

        this.messages.push({
          id: ev.event_id,
          body: ev.content.body,
          sender: ev.sender,
          edited: false
        });

      }
    });

  } catch (e) {
    console.error("fetchMessages error:", e);
  }
}


function startEdit(id, text) {
  this.editMode = id;
  this.editText = text;
}

function cancelEdit() {
  this.editMode = "";
  this.editText = "";
}

async function saveEdit(id) {
  if (!this.editText.trim()) return;

  const newBody = this.editText.trim();

  try {
    await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${this.roomId}/send/m.room.message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          "m.new_content": {
            msgtype: "m.text",
            body: newBody
          },
          body: newBody,
          msgtype: "m.text",
          "m.relates_to": {
            "rel_type": "m.replace",
            "event_id": id
          }
        })
      }
    );

    cancelEdit.call(this);

  } catch (e) {
    console.error("Edit message error:", e);
  }
}

async function deleteMessage(id) {
  try {
    await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${this.roomId}/redact/${id}/${Date.now()}`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`
        },
        body: JSON.stringify({
          reason: "User removed message"
        })
      }
    );

  } catch (e) {
    console.error("Delete error:", e);
  }
}


window.chatModule = {
  sendMessage,
  fetchMessages,
  startEdit,
  cancelEdit,
  saveEdit,
  deleteMessage
};
