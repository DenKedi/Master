"use client";
import { useEffect, useState } from "react";
import LoadingDots from "@/components/ui/LoadingDots";

interface FriendUser {
  _id: string;
  username: string;
  avatarUrl?: string;
  isActive?: boolean;
}

interface FriendRequest {
  _id: string;
  fromUserId?: FriendUser;
  toUserId?: FriendUser;
  status: string;
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [sent, setSent] = useState<FriendRequest[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResult, setSearchResult] = useState<string>("");
  const [loading, setLoading] = useState(true);

  function fetchData() {
    fetch("/api/friends")
      .then((r) => r.json())
      .then((d) => {
        setFriends(d.data?.friends ?? []);
        setPending(d.data?.pending ?? []);
        setSent(d.data?.sent ?? []);
        setLoading(false);
      });
  }

  useEffect(() => { fetchData(); }, []);

  async function sendRequest() {
    setSearchResult("");
    // Search user by username via admin endpoint isn't ideal;
    // we use the users API to look them up by username
    const res = await fetch(`/api/users?username=${encodeURIComponent(searchUsername)}`);
    const data = await res.json();
    if (!data.success || !data.data || data.data.length === 0) {
      setSearchResult("User not found.");
      return;
    }
    const targetId = data.data[0]._id;
    const r2 = await fetch("/api/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toUserId: targetId }),
    });
    const d2 = await r2.json();
    setSearchResult(d2.success ? "Friend request sent!" : (d2.error ?? "Error"));
    if (d2.success) fetchData();
  }

  async function respond(requestId: string, action: "accept" | "reject") {
    await fetch(`/api/friends/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    fetchData();
  }

  async function unfriend(friendId: string) {
    await fetch(`/api/friends/${friendId}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="max-w-2xl animate-slide-up">
      <div className="mb-8">
        <div className="text-xs tracking-[0.3em] uppercase mb-2" style={{ color: 'var(--gold)' }}>✦ Inquisition ✦</div>
        <h1 className="font-display font-black text-3xl tracking-widest uppercase text-gold-gradient">Hunt Roster</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Having allies is a powerful advantage, mostly because you can blame them for your failures.</p>
      </div>

      {/* Add Rival */}
      <div className="panel p-6 mb-6 relative">
        <div className="corner-tl" />
        <h2 className="font-display font-bold text-sm tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>🗡️ Mark a Target</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendRequest()}
            placeholder="Enter goblin name..."
            className="input-game flex-1"
          />
          <button onClick={sendRequest} className="btn-game px-5 text-sm shrink-0">
            Search
          </button>
        </div>
        {searchResult && (
          <p
            className="text-sm mt-3 font-semibold"
            style={{ color: searchResult.includes('sent') ? 'var(--gold)' : '#f87171' }}
          >
            {searchResult}
          </p>
        )}
      </div>

      {/* Incoming Challenges */}
      {pending.length > 0 && (
        <div className="panel p-6 mb-6 relative" style={{ borderColor: 'rgba(200,150,42,0.5)' }}>
          <div className="corner-tl" />
          <h2 className="font-display font-bold text-sm tracking-widest uppercase mb-4" style={{ color: 'var(--gold-bright)' }}>
            ⚠ Incoming Warrants ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <div
                key={req._id}
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'rgba(200,150,42,0.07)', border: '1px solid rgba(200,150,42,0.15)' }}
              >
                <span className="font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                  {req.fromUserId?.username}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => respond(req._id, "accept")} className="btn-game text-xs px-4 py-1.5" style={{ color: '#4ade80' }}>
                    Induct
                  </button>
                  <button onClick={() => respond(req._id, "reject")} className="btn-game btn-game-crimson text-xs px-4 py-1.5">
                    Condemn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {sent.length > 0 && (
        <div className="panel p-6 mb-6 relative">
          <div className="corner-tl" />
          <h2 className="font-display font-bold text-sm tracking-widest uppercase mb-4" style={{ color: 'var(--text-muted)' }}>
            Awaiting Judgement ({sent.length})
          </h2>
          <div className="space-y-2">
            {sent.map((req) => (
              <div key={req._id} className="text-sm py-2 px-3" style={{ color: 'var(--text-muted)', borderBottom: '1px solid rgba(200,150,42,0.08)' }}>
                ⚖ Warrant issued for {req.toUserId?.username}…
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends/Rivals List */}
      <div className="panel p-6 relative">
        <div className="corner-tl" />
        <h2 className="font-display font-bold text-sm tracking-widest uppercase mb-4" style={{ color: 'var(--gold)' }}>
          ★ Rivals ({friends.length})
        </h2>
        {loading ? (
          <LoadingDots label="Consulting the registry…" size="sm" />
        ) : friends.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No rivals yet. Send your first challenge.</p>
        ) : (
          <div className="space-y-3">
            {friends.map((friend) => (
              <div
                key={friend._id}
                className="flex items-center justify-between px-4 py-3"
                style={{ background: 'rgba(15,0,32,0.6)', border: '1px solid rgba(200,150,42,0.12)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center text-sm font-black font-display"
                    style={{
                      background: 'var(--arcane)',
                      clipPath: 'polygon(4px 0%,100% 0%,calc(100% - 4px) 100%,0% 100%)',
                      color: '#e0ccff'
                    }}
                  >
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold tracking-wide" style={{ color: 'var(--text-primary)' }}>{friend.username}</span>
                  {!friend.isActive && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>dormant</span>
                  )}
                </div>
                <button
                  onClick={() => unfriend(friend._id)}
                  className="btn-game btn-game-crimson text-xs px-3 py-1.5"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
