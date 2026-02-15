"use client";

import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEY } from "@/lib/config";
import { defaultPrompts } from "@/lib/prompts";
import type { Direction, LoopState, PromptOverrides } from "@/lib/schemas";

const PROMPT_KEYS = Object.keys(defaultPrompts) as Array<keyof PromptOverrides>;

export default function HomePage() {
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [directions, setDirections] = useState<Direction[]>([]);
  const [picked, setPicked] = useState<"A" | "B" | "C" | "">("");
  const [rounds, setRounds] = useState(4);
  const [twist, setTwist] = useState<"약" | "중" | "강">("중");
  const [editMode, setEditMode] = useState<"균형" | "구조" | "문장">("균형");
  const [state, setState] = useState<LoopState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [overrides, setOverrides] = useState<PromptOverrides>({});
  const [importText, setImportText] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setOverrides(JSON.parse(raw));
    } catch {
      setOverrides({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const mergedPrompts = useMemo(() => ({ ...defaultPrompts, ...overrides }), [overrides]);

  async function postJson<T>(url: string, body: unknown): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data as T;
  }

  async function generateDirections() {
    setLoading(true);
    setError("");
    try {
      const data = await postJson<{ directions: Direction[] }>("/api/directions", { genre, theme, prompts: overrides });
      setDirections(data.directions);
      setPicked("");
      setState(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "카드 생성 실패");
    } finally {
      setLoading(false);
    }
  }

  async function startLoop() {
    if (!picked) return;
    setLoading(true);
    setError("");
    try {
      const data = await postJson<{ state: LoopState }>("/api/loop/init", {
        genre,
        theme,
        pickedDirectionId: picked,
        directions,
        rounds,
        twist,
        editMode,
        prompts: overrides,
      });
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "루프 시작 실패");
    } finally {
      setLoading(false);
    }
  }

  async function nextRound() {
    if (!state || state.done) return;
    setLoading(true);
    setError("");
    try {
      const data = await postJson<{ state: LoopState }>("/api/loop/step", { state, prompts: overrides });
      setState(data.state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "다음 라운드 실패");
    } finally {
      setLoading(false);
    }
  }

  async function autoComplete() {
    if (!state) return;
    let current = state;
    setLoading(true);
    setError("");
    try {
      while (!current.done) {
        const data = await postJson<{ state: LoopState }>("/api/loop/step", { state: current, prompts: overrides });
        current = data.state;
        setState(current);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "자동 완료 실패");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setDirections([]);
    setPicked("");
    setState(null);
    setError("");
  }

  function importPrompts() {
    try {
      const parsed = JSON.parse(importText) as PromptOverrides;
      setOverrides(parsed);
    } catch {
      setError("프롬프트 JSON 형식이 올바르지 않습니다.");
    }
  }

  return (
    <main>
      <h1>Short-Story A/B Studio</h1>
      <div className="panel">
        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Genre</label>
            <input value={genre} onChange={(e) => setGenre(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label>Theme</label>
            <input value={theme} onChange={(e) => setTheme(e.target.value)} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <button onClick={generateDirections} disabled={loading || !genre || !theme}>Generate direction cards</button>
          <button onClick={() => setShowSettings((s) => !s)}>Settings</button>
          <button onClick={resetAll}>Reset</button>
        </div>
      </div>

      {showSettings && (
        <div className="panel">
          <h3>Prompt Settings</h3>
          {PROMPT_KEYS.map((key) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label>{key}</label>
              <textarea
                rows={5}
                value={(mergedPrompts[key] as string) ?? ""}
                onChange={(e) => setOverrides((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="row">
            <button onClick={() => setOverrides({})}>Reset to defaults</button>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify(overrides, null, 2))}>Copy export JSON</button>
          </div>
          <label style={{ marginTop: 12 }}>Import JSON</label>
          <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} />
          <button onClick={importPrompts}>Import</button>
        </div>
      )}

      {!!directions.length && (
        <div className="panel">
          <h3>Directions</h3>
          <div className="row">
            {directions.map((d) => (
              <div key={d.id} className={`card ${picked === d.id ? "selected" : ""}`}>
                <strong>{d.id}</strong>
                <p>style: {d.style}</p>
                <p>hook: {d.hook}</p>
                <p>conflict: {d.conflict}</p>
                <p>endingMood: {d.endingMood}</p>
                <button onClick={() => setPicked(d.id)}>Choose {d.id}</button>
              </div>
            ))}
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <div>
              <label>Rounds (2-10)</label>
              <input type="number" min={2} max={10} value={rounds} onChange={(e) => setRounds(Number(e.target.value))} />
            </div>
            <div>
              <label>Twist strength</label>
              <select value={twist} onChange={(e) => setTwist(e.target.value as "약" | "중" | "강")}>
                <option>약</option>
                <option>중</option>
                <option>강</option>
              </select>
            </div>
            <div>
              <label>Edit mode</label>
              <select value={editMode} onChange={(e) => setEditMode(e.target.value as "균형" | "구조" | "문장")}>
                <option>균형</option>
                <option>구조</option>
                <option>문장</option>
              </select>
            </div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button onClick={startLoop} disabled={!picked || loading}>Start loop</button>
            <button onClick={nextRound} disabled={!state || state.done || loading}>Next round</button>
            <button onClick={autoComplete} disabled={!state || state.done || loading}>Auto-complete</button>
            <button onClick={generateDirections} disabled={loading}>Regenerate cards</button>
          </div>
        </div>
      )}

      {state && (
        <div className="panel">
          <h3>Loop Output</h3>
          <p>Round {state.roundNow} / {state.roundsTotal} · phase: {state.phase}</p>
          <label>Current draft</label>
          <pre>{state.draft}</pre>

          {state.history[state.history.length - 1]?.critic && (
            <>
              <label>Latest critic output</label>
              <pre>{JSON.stringify(state.history[state.history.length - 1].critic, null, 2)}</pre>
            </>
          )}

          {state.done && state.final && (
            <>
              <h4>Final Story</h4>
              <pre>{state.final.story}</pre>
              <p><strong>Titles</strong></p>
              <ul>{state.final.titles.map((t) => <li key={t}>{t}</li>)}</ul>
              <p><strong>Taglines</strong></p>
              <ul>{state.final.taglines.map((t) => <li key={t}>{t}</li>)}</ul>
            </>
          )}

          <label>Change log by round</label>
          <pre>{JSON.stringify(state.history, null, 2)}</pre>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p className="small">보안: API 키는 서버 라우트에서만 사용됩니다.</p>
    </main>
  );
}
