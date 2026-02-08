import { useState, useRef, useCallback, useEffect } from "react";
import { runStream } from "./streamRunner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type GenerationStatus =
    | "queued"       // waiting for a slot
    | "generating"   // stream is live
    | "done"         // finished successfully
    | "error";       // failed

export interface QueueEntry {
    lessonKey: string;
    lessonTitle: string;
    status: GenerationStatus;
    error?: string;
    abortController: AbortController;
    /** Stored so the queue can self-start the stream without a mounted component */
    apiUrl: string;
    body: Record<string, unknown>;
}

export interface GenerationQueue {
    entries: QueueEntry[];
    enqueue: (lessonKey: string, lessonTitle: string, apiUrl: string, body: Record<string, unknown>) => boolean;
    getStatus: (lessonKey: string) => GenerationStatus | null;
    getAbortController: (lessonKey: string) => AbortController | null;
    remove: (lessonKey: string) => void;
}

const MAX_CONCURRENT = 3;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGenerationQueue(): GenerationQueue {
    // The single source of truth. We mutate this ref and then call setTick()
    // to push a new snapshot into state for rendering.
    const queueRef = useRef<Map<string, QueueEntry>>(new Map());

    // This is the ONLY piece of state. Every mutation ends with setTick(n => n+1).
    // Everything the UI needs is derived from queueRef at render time.
    const [tick, setTick] = useState(0);

    const snapshot = useCallback(() => setTick((n) => n + 1), []);

    // ---------------------------------------------------------------------------
    // How many are actively streaming right now
    // ---------------------------------------------------------------------------
    const countGenerating = useCallback(() => {
        let n = 0;
        queueRef.current.forEach((e) => { if (e.status === "generating") n++; });
        return n;
    }, []);

    // ---------------------------------------------------------------------------
    // enqueue — always accepts. Unlimited items can wait in "queued".
    // ---------------------------------------------------------------------------
    const enqueue = useCallback((
        lessonKey: string,
        lessonTitle: string,
        apiUrl: string,
        body: Record<string, unknown>,
    ): boolean => {
        const existing = queueRef.current.get(lessonKey);

        // Already queued or streaming — ignore (idempotent, not an error)
        if (existing && (existing.status === "queued" || existing.status === "generating")) {
            return false;
        }

        // Clean up any previous terminal entry so re-enqueue works
        if (existing) {
            existing.abortController.abort();
            queueRef.current.delete(lessonKey);
        }

        // Hard cap: count active (queued + generating) entries. Reject if at limit.
        let activeCount = 0;
        queueRef.current.forEach((e) => {
            if (e.status === "queued" || e.status === "generating") activeCount++;
        });
        if (activeCount >= MAX_CONCURRENT) return false;

        queueRef.current.set(lessonKey, {
            lessonKey,
            lessonTitle,
            status: "queued",
            abortController: new AbortController(),
            apiUrl,
            body,
        });

        snapshot();
        return true;
    }, [snapshot]);

    // ---------------------------------------------------------------------------
    // Internal: start the next queued item if a slot is free.
    // Called after every tick so newly-queued or newly-freed slots get picked up.
    // ---------------------------------------------------------------------------
    useEffect(() => {
        const generating = countGenerating();
        if (generating >= MAX_CONCURRENT) return;

        // Find the first queued entry (insertion order is preserved by Map)
        let target: QueueEntry | null = null;
        queueRef.current.forEach((e) => {
            if (!target && e.status === "queued") target = e;
        });
        if (!target) return;

        const entry = target as QueueEntry; // narrow

        // Transition to generating immediately so we don't double-start on the next tick
        entry.status = "generating";
        snapshot(); // this will re-run this effect, potentially starting another if slots remain

        // Fire the stream. Callbacks mutate the entry and snapshot.
        runStream(
            entry.lessonKey,
            entry.apiUrl,
            entry.body,
            entry.abortController,
            // onStarted — already marked generating above, nothing extra needed
            () => { },
            // onDone
            () => {
                const e = queueRef.current.get(entry.lessonKey);
                if (e) { e.status = "done"; }
                snapshot();
            },
            // onError
            (msg: string) => {
                const e = queueRef.current.get(entry.lessonKey);
                if (e) { e.status = "error"; e.error = msg; }
                snapshot();
            },
        );
    }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps
    // Re-check on every tick. Intentional — tick is our only signal.

    // ---------------------------------------------------------------------------
    // Public reads
    // ---------------------------------------------------------------------------
    const getStatus = useCallback((lessonKey: string): GenerationStatus | null => {
        return queueRef.current.get(lessonKey)?.status ?? null;
    }, []);

    const getAbortController = useCallback((lessonKey: string): AbortController | null => {
        return queueRef.current.get(lessonKey)?.abortController ?? null;
    }, []);

    const remove = useCallback((lessonKey: string) => {
        const entry = queueRef.current.get(lessonKey);
        if (entry) {
            entry.abortController.abort();
            queueRef.current.delete(lessonKey);
            snapshot();
        }
    }, [snapshot]);

    // ---------------------------------------------------------------------------
    // Derived entries for the UI — recalculated every render (tick changed).
    // Only surface non-done items so the bar disappears once everything finishes.
    // ---------------------------------------------------------------------------
    const entries: QueueEntry[] = [];
    queueRef.current.forEach((e) => {
        if (e.status !== "done") {
            entries.push({ ...e });
        }
    });

    return { entries, enqueue, getStatus, getAbortController, remove };
}