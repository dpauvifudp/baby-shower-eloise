import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

/* ─── Browser Token ─── */
function getOrCreateToken() {
  let token = localStorage.getItem("bs-token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("bs-token", token);
  }
  return token;
}

/* ─── Palette & Typography ─── */
const P = {
  bg: "#FFF7F3", card: "#FFFFFF", blush: "#F2C4CE", rose: "#D4919E",
  deepRose: "#B76E7E", sage: "#A8B8A0", cream: "#FFF0E6", plum: "#4A2E3F",
  plumLight: "#6B4A5E", gold: "#D4A96A", border: "#F0DDD5",
  claimedBg: "#F0F7F0", claimedBorder: "#B8D8B8",
};
const ff = "'Cormorant Garamond', Georgia, serif";
const fb = "'DM Sans', system-ui, -apple-system, sans-serif";

/* ─── App ─── */
export default function App() {
  const [gifts, setGifts] = useState([]);
  const [guestName, setGuestName] = useState(() => localStorage.getItem("bs-guest") || "");
  const [screen, setScreen] = useState("welcome");
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("all");

  const browserToken = getOrCreateToken();

  /* ── Fetch gifts ── */
  const fetchGifts = useCallback(async () => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setGifts(data);
    setLoading(false);
  }, []);

  /* ── Real-time subscription ── */
  useEffect(() => {
    fetchGifts();

    const channel = supabase
      .channel("gifts-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gifts" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setGifts((prev) =>
              prev.map((g) => (g.id === payload.new.id ? payload.new : g))
            );
          } else {
            fetchGifts();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchGifts]);

  /* ── Actions ── */
  const claim = async (id) => {
    const name = guestName.trim();
    if (!name) return;
    const { error } = await supabase
      .from("gifts")
      .update({ claimed_by: name, claimed_token: browserToken })
      .eq("id", id)
      .is("claimed_by", null);

    if (error) {
      showToastMsg("Alguien ya reservó este regalo");
      fetchGifts();
      return;
    }
    setClaimingId(null);
    setShowConfetti(true);
    showToastMsg(`¡Reservaste "${gifts.find((g) => g.id === id)?.name}"!`);
    setTimeout(() => setShowConfetti(false), 2500);
  };

  const unclaim = async (id) => {
    const gift = gifts.find((x) => x.id === id);
    if (!gift || gift.claimed_token !== browserToken) {
      showToastMsg("Solo puedes liberar regalos que reservaste desde este dispositivo");
      return;
    }
    const { error } = await supabase
      .from("gifts")
      .update({ claimed_by: null, claimed_token: null })
      .eq("id", id)
      .eq("claimed_token", browserToken);

    if (error) {
      showToastMsg("No se pudo liberar el regalo");
      return;
    }
    showToastMsg("Regalo liberado");
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const enterRegistry = () => {
    if (!guestName.trim()) return;
    localStorage.setItem("bs-guest", guestName.trim());
    setScreen("message");
  };

  /* ── Derived ── */
  const claimed = gifts.filter((g) => g.claimed_by).length;
  const filtered =
    filter === "all"
      ? gifts
      : filter === "available"
      ? gifts.filter((g) => !g.claimed_by)
      : gifts.filter((g) => g.claimed_by);

  /* ─── Welcome ─── */
  if (screen === "welcome") {
    return (
      <div style={s.page}>
        <div style={s.welcomeWrap}>
          <div style={s.welcomeCard}>
            <div style={s.floralRow}>✿ ❀ ✿</div>
            <p style={s.eyebrow}>Estás invitado/a al baby shower de</p>
            <h1 style={s.heroName}>Eloise</h1>
            <Divider />
            <p style={s.parents}>
              Con amor, <strong>Óscar</strong> & <strong>Catalina</strong>
            </p>
            <p style={s.welcomeSub}>Ingresa tu nombre para continuar</p>
            <div style={s.inputCol}>
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enterRegistry()}
                style={s.input}
              />
              <button
                onClick={enterRegistry}
                disabled={!guestName.trim()}
                style={{
                  ...s.btnPrimary,
                  opacity: guestName.trim() ? 1 : 0.5,
                  cursor: guestName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Continuar
              </button>
            </div>
          </div>
          <p style={s.footNote}>
            Cada regalo puede ser reservado por una sola persona.
          </p>
        </div>
      </div>
    );
  }

  /* ─── Message ─── */
  if (screen === "message") {
    return (
      <div style={s.page}>
        <div style={s.welcomeWrap}>
          <div
            style={{
              ...s.welcomeCard,
              padding: "44px 32px 40px",
              maxWidth: 460,
            }}
          >
            <div style={s.floralRow}>🌸</div>
            <h2 style={s.msgTitle}>
              Querido/a {guestName.trim().split(" ")[0]}
            </h2>
            <div style={s.msgBody}>
              <p>
                Estamos muy felices de compartir contigo este momento tan
                especial. La llegada de{" "}
                <strong style={{ color: P.deepRose }}>Eloise</strong> es el
                regalo más grande que la vida nos da, y que tú estés presente lo
                hace aún más significativo.
              </p>
              <p>
                Queremos que sepas que{" "}
                <strong>
                  lo más importante es tu compañía y tu cariño
                </strong>
                . Hemos preparado una lista con algunas cosas que nos harían
                falta para recibir a nuestra hija, pero son solo sugerencias: no
                tienes que ceñirte a ellas ni sentir que debes regalar algo de
                la lista. Cualquier detalle, por pequeño que sea, será recibido
                con todo el amor del mundo.
              </p>
              <p>
                Tampoco es necesario que todos los regalos sean cubiertos. Lo
                que más valoramos es saber que Eloise llega a un mundo lleno de
                personas que la quieren.
              </p>
            </div>
            <p style={s.msgSign}>Con todo nuestro cariño,</p>
            <p style={s.msgSignNames}>Óscar, Catalina & Eloise 💕</p>
            <Divider />
            <button
              onClick={() => setScreen("registry")}
              style={{ ...s.btnPrimary, marginTop: 8 }}
            >
              Ver lista de regalos
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Registry ─── */
  if (loading) {
    return (
      <div style={{ ...s.page, justifyContent: "center", minHeight: "100vh" }}>
        <p style={{ color: P.plumLight, fontSize: 15 }}>Cargando regalos…</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {showConfetti && <Confetti />}
      {toast && <div style={s.toast}>{toast}</div>}

      <header style={s.header}>
        <p style={s.hdrEye}>Baby Shower</p>
        <h1 style={s.hdrTitle}>Eloise</h1>
        <p style={s.hdrParents}>Óscar & Catalina</p>
      </header>

      {/* Progress */}
      <div style={s.progressWrap}>
        <div style={s.progressRow}>
          <span style={s.progLabel}>Regalos reservados</span>
          <span style={s.progCount}>
            {claimed} de {gifts.length}
          </span>
        </div>
        <div style={s.progBar}>
          <div
            style={{
              ...s.progFill,
              width: gifts.length
                ? `${(claimed / gifts.length) * 100}%`
                : "0%",
            }}
          />
        </div>
      </div>

      {/* Guest badge */}
      <div style={s.badge}>
        <span>👋</span>
        <span style={{ flex: 1 }}>
          Hola, <strong>{guestName}</strong>
        </span>
        <button
          onClick={() => {
            setScreen("welcome");
            setGuestName("");
            localStorage.removeItem("bs-guest");
          }}
          style={s.changeBtn}
        >
          Cambiar
        </button>
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        {[
          ["all", "Todos"],
          ["available", "Disponibles"],
          ["claimed", "Reservados"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            style={{ ...s.filterBtn, ...(filter === k ? s.filterActive : {}) }}
          >
            {l}{" "}
            {k === "all"
              ? `(${gifts.length})`
              : k === "available"
              ? `(${gifts.length - claimed})`
              : `(${claimed})`}
          </button>
        ))}
      </div>

      {/* Gift list */}
      <div style={s.giftList}>
        {filtered.map((gift) => {
          const isMine = gift.claimed_token === browserToken;
          const taken = !!gift.claimed_by;
          const expanding = claimingId === gift.id;
          const links = gift.links || [];

          return (
            <div
              key={gift.id}
              style={{
                ...s.giftCard,
                ...(taken
                  ? {
                      backgroundColor: isMine ? "#F0F7F0" : "#FAFAFA",
                      borderColor: isMine ? P.claimedBorder : "#E8E8E8",
                    }
                  : {}),
              }}
            >
              <div style={s.giftTop}>
                <span style={s.giftEmoji}>{gift.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      ...s.giftName,
                      ...(taken && !isMine ? { color: "#aaa" } : {}),
                    }}
                  >
                    {gift.name}
                  </h3>
                  {links.length > 0 && (
                    <div style={s.linksRow}>
                      {links.map((lk, i) => (
                        <a
                          key={i}
                          href={lk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={s.linkChip}
                        >
                          {lk.label} ↗
                        </a>
                      ))}
                    </div>
                  )}
                  {links.length === 0 && (
                    <p style={s.noLink}>
                      Sin enlace — cualquier opción es bienvenida
                    </p>
                  )}
                </div>
                <span
                  style={{
                    ...s.statusBadge,
                    backgroundColor: taken
                      ? isMine
                        ? "#E8F5E8"
                        : "#F5F5F5"
                      : P.cream,
                    color: taken
                      ? isMine
                        ? "#4A7A4A"
                        : "#999"
                      : P.deepRose,
                  }}
                >
                  {taken ? (isMine ? "Tuyo" : "Reservado") : "Disponible"}
                </span>
              </div>

              {taken && (
                <div style={s.claimedBar}>
                  <span style={{ color: P.sage, fontWeight: 700 }}>✓</span>
                  <span>
                    Reservado por <strong>{gift.claimed_by}</strong>
                  </span>
                </div>
              )}

              {!taken && !expanding && (
                <button
                  onClick={() => setClaimingId(gift.id)}
                  style={s.claimBtn}
                >
                  Reservar este regalo
                </button>
              )}

              {!taken && expanding && (
                <div style={s.confirmBox}>
                  <p
                    style={{
                      fontSize: 13,
                      color: P.plum,
                      marginBottom: 10,
                    }}
                  >
                    ¿Confirmas reservar como <strong>{guestName}</strong>?
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => claim(gift.id)}
                      style={s.confirmYes}
                    >
                      Sí, reservar
                    </button>
                    <button
                      onClick={() => setClaimingId(null)}
                      style={s.confirmNo}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {isMine && (
                <button
                  onClick={() => unclaim(gift.id)}
                  style={s.unclaimBtn}
                >
                  Liberar regalo
                </button>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 40,
              color: P.plumLight,
              fontSize: 14,
            }}
          >
            {filter === "available"
              ? "¡Todos los regalos están reservados! 🎉"
              : "Aún no hay regalos reservados."}
          </div>
        )}
      </div>

      {/* Reminder */}
      <div style={s.reminder}>
        <p
          style={{
            fontSize: 13,
            color: P.plumLight,
            lineHeight: 1.55,
            textAlign: "center",
          }}
        >
          Recuerda: esta lista son solo sugerencias. Cualquier regalo será
          recibido con mucho cariño. No es necesario ceñirse al producto exacto
          del enlace. 💕
        </p>
      </div>

      <footer style={s.footer}>
        <Divider />
        <p
          style={{
            fontFamily: ff,
            fontSize: 15,
            fontStyle: "italic",
            color: P.rose,
            marginTop: 12,
          }}
        >
          Con cariño para Eloise
        </p>
      </footer>
    </div>
  );
}

/* ─── Shared Components ─── */
function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: "14px 0",
      }}
    >
      <span
        style={{
          display: "block",
          width: 60,
          height: 1,
          backgroundColor: P.blush,
        }}
      />
      <span style={{ color: P.rose, fontSize: 14 }}>♡</span>
      <span
        style={{
          display: "block",
          width: 60,
          height: 1,
          backgroundColor: P.blush,
        }}
      />
    </div>
  );
}

function Confetti() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1000,
      }}
    >
      {Array.from({ length: 30 }).map((_, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            width: 8,
            height: 8,
            borderRadius: 2,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.5}s`,
            backgroundColor: [P.blush, P.rose, P.gold, P.sage, "#F9E2E8"][
              i % 5
            ],
            transform: `rotate(${Math.random() * 360}deg)`,
            animation: "confettiFall 2.5s ease-out forwards",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Styles ─── */
const s = {
  page: {
    fontFamily: fb,
    backgroundColor: P.bg,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 16px 40px",
    color: P.plum,
    position: "relative",
  },
  welcomeWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    width: "100%",
  },
  welcomeCard: {
    background: P.card,
    borderRadius: 20,
    padding: "48px 36px 40px",
    maxWidth: 420,
    width: "100%",
    textAlign: "center",
    boxShadow: "0 8px 40px rgba(74,46,63,0.08)",
    border: `1px solid ${P.border}`,
    animation: "fadeUp 0.6s ease-out",
  },
  floralRow: {
    fontSize: 28,
    color: P.blush,
    marginBottom: 8,
    letterSpacing: 8,
  },
  eyebrow: {
    fontFamily: fb,
    fontSize: 13,
    letterSpacing: "0.05em",
    color: P.plumLight,
    marginBottom: 8,
  },
  heroName: {
    fontFamily: ff,
    fontSize: 62,
    fontWeight: 600,
    color: P.deepRose,
    lineHeight: 1.05,
    marginBottom: 4,
  },
  parents: {
    fontFamily: ff,
    fontSize: 20,
    color: P.plum,
    fontStyle: "italic",
    marginBottom: 16,
  },
  welcomeSub: { fontSize: 14, color: P.plumLight, marginBottom: 24 },
  inputCol: { display: "flex", flexDirection: "column", gap: 12 },
  input: {
    fontFamily: fb,
    fontSize: 15,
    padding: "14px 18px",
    borderRadius: 12,
    border: `1.5px solid ${P.border}`,
    backgroundColor: P.bg,
    color: P.plum,
    outline: "none",
    textAlign: "center",
  },
  btnPrimary: {
    fontFamily: fb,
    fontSize: 15,
    fontWeight: 600,
    padding: "14px 24px",
    borderRadius: 12,
    border: "none",
    backgroundColor: P.deepRose,
    color: "#fff",
    transition: "all 0.2s",
    cursor: "pointer",
  },
  footNote: { fontSize: 12, color: P.plumLight, marginTop: 20, opacity: 0.7 },

  msgTitle: {
    fontFamily: ff,
    fontSize: 28,
    fontWeight: 600,
    color: P.deepRose,
    marginBottom: 16,
  },
  msgBody: {
    textAlign: "left",
    fontSize: 14.5,
    lineHeight: 1.7,
    color: P.plum,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  msgSign: {
    fontFamily: ff,
    fontSize: 16,
    fontStyle: "italic",
    color: P.plumLight,
    marginTop: 20,
    textAlign: "right",
  },
  msgSignNames: {
    fontFamily: ff,
    fontSize: 18,
    fontWeight: 600,
    color: P.deepRose,
    textAlign: "right",
    marginBottom: 4,
  },

  header: {
    textAlign: "center",
    padding: "32px 0 8px",
    width: "100%",
    maxWidth: 540,
  },
  hdrEye: {
    fontFamily: fb,
    fontSize: 12,
    letterSpacing: "0.08em",
    color: P.rose,
    marginBottom: 2,
  },
  hdrTitle: {
    fontFamily: ff,
    fontSize: 44,
    fontWeight: 600,
    color: P.deepRose,
    lineHeight: 1.1,
  },
  hdrParents: {
    fontFamily: ff,
    fontSize: 16,
    fontStyle: "italic",
    color: P.plumLight,
    marginTop: 2,
  },

  progressWrap: { width: "100%", maxWidth: 540, margin: "16px 0 12px" },
  progressRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progLabel: { fontSize: 13, color: P.plumLight },
  progCount: { fontSize: 13, fontWeight: 600, color: P.deepRose },
  progBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: P.border,
    overflow: "hidden",
  },
  progFill: {
    height: "100%",
    borderRadius: 3,
    background: `linear-gradient(90deg, ${P.blush}, ${P.deepRose})`,
    transition: "width 0.5s ease",
  },

  badge: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    backgroundColor: P.card,
    border: `1px solid ${P.border}`,
    borderRadius: 40,
    padding: "8px 16px",
    marginBottom: 12,
    fontSize: 14,
    maxWidth: 540,
    width: "100%",
  },
  changeBtn: {
    fontFamily: fb,
    fontSize: 12,
    color: P.rose,
    background: "none",
    border: "none",
    cursor: "pointer",
    textDecoration: "underline",
  },

  filterRow: {
    display: "flex",
    gap: 6,
    marginBottom: 16,
    maxWidth: 540,
    width: "100%",
  },
  filterBtn: {
    fontFamily: fb,
    fontSize: 12,
    fontWeight: 500,
    padding: "7px 14px",
    borderRadius: 20,
    border: `1px solid ${P.border}`,
    backgroundColor: P.card,
    color: P.plumLight,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  filterActive: {
    backgroundColor: P.deepRose,
    color: "#fff",
    borderColor: P.deepRose,
  },

  giftList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "100%",
    maxWidth: 540,
  },
  giftCard: {
    backgroundColor: P.card,
    borderRadius: 16,
    padding: "18px 20px",
    border: `1px solid ${P.border}`,
    animation: "fadeUp 0.4s ease-out",
  },
  giftTop: { display: "flex", alignItems: "flex-start", gap: 14 },
  giftEmoji: {
    fontSize: 24,
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: P.cream,
    borderRadius: 12,
    flexShrink: 0,
  },
  giftName: {
    fontFamily: ff,
    fontSize: 17,
    fontWeight: 600,
    color: P.plum,
    lineHeight: 1.3,
    marginBottom: 4,
  },
  linksRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 },
  linkChip: {
    fontSize: 11,
    color: P.rose,
    textDecoration: "none",
    padding: "3px 10px",
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    border: "1px solid #FAE0E0",
    whiteSpace: "nowrap",
  },
  noLink: {
    fontSize: 11,
    color: "#bbb",
    fontStyle: "italic",
    marginTop: 2,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: 20,
    flexShrink: 0,
    fontFamily: fb,
    marginTop: 2,
  },
  claimedBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    padding: "8px 12px",
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    fontSize: 13,
    color: "#777",
  },

  claimBtn: {
    fontFamily: fb,
    width: "100%",
    marginTop: 12,
    padding: "12px",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    border: `1.5px solid ${P.deepRose}`,
    backgroundColor: "transparent",
    color: P.deepRose,
    cursor: "pointer",
  },
  confirmBox: {
    marginTop: 12,
    padding: 14,
    backgroundColor: P.cream,
    borderRadius: 10,
  },
  confirmYes: {
    fontFamily: fb,
    flex: 1,
    padding: 10,
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    border: "none",
    backgroundColor: P.deepRose,
    color: "#fff",
    cursor: "pointer",
  },
  confirmNo: {
    fontFamily: fb,
    flex: 1,
    padding: 10,
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 8,
    border: `1px solid ${P.border}`,
    backgroundColor: P.card,
    color: P.plumLight,
    cursor: "pointer",
  },
  unclaimBtn: {
    fontFamily: fb,
    width: "100%",
    marginTop: 10,
    padding: 8,
    fontSize: 12,
    borderRadius: 8,
    border: `1px solid ${P.claimedBorder}`,
    backgroundColor: "transparent",
    color: "#7A9A7A",
    cursor: "pointer",
  },

  reminder: {
    maxWidth: 540,
    width: "100%",
    marginTop: 20,
    padding: "14px 18px",
    backgroundColor: P.cream,
    borderRadius: 12,
    border: `1px dashed ${P.border}`,
  },
  footer: { marginTop: 32, textAlign: "center" },

  toast: {
    position: "fixed",
    bottom: 30,
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: P.plum,
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 40,
    fontSize: 14,
    fontFamily: fb,
    fontWeight: 500,
    zIndex: 1001,
    boxShadow: "0 6px 20px rgba(74,46,63,0.2)",
    animation: "toastIn 0.3s ease-out",
    whiteSpace: "nowrap",
  },
};
