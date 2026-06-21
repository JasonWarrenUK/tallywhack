import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// ── Design tokens ──
const FONT = "'Newsreader', 'Georgia', serif";
const SANS = "'DM Sans', 'Helvetica Neue', sans-serif";
const BG = "#F7F3EC";
const FG = "#3A3530";
const FG_DIM = "#9A9490";
const FG_MID = "#6E6862";
const ACCENT = "#7E6B91";
const ACCENT_LIGHT = "#9A89AA";
const ACCENT_BG = "#EDE8F2";
const SURFACE = "#EEEAD4";
const BORDER = "#DDD6CA";
const BORDER_LIGHT = "#E5DFD5";

const CAT_ACCENTS = [
  { color: "#8B5E5E", bg: "#F2E8E8", border: "#D4BFBF", label: "#6B4444" },
  { color: "#5E7B7B", bg: "#E8F0F0", border: "#BFCECE", label: "#44605F" },
  { color: "#7B6E4E", bg: "#F0EDE4", border: "#D0C9B0", label: "#5E5338" },
];

const INPUT_STYLE = {
  fontFamily: SANS,
  background: "#FDFCF9",
  border: `1px solid ${BORDER}`,
  borderRadius: "8px",
  color: FG,
  padding: "0.65rem 0.85rem",
  fontSize: "0.92rem",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const TIERS = [
  {
    id: 0,
    label: "Love it",
    emoji: "✦",
    color: "#8B5050",
    bg: "#F5ECEC",
    border: "#DECCCC",
  },
  {
    id: 1,
    label: "Strong yes",
    emoji: "↑",
    color: "#8A7040",
    bg: "#F3EFE4",
    border: "#DED5BB",
  },
  {
    id: 2,
    label: "It's nice",
    emoji: "·",
    color: "#607080",
    bg: "#ECF0F4",
    border: "#C8D0DA",
  },
  {
    id: 3,
    label: "Lukewarm",
    emoji: "↓",
    color: "#6A8068",
    bg: "#EDF2ED",
    border: "#C5D4C4",
  },
  {
    id: 4,
    label: "Not this one",
    emoji: "—",
    color: "#888078",
    bg: "#F0EEEC",
    border: "#D4D0CC",
  },
];

const PHASES = { SETUP: 0, RATING: 1, HANDOVER: 2, RESULTS: 3 };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=DM+Sans:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .r-btn { transition: all 0.15s ease; }
  .r-btn:hover:not(:disabled) { filter: brightness(0.96); transform: translateY(-1px); }
  .r-btn:active:not(:disabled) { transform: translateY(0); filter: brightness(0.93); }
  .tier-btn { transition: all 0.15s ease; }
  .tier-btn:hover:not(:disabled) { filter: brightness(0.96); transform: scale(1.012); }
  .tier-btn:active:not(:disabled) { transform: scale(0.988); }
  .pill { transition: all 0.15s ease; }
  .pill:hover { filter: brightness(0.95); }
  .chip { transition: all 0.15s ease; }
  .chip:hover { border-color: #B8B0A8 !important; }
  .entry-remove { transition: all 0.1s ease; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; }
  .entry-remove:hover { background: #F0E0E0; color: #8B5050 !important; }
  .result-row { transition: background 0.15s ease; }
  .result-row:hover { background: #F0ECE4 !important; }
  select.r-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%239A9490' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    padding-right: 2rem !important;
  }
  .handover-ring {
    width: 80px; height: 80px; border-radius: 50%;
    border: 2px solid ${BORDER};
    display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; font-weight: 300;
    animation: pulse-ring 2s ease-in-out infinite;
  }
  @keyframes pulse-ring {
    0%, 100% { border-color: ${BORDER}; box-shadow: 0 0 0 0 transparent; }
    50% { border-color: ${ACCENT_LIGHT}; box-shadow: 0 0 16px 2px ${ACCENT}15; }
  }
`;

// ── Utility ──
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tierCap(categorySize, tierId) {
  if (categorySize <= 0) return 0;
  if (tierId === 0) return Math.max(1, Math.round(categorySize * 0.22));
  if (tierId === 1) return Math.max(1, Math.round(categorySize * 0.28));
  return categorySize;
}

// ── Stable sub-components ──

function FadeCard({ children, keyProp }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true)),
    );
    return () => cancelAnimationFrame(t);
  }, [keyProp]);
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      }}
    >
      {children}
    </div>
  );
}

function Shell({ children, narrow }) {
  return (
    <div
      style={{
        fontFamily: SANS,
        background: BG,
        color: FG,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2.5rem 1.25rem 3rem",
        position: "relative",
      }}
    >
      <style>{CSS}</style>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: narrow ? "380px" : "440px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Card({ children, style: s }) {
  return (
    <div
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: "14px",
        padding: "1.5rem",
        width: "100%",
        ...s,
      }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children, right }) {
  return (
    <div
      style={{
        fontSize: "0.68rem",
        color: FG_DIM,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: "0.6rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <span>{children}</span>
      {right}
    </div>
  );
}

function AddLink({ onClick, children }) {
  return (
    <span
      className="r-btn"
      onClick={onClick}
      style={{
        cursor: "pointer",
        color: ACCENT,
        fontSize: "0.72rem",
        letterSpacing: "0.02em",
        textTransform: "none",
      }}
    >
      {children}
    </span>
  );
}

function Pill({ active, children, onClick, catAccent }) {
  const bg = active ? (catAccent ? catAccent.bg : ACCENT_BG) : "transparent";
  const bdr = active
    ? catAccent
      ? catAccent.border
      : ACCENT_LIGHT
    : "transparent";
  const clr = active ? (catAccent ? catAccent.label : ACCENT) : FG_DIM;
  return (
    <button
      className="pill"
      onClick={onClick}
      style={{
        fontFamily: SANS,
        background: bg,
        border: `1px solid ${bdr}`,
        borderRadius: "20px",
        color: clr,
        padding: "0.4rem 0.95rem",
        fontSize: "0.78rem",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function PrimaryBtn({ onClick, disabled, children }) {
  return (
    <button
      className="r-btn"
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: SANS,
        background: disabled ? BORDER_LIGHT : ACCENT,
        border: `1px solid ${disabled ? BORDER : ACCENT}`,
        borderRadius: "10px",
        color: disabled ? FG_DIM : "#fff",
        padding: "0.75rem 1.2rem",
        fontSize: "0.88rem",
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        fontWeight: 500,
      }}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children }) {
  return (
    <button
      className="r-btn"
      onClick={onClick}
      style={{
        fontFamily: SANS,
        background: "transparent",
        border: `1px solid ${BORDER}`,
        borderRadius: "10px",
        color: FG_MID,
        padding: "0.6rem 1rem",
        fontSize: "0.82rem",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Main component ──

export default function Reckoning() {
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [activityName, setActivityName] = useState("");
  const [participants, setParticipants] = useState(["", ""]);
  const [categories, setCategories] = useState([""]);
  const [entries, setEntries] = useState([]);
  const [newEntry, setNewEntry] = useState("");
  const [newCat, setNewCat] = useState(0);
  const [addingAs, setAddingAs] = useState(0);
  const [ratings, setRatings] = useState([]);
  const [currentRater, setCurrentRater] = useState(0);
  const [cardOrder, setCardOrder] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showCat, setShowCat] = useState(0);
  const entryInputRef = useRef(null);

  const activeCats = categories.filter((c) => c.trim() !== "");
  const hasCats = activeCats.length > 1;

  // Precompute category sizes
  const catSizes = useMemo(() => {
    const sizes = {};
    entries.forEach((e) => {
      sizes[e.cat] = (sizes[e.cat] || 0) + 1;
    });
    return sizes;
  }, [entries]);

  const startRating = useCallback(
    (raterIdx) => {
      setCurrentRater(raterIdx);
      setCardOrder(shuffle(entries.map((e) => e.id)));
      setCardIndex(0);
      setPhase(PHASES.RATING);
    },
    [entries],
  );

  const currentCard = cardOrder[cardIndex];
  const currentEntry = entries.find((e) => e.id === currentCard);

  // Tier counts scoped to the current entry's category
  const tierCountsForCurrentCat = useMemo(() => {
    const counts = {};
    TIERS.forEach((t) => (counts[t.id] = 0));
    if (!currentEntry) return counts;
    const r = ratings[currentRater] || {};
    const sameCatIds = new Set(
      entries.filter((e) => e.cat === currentEntry.cat).map((e) => e.id),
    );
    Object.entries(r).forEach(([eid, tid]) => {
      if (sameCatIds.has(eid)) {
        counts[tid] = (counts[tid] || 0) + 1;
      }
    });
    return counts;
  }, [ratings, currentRater, cardIndex, currentEntry, entries]);

  const assignTier = useCallback(
    (tierId) => {
      if (!currentEntry) return;
      const catSize = catSizes[currentEntry.cat] || 0;
      const cap = tierCap(catSize, tierId);
      if (tierCountsForCurrentCat[tierId] >= cap) return;
      setRatings((prev) => {
        const next = [...prev];
        next[currentRater] = { ...next[currentRater], [currentCard]: tierId };
        return next;
      });
      if (cardIndex < cardOrder.length - 1) {
        setCardIndex((i) => i + 1);
      } else {
        if (currentRater + 1 < participants.length) {
          setPhase(PHASES.HANDOVER);
        } else {
          setPhase(PHASES.RESULTS);
        }
      }
    },
    [
      currentRater,
      currentCard,
      currentEntry,
      cardIndex,
      cardOrder,
      catSizes,
      tierCountsForCurrentCat,
      participants.length,
    ],
  );

  const goBack = useCallback(() => {
    if (cardIndex > 0) {
      const prevCard = cardOrder[cardIndex - 1];
      setRatings((prev) => {
        const next = [...prev];
        const r = { ...next[currentRater] };
        delete r[prevCard];
        next[currentRater] = r;
        return next;
      });
      setCardIndex((i) => i - 1);
    }
  }, [cardIndex, cardOrder, currentRater]);

  const results = useMemo(() => {
    if (phase !== PHASES.RESULTS) return {};
    const catsToShow = hasCats ? activeCats : [null];
    const out = {};
    catsToShow.forEach((cat, ci) => {
      const key = cat ?? "__all";
      const filtered = cat ? entries.filter((e) => e.cat === ci) : entries;
      out[key] = filtered
        .map((e) => {
          const scores = participants.map((_, pi) => ratings[pi]?.[e.id] ?? 4);
          const worst = Math.max(...scores);
          const sum = scores.reduce((a, b) => a + b, 0);
          return { ...e, scores, worst, sum };
        })
        .sort((a, b) =>
          a.worst !== b.worst ? a.worst - b.worst : a.sum - b.sum,
        );
    });
    return out;
  }, [phase, entries, ratings, participants, activeCats, hasCats]);

  const resultKeys = Object.keys(results);
  const currentResultKey = hasCats
    ? (activeCats[showCat] ?? resultKeys[0])
    : resultKeys[0];
  const currentResults = results[currentResultKey] || [];

  const addEntry = () => {
    const trimmed = newEntry.trim();
    if (!trimmed) return;
    const catIdx = hasCats ? newCat : 0;
    if (
      entries.some(
        (e) =>
          e.text.toLowerCase() === trimmed.toLowerCase() && e.cat === catIdx,
      )
    )
      return;
    setEntries((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        text: trimmed,
        cat: catIdx,
        suggestedBy: addingAs,
      },
    ]);
    setNewEntry("");
    entryInputRef.current?.focus();
  };

  const removeEntry = (id) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));
  const canStart = entries.length >= 2;

  const addParticipant = () => {
    if (participants.length < 8) setParticipants((p) => [...p, ""]);
  };
  const removeParticipant = (i) => {
    if (participants.length > 2)
      setParticipants((p) => p.filter((_, j) => j !== i));
  };
  const setParticipant = (i, v) =>
    setParticipants((p) => p.map((x, j) => (j === i ? v : x)));

  const addCategory = () => {
    if (categories.length < 3) setCategories((c) => [...c, ""]);
  };
  const removeCategory = (i) => {
    if (categories.length > 1) {
      setCategories((c) => c.filter((_, j) => j !== i));
      setEntries((e) =>
        e
          .filter((x) => x.cat !== i)
          .map((x) => ({ ...x, cat: x.cat > i ? x.cat - 1 : x.cat })),
      );
      if (newCat >= categories.length - 1 && newCat > 0) setNewCat(newCat - 1);
    }
  };
  const setCategory = (i, v) =>
    setCategories((c) => c.map((x, j) => (j === i ? v : x)));

  const title = activityName.trim() || "Reckoning";
  const pName = (i) => participants[i]?.trim() || `Person ${i + 1}`;
  const getCatAccent = (ci) => CAT_ACCENTS[ci % CAT_ACCENTS.length];

  // ===== SETUP =====
  if (phase === PHASES.SETUP) {
    return (
      <Shell>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: "2rem",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            color: FG,
            marginBottom: "0.3rem",
          }}
        >
          Reckoning
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: FG_DIM,
            marginBottom: "2.5rem",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Fair consensus ranking for any group decision.
        </p>

        <div style={{ width: "100%", marginBottom: "2rem" }}>
          <input
            style={{
              ...INPUT_STYLE,
              fontFamily: FONT,
              fontSize: "1.15rem",
              fontWeight: 400,
              textAlign: "center",
              padding: "0.8rem 1rem",
              background: "transparent",
              borderColor: BORDER,
            }}
            placeholder="What are you ranking?"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
          />
        </div>

        <Card style={{ marginBottom: "1rem" }}>
          <SectionLabel
            right={
              participants.length < 8 && (
                <AddLink onClick={addParticipant}>+ add person</AddLink>
              )
            }
          >
            Participants
          </SectionLabel>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            {participants.map((p, i) => (
              <div
                key={i}
                style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}
              >
                <input
                  style={{ ...INPUT_STYLE, flex: 1 }}
                  placeholder={`Person ${i + 1}`}
                  value={p}
                  onChange={(e) => setParticipant(i, e.target.value)}
                />
                {participants.length > 2 && (
                  <span
                    className="entry-remove"
                    style={{
                      cursor: "pointer",
                      color: FG_DIM,
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                    onClick={() => removeParticipant(i)}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ marginBottom: "1rem" }}>
          <SectionLabel
            right={
              categories.length < 3 && (
                <AddLink onClick={addCategory}>+ add category</AddLink>
              )
            }
          >
            Categories{" "}
            <span
              style={{
                textTransform: "none",
                fontStyle: "italic",
                opacity: 0.5,
                letterSpacing: 0,
              }}
            >
              — optional
            </span>
          </SectionLabel>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}
          >
            {categories.map((c, i) => {
              const ca = getCatAccent(i);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "0.4rem",
                    alignItems: "center",
                  }}
                >
                  {hasCats && (
                    <div
                      style={{
                        width: "4px",
                        height: "28px",
                        borderRadius: "2px",
                        background: ca.color,
                        flexShrink: 0,
                        opacity: 0.6,
                      }}
                    />
                  )}
                  <input
                    style={{ ...INPUT_STYLE, flex: 1 }}
                    placeholder={`Category ${i + 1}`}
                    value={c}
                    onChange={(e) => setCategory(i, e.target.value)}
                  />
                  {categories.length > 1 && (
                    <span
                      className="entry-remove"
                      style={{
                        cursor: "pointer",
                        color: FG_DIM,
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}
                      onClick={() => removeCategory(i)}
                    >
                      ×
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <SectionLabel>Entries</SectionLabel>
          <div
            style={{
              display: "flex",
              gap: "0.35rem",
              marginBottom: "0.8rem",
              flexWrap: "wrap",
            }}
          >
            {participants.map((_, i) => (
              <Pill
                key={i}
                active={addingAs === i}
                onClick={() => setAddingAs(i)}
              >
                {pName(i)}'s
              </Pill>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.4rem",
              marginBottom: "0.5rem",
              alignItems: "stretch",
            }}
          >
            <input
              ref={entryInputRef}
              style={{ ...INPUT_STYLE, flex: 1, minWidth: 0 }}
              placeholder="Entry name"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEntry()}
            />
            {hasCats && (
              <select
                className="r-select"
                value={newCat}
                onChange={(e) => setNewCat(Number(e.target.value))}
                style={{
                  ...INPUT_STYLE,
                  width: "auto",
                  flex: "0 0 auto",
                  cursor: "pointer",
                  paddingRight: "2rem",
                }}
              >
                {categories.map((c, i) => (
                  <option key={i} value={i}>
                    {c.trim() || `Cat ${i + 1}`}
                  </option>
                ))}
              </select>
            )}
            <button
              className="r-btn"
              onClick={addEntry}
              style={{
                fontFamily: SANS,
                background: ACCENT,
                border: `1px solid ${ACCENT}`,
                borderRadius: "8px",
                color: "#fff",
                padding: "0 0.85rem",
                fontSize: "1.1rem",
                cursor: "pointer",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              +
            </button>
          </div>

          {(hasCats ? categories : [null]).map((cat, ci) => {
            const catEntries = hasCats
              ? entries.filter((e) => e.cat === ci)
              : entries;
            if (catEntries.length === 0) return null;
            const ca = getCatAccent(ci);
            return (
              <div key={ci} style={{ marginTop: "1rem" }}>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: hasCats ? ca.label : FG_DIM,
                    textTransform: hasCats ? "uppercase" : "none",
                    letterSpacing: hasCats ? "0.1em" : "0",
                    marginBottom: "0.5rem",
                  }}
                >
                  {hasCats
                    ? `${categories[ci]?.trim() || `Category ${ci + 1}`} · ${catEntries.length}`
                    : `${entries.length} entries`}
                </div>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}
                >
                  {catEntries.map((e) => {
                    const chipBg = hasCats ? ca.bg : "#FAF8F4";
                    const chipBorder = hasCats ? ca.border : BORDER;
                    return (
                      <span
                        key={e.id}
                        className="chip"
                        style={{
                          background: chipBg,
                          border: `1px solid ${chipBorder}`,
                          borderRadius: "8px",
                          padding: "0.4rem 0.5rem 0.4rem 0.7rem",
                          fontSize: "0.84rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {e.text}
                        <span
                          style={{
                            fontSize: "0.6rem",
                            color: FG_DIM,
                            opacity: 0.7,
                          }}
                        >
                          {pName(e.suggestedBy)[0]}
                        </span>
                        <span
                          className="entry-remove"
                          style={{
                            cursor: "pointer",
                            color: FG_DIM,
                            fontSize: "0.75rem",
                          }}
                          onClick={() => removeEntry(e.id)}
                        >
                          ×
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ marginTop: "1.5rem" }}>
            <PrimaryBtn
              onClick={() => {
                setRatings(participants.map(() => ({})));
                startRating(0);
              }}
              disabled={!canStart}
            >
              Start — {pName(0)} goes first
            </PrimaryBtn>
          </div>
        </Card>

        <div
          style={{ marginTop: "1.5rem", width: "100%", padding: "0 0.25rem" }}
        >
          <details
            style={{ fontSize: "0.76rem", color: FG_DIM, lineHeight: 1.65 }}
          >
            <summary
              style={{
                cursor: "pointer",
                marginBottom: "0.5rem",
                color: FG_MID,
              }}
            >
              How this works
            </summary>
            <p>
              Each participant independently sorts every entry into five tiers.
              Entries appear one at a time in random order — gut reactions, not
              strategy.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              The top two tiers are{" "}
              <strong style={{ color: FG }}>capped</strong> — "Love it" fits
              roughly 1 in 5, "Strong yes" roughly 1 in 4. Caps are calculated
              per category, so a category with fewer entries has proportionally
              fewer top-tier slots. This is what stops you putting all your own
              suggestions at the top.
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              Results use a{" "}
              <strong style={{ color: FG }}>consensus floor</strong>: an entry
              ranks by whoever rated it <em>lowest</em>. Everyone has implicit
              veto power.
            </p>
          </details>
        </div>
      </Shell>
    );
  }

  // ===== RATING =====
  if (phase === PHASES.RATING && currentEntry) {
    const total = entries.length;
    const progress = cardIndex + 1;
    const pct = (progress / total) * 100;
    const catLabel = hasCats
      ? categories[currentEntry.cat]?.trim() || `Cat ${currentEntry.cat + 1}`
      : null;
    const ca = getCatAccent(currentEntry.cat);
    const currentCatSize = catSizes[currentEntry.cat] || 0;

    return (
      <Shell narrow>
        <div
          style={{
            fontSize: "0.72rem",
            color: FG_MID,
            marginBottom: "0.3rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 500,
          }}
        >
          {pName(currentRater)}
        </div>
        <div
          style={{ fontSize: "0.7rem", color: FG_DIM, marginBottom: "1.5rem" }}
        >
          {progress} of {total}
        </div>

        <div
          style={{
            width: "100%",
            height: "4px",
            background: BORDER_LIGHT,
            borderRadius: "2px",
            marginBottom: "2rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              borderRadius: "2px",
              background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_LIGHT})`,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <FadeCard keyProp={currentCard}>
          <Card
            style={{
              textAlign: "center",
              padding: "2rem 1.5rem 1.5rem",
              position: "relative",
            }}
          >
            {catLabel && (
              <div
                style={{
                  position: "absolute",
                  top: "0.75rem",
                  right: "1rem",
                  fontSize: "0.62rem",
                  color: ca.label,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  background: ca.bg,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "4px",
                  border: `1px solid ${ca.border}`,
                }}
              >
                {catLabel}
              </div>
            )}
            <div
              style={{
                fontFamily: FONT,
                fontSize: "2.2rem",
                fontWeight: 300,
                letterSpacing: "-0.02em",
                color: FG,
                marginBottom: "2.2rem",
                marginTop: "0.5rem",
                lineHeight: 1.2,
              }}
            >
              {currentEntry.text}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem",
              }}
            >
              {TIERS.map((tier) => {
                const count = tierCountsForCurrentCat[tier.id] || 0;
                const cap = tierCap(currentCatSize, tier.id);
                const full = count >= cap;
                return (
                  <button
                    key={tier.id}
                    className="tier-btn"
                    disabled={full}
                    onClick={() => assignTier(tier.id)}
                    style={{
                      fontFamily: SANS,
                      background: full ? BORDER_LIGHT : tier.bg,
                      border: `1px solid ${full ? BORDER : tier.border}`,
                      borderRadius: "10px",
                      color: full ? "#C0BAB4" : tier.color,
                      padding: "0.7rem 1rem",
                      fontSize: "0.88rem",
                      cursor: full ? "not-allowed" : "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      opacity: full ? 0.5 : 1,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                        {tier.emoji}
                      </span>
                      {tier.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        opacity: 0.45,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {count}
                      {cap < currentCatSize ? `/${cap}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            {cardIndex > 0 && (
              <button
                className="r-btn"
                onClick={goBack}
                style={{
                  fontFamily: SANS,
                  background: "transparent",
                  border: "none",
                  color: FG_DIM,
                  fontSize: "0.76rem",
                  cursor: "pointer",
                  marginTop: "1.2rem",
                  padding: "0.4rem 0.8rem",
                }}
              >
                ← back
              </button>
            )}
          </Card>
        </FadeCard>
      </Shell>
    );
  }

  // ===== HANDOVER =====
  if (phase === PHASES.HANDOVER) {
    const nextRater = currentRater + 1;
    return (
      <Shell narrow>
        <div style={{ marginBottom: "2rem", marginTop: "1rem" }}>
          <div
            className="handover-ring"
            style={{ fontFamily: FONT, color: FG_MID }}
          >
            {nextRater + 1}
          </div>
        </div>
        <h2
          style={{
            fontFamily: FONT,
            fontSize: "1.4rem",
            fontWeight: 400,
            color: FG,
            marginBottom: "0.4rem",
            letterSpacing: "-0.02em",
          }}
        >
          Pass it over
        </h2>
        <p
          style={{
            fontSize: "0.82rem",
            color: FG_DIM,
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: "0.3rem",
          }}
        >
          {pName(currentRater)} is done.
        </p>
        <p
          style={{
            fontSize: "0.82rem",
            color: FG_MID,
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: "2rem",
          }}
        >
          <strong style={{ color: FG }}>{pName(nextRater)}</strong> — you're up.
          Person {nextRater + 1} of {participants.length}.
        </p>
        <p
          style={{
            fontSize: "0.72rem",
            color: FG_DIM,
            textAlign: "center",
            marginBottom: "2rem",
            fontStyle: "italic",
          }}
        >
          Don't discuss your choices yet.
        </p>
        <div style={{ width: "100%" }}>
          <PrimaryBtn onClick={() => startRating(nextRater)}>
            I'm {pName(nextRater)} — start
          </PrimaryBtn>
        </div>
      </Shell>
    );
  }

  // ===== RESULTS =====
  if (phase === PHASES.RESULTS) {
    const manyRaters = participants.length > 3;
    return (
      <Shell>
        <h1
          style={{
            fontFamily: FONT,
            fontSize: "2rem",
            fontWeight: 300,
            letterSpacing: "-0.03em",
            color: FG,
            marginBottom: "0.3rem",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: FG_DIM,
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          Ranked by consensus — everyone must agree.
        </p>

        {hasCats && activeCats.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: "0.35rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {activeCats.map((c, i) => (
              <Pill
                key={i}
                active={showCat === i}
                onClick={() => setShowCat(i)}
                catAccent={getCatAccent(i)}
              >
                {c}
              </Pill>
            ))}
          </div>
        )}

        <Card style={{ padding: "0.75rem" }}>
          {currentResults.length === 0 ? (
            <p
              style={{
                color: FG_DIM,
                textAlign: "center",
                fontSize: "0.85rem",
                padding: "1rem",
              }}
            >
              No entries in this category.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "2px" }}
            >
              {currentResults.map((e, i) => {
                const isTop = e.worst <= 1;
                const maxDiff = Math.max(...e.scores) - Math.min(...e.scores);
                const consensusTier = TIERS[e.worst];
                const ca = hasCats ? getCatAccent(e.cat) : null;
                const leftColor = isTop
                  ? ca
                    ? ca.color
                    : ACCENT
                  : "transparent";
                return (
                  <div
                    key={e.id}
                    className="result-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: manyRaters ? "0.7rem 0.6rem" : "0.6rem 0.7rem",
                      borderRadius: "8px",
                      background: isTop
                        ? ca
                          ? ca.bg
                          : ACCENT_BG
                        : "transparent",
                      borderLeft: `3px solid ${leftColor}80`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: isTop ? (ca ? ca.color : ACCENT) : FG_DIM,
                        width: "1.4rem",
                        textAlign: "center",
                        flexShrink: 0,
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: isTop ? 500 : 400,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: FONT,
                          fontSize: isTop ? "1.1rem" : "0.95rem",
                          color: isTop ? FG : FG_MID,
                          fontWeight: isTop ? 400 : 300,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {e.text}
                        {maxDiff >= 3 && (
                          <span
                            style={{
                              marginLeft: "0.4rem",
                              fontSize: "0.65rem",
                            }}
                            title="Big disagreement"
                          >
                            ⚡
                          </span>
                        )}
                      </div>
                      {manyRaters && (
                        <div
                          style={{
                            display: "flex",
                            gap: "0.25rem",
                            marginTop: "0.3rem",
                            flexWrap: "wrap",
                          }}
                        >
                          {e.scores.map((s, pi) => {
                            const t = TIERS[s];
                            return (
                              <span
                                key={pi}
                                style={{
                                  fontSize: "0.58rem",
                                  padding: "0.1rem 0.4rem",
                                  borderRadius: "3px",
                                  background: t.bg,
                                  color: t.color,
                                  border: `1px solid ${t.border}`,
                                  lineHeight: 1.4,
                                }}
                                title={`${pName(pi)}: ${t.label}`}
                              >
                                {pName(pi).slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {!manyRaters && (
                      <div
                        style={{
                          display: "flex",
                          gap: "0.25rem",
                          flexShrink: 0,
                        }}
                      >
                        {e.scores.map((s, pi) => {
                          const t = TIERS[s];
                          return (
                            <span
                              key={pi}
                              style={{
                                fontSize: "0.6rem",
                                padding: "0.15rem 0.4rem",
                                borderRadius: "4px",
                                background: t.bg,
                                color: t.color,
                                border: `1px solid ${t.border}`,
                              }}
                              title={`${pName(pi)}: ${t.label}`}
                            >
                              {pName(pi)[0]}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div style={{ marginTop: "1rem", width: "100%", padding: "0 0.25rem" }}>
          <div
            style={{
              fontSize: "0.65rem",
              color: FG_DIM,
              marginBottom: "0.4rem",
            }}
          >
            Tiers
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
            {TIERS.map((t) => (
              <span
                key={t.id}
                style={{
                  fontSize: "0.62rem",
                  padding: "0.18rem 0.5rem",
                  borderRadius: "4px",
                  background: t.bg,
                  color: t.color,
                  border: `1px solid ${t.border}`,
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "0.5rem" }}>
          <GhostBtn
            onClick={() => {
              setRatings([]);
              setPhase(PHASES.SETUP);
            }}
          >
            Start over
          </GhostBtn>
          <GhostBtn
            onClick={() => {
              setRatings(participants.map(() => ({})));
              startRating(0);
            }}
          >
            Re-rank
          </GhostBtn>
        </div>
      </Shell>
    );
  }

  return null;
}
