async function fetchRoomMembers() {
  if (!this.accessToken || !this.roomId) return;

  try {
    
    const res = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/joined_members`,
      { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
    );
    const data = await res.json();

    
    const plRes = await fetch(
      `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(this.roomId)}/state/m.room.power_levels`,
      { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
    );
    const pl = await plRes.json();

    const defaultPL = pl.users_default ?? 0;

    
    this.roomMembers = Object.entries(data.joined || {}).map(([userId, info]) => ({
      userId,
      displayName: info.display_name || userId.split(':')[0].substring(1),
      avatarUrl: info.avatar_url
        ? `https://matrix.org/_matrix/media/r0/download/${info.avatar_url.replace('mxc://','')}`
        : null,
      powerLevel: pl.users?.[userId] ?? defaultPL
    }));

  } catch (e) {
    console.error('Error fetching room members:', e);
    this.roomMembers = [];
  }
}
