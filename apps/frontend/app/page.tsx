import { ArrowRight, CheckCircle2, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const outcomes = ["Transparent six-stage case tracking", "Role-based accountability", "GIS parcel intelligence", "AI-assisted document review"];

export default function HomePage() {
  return <main className="landing">
    <nav className="landingNav"><a className="brand" href="#top"><span className="brandMark">भू</span><span>BhoomiSetu<small>भूमि से विश्वास तक</small></span></a><Link className="button secondary" href="/login">Open portal</Link></nav>
    <section className="landingHero" id="top"><div><p className="eyebrow"><Sparkles size={15} /> SIH26016 · Digital land acquisition</p><h1>Land acquisition,<br /><em>made legible.</em></h1><p className="intro">One operational record for families, field teams and decision-makers—from first notification to compensation and possession.</p><div className="heroActions"><Link className="button primary" href="/login">Open BhoomiSetu <ArrowRight size={18} /></Link><span><i /> Core platform verified</span></div></div><div className="heroPanel"><div className="miniMap"><MapPinned size={42} /><span>Kharadi Bypass</span><small>20 mapped acquisition parcels</small></div><div className="trustRow"><ShieldCheck /><span><strong>Tamper-evident record</strong><small>Every case action is attributable</small></span></div></div></section>
    <section className="outcomes"><p className="sectionLabel">What the platform resolves</p><div>{outcomes.map((item, index) => <article key={item}><span className="outcomeIndex">0{index + 1}</span><CheckCircle2 /><h2>{item}</h2><p>Built for public administration and citizen confidence.</p></article>)}</div></section>
  </main>;
}
