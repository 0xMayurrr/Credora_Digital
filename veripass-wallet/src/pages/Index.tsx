import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Fingerprint,
  Lock,
  CheckCircle2,
  ArrowRight,
  Github,
  Award,
  Star,
  BookOpen,
  Clock,
  Users,
  ShieldCheck,
  Globe,
  GitCommit,
  Wallet,
  Share2,
  Award as BadgeCheck,
  FileCheck,
  KeyRound,
  ScanLine,
  BadgeCheck as VerifiedIcon,
  CircleCheck,
  Building2,
  FileSignature,
  Eye,
  EyeOff,
  Landmark,
  Scale,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  ChevronRight,
} from "lucide-react";

// Subtle fade-up animation
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

const Index = () => {
  return (
    <div className="min-h-screen bg-white text-[hsl(220,40%,13%)] selection:bg-[hsl(218,72%,23%)/0.15]">
      <Navbar />

      {/* ═══════════════════════════════════════════ */}
      {/* 1. HERO SECTION — Official Government Style */}
      {/* ═══════════════════════════════════════════ */}
      <section className="relative pt-28 pb-20 overflow-hidden" id="hero-section">
        {/* Subtle pattern background */}
        <div className="absolute inset-0 gov-pattern-bg opacity-50" />

        {/* Navy gradient accent at top */}
        <div className="absolute top-0 left-0 right-0 h-[420px] bg-gradient-to-b from-[hsl(218,72%,23%)/0.03] to-transparent pointer-events-none" />

        <div className="container mx-auto px-6 lg:px-16 xl:px-24 relative z-10">
          {/* Official Badge */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="flex justify-center mb-8"
          >
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[hsl(218,72%,23%)] text-white text-xs font-semibold uppercase tracking-[0.15em] shadow-lg">
              <Shield className="h-4 w-4 text-[hsl(43,96%,56%)]" />
              MeitY Blockchain India Challenge 2024
            </div>
          </motion.div>

          {/* Centered Hero Content */}
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          >
            {/* Government Seal */}
            <motion.div variants={fadeUp} custom={1} className="flex justify-center mb-8">
              <div className="w-24 h-24">
                <img src="/credora-high-resolution-logo-transparent.png" alt="Credora" className="w-full h-full object-contain" />
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={2}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 text-[hsl(218,72%,23%)]"
            >
              India's Blockchain-Powered
              <br />
              <span className="text-[hsl(220,10%,45%)] font-bold">
                Credential Verification System
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={3}
              className="text-lg sm:text-xl text-[hsl(220,10%,45%)] mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Government-grade certificate lifecycle management on Hyperledger Fabric.
              AI fraud detection, zero-knowledge privacy, and instant verification for
              academic and professional credentials.
            </motion.p>

            <motion.div
              variants={fadeUp}
              custom={4}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
            >
              <Link to="/signup">
                <Button
                  size="lg"
                  className="bg-[hsl(218,72%,23%)] text-white hover:bg-[hsl(218,72%,28%)] text-base px-8 h-14 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold"
                  id="hero-cta-primary"
                >
                  Access Credential Wallet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/verify">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-14 rounded-lg border-2 border-[hsl(218,72%,23%)] text-[hsl(218,72%,23%)] hover:bg-[hsl(218,72%,23%)/0.05] font-semibold"
                  id="hero-cta-secondary"
                >
                  <ScanLine className="mr-2 h-5 w-5" />
                  Verify Certificate
                </Button>
              </Link>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={fadeUp}
              custom={5}
              className="flex flex-wrap justify-center gap-6 sm:gap-8"
            >
              {[
                { icon: Lock, label: "Hyperledger Fabric" },
                { icon: ShieldCheck, label: "AI Fraud Detection" },
                { icon: VerifiedIcon, label: "ZK-Proof Privacy" },
                { icon: Scale, label: "UGC Compliant" },
              ].map(({ icon: Icon, label }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-sm text-[hsl(220,10%,45%)]"
                >
                  <div className="w-8 h-8 rounded-full bg-[hsl(158,64%,35%)/0.1] flex items-center justify-center">
                    <Icon className="h-4 w-4 text-[hsl(158,64%,35%)]" />
                  </div>
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 2. CORE PLATFORM FEATURES                  */}
      {/* ═══════════════════════════════════════════ */}
      <section
        className="py-20 bg-[hsl(220,33%,97%)] border-y border-gray-200"
        id="services-section"
      >
        <div className="container mx-auto px-6 lg:px-16">
          {/* Section Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <div className="gov-section-divider mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[hsl(218,72%,23%)] mb-4">
              Three Deep Technologies, One Platform
            </h2>
            <p className="text-[hsl(220,10%,45%)] text-lg max-w-2xl mx-auto">
              Hyperledger Fabric for trust, AI for fraud prevention, and Zero-Knowledge
              proofs for privacy — all working together.
            </p>
          </motion.div>

          {/* Service Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: Shield,
                title: "Hyperledger Fabric",
                desc: "Permissioned blockchain with 3-org network (Government, Universities, Verifiers). No gas fees, enterprise-grade security.",
                color: "hsl(218,72%,23%)",
                bgColor: "hsl(218,72%,23%)/0.08",
              },
              {
                icon: BadgeCheck,
                title: "AI Fraud Detection",
                desc: "8-signal fraud scoring engine checks every credential against UGC database before blockchain issuance. Blocks fake universities instantly.",
                color: "hsl(0,84%,60%)",
                bgColor: "hsl(0,84%,60%)/0.08",
              },
              {
                icon: EyeOff,
                title: "Zero-Knowledge Privacy",
                desc: "Semaphore Protocol integration. Prove credential ownership without revealing name, marks, or identity — complete privacy.",
                color: "hsl(262,60%,45%)",
                bgColor: "hsl(262,60%,45%)/0.08",
              },
              {
                icon: FileSignature,
                title: "6-State Lifecycle",
                desc: "Draft → Review → Approved → Signed → Issued → Revoked. Multi-signature approval workflow with complete audit trail.",
                color: "hsl(158,64%,35%)",
                bgColor: "hsl(158,64%,35%)/0.08",
              },
            ].map(({ icon: Icon, title, desc, color, bgColor }, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="gov-card group"
                id={`service-card-${i}`}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${bgColor}` }}
                >
                  <Icon className="h-7 w-7" style={{ color }} />
                </div>
                <h3 className="text-lg font-bold text-[hsl(220,40%,13%)] mb-3">
                  {title}
                </h3>
                <p className="text-sm text-[hsl(220,10%,45%)] leading-relaxed">
                  {desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. AI FRAUD DETECTION ENGINE               */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white" id="security-section">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
            {/* Left — Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="flex-1"
            >
              <div className="gov-section-divider mb-6" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[hsl(218,72%,23%)] mb-6 leading-tight">
                AI Fraud Detection.
                <br />
                Before It Hits the Blockchain.
              </h2>
              <p className="text-[hsl(220,10%,45%)] text-lg mb-8 max-w-lg leading-relaxed">
                Every credential passes through an 8-signal fraud scoring engine.
                Fake universities are blocked instantly. UGC database verification
                ensures only legitimate institutions can issue credentials.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "UGC recognized institution verification",
                  "Fake university list cross-check (instant block)",
                  "Date anomaly detection (future/impossible dates)",
                  "Suspicious pattern matching (instant degree, etc.)",
                  "Issuance surge detection (50+ creds/hour)",
                  "Duplicate hash prevention",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[hsl(220,40%,13%)]"
                  >
                    <CircleCheck className="h-5 w-5 text-[hsl(158,64%,35%)] shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right — Fraud Scoring */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 w-full max-w-lg"
            >
              <div className="bg-[hsl(220,33%,97%)] rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-[hsl(218,72%,23%)] mb-6 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[hsl(43,96%,42%)]" />
                  8-Signal Fraud Analysis
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      signal: "Unknown Institution",
                      points: "40 pts",
                      status: "High Risk",
                      color: "hsl(0,84%,60%)",
                    },
                    {
                      signal: "Fake University (UGC)",
                      points: "100 pts",
                      status: "Blocked",
                      color: "hsl(0,84%,60%)",
                    },
                    {
                      signal: "Date Anomaly",
                      points: "25 pts",
                      status: "Medium",
                      color: "hsl(43,96%,42%)",
                    },
                    {
                      signal: "Issuance Surge",
                      points: "30 pts",
                      status: "Review",
                      color: "hsl(43,96%,42%)",
                    },
                  ].map(({ signal, points, status, color }, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-[hsl(218,72%,23%)/0.2] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[hsl(218,72%,23%)/0.08] flex items-center justify-center shrink-0">
                        <Lock className="h-5 w-5 text-[hsl(218,72%,23%)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-[hsl(220,40%,13%)]">
                            {signal}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap" style={{ color, backgroundColor: `${color}/0.1` }}>
                            {status}
                          </span>
                        </div>
                        <p className="text-xs text-[hsl(220,10%,45%)] mt-1">
                          Max penalty: {points}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-white rounded-xl border-2 border-[hsl(158,64%,35%)]">
                  <div className="text-xs font-bold text-[hsl(158,64%,35%)] uppercase tracking-wider mb-1">Fraud Score Threshold</div>
                  <div className="text-sm text-[hsl(220,10%,45%)]">Score ≥ 70 = Auto-reject | Score 40-69 = Manual review</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. STATISTICS BAR                          */}
      {/* ═══════════════════════════════════════════ */}
      <section
        className="py-16 bg-[hsl(218,72%,23%)] text-white"
        id="stats-section"
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              { value: "3", label: "Organizations (Gov/Uni/Verifier)", icon: Building2 },
              { value: "4", label: "Active Chaincodes", icon: GitCommit },
              { value: "6", label: "Certificate Lifecycle States", icon: FileCheck },
              { value: "$0", label: "Gas Fees (Hyperledger)", icon: Wallet },
            ].map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center flex flex-col items-center"
              >
                <Icon className="h-6 w-6 text-[hsl(43,96%,56%)] mb-3" />
                <div className="text-3xl sm:text-4xl font-extrabold text-white mb-1">
                  {value}
                </div>
                <div className="text-xs sm:text-sm text-white/70 font-medium uppercase tracking-wider">
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 5. CERTIFICATE LIFECYCLE — 6-State FSM    */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white" id="how-it-works-section">
        <div className="container mx-auto px-6 lg:px-16">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <div className="gov-section-divider mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[hsl(218,72%,23%)] mb-4">
              Certificate Lifecycle Management
            </h2>
            <p className="text-[hsl(220,10%,45%)] text-lg max-w-2xl mx-auto">
              Every credential goes through a 6-state approval workflow with role-based
              access control and complete audit trail on Hyperledger Fabric.
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            {/* Timeline */}
            <div className="relative">
              {/* Vertical connector line (desktop) */}
              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gray-200 -translate-x-1/2" />

              {[
                {
                  step: 1,
                  title: "DRAFT → UNDER_REVIEW",
                  desc: "Issuer Officer creates draft certificate and submits for approval. All metadata validated before submission.",
                  icon: FileCheck,
                  role: "ISSUER_OFFICER",
                },
                {
                  step: 2,
                  title: "UNDER_REVIEW → APPROVED",
                  desc: "Approver reviews certificate details, verifies institution credentials, and approves or rejects with remarks.",
                  icon: BadgeCheck,
                  role: "APPROVER",
                },
                {
                  step: 3,
                  title: "APPROVED → SIGNED",
                  desc: "Admin digitally signs the certificate with cryptographic signature. Immutable record created on Fabric ledger.",
                  icon: FileSignature,
                  role: "ADMIN",
                },
                {
                  step: 4,
                  title: "SIGNED → ISSUED",
                  desc: "Certificate issued to recipient's wallet. W3C Verifiable Credential created with ZK commitment for privacy.",
                  icon: CircleCheck,
                  role: "ADMIN",
                },
                {
                  step: 5,
                  title: "ISSUED → REVOKED (Optional)",
                  desc: "Admin can revoke certificate with reason. Revocation recorded on-chain with appeal process available.",
                  icon: Lock,
                  role: "ADMIN",
                },
              ].map(({ step, title, desc, icon: Icon, role }, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 mb-12 last:mb-0 ${
                    i % 2 === 1 ? "lg:flex-row-reverse" : ""
                  }`}
                >
                  {/* Content */}
                  <div
                    className={`flex-1 ${
                      i % 2 === 0 ? "lg:text-right lg:pr-16" : "lg:text-left lg:pl-16"
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[hsl(43,96%,42%)] mb-3 ${
                        i % 2 === 0 ? "lg:justify-end" : ""
                      }`}
                    >
                      State {step} • {role}
                    </div>
                    <h3 className="text-xl font-bold text-[hsl(220,40%,13%)] mb-3">
                      {title}
                    </h3>
                    <p className="text-sm text-[hsl(220,10%,45%)] leading-relaxed max-w-md">
                      {desc}
                    </p>
                  </div>

                  {/* Center Node */}
                  <div className="relative z-10 shrink-0">
                    <div className="step-number">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Spacer for timeline alignment */}
                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 6. 3-ORG NETWORK & CREDENTIAL TYPES        */}
      {/* ═══════════════════════════════════════════ */}
      <section
        className="py-20 bg-[hsl(220,33%,97%)] border-y border-gray-200"
        id="issuers-section"
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
            {/* Network Graphic */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex-1 w-full max-w-lg"
            >
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h3 className="text-lg font-bold text-[hsl(218,72%,23%)] mb-6 flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-[hsl(43,96%,42%)]" />
                  3-Organization Hyperledger Network
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      name: "GovernmentMSP",
                      type: "Admin Authority",
                      icon: Building2,
                      color: "hsl(218,72%,23%)",
                      bg: "hsl(218,72%,23%)/0.08",
                    },
                    {
                      name: "UniversityMSP",
                      type: "Credential Issuer",
                      icon: GraduationCap,
                      color: "hsl(158,64%,35%)",
                      bg: "hsl(158,64%,35%)/0.08",
                    },
                    {
                      name: "VerifierMSP",
                      type: "Read-Only Verifier",
                      icon: ShieldCheck,
                      color: "hsl(262,60%,45%)",
                      bg: "hsl(262,60%,45%)/0.08",
                    },
                  ].map(({ name, type, icon: Icon, color, bg }, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-[hsl(220,33%,97%)] rounded-xl border border-gray-100 hover:border-[hsl(218,72%,23%)/0.2] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[hsl(220,40%,13%)]">
                          {name}
                        </div>
                        <div className="text-xs text-[hsl(220,10%,45%)]">{type}</div>
                      </div>
                      <CircleCheck className="h-5 w-5 text-[hsl(158,64%,35%)]" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-[hsl(218,72%,23%)/0.05] rounded-xl border border-[hsl(218,72%,23%)/0.2]">
                  <div className="text-xs font-bold text-[hsl(218,72%,23%)] mb-2">Supported Credentials</div>
                  <div className="flex flex-wrap gap-2">
                    {["Academic Degrees", "Professional Certs", "Gov Documents", "Dev Reputation"].map((tag, i) => (
                      <span key={i} className="text-[10px] font-semibold px-2 py-1 bg-white rounded-md text-[hsl(220,10%,45%)]">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Text */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="flex-1"
            >
              <div className="gov-section-divider mb-6" />
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[hsl(218,72%,23%)] mb-6 leading-tight">
                Permissioned Network.
                <br />
                No Cryptocurrency.
              </h2>
              <p className="text-[hsl(220,10%,45%)] text-lg mb-8 max-w-lg leading-relaxed">
                Built on Hyperledger Fabric with RAFT consensus. Three organizations
                collaborate on a private blockchain — no tokens, no gas fees, no speculation.
                Enterprise-grade security for government credentials.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "TLS 1.3 encrypted peer communication",
                  "CouchDB state database for rich queries",
                  "4 active chaincodes (Lifecycle, Registry, Revocation, Identity)",
                  "W3C Verifiable Credentials standard",
                  "IPFS document storage via Pinata",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[hsl(220,40%,13%)]"
                  >
                    <CircleCheck className="h-5 w-5 text-[hsl(158,64%,35%)] shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="bg-[hsl(218,72%,23%)] text-white hover:bg-[hsl(218,72%,28%)] font-semibold shadow-sm"
                    id="issuers-cta"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-gray-300 text-[hsl(220,40%,13%)] hover:bg-gray-50 font-semibold"
                    id="issuers-learn-more"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 7. CTA BANNER — Official Call to Action     */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white" id="cta-section">
        <div className="container mx-auto px-6 lg:px-16">
          <div className="max-w-4xl mx-auto text-center bg-[hsl(218,72%,23%)] rounded-2xl p-12 sm:p-16 relative overflow-hidden shadow-xl">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(43,96%,42%)/0.08] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-[hsl(43,96%,56%)]" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Join India's Blockchain Credential Revolution
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Built for MeitY Blockchain India Challenge 2024. AI-powered fraud
                detection, zero-knowledge privacy, and Hyperledger Fabric security.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="bg-[hsl(43,96%,42%)] text-[hsl(218,72%,13%)] hover:bg-[hsl(43,96%,48%)] font-bold px-10 h-14 rounded-lg shadow-lg text-base"
                    id="cta-create-account"
                  >
                    Create Your Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/verify">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold px-8 h-14 rounded-lg text-base"
                    id="cta-verify"
                  >
                    Verify Credentials
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* 8. FOOTER — Official Government Style      */}
      {/* ═══════════════════════════════════════════ */}
      <footer
        className="bg-[hsl(218,72%,13%)] text-white pt-16 pb-8"
        id="footer"
      >
        <div className="container mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center p-2 border border-[hsl(43,96%,42%)]">
                  <img src="/credora-high-resolution-logo-transparent.png" alt="Credora Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Credora</div>
                  <div className="text-[10px] text-white/50 uppercase tracking-[0.1em]">
                    Digital Identity Service
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">
                Credora provides a secure, blockchain-based platform for government
                credential management and verification. Built on Hyperledger Fabric
                with AI fraud detection and zero-knowledge privacy.
              </p>
            </div>

            {/* Official Links */}
            <div>
              <h4 className="text-xs font-bold text-[hsl(43,96%,56%)] uppercase tracking-[0.15em] mb-5">
                Official Links
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/about", label: "About Credora" },
                  { to: "/verify", label: "Verify Credentials" },
                  { to: "/gov", label: "Government Portal" },
                  { to: "/signup", label: "Sign Up / Sign In" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight className="h-3 w-3 text-white/30" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-[hsl(43,96%,56%)] uppercase tracking-[0.15em] mb-5">
                Legal & Compliance
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/privacy", label: "Privacy Policy" },
                  { to: "/terms", label: "Terms of Service" },
                  { to: "/accessibility", label: "Accessibility" },
                  { to: "/security", label: "Security Policy" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight className="h-3 w-3 text-white/30" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-xs font-bold text-[hsl(43,96%,56%)] uppercase tracking-[0.15em] mb-5">
                Support
              </h4>
              <ul className="space-y-3">
                {[
                  { to: "/contact", label: "Contact Us" },
                  { to: "/faq", label: "FAQ" },
                  { to: "/docs", label: "Documentation" },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <ChevronRight className="h-3 w-3 text-white/30" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 mt-5">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="GitHub Repository"
                >
                  <Github className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Official Website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-white/10 pt-8">
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <p className="text-xs text-white/40 leading-relaxed">
                <strong className="text-white/60">Official Notice:</strong> Credora
                is a government-grade credential management platform built on Hyperledger
                Fabric. Credentials are verified through AI fraud detection and stored
                immutably on a permissioned blockchain. Zero-knowledge proofs ensure
                privacy. Submitted to MeitY Blockchain India Challenge 2024.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/40">
              <p>© 2024 Credora Networks. MeitY Blockchain India Challenge.</p>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3 w-3" /> Hyperledger Fabric
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" /> AI Fraud Detection
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
