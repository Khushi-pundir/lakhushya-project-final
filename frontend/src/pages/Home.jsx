import { useEffect, useState } from "react";
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
    description: "Create and track donations.",
  },
  {
    title: "NGOs",
    description: "Approve needs and receive support.",
  },
  {
    title: "Volunteers",
    description: "Handle pickup and final delivery.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeRole, setActiveRole] = useState(0);

  const scrollToLearn = () => {
    const section = document.getElementById("learn-more");
    if (!section) {
      return;
    }
    const y = section.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((current) => (current + 1) % features.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eff9f0_0%,#f7fcf8_45%,#ffffff_100%)] text-slate-800">
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
        <section className="relative min-h-[calc(100vh-81px)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(110,231,183,0.18),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(187,247,208,0.28),transparent_28%)]" />
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-100/60 blur-3xl animate-soft-float" />
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-lime-100/60 blur-3xl animate-soft-float-delayed" />
          <div className="relative mx-auto flex min-h-[calc(100vh-81px)] max-w-7xl items-center px-4 py-6 sm:px-6 lg:px-8">
            <div className="relative min-h-[calc(100vh-129px)] w-full overflow-hidden rounded-[40px] border border-emerald-100 shadow-2xl shadow-emerald-100/70">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,32,21,0.82)_0%,rgba(9,62,38,0.74)_34%,rgba(16,185,129,0.20)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(167,243,208,0.22),transparent_24%)]" />

              <div className="relative grid min-h-[calc(100vh-129px)] gap-10 px-6 py-10 sm:px-8 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-16">
                <div className="flex flex-col justify-center animate-rise-in">
                  <span className="inline-flex w-fit rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-emerald-50 ring-1 ring-white/20 backdrop-blur">
                From Giving to Impact
                  </span>
                  <h2 className="mt-6 max-w-3xl text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Every donation deserves a journey that feels human, trusted, and visible.
                  </h2>
                  <p className="mt-6 max-w-2xl text-base leading-8 text-emerald-50/90 sm:text-lg">
                    Lakhushya helps donors, NGOs, volunteers, and admins work in one connected flow so every donation can move from intention to delivery with clarity and purpose.
                  </p>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => navigate("/register")}
                      className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-400"
                    >
                      Get Started
                    </button>
                    <button
                      onClick={scrollToLearn}
                      className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15"
                    >
                      Explore Platform
                    </button>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {trustStats.map((stat) => (
                      <div key={stat.label} className="rounded-3xl border border-white/12 bg-white/10 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:bg-white/14">
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="mt-1 text-sm text-emerald-50/80">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative hidden items-end justify-end lg:flex">
                  <div className="grid gap-4 pb-4">
                    <div className="w-64 rounded-[28px] border border-white/12 bg-white/12 p-5 shadow-xl backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Real-Time Visibility</p>
                      <p className="mt-3 text-lg font-semibold text-white">Track donor, volunteer, and NGO movement in one clear flow.</p>
                    </div>
                    <div className="ml-12 w-60 rounded-[28px] border border-white/12 bg-white/12 p-5 shadow-xl backdrop-blur">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-100">Verified Handover</p>
                      <p className="mt-3 text-lg font-semibold text-white">Secure pickup and final delivery using OTP checkpoints.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="learn-more" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-emerald-100 bg-white p-8 shadow-sm animate-rise-in">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Why Lakhushya</p>
              <h3 className="mt-3 text-3xl font-bold text-emerald-950">Designed to make donations dependable, visible, and easy to trust.</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                The platform brings together structured donation intake, NGO verification, volunteer logistics, OTP checkpoints, and admin monitoring in one professional workflow.
              </p>
            </div>

            <div className="mt-8 rounded-[32px] border border-emerald-100 bg-[linear-gradient(135deg,#f6fef9_0%,#ffffff_100%)] p-4 shadow-sm">
              <div className="grid gap-6 lg:grid-cols-[0.28fr_0.72fr] lg:items-stretch">
                <div className="flex gap-2 overflow-x-auto lg:flex-col">
                  {features.map((feature, index) => {
                    const isActive = index === activeFeature;
                    return (
                      <button
                        key={feature.title}
                        onClick={() => setActiveFeature(index)}
                        className={`min-w-[180px] rounded-2xl px-4 py-4 text-left transition ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                            : "bg-white text-slate-600 hover:bg-emerald-50"
                        }`}
                      >
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isActive ? "text-emerald-100" : "text-emerald-600"}`}>
                          0{index + 1}
                        </p>
                        <p className="mt-2 text-sm font-semibold">{feature.title}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="relative overflow-hidden rounded-[28px] border border-slate-100 bg-white p-8 shadow-sm">
                  <div
                    key={features[activeFeature].title}
                    className="animate-rise-in"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      {features[activeFeature].title}
                    </p>
                    <h4 className="mt-4 text-3xl font-bold text-emerald-950">
                      {features[activeFeature].title === "Smart Matching" && "Nearest help, matched intelligently."}
                      {features[activeFeature].title === "Tracked Logistics" && "Every route stays visible from source to impact."}
                      {features[activeFeature].title === "Trusted Verification" && "A donation flow that feels secure at every step."}
                    </h4>
                    <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600">
                      {features[activeFeature].description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between">
                    <div className="flex gap-2">
                      {features.map((feature, index) => (
                        <button
                          key={feature.title}
                          onClick={() => setActiveFeature(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === activeFeature ? "w-10 bg-emerald-600" : "w-2.5 bg-emerald-200"
                          }`}
                          aria-label={`Show ${feature.title}`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setActiveFeature((activeFeature - 1 + features.length) % features.length)
                        }
                        className="rounded-full border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setActiveFeature((activeFeature + 1) % features.length)}
                        className="rounded-full border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-emerald-100 bg-white p-8 shadow-sm animate-rise-in lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Who It Serves</p>
              <h3 className="mt-3 text-3xl font-bold text-emerald-950">A simple flow for every role.</h3>

              <div className="mt-8 grid gap-6 lg:grid-cols-[0.28fr_0.72fr]">
                <div className="flex gap-2 overflow-x-auto lg:flex-col">
                  {roleCards.map((role, index) => {
                    const isActive = index === activeRole;
                    return (
                      <button
                        key={role.title}
                        onClick={() => setActiveRole(index)}
                        className={`min-w-[170px] rounded-2xl px-4 py-4 text-left transition ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                            : "bg-slate-50 text-slate-600 hover:bg-emerald-50"
                        }`}
                      >
                      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${isActive ? "text-emerald-100" : "text-emerald-600"}`}>
                          Role 0{index + 1}
                      </p>
                      <p className="mt-2 text-sm font-semibold">{role.title}</p>
                    </button>
                    );
                  })}
                </div>

                <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-[linear-gradient(135deg,#f6fef9_0%,#ffffff_100%)] p-6 shadow-sm lg:p-8">
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-48 bg-[radial-gradient(circle_at_center,rgba(110,231,183,0.18),transparent_70%)]" />
                  <div className="pointer-events-none absolute left-10 top-10 bottom-10 hidden w-px bg-gradient-to-b from-emerald-200 via-emerald-300 to-emerald-100 lg:block" />
                  <div key={roleCards[activeRole].title} className="animate-rise-in">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                      {roleCards[activeRole].title}
                    </p>
                    <h4 className="mt-4 text-3xl font-bold text-emerald-950">
                      {activeRole === 0 && "Give"}
                      {activeRole === 1 && "Coordinate"}
                      {activeRole === 2 && "Deliver"}
                    </h4>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                      {roleCards[activeRole].description}
                    </p>

                    <div className="mt-8 space-y-3">
                      {roleCards.map((role, index) => (
                        <div key={role.title} className="rounded-2xl border border-white bg-white p-4 shadow-sm transition hover:shadow-md lg:p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center pt-0.5">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold ${
                                index <= activeRole
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-100"
                                  : "border-emerald-200 bg-white text-emerald-400"
                              }`}>
                                0{index + 1}
                              </div>
                              {index < roleCards.length - 1 ? (
                                <div className={`mt-2 flex h-8 w-px justify-center ${
                                  index < activeRole ? "bg-emerald-300" : "bg-emerald-100"
                                }`} />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800">{role.title}</p>
                              <p className="mt-1 text-xs text-slate-500">{role.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[36px] border border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_100%)] p-8 shadow-sm animate-rise-in">
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
