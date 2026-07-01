import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SEOHead from '../components/SEOHead';
import logo from "../assets/image.png"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import {
  Activity, Zap, Globe, Clock, Shield,
  CheckCircle2, ArrowRight, Server,
  RefreshCw, Lock, BarChart3, Cloud, Command,
  Star, Users, Award, Code, Heart, Database, Mail, Share2, Link2, ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── Helper function for ping data ────────────────────────────────
const generatePingData = () =>
  Array.from({ length: 15 }, (_, i) => ({
    time: `10:${i < 10 ? '0' + i : i}`,
    ms: Math.floor(Math.random() * 40) + 40,
    status: 'Up',
  }));

// ─── Live Ping Simulator ──────────────────────────────────────────
const LivePingSimulator = () => {
  const [data, setData] = useState(generatePingData());
  const [simStats, setSimStats] = useState({ uptime: 99.9, avgLatency: 52, checks: 142 });

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev.slice(1)];
        const lastTime = prev[prev.length - 1].time;
        const [h, m] = lastTime.split(':').map(Number);
        let nextM = m + 1;
        let nextH = h;
        if (nextM >= 60) { nextM = 0; nextH++; }
        const time = `${nextH}:${nextM < 10 ? '0' + nextM : nextM}`;
        const newMs = Math.floor(Math.random() * 60) + 45;
        newData.push({ time, ms: newMs, status: 'Up' });
        setSimStats(prev => ({
          uptime: parseFloat((prev.uptime * 0.99 + (newMs < 100 ? 100 : 99.5) * 0.01).toFixed(2)),
          avgLatency: Math.round(prev.avgLatency * 0.95 + newMs * 0.05),
          checks: prev.checks + 1
        }));
        return newData;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl shadow-lg">
          <p className="text-slate-500 dark:text-slate-400 text-xs mb-1 font-mono">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-900 dark:text-white font-mono font-bold text-sm">{payload[0].value}ms</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-2" />
          <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
            <Globe size={12} className="text-blue-500" /> my-startup.onrender.com
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">{simStats.checks} checks</span>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Shield size={10} className="text-emerald-500" /> Uptime</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">{simStats.uptime}%</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Zap size={10} className="text-blue-500" /> Latency</div>
            <div className="text-blue-600 dark:text-blue-400 font-bold text-lg">{simStats.avgLatency}ms</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Clock size={10} className="text-purple-500" /> Last Check</div>
            <div className="text-slate-700 dark:text-slate-200 font-bold text-lg flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Now
            </div>
          </div>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHeroMs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.12} />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Area type="monotone" dataKey="ms" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHeroMs)" isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400 font-mono border-t border-slate-100 dark:border-slate-700 pt-3">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-500" /> All systems operational</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            100% uptime (30d)
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Trust Badge ──────────────────────────────────────────────────
const TrustBadge = ({ icon: Icon, label, value, colorClass }) => (
  <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon size={18} />
    </div>
    <div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-bold text-slate-900 dark:text-white text-sm">{value}</div>
    </div>
  </div>
);

// ─── Initial Avatar Component (only first letter) ──────────────────
const InitialAvatar = ({ name }) => {
  const getInitial = () => {
    if (name) return name.charAt(0).toUpperCase();
    return '?';
  };

  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500'];
  const colorIndex = name ? name.length % colors.length : 0;

  return (
    <div className={`w-full h-full flex items-center justify-center font-bold text-white text-sm ${colors[colorIndex]}`}>
      {getInitial()}
    </div>
  );
};

// ─── Testimonial Carousel Component ──────────────────────────────
const TestimonialCarousel = () => {
  const testimonials = [
    { 
      name: 'Sneha Reddy', 
      role: 'Tech Lead', 
      company: 'Hyderabad', 
      text: 'We were spending hours manually checking our services. Pinglix automated everything. Best part? It\'s free for our small team and works like magic. Absolutely love it!' 
    },
    { 
      name: 'Mohd Aman', 
      role: 'Full Stack Developer', 
      company: 'Self-Employed', 
      text: 'I\'ve tried many monitoring tools, but Pinglix just gets it. Simple setup, beautiful dashboard, and the peace of mind knowing my APIs are always up. Totally worth it!' 
    },
    { 
      name: 'Zubair Khan ', 
      role: 'Front-end Developer', 
      company: 'Delhi NCR', 
      text: 'We use Pinglix for all our client projects. The uptime badges give our clients confidence, and the latency monitoring helps us catch issues before they become problems. Highly recommended!' 
    },
    { 
      name: 'Aarif', 
      role: 'Python Developer', 
      company: 'TechSolutions', 
      text: 'Honestly, Pinglix solved my biggest headache with free hosting cold starts. It runs quietly in the background and the latency charts are super helpful.' 
    },
    { 
      name: 'Aditya Patel', 
      role: 'Backend Engineer', 
      company: 'CloudWorks', 
      text: 'Really solid tool. We were looking for something simple that just works without the crazy pricing of other enterprise tools. Highly recommend it.' 
    },
    { 
      name: 'Priya Desai', 
      role: 'Freelance Developer', 
      company: 'Self-Employed', 
      text: 'Took me less than a minute to add my first monitor. The UI looks premium, and the public uptime badges are great for showing reliability to my clients.' 
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotate testimonials
  useEffect(() => {
    let interval;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      }, 4000); // Change every 4 seconds
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Get current testimonial
  const currentTestimonial = testimonials[currentIndex];

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Testimonial Card */}
      <div className="group bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 relative testimonial-card max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 border-2 border-blue-100 dark:border-blue-900/50">
            <InitialAvatar name={currentTestimonial.name} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {currentTestimonial.name}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {currentTestimonial.role} 
            </p>
          </div>
        </div>
        <div className="flex gap-0.5 mb-4">
          {[...Array(5)].map((_, idx) => (
            <Star key={idx} size={16} className="text-yellow-400 fill-yellow-400" />
          ))}
        </div>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed italic">
          "{currentTestimonial.text}"
        </p>
        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
          <Code size={18} className="text-blue-400" />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-8">
        <button
          onClick={goToPrevious}
          className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
          aria-label="Previous testimonial"
        >
          <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </button>

        {/* Dot Indicators */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'w-8 bg-blue-600 dark:bg-blue-400' 
                  : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goToNext}
          className="p-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm hover:shadow-md"
          aria-label="Next testimonial"
        >
          <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Counter */}
      <div className="text-center mt-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
        {currentIndex + 1} / {testimonials.length}
      </div>
    </div>
  );
};

// ─── Home Component ───────────────────────────────────────────────
const Home = () => {
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Only intersection observer for lazy loading - nothing else
  useEffect(() => {
    const sections = document.querySelectorAll('[data-lazy-section]');
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    sections.forEach(section => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  // ─── JSON-LD Structured Data for Home Page ─────────────────────
  const homeFaqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Pinglix?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pinglix is a free website uptime monitoring tool that continuously pings your web endpoints, tracks real-time latency, and prevents free-tier cold starts on platforms like Render and Heroku. It's trusted by 1,000+ developers worldwide."
        }
      },
      {
        "@type": "Question",
        "name": "Is Pinglix free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Pinglix is completely free to use. You can monitor unlimited websites, track uptime and latency, and prevent cold starts without any cost. Start monitoring in under 60 seconds."
        }
      },
      {
        "@type": "Question",
        "name": "How does Pinglix prevent cold starts on Render and Heroku?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pinglix periodically sends HTTP requests to your server at custom intervals (as low as every 1 minute). This keeps free-tier services like Render and Heroku from spinning down due to inactivity, preventing cold starts and ensuring instant response times for your users."
        }
      },
      {
        "@type": "Question",
        "name": "What platforms does Pinglix support?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pinglix works with any web-accessible URL. It's optimized for popular cloud platforms including Render, Heroku, Railway, Vercel, AWS, and DigitalOcean. If your service has a public URL, Pinglix can monitor it."
        }
      },
      {
        "@type": "Question",
        "name": "How often does Pinglix check my website?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can configure custom ping intervals from 1 minute to 60 minutes. Pinglix uses a background scheduler to perform checks at your specified interval without blocking the main application thread."
        }
      },
      {
        "@type": "Question",
        "name": "Does Pinglix provide uptime badges?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Pinglix generates public SVG uptime badges for each monitored website. You can embed these badges in your README, portfolio, or status page to showcase real-time uptime to your users and clients."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://pinglix.onrender.com/"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-blue-500/30 transition-colors duration-200">

      {/* ── SEO HEAD ── */}
      <SEOHead
        title="Pinglix – Free Website Uptime Monitor | Keep Servers Always Online"
        description="Pinglix monitors your websites 24/7 for free. Track real-time latency, prevent Render & Heroku cold starts, generate uptime badges. Trusted by 1,000+ developers. Start in 60 seconds."
        canonical="https://pinglix.onrender.com/"
        jsonLd={homeFaqSchema}
      />

      {/* Breadcrumb JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Navbar />


      {/* ── HERO ── */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                 Monitoring Infrastructure
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <Star key={i} size={13} className="text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">4.9 / 5</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Keep your servers <br />
              <span className="text-blue-600 dark:text-blue-400">always online.</span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed mb-8">
              Pinglix continuously tracks your endpoints, analyzes real-time latency, and prevents free-tier deployments from going to sleep. Trusted by <strong className="text-slate-900 dark:text-white">100+</strong> developers.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <TrustBadge icon={Users} label="Active Users" value="100+" colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
              <TrustBadge icon={Award} label="Uptime SLA" value="90%" colorClass="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" />
              <TrustBadge icon={Globe} label="Monitors Active" value="500+" colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" />
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 w-full sm:w-auto"
              >
                <Zap size={18} />
                Start Monitoring Free
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-200 shadow-sm w-full sm:w-auto"
              >
                <Command size={18} className="text-slate-400" />
                Sign In
              </Link>
            </div>

            {/* Social proof - avatars replaced with initials ONLY */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['Sarah', 'David', 'Elena', 'Mike'].map((name, i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 overflow-hidden bg-slate-200 dark:bg-slate-700"
                  >
                    <InitialAvatar name={name} />
                  </div>
                ))}
              </div>
              <div>
                <div className="text-sm font-semibold">Join 1,000+ developers</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Trusted by teams worldwide</div>
              </div>
            </div>
          </div>

        <div className="relative flex justify-center items-center">

    <div className="absolute w-[95%] h-[95%]
        bg-blue-500/20 blur-[120px] rounded-full"></div>

    <img
        src={logo}
        alt="Pinglix Dashboard – Real-time Website Uptime Monitoring Tool showing latency charts and uptime statistics"
        title="Pinglix – Free Website Uptime Monitor"
        loading="eager"
        className="relative z-10 w-full max-w-5xl
        hover:scale-[1.02]
        transition duration-700"
    />
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <div className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Built for deployments across top cloud providers</p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              { icon: Cloud, label: 'Vercel', color: 'text-blue-500' },
              { icon: Globe, label: 'Render', color: 'text-emerald-500' },
              { icon: Zap, label: 'Railway', color: 'text-yellow-500' },
              { icon: Server, label: 'Heroku', color: 'text-purple-500' },
              { icon: Activity, label: 'AWS', color: 'text-red-500' },
              { icon: Database, label: 'DigitalOcean', color: 'text-sky-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 font-black text-xl tracking-tighter text-slate-700 dark:text-slate-300">
                <item.icon size={22} className={item.color} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOCIAL PROOF STATS ── */}
      <section 
        data-lazy-section
        className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50/50 dark:bg-blue-900/10 border-b border-slate-200 dark:border-slate-800 lazy-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: Activity, value: '45+', label: 'Monitors Active' },
              { icon: Clock, value: '90%', label: 'Uptime SLA' },
              { icon: Users, value: '100+', label: 'Happy Developers' },
              { icon: RefreshCw, value: '90K+', label: 'Checks Performed' },
            ].map((stat, i) => (
              <div key={i} className="group stat-item">
                <div className="flex justify-center mb-3">
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all">
                    <stat.icon className="text-blue-600 dark:text-blue-400" size={22} />
                  </div>
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section 
        data-lazy-section
        className="py-24 px-4 sm:px-6 lg:px-8 lazy-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
           
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Enterprise-grade tracking, <br />simplified.</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              Everything you need to guarantee high availability for your applications, backed by modern architecture.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Activity, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', title: 'Real-time Latency', desc: 'Track millisecond response times instantly with beautiful, dynamic area charts and live monitoring.', popular: true },
              { icon: Shield, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', title: 'Cold-start Prevention', desc: 'Keep free-tier servers awake forever by simulating organic, consistent HTTP traffic patterns.', popular: false },
              { icon: Clock, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400', title: 'Micro-intervals', desc: 'Choose exactly how often we check your site, scaling down to 1-minute intervals for critical services.', popular: false },
        
              { icon: Lock, color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400', title: 'Secure Architecture', desc: 'Protected routes, HTTP-only JWT cookies, strict password hashing, and enterprise-grade security.', popular: false },
              { icon: RefreshCw, color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400', title: 'Global Scheduler', desc: 'Our centralized node-cron service handles background tasks without blocking the main application thread.', popular: false },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden feature-card"
                onMouseEnter={() => setHoveredFeature(i)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                {f.popular && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-blue-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider">Popular</span>
                  </div>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${f.color} group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon size={26} />
                </div>
                <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                {hoveredFeature === i && (
                  <div className="absolute bottom-6 right-6">
                    <ArrowRight size={18} className="text-blue-500 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section 
        data-lazy-section
        className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 lazy-section"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-full mb-4">
              <Heart size={13} className="text-red-500" />
              Developer Testimonials
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Loved by <span className="text-blue-600 dark:text-blue-400">1,000+</span> developers</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
              See why thousands of developers trust Pinglix to keep their infrastructure highly available.
            </p>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* ── FAQ SECTION ── */}
      <section
        data-lazy-section
        className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 lazy-section"
        aria-label="Frequently Asked Questions about Pinglix"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 px-4 py-2 rounded-full mb-4">
              <Activity size={13} className="text-blue-500" />
              FAQ
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked <span className="text-blue-600 dark:text-blue-400">Questions</span></h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to know about Pinglix – the free website uptime monitoring tool for developers.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What is Pinglix?',
                a: 'Pinglix is a free website uptime monitoring tool that continuously pings your web endpoints, tracks real-time latency, and prevents free-tier cold starts on platforms like Render and Heroku. Trusted by 1,000+ developers worldwide.'
              },
              {
                q: 'Is Pinglix free to use?',
                a: 'Yes, Pinglix is completely free. Monitor unlimited websites, track uptime and latency, and prevent cold starts — all at zero cost. Start monitoring in under 60 seconds with no credit card required.'
              },
              {
                q: 'How does Pinglix prevent Render & Heroku cold starts?',
                a: 'Pinglix sends periodic HTTP pings to your server at your chosen interval (as low as 1 minute). This keeps free-tier services active and prevents the spin-down that causes slow cold starts for your users.'
              },
              {
                q: 'What platforms does Pinglix support?',
                a: 'Pinglix works with any publicly accessible URL — Render, Heroku, Railway, Vercel, AWS, DigitalOcean, and more. If it has a URL, Pinglix can monitor it.'
              },
              {
                q: 'How often does Pinglix check my website?',
                a: 'You choose the interval — anywhere from every 1 minute to every 60 minutes. Our background scheduler handles checks without blocking your application.'
              },
              {
                q: 'Does Pinglix provide uptime badges?',
                a: 'Yes! Pinglix generates embeddable SVG uptime badges for each monitored site. Add them to your GitHub README or portfolio to show clients your real-time uptime stats.'
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-base pr-4 group-open:text-blue-600 dark:group-open:text-blue-400 transition-colors">
                    {item.q}
                  </h3>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 group-open:bg-blue-600 group-open:text-white transition-all duration-300">
                    <svg className="w-3 h-3 transition-transform duration-300 group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Mail size={16} className="text-blue-500 flex-shrink-0" />
              <a href="mailto:umohdfaizan@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
                umohdfaizan@gmail.com
              </a>
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Globe size={16} className="text-blue-500 flex-shrink-0" />
              <span className="font-medium">+91 8810743304</span>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              © {new Date().getFullYear()} Pinglix. All rights reserved.
            </span>
            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live
              </span>
              <span className="hidden xs:inline">•</span>
            </div>
          </div>
        </div>
      </footer>
      
      <style>{`
        .lazy-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .lazy-section.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lazy-section .stat-item,
        .lazy-section .feature-card,
        .lazy-section .testimonial-card {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .lazy-section.visible .stat-item:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .stat-item:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .stat-item:nth-child(3) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .stat-item:nth-child(4) { transition-delay: 0.4s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .feature-card:nth-child(1) { transition-delay: 0.05s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .feature-card:nth-child(2) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .feature-card:nth-child(3) { transition-delay: 0.15s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .feature-card:nth-child(4) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .feature-card:nth-child(5) { transition-delay: 0.25s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .feature-card:nth-child(6) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .testimonial-card:nth-child(1) { transition-delay: 0.1s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .testimonial-card:nth-child(2) { transition-delay: 0.2s; opacity: 1; transform: translateY(0); }
        .lazy-section.visible .testimonial-card:nth-child(3) { transition-delay: 0.3s; opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
};

export default Home;