import { ArrowRight, CheckCircle2, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const outcomes = ["Transparent six-stage case tracking", "Role-based accountability", "GIS parcel intelligence", "AI-assisted document review"];

export default function HomePage() {
  return <main className="landing">
    <nav className="landingNav"><a className="brand" href="#top"><span className="brandMark">भू</span><span>BhoomiSetu<small>भूमि से विश्वास तक</small></span></a><Link className="button secondary" href="/login">Open portal</Link></nav>
    <section className="landingHero" id="top"><div><p className="eyebrow"><Sparkles size={15} /> SIH26016 · Digital land acquisition</p><h1>Clarity for every family.<br /><em>Control for every decision.</em></h1><p className="intro">A live coordination layer connecting landowners, field officers and government leaders—from first notification to fair compensation and possession.</p><div className="heroActions"><Link className="button primary" href="/login">Enter command centre <ArrowRight size={18} /></Link><span><i /> Core platform verified</span></div></div><div className="heroPanel"><div className="miniMap"><div className="mapRadar" /><MapPinned size={42} /><span>Kharadi Bypass</span><small>20 live-ready acquisition parcels</small></div><div className="trustRow"><ShieldCheck /><span><strong>Tamper-evident</strong><small>Every action leaves an audit trail</small></span></div></div></section>
    <section className="outcomes"><p className="sectionLabel">One connected source of truth</p><div>{outcomes.map((item) => <article key={item}><CheckCircle2 /><h2>{item}</h2><p>Built for real-world public administration and citizen confidence.</p></article>)}</div></section>
  </main>;
}
