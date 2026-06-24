import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { supabase } from "../lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "loading" | "scan" | "verify" | "success" | "error";

export default function TwoFactorModal({ open, onClose, onSuccess }: Props) {
  const [step,      setStep]      = useState<Step>("loading");
  const [qrCode,    setQrCode]    = useState("");
  const [secret,    setSecret]    = useState("");
  const [factorId,  setFactorId]  = useState("");
  const [code,      setCode]      = useState("");
  const [errMsg,    setErrMsg]    = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("loading");
      setQrCode(""); setSecret(""); setFactorId("");
      setCode(""); setErrMsg(""); setVerifying(false);
      enroll();
    }
  }, [open]);

  const enroll = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) { setErrMsg(error.message); setStep("error"); return; }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setFactorId(data.id);
    setStep("scan");
  };

  const handleVerify = async () => {
    if (code.length !== 6) { setErrMsg("Enter all 6 digits"); return; }
    setVerifying(true); setErrMsg("");
    const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { setErrMsg(chErr.message); setVerifying(false); return; }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId, challengeId: ch.id, code,
    });
    setVerifying(false);
    if (vErr) { setErrMsg(vErr.message); return; }
    setStep("success");
    setTimeout(() => { onSuccess(); onClose(); }, 1800);
  };

  if (!open) return null;

  const backdrop: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  const card: React.CSSProperties = {
    background: "#fff", borderRadius: 20, padding: "20px 20px 24px",
    width: "90vw", maxWidth: 400,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  };
  const btnBase: React.CSSProperties = {
    flex: 1, padding: "10px 0", borderRadius: 12, fontSize: 12,
    fontWeight: 700, cursor: "pointer", border: "none",
  };

  return ReactDOM.createPortal(
    <div style={backdrop} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={card}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
              🔐
            </div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1E3A8A" }}>Google Authenticator</p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Loading */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "#94a3b8", fontSize: 12 }}>
            <div style={{ width: 28, height: 28, border: "3px solid #e2e8f0", borderTopColor: "#1E3A8A", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 10px" }} />
            Setting up 2FA...
          </div>
        )}

        {/* Scan QR */}
        {step === "scan" && (
          <div>
            <div style={{ background: "#EFF6FF", borderRadius: 12, padding: "8px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ fontSize: 12, marginTop: 1 }}>ℹ️</span>
              <p style={{ margin: 0, fontSize: 10, color: "#1e40af", lineHeight: 1.5 }}>
                Scan the QR code with <strong>Google Authenticator</strong>, then tap the button below to enter the code.
              </p>
            </div>
            {qrCode && (
              <img src={qrCode} alt="2FA QR Code"
                style={{ width: 160, height: 160, display: "block", margin: "0 auto 12px", borderRadius: 12, border: "1px solid #e2e8f0", padding: 4, background: "#fff" }} />
            )}
            {secret && (
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "8px 12px", marginBottom: 12, textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: 9, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Manual key</p>
                <p style={{ margin: 0, fontSize: 10, fontFamily: "monospace", fontWeight: 700, letterSpacing: 2, color: "#1E3A8A", wordBreak: "break-all" }}>{secret}</p>
              </div>
            )}
            <button
              onClick={() => { setStep("verify"); setErrMsg(""); }}
              style={{ ...btnBase, width: "100%", background: "#1E3A8A", color: "#fff" }}>
              I've scanned — Enter Code →
            </button>
          </div>
        )}

        {/* Enter code */}
        {step === "verify" && (
          <div>
            <p style={{ margin: "0 0 14px", fontSize: 11, color: "#64748b", textAlign: "center" }}>
              Enter the 6-digit code from Google Authenticator
            </p>
            <input
              type="text" inputMode="numeric" maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrMsg(""); }}
              autoFocus
              style={{
                width: "100%", border: `2px solid ${errMsg ? "#dc2626" : code.length === 6 ? "#16a34a" : "#e2e8f0"}`,
                borderRadius: 12, padding: "12px 0", fontSize: 28,
                textAlign: "center", letterSpacing: 10, fontFamily: "monospace",
                outline: "none", boxSizing: "border-box", color: "#1E3A8A",
                transition: "border-color 0.15s",
              }}
            />
            {errMsg && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#dc2626", textAlign: "center" }}>{errMsg}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setStep("scan")}
                style={{ ...btnBase, background: "#f1f5f9", color: "#64748b" }}>← Back</button>
              <button onClick={handleVerify}
                disabled={verifying || code.length !== 6}
                style={{ ...btnBase, background: "#1E3A8A", color: "#fff", opacity: (verifying || code.length !== 6) ? 0.5 : 1 }}>
                {verifying ? "Verifying..." : "Verify & Enable"}
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15, color: "#16a34a" }}>2FA Enabled!</p>
            <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>Your account is now protected with Google Authenticator.</p>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#dc2626" }}>{errMsg || "Setup failed"}</p>
            <button onClick={enroll}
              style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "#1E3A8A", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              Try Again
            </button>
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}
