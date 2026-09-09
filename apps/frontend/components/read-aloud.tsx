"use client";
import { useEffect, useRef, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { useLocale, useT } from "@/lib/i18n";

export function ReadAloud({ text }: { text: string }) {
  const locale = useLocale((state) => state.locale);
  return <Reader key={`${locale}:${text}`} text={text} />;
}

function Reader({ text }: { text: string }) {
  const locale = useLocale((state) => state.locale);
  const t = useT();
  const [speaking, setSpeaking] = useState(false);
  const [message, setMessage] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [preparing, setPreparing] = useState(false);
  const player = useRef<HTMLAudioElement>(null);
  const generation = useRef(0);
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const current = useRef<SpeechSynthesisUtterance | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function cancel() {
    generation.current += 1;
    if (timer.current) clearTimeout(timer.current);
    current.current = null;
    window.speechSynthesis?.cancel();
  }

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth)
      return () => {
        generation.current += 1;
      };
    const loadVoices = () => {
      voices.current = synth.getVoices();
    };
    loadVoices();
    synth.addEventListener("voiceschanged", loadVoices);
    return () => {
      synth.removeEventListener("voiceschanged", loadVoices);
      cancel();
    };
  }, []);

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl],
  );

  async function serverAudio() {
    cancel();
    const request = generation.current;
    setSpeaking(false);
    setPreparing(true);
    setMessage(t("preparingAudio"));
    try {
      const blob = await apiFetch<Blob>("/accessibility/speech", {
        method: "POST",
        body: JSON.stringify({ text, locale }),
      });
      if (generation.current !== request) return;
      setAudioUrl(URL.createObjectURL(blob));
      setMessage(t("audioReady"));
    } catch {
      if (generation.current === request) setMessage(t("voiceUnavailable"));
    } finally {
      if (generation.current === request) setPreparing(false);
    }
  }

  function read() {
    if (audioUrl && player.current) {
      if (speaking) player.current.pause();
      else void player.current.play().catch(() => setMessage(t("audioReady")));
      return;
    }
    const synth = window.speechSynthesis;
    if (!synth || typeof SpeechSynthesisUtterance === "undefined") {
      void serverAudio();
      return;
    }
    if (speaking) {
      cancel();
      setSpeaking(false);
      return;
    }
    const available = synth.getVoices();
    if (available.length) voices.current = available;
    const matching = voices.current.filter(
      (voice) => voice.lang.toLowerCase().split(/[-_]/)[0] === locale,
    );
    const voice =
      matching.find((item) => item.lang.toLowerCase() === `${locale}-in`) ??
      matching.find((item) => item.default) ??
      matching[0];
    if (voices.current.length && !voice) {
      void serverAudio();
      return;
    }
    cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Some browsers load voices lazily. Keep speak inside the user's click and
    // let the browser select by language when its voice list is still empty.
    utterance.lang = voice?.lang ?? `${locale}-IN`;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    current.current = utterance;
    utterance.onstart = () => {
      if (timer.current) clearTimeout(timer.current);
    };
    utterance.onend = () => {
      if (current.current !== utterance) return;
      if (timer.current) clearTimeout(timer.current);
      current.current = null;
      setSpeaking(false);
    };
    utterance.onerror = () => {
      if (current.current !== utterance) return;
      void serverAudio();
    };
    setSpeaking(true);
    setMessage("");
    timer.current = setTimeout(() => {
      if (current.current !== utterance) return;
      void serverAudio();
    }, 8000);
    try {
      synth.speak(utterance);
      if (synth.paused) synth.resume();
    } catch {
      void serverAudio();
    }
  }
  return (
    <div className="readAloud">
      <button
        type="button"
        className="button secondary small"
        disabled={preparing}
        onClick={read}
      >
        {speaking ? <Square size={15} /> : <Volume2 size={15} />}
        {t(speaking ? "stopReading" : "readAloud")}
      </button>
      <small role="status">{message || t("voiceNote")}</small>
      {audioUrl && (
        <audio
          ref={player}
          src={audioUrl}
          controls
          autoPlay
          aria-label={t("readAloud")}
          onPlay={() => setSpeaking(true)}
          onPause={() => setSpeaking(false)}
          onEnded={() => setSpeaking(false)}
          onError={() => {
            setSpeaking(false);
            setMessage(t("voiceUnavailable"));
          }}
        />
      )}
    </div>
  );
}
