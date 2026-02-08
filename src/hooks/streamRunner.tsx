// ---------------------------------------------------------------------------
// Shared content store
// ---------------------------------------------------------------------------
// Module-level Map: lessonKey → { content accumulated so far, set of listener fns }.
// The queue's runStream writes here. OpenAIStreamingMarkdown subscribes here.
// Both can do so regardless of mount state.

interface StoreEntry {
    content: string;
    listeners: Set<(content: string) => void>;
}

const streamContentStore = new Map<string, StoreEntry>();

export function getOrCreateStore(key: string): StoreEntry {
    if (!streamContentStore.has(key)) {
        streamContentStore.set(key, { content: "", listeners: new Set() });
    }
    return streamContentStore.get(key)!;
}

export function clearStore(key: string) {
    streamContentStore.delete(key);
}

// ---------------------------------------------------------------------------
// Active-stream guard — prevents two fetches for the same key
// ---------------------------------------------------------------------------
const activeStreams = new Set<string>();

// ---------------------------------------------------------------------------
// runStream
// ---------------------------------------------------------------------------
export async function runStream(
    key: string,
    apiUrl: string,
    body: Record<string, unknown>,
    abortController: AbortController,
    onStarted: () => void,
    onDone: () => void,
    onError: (msg: string) => void,
) {
    if (activeStreams.has(key)) return;
    activeStreams.add(key);

    // Reset the store for this key so subscribers see a fresh stream
    const store = getOrCreateStore(key);
    store.content = "";
    store.listeners.forEach((fn) => fn(""));

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: abortController.signal,
        });

        if (!response.body) throw new Error("Stream response has no body.");

        if (!response.ok) {
            const respJson = await response.json();
            if (response.status === 402) {
                onError(respJson.detail || "Not enough credits");
                return;
            }
            throw new Error(
                respJson.detail || `Request failed with status: ${response.status}`,
            );
        }

        // Stream is live
        onStarted();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let buffer = "";

        const flush = () => {
            if (buffer) {
                store.content += buffer;
                buffer = "";
                store.listeners.forEach((fn) => fn(store.content));
            }
        };

        // Batch at ~10 fps
        const interval = setInterval(flush, 100);

        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) buffer += decoder.decode(value);
        }

        clearInterval(interval);
        flush(); // final flush

        onDone();
    } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
            // User-initiated cancel — not an error state
            onDone();
            return;
        }
        onError(err instanceof Error ? err.message : "Failed to stream content.");
    } finally {
        activeStreams.delete(key);
    }
}