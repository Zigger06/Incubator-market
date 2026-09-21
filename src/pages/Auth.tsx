import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useI18n } from "../i18n/Provider";
import { useAuth } from "../features/auth/AuthProvider";
import { supabase } from "../lib/supabase";
import {
  loginSchema,
  registerSchema,
  normalizePhone,
  formatPhone,
} from "../lib/validation";
import { Notice } from "../components/Status";
import type { MessageKey } from "../i18n/messages";
export default function Auth() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const [params, setParams] = useSearchParams();
  const register = params.get("mode") === "register";
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const next = params.get("next") === "/checkout" ? "/checkout" : "/account";
  if (loading) return <div className="status">{t("loading")}</div>;
  if (user) return <Navigate to={next} replace />;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!supabase) {
      setError("unavailable");
      return;
    }
    setBusy(true);
    try {
      if (needsOtp) {
        const { error } = await supabase.auth.verifyOtp({
          phone: normalizePhone(phone),
          token: otp,
          type: "sms",
        });
        if (error) throw error;
        return;
      }
      const parsed = (register ? registerSchema : loginSchema).safeParse({
        phone,
        password,
        confirm,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0].message);
        return;
      }
      const result = register
        ? await supabase.auth.signUp({ phone: parsed.data.phone, password })
        : await supabase.auth.signInWithPassword({
            phone: parsed.data.phone,
            password,
          });
      if (result.error) throw result.error;
      if (register && !result.data.session) setNeedsOtp(true);
    } catch {
      setError(
        needsOtp ? "otpError" : register ? "registerError" : "authError",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-intro">
        <LockKeyhole size={32} />
        <h1>{t(register ? "register" : "login")}</h1>
        <p>{t("loginCheckout")}</p>
        <Link className="text-link" to="/catalog">
          {t("continue")}
        </Link>
      </div>
      <form className="panel" onSubmit={submit} aria-busy={busy}>
        <h2>{t(needsOtp ? "verifyPhone" : register ? "register" : "login")}</h2>
        {!needsOtp ? (
          <>
            <label>
              {t("phone")}
              <input
                disabled={busy}
                required
                type="tel"
                autoComplete="tel"
                aria-invalid={error === "phoneError"}
                value={phone}
                onBlur={() => setPhone(formatPhone(phone))}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+992 XX XXX XX XX"
              />
            </label>
            <label>
              {t("password")}
              <input
                disabled={busy}
                required
                autoComplete={register ? "new-password" : "current-password"}
                type={show ? "text" : "password"}
                minLength={8}
                maxLength={128}
                aria-invalid={
                  error === "passwordError" || error === "authError"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {register && (
              <label>
                {t("confirm")}
                <input
                  disabled={busy}
                  required
                  autoComplete="new-password"
                  type={show ? "text" : "password"}
                  minLength={8}
                  maxLength={128}
                  aria-invalid={error === "passwordMatch"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
            )}
            <label className="checkbox">
              <input
                disabled={busy}
                type="checkbox"
                checked={show}
                onChange={(e) => setShow(e.target.checked)}
              />
              {t("show")}
            </label>
          </>
        ) : (
          <label>
            {t("otp")}
            <input
              disabled={busy}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>
        )}
        <Notice error text={error ? t(error as MessageKey) : ""} />
        <button className="button primary full" disabled={busy || !supabase}>
          {t(
            busy
              ? "loading"
              : needsOtp
                ? "verify"
                : register
                  ? "registerAction"
                  : "login",
          )}
        </button>
        {!supabase && <p className="form-note">{t("authUnavailable")}</p>}
        <button
          type="button"
          disabled={busy}
          className="text-button"
          onClick={() => {
            const nextParams = new URLSearchParams(params);
            if (register) nextParams.delete("mode");
            else nextParams.set("mode", "register");
            setParams(nextParams);
            setConfirm("");
            setPassword("");
            setShow(false);
            setOtp("");
            setError("");
            setNeedsOtp(false);
          }}
        >
          {t(register ? "login" : "register")}
        </button>
      </form>
    </div>
  );
}
