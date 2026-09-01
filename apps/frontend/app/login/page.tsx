"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import { ArrowRight, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { demoAccounts } from "@/lib/demo-data";
import type { AuthTokens, Role } from "@/lib/types";

const roles = Object.keys(demoAccounts) as Role[];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [role, setRole] = useState<Role>("landowner");
  const [email, setEmail] = useState(demoAccounts.landowner.email);
  const [password, setPassword] = useState(demoAccounts.landowner.password);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const chooseRole = (nextRole: Role) => { setRole(nextRole); setEmail(demoAccounts[nextRole].email); setPassword(demoAccounts[nextRole].password); setMessage(""); };
  const signIn = async (demo = false) => {
    setLoading(true); setMessage("");
    try {
      let tokens: AuthTokens;
      if (demo) tokens = { access_token: `demo-${role}`, refresh_token: "demo", token_type: "bearer", user: { id: `demo-${role}`, email, name: demoAccounts[role].name, role } };
      else tokens = await api.login(email, password);
      setSession(tokens, demo); router.push(`/portal/${tokens.user.role}`);
    } catch { setMessage("The local API is unavailable. Use ‘Explore with demo data’ or start the backend."); }
    finally { setLoading(false); }
  };
  return <main className="authPage"><section className="authStory"><a className="brand" href="/"><span className="brandMark">भू</span><span>BhoomiSetu<small>भूमि से विश्वास तक</small></span></a><div><p className="eyebrow">Secure role workspace</p><h1>One system.<br />Five accountable views.</h1><p>Choose a role to see the exact operational picture that stakeholder needs—without exposing what they should not see.</p></div><span className="authTrust"><ShieldCheck /> JWT authentication · Role-based access · Audit trail</span></section><section className="loginPanel"><div className="loginBox"><KeyRound className="loginIcon" /><p className="sectionLabel">Identity gateway</p><h2>Enter your workspace</h2><div className="rolePicker">{roles.map((item) => <button className={role === item ? "active" : ""} key={item} onClick={() => chooseRole(item)}>{item.replace("_admin", " admin").replace("landowner", "citizen")}</button>)}</div><label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label><label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" /></label>{message && <p className="formMessage">{message}</p>}<button className="button primary full" disabled={loading} onClick={() => signIn(false)}>{loading ? <LoaderCircle className="spin" /> : <>Sign in securely <ArrowRight size={18} /></>}</button><button className="demoButton" disabled={loading} onClick={() => signIn(true)}>Explore with demo data</button><small className="helper">Demo credentials are prefilled. Demo mode is always visibly labelled.</small></div></section></main>;
}
