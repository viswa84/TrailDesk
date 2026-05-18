/**
 * useWhatsAppCall — drives outbound AND inbound WhatsApp calls.
 *
 * callState values:
 *   'idle'                 — no active call
 *   'dialing'             — outbound: offer sent, waiting for answer SDP
 *   'ringing-in'          — inbound: call ringing, waiting for user to answer or decline
 *   'in-call'             — audio connected (either direction)
 *   'ended'               — call just finished (briefly, before resetting to idle)
 *   'needs-permission'    — /initiate returned 409 needsPermission:true
 *   'permission-requested'— permission request message sent; waiting for user to tap Allow
 *
 * Auth token is read from localStorage (same source as AuthContext).
 *
 * Inbound call flow:
 *   Socket emits `incomingCall` → hook sets callState='ringing-in', stores sdpOffer+callId
 *   User clicks Answer  → answerCall() builds RTCPeerConnection, sends SDP answer to backend
 *   User clicks Decline → rejectCall() POSTs /reject, clears state
 *
 * Outbound call flow (unchanged from original):
 *   startCall(phone) → creates offer → POSTs /initiate → waits for answer
 *   If /initiate returns 409 needsPermission:true → callState='needs-permission'
 *   Admin clicks "Request Call Permission" → requestCallPermission(phone) → POSTs
 *     /permission/request → callState='permission-requested'
 *   answer may arrive immediately in HTTP response, or via socket callEvent
 *   Socket emits `callPermissionGranted` → callState resets to 'idle' so admin can retry
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '');

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

function getToken() {
  return localStorage.getItem('trekops_token') || '';
}

async function callApi(path, body, method = 'POST') {
  const ctrl = new AbortController();
  const timeoutId = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(`${API_URL}/api/calls${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const json = await r.json().catch(() => ({}));

    // Special case: 409 with needsPermission is not a generic error —
    // return the JSON directly so startCall can inspect it.
    if (r.status === 409 && json?.needsPermission) {
      const err = new Error('needs-permission');
      err.needsPermission = true;
      err.phone = body?.phone;
      throw err;
    }

    if (!r.ok || json?.success === false) {
      const err = json?.error || json;
      throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
    }
    return json;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`request to /api/calls${path} timed out`);
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
}

const waitForIce = (pc) =>
  new Promise((resolve) => {
    if (pc.iceGatheringState === 'complete') return resolve();
    const check = () => {
      if (pc.iceGatheringState === 'complete') {
        pc.removeEventListener('icegatheringstatechange', check);
        resolve();
      }
    };
    pc.addEventListener('icegatheringstatechange', check);
    setTimeout(resolve, 3000); // 3 s safety
  });

/**
 * @param {object} opts
 * @param {import('socket.io-client').Socket|null} opts.socket — the Socket.IO client instance
 *   managed by the caller (SupportChatPage). Pass null / undefined if not yet connected.
 */
export function useWhatsAppCall({ socket } = {}) {
  // 'idle' | 'dialing' | 'ringing-in' | 'in-call' | 'needs-permission' | 'permission-requested'
  const [callState, setCallState] = useState('idle');
  const [activeCallId, setActiveCallId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { callId, phone, sdpOffer }
  const [permissionPhone, setPermissionPhone] = useState(null); // phone awaiting permission
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const audioRef = useRef(null); // attach this ref to a hidden <audio autoPlay> element
  // Mirror of activeCallId kept in a ref so ICE/socket handlers can read the
  // current value without stale-closure issues (refs update synchronously).
  const activeCallIdRef = useRef(null);

  // ── Tear down the WebRTC side cleanly ──────────────────────────────────────
  const teardown = useCallback((nextState = 'idle') => {
    try {
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (audioRef.current) audioRef.current.srcObject = null;
    } catch { /* ignore */ }
    activeCallIdRef.current = null;
    setCallState(nextState);
    setActiveCallId(null);
    setMuted(false);
    setIncomingCall(null);
    if (nextState === 'idle') setPermissionPhone(null);
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  // ── Wire up remote audio to the <audio> element ───────────────────────────
  function attachRemoteAudio(stream) {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(() => {});
    }
  }

  // ── Create a fresh RTCPeerConnection with mic tracks attached ─────────────
  async function buildPC() {
    const pc = new RTCPeerConnection(RTC_CONFIG);
    pc.ontrack = (e) => attachRemoteAudio(e.streams[0]);

    // Belt-and-suspenders: if ICE goes down (remote hangup, network drop) the
    // connection/iceConnection state will reach disconnected/failed/closed within
    // a few seconds — use that as a reliable local hangup signal.
    const handlePeerGone = (state) => {
      if (['disconnected', 'failed', 'closed'].includes(state)) {
        console.log('[useWhatsAppCall] peer connection gone, state:', state, '— cleaning up');
        teardown('idle');
      }
    };
    pc.onconnectionstatechange = () => handlePeerGone(pc.connectionState);
    pc.oniceconnectionstatechange = () => handlePeerGone(pc.iceConnectionState);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pcRef.current = pc;
    return pc;
  }

  // ── Socket.IO: listen for inbound call events ─────────────────────────────
  // NOTE: intentionally excluded `callState` from deps. callState is read
  // inside onIncomingCall via a ref pattern (callStateRef) to avoid
  // re-registering listeners every time callState changes. Re-registering on
  // every state transition creates a timing window where a callStatus event
  // arriving during the off/on cycle is silently dropped — which is exactly
  // the bug that caused remote hang-up not stopping the timer.
  const callStateRef = useRef(callState);
  useEffect(() => { callStateRef.current = callState; }, [callState]);

  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = ({ callId, phone, sdpOffer }) => {
      // Ignore if we're already in a call
      if (callStateRef.current !== 'idle') {
        console.warn('[useWhatsAppCall] incomingCall ignored — already in call state:', callStateRef.current);
        return;
      }
      console.log('[useWhatsAppCall] incomingCall', { callId, phone });
      activeCallIdRef.current = callId;
      setIncomingCall({ callId, phone, sdpOffer });
      setActiveCallId(callId);
      setCallState('ringing-in');
    };

    const onCallStatus = (payload) => {
      const { callId, status } = payload || {};
      console.log('[useWhatsAppCall] callStatus received', { callId, status }, 'activeCallId=', activeCallIdRef.current);
      if (!status) return;
      // Normalise to lowercase — Meta sends uppercase (COMPLETED, RINGING, etc.)
      const normStatus = String(status).toLowerCase();
      const isTerminal = ['completed', 'failed', 'rejected', 'missed', 'terminated', 'ended', 'canceled', 'busy', 'declined', 'no_answer'].includes(normStatus);
      if (!isTerminal) return;

      // Tear down if the callId matches the active call, OR if there is no
      // active callId yet (race: terminate arrived before /initiate response),
      // OR if the callId is missing in the payload (some Meta status updates
      // omit it for outbound BUSINESS_INITIATED flows).
      const activeId = activeCallIdRef.current;
      if (!callId || activeId === callId || activeId === null) {
        console.log('[useWhatsAppCall] terminal callStatus — tearing down. callId=', callId, 'activeId=', activeId);
        teardown('idle');
      }
    };

    const onCallEvent = ({ callId, sdp, sdpType }) => {
      // Outbound: backend relays the answer SDP via socket when it arrives from Meta
      if (sdpType === 'answer' && sdp && pcRef.current) {
        pcRef.current
          .setRemoteDescription({ type: 'answer', sdp })
          .then(() => setCallState('in-call'))
          .catch((e) => setError(e.message));
      }
    };

    // When the user taps Allow on the permission request, the backend emits
    // this event. Reset to 'idle' so the admin can attempt the call again.
    const onCallPermissionGranted = ({ phone }) => {
      console.log('[useWhatsAppCall] callPermissionGranted', { phone, currentState: callStateRef.current });
      const cur = callStateRef.current;
      if (cur === 'needs-permission' || cur === 'permission-requested') {
        setCallState('idle');
        setPermissionPhone(null);
        setError(null);
      }
    };

    socket.on('incomingCall', onIncomingCall);
    socket.on('callStatus', onCallStatus);
    socket.on('callEvent', onCallEvent);
    socket.on('callPermissionGranted', onCallPermissionGranted);

    return () => {
      socket.off('incomingCall', onIncomingCall);
      socket.off('callStatus', onCallStatus);
      socket.off('callEvent', onCallEvent);
      socket.off('callPermissionGranted', onCallPermissionGranted);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, teardown]);

  // ── OUTBOUND: start a call to a phone number ──────────────────────────────
  const startCall = useCallback(async (phone) => {
    if (!phone) { setError('No phone number provided'); return; }
    if (callState !== 'idle') return;
    setError(null);
    setCallState('dialing');

    try {
      const pc = await buildPC();

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await waitForIce(pc);

      const result = await callApi('/initiate', {
        phone,
        sdpOffer: pc.localDescription.sdp,
      });

      activeCallIdRef.current = result.callId;
      setActiveCallId(result.callId);

      if (result.sdpAnswer) {
        await pc.setRemoteDescription({ type: 'answer', sdp: result.sdpAnswer });
        setCallState('in-call');
      } else {
        // Answer will arrive via socket `callEvent`
        setCallState('dialing');
      }
    } catch (e) {
      if (e.needsPermission) {
        // /initiate returned 409 — user has not granted call permission.
        // Release mic (PC teardown), then surface the needs-permission state
        // so the UI can show the amber "Request Call Permission" button.
        teardown('needs-permission');
        setPermissionPhone(phone);
        setError(null); // error banner is replaced by the needs-permission UI
        return;
      }
      setError(e.message);
      teardown('idle');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callState, teardown]);

  // ── Request call permission from the user ─────────────────────────────────
  // Sends the call_permission_request interactive message via the backend.
  const requestCallPermission = useCallback(async (phone) => {
    const target = phone || permissionPhone;
    if (!target) return;
    setError(null);
    try {
      await callApi('/permission/request', { phone: target });
      setCallState('permission-requested');
      setPermissionPhone(target);
    } catch (e) {
      setError(`Failed to send permission request: ${e.message}`);
    }
  }, [permissionPhone]);

  // ── INBOUND: answer the ringing call ─────────────────────────────────────
  const answerCall = useCallback(async () => {
    if (callState !== 'ringing-in' || !incomingCall) return;
    setError(null);

    try {
      const { callId, sdpOffer } = incomingCall;

      const pc = await buildPC();

      // Set the caller's offer as remote description
      await pc.setRemoteDescription({ type: 'offer', sdp: sdpOffer });

      // Create our answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitForIce(pc);

      // Send answer to Meta via backend
      await callApi('/answer', {
        callId,
        sdpAnswer: pc.localDescription.sdp,
      });

      activeCallIdRef.current = callId;
      setActiveCallId(callId);
      setCallState('in-call');
    } catch (e) {
      setError(e.message);
      teardown('idle');
    }
  }, [callState, incomingCall, teardown]);

  // ── INBOUND: reject the ringing call ─────────────────────────────────────
  const rejectCall = useCallback(async () => {
    const callId = incomingCall?.callId || activeCallId;
    if (!callId) { teardown('idle'); return; }
    try {
      await callApi('/reject', { callId });
    } catch { /* log only */ }
    teardown('idle');
  }, [incomingCall, activeCallId, teardown]);

  // ── BOTH: hang up / terminate current call ────────────────────────────────
  const terminateCall = useCallback(async () => {
    const callId = activeCallId;
    // Close WebRTC first so mic is released immediately
    teardown('idle');
    if (callId) {
      try { await callApi('/terminate', { callId }); } catch { /* log only */ }
    }
  }, [activeCallId, teardown]);

  // ── Called after receiving answer SDP via socket for outbound calls ───────
  const receiveAnswer = useCallback(async (sdpAnswer) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.setRemoteDescription({ type: 'answer', sdp: sdpAnswer });
      setCallState('in-call');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const nowMuted = !muted;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !nowMuted));
    setMuted(nowMuted);
  }, [muted]);

  return {
    /** 'idle' | 'dialing' | 'ringing-in' | 'in-call' | 'needs-permission' | 'permission-requested' */
    callState,
    activeCallId,
    /** Populated when callState === 'ringing-in' */
    incomingCall,
    /** Populated when callState === 'needs-permission' or 'permission-requested' */
    permissionPhone,
    muted,
    error,
    /** Attach this to a hidden <audio autoPlay playsInline> element */
    audioRef,
    startCall,
    answerCall,
    rejectCall,
    terminateCall,
    toggleMute,
    receiveAnswer,
    requestCallPermission,
  };
}
