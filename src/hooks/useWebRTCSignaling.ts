import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Send signal to other participant
  const sendSignal = useCallback(
    async (signal: SignalMessage) => {
      if (!sessionId || !localUserId) {
        console.error("[WebRTC] Missing sessionId or localUserId");
        return;
      }

      console.log(`[WebRTC] Sending signal: ${signal.type}`);

      try {
        const { error } = await supabase.from("webrtc_signals").insert({
          session_id: sessionId,
          sender_id: localUserId,
          signal_type: signal.type,
          signal_data: signal.data as unknown as Record<string, unknown>,
        } as any);

        if (error) {
          console.error("[WebRTC] Error sending signal:", error);
        }
      } catch (err) {
        console.error("[WebRTC] Failed to send signal:", err);
      }
    },
    [sessionId, localUserId]
  );

  // Subscribe to signals from other participants
  useEffect(() => {
    if (!enabled || !sessionId || !localUserId) {
      return;
    }

    console.log(`[WebRTC] Subscribing to signals for session: ${sessionId}`);

    const channel = supabase
      .channel(`webrtc-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "webrtc_signals",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newSignal = payload.new as {
            sender_id: string;
            signal_type: string;
            signal_data: RTCSessionDescriptionInit | RTCIceCandidateInit;
          };

          // Ignore signals from self
          if (newSignal.sender_id === localUserId) {
            return;
          }

          console.log(`[WebRTC] Received signal: ${newSignal.signal_type}`);

          onSignalReceived({
            type: newSignal.signal_type as SignalMessage["type"],
            data: newSignal.signal_data,
          });
        }
      )
      .subscribe((status) => {
        console.log(`[WebRTC] Channel status: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      console.log("[WebRTC] Unsubscribing from signals");
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, sessionId, localUserId, onSignalReceived]);

  // Cleanup old signals when component unmounts
  useEffect(() => {
    return () => {
      // Note: Cleanup is handled by the database function cleanup_old_webrtc_signals
    };
  }, []);

  return { sendSignal };
}

// Utility to create and manage RTCPeerConnection
export function createPeerConnection(
  onTrack: (event: RTCTrackEvent) => void,
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onConnectionStateChange: (state: RTCPeerConnectionState) => void
): RTCPeerConnection {
  const config: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
    ],
  };

  const pc = new RTCPeerConnection(config);

  pc.ontrack = onTrack;

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    onConnectionStateChange(pc.connectionState);
  };

  return pc;
}

// Create offer for initiator
export async function createOffer(
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

// Create answer for receiver
export async function createAnswer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

// Set remote answer
export async function setRemoteAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

// Add ICE candidate
export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  if (pc.remoteDescription) {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }
}
