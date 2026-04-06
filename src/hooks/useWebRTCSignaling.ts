/**
 * WebRTC Signaling — polling-based via REST backend
 * Replaces Supabase Realtime with /telemedicine/sessions/:id/signals endpoints
 */
import { useEffect, useCallback, useRef } from "react";

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const FETCH_OPTS: RequestInit = { credentials: 'include', headers: { 'Content-Type': 'application/json' } };

interface SignalMessage {
  type: "offer" | "answer" | "ice-candidate";
  data: RTCSessionDescriptionInit | RTCIceCandidateInit;
}

interface UseWebRTCSignalingProps {
  sessionId: string;
  localUserId: string;
  onSignalReceived: (signal: SignalMessage) => void;
  enabled: boolean;
}

export function useWebRTCSignaling({
  sessionId,
  localUserId,
  onSignalReceived,
  enabled,
}: UseWebRTCSignalingProps) {
  // Track the timestamp of the last signal we've seen so we don't re-process
  const lastSeenRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendSignal = useCallback(
    async (signal: SignalMessage) => {
      if (!sessionId || !localUserId) {
        console.error("[WebRTC] Missing sessionId or localUserId");
        return;
      }
      console.log(`[WebRTC] Sending signal: ${signal.type}`);
      try {
        await fetch(`${API_BASE}/telemedicine/sessions/${sessionId}/signal`, {
          ...FETCH_OPTS,
          method: 'POST',
          body: JSON.stringify({
            sender_id:   localUserId,
            signal_type: signal.type,
            signal_data: signal.data,
          }),
        });
      } catch (err) {
        console.error("[WebRTC] Failed to send signal:", err);
      }
    },
    [sessionId, localUserId]
  );

  // Poll for new signals every 1.5 s
  useEffect(() => {
    if (!enabled || !sessionId || !localUserId) return;

    const poll = async () => {
      try {
        const p = new URLSearchParams({
          since:          lastSeenRef.current,
          exclude_sender: localUserId,
        });
        const res  = await fetch(`${API_BASE}/telemedicine/sessions/${sessionId}/signals?${p}`, FETCH_OPTS);
        if (!res.ok) return;
        const json = await res.json();
        const signals: Array<{ signal_type: string; signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit; created_at: string }> =
          json.data ?? [];

        for (const sig of signals) {
          console.log(`[WebRTC] Received signal: ${sig.signal_type}`);
          onSignalReceived({ type: sig.signal_type as SignalMessage["type"], data: sig.signal_data });
          if (sig.created_at > lastSeenRef.current) {
            lastSeenRef.current = sig.created_at;
          }
        }
      } catch (err) {
        console.error("[WebRTC] Poll error:", err);
      }
    };

    console.log(`[WebRTC] Starting polling for session: ${sessionId}`);
    intervalRef.current = setInterval(poll, 1500);

    return () => {
      console.log("[WebRTC] Stopping polling");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, sessionId, localUserId, onSignalReceived]);

  return { sendSignal };
}

// ─── RTCPeerConnection helpers (unchanged) ────────────────────────────────────

export function createPeerConnection(
  onTrack: (event: RTCTrackEvent) => void,
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
): RTCPeerConnection {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  });
  pc.ontrack = onTrack;
  pc.onicecandidate = (e) => { if (e.candidate) onIceCandidate(e.candidate); };
  pc.onconnectionstatechange = () => onConnectionStateChange(pc.connectionState);
  return pc;
}

export async function createOffer(pc: RTCPeerConnection): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function createAnswer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function setRemoteAnswer(pc: RTCPeerConnection, answer: RTCSessionDescriptionInit): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function addIceCandidate(pc: RTCPeerConnection, candidate: RTCIceCandidateInit): Promise<void> {
  if (pc.remoteDescription) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
}
