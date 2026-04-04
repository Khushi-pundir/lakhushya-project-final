import { useNavigate } from "react-router-dom";
import heroImage from "../assets/hero.png";

const trustStats = [
  { value: "5,000+", label: "Donations Coordinated" },
  { value: "150+", label: "Verified NGO Partners" },
  { value: "50+", label: "Cities Reached" },
  { value: "24/7", label: "Donation Visibility" },
];

const features = [
  {
    title: "Smart Matching",
    description: "Connect donations to the nearest verified NGO and the most suitable volunteer flow.",
  },
  {
    title: "Tracked Logistics",
    description: "Follow every donation from donor source to NGO destination with clear status updates.",
  },
  {
    title: "Trusted Verification",
    description: "Secure pickup and delivery through OTP verification and admin-approved NGO onboarding.",
  },
];

const roleCards = [
  {
    title: "Donors",
    description: "Create donations confidently and see where your contribution goes.",
  },
  {
    title: "NGOs",
    description: "Manage incoming donations, publish needs, and coordinate fulfillment.",
  },
  {
    title: "Volunteers",
    description: "Accept tasks, verify OTP checkpoints, and complete last-mile logistics.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  const scrollToLearn = () => {
    const section = document.getElementById("learn-more");
    if (!section) {
      return;
    }
    const y = section.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4fbf2_0%,#fbfffc_46%,#ffffff_100%)] text-slate-800">
      <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-950">Lakhushya</h1>
            <p className="text-sm text-slate-500">Connecting Donations with Purpose</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={scrollToLearn}
              className="hidden rounded-full border border-emerald-200 px-5 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 sm:block"
            >
              Learn More
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
            >
              Login / Register
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(167,243,208,0.4),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(187,247,208,0.35),transparent_30%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
                From Giving to Impact
              </span>
              <h2 className="mt-6 max-w-2xl text-4xl font-bold leading-tight text-emerald-950 sm:text-5xl">
                A smarter donation logistics platform built on trust, clarity, and real impact.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                Lakhushya helps donors, NGOs, volunteers, and admins work in one connected flow so every donation can move from intention to delivery with visibility and purpose.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  Get Started
                </button>
                <button
                  onClick={scrollToLearn}
                  className="rounded-2xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Explore Platform
                </button>
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {trustStats.map((stat) => (
                  <div key={stat.label} className="rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
                    <p className="text-2xl font-bold text-emerald-700">{stat.value}</p>
                    <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="absolute -left-4 top-10 hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl lg:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Real-Time</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">Track donor, volunteer, and NGO flow</p>
              </div>
              <div className="absolute -right-2 bottom-8 hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl lg:block">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Verified</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">OTP-secured pickup and delivery</p>
              </div>
              <div className="overflow-hidden rounded-[36px] border border-emerald-100 bg-white p-3 shadow-2xl shadow-emerald-100/60">
                <img
                  src={heroImage}
                  alt="Lakhushya donation logistics"
                  className="h-full w-full rounded-[28px] object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="learn-more" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Why Lakhushya</p>
              <h3 className="mt-3 text-3xl font-bold text-emerald-950">Designed to make donations dependable, visible, and easy to trust.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The platform brings together structured donation intake, NGO verification, volunteer logistics, OTP checkpoints, and admin monitoring in one professional workflow.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-[28px] border border-slate-100 bg-slate-50 p-6 shadow-sm">
                  <h4 className="text-lg font-semibold text-emerald-900">{feature.title}</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-[36px] border border-emerald-100 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Who It Serves</p>
              <h3 className="mt-3 text-3xl font-bold text-emerald-950">Built for everyone involved in the donation chain.</h3>

              <div className="mt-8 space-y-4">
                {roleCards.map((role) => (
                  <div key={role.title} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm">
                    <p className="text-lg font-semibold text-slate-800">{role.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[36px] border border-emerald-100 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Platform Confidence</p>
              <h3 className="mt-3 text-3xl font-bold text-emerald-950">A more professional donation experience for every user role.</h3>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <InsightCard title="Admin Verification" text="NGOs can be approved before joining the active logistics network." />
                <InsightCard title="Volunteer Routing" text="Requests flow only after NGO approval to keep volunteer dashboards clean." />
                <InsightCard title="OTP Security" text="Pickup and handover both use OTP checkpoints for stronger trust." />
                <InsightCard title="Transparent Tracking" text="Distance, ETA, and routing help each donation stay accountable." />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Ready to Begin</p>
                <h3 className="mt-3 text-3xl font-bold text-emerald-950">Join Lakhushya and move donations with purpose.</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Register as a donor, NGO, or volunteer and take part in a platform focused on trustworthy logistics and meaningful outcomes.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/register")}
                  className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  Create Account
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="rounded-2xl border border-emerald-200 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InsightCard({ title, text }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}
