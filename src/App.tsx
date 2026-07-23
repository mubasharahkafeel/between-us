import React, {
  useEffect,
  useMemo,
  useState,
  createContext,
  useContext,
  Component,
} from "react";

import {
  Heart,
  Home,
  Book,
  Mail,
  User,
  Flame,
  Clock,
  Calendar,
  Sparkles,
  MessageCircle,
  MapPin,
  Camera,
  Lock,
  Plus,
  X,
  Check,
  ArrowRight,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react";

import { supabase } from "./supabase";
window.addEventListener("error", (event) => {
  document.body.innerHTML = `
    <div style="padding:20px;color:red;background:white;font-family:monospace;white-space:pre-wrap;">
      <h2>APP ERROR</h2>
      <p>${event.message}</p>
      <p>${event.filename}:${event.lineno}:${event.colno}</p>
    </div>
  `;
});

window.addEventListener("unhandledrejection", (event) => {
  document.body.innerHTML = `
    <div style="padding:20px;color:red;background:white;font-family:monospace;white-space:pre-wrap;">
      <h2>PROMISE ERROR</h2>
      <p>${String(event.reason)}</p>
    </div>
  `;
});
/* =========================================================
   TYPES
========================================================= */
class ErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("APP CRASH:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "30px",
            background: "#111",
            color: "#ff6b6b",
            minHeight: "100vh",
            fontFamily: "monospace",
            whiteSpace: "pre-wrap",
          }}
        >
          <h1>Between Us crashed</h1>

          <p>{this.state.error?.message}</p>

          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
type Theme = "light" | "dark";

type TabName = "home" | "diary" | "us" | "letters" | "profile";

const validTabs: TabName[] = [
  "home",
  "diary",
  "us",
  "letters",
  "profile",
];

const getInitialTab = (): TabName => {
  const hash = window.location.hash
    .replace("#/", "")
    .replace("#", "") as TabName;

  if (validTabs.includes(hash)) {
    return hash;
  }

  const savedTab = localStorage.getItem("betweenUsActiveTab") as TabName;

  if (validTabs.includes(savedTab)) {
    return savedTab;
  }

  return "home";
};

type Person = {
  name: string;
  avatar: string;
  mood: string;
  hasSharedToday: boolean;
};

type Relationship = {
  startDate: string;
  nextMeetDate: string;
  distance: string;
  currentStreak: number;
  longestStreak: number;
};

type DiaryEntry = {
  id: string | number;
  date: string;
  author: string;
  text: string;
  reactions: string[];
};

type Letter = {
  id: string | number;
  title: string;
  unlockDate: string | null;
  author: string;
  isOpened: boolean;
};

type AppState = {
  theme: Theme;
  me: Person;
  partner: Person;
  relationship: Relationship;
  diaryEntries: DiaryEntry[];
  memories: string[];
  letters: Letter[];
  dailyQuestion: string;
};

type Action =
  | {
      type: "ADD_DIARY_ENTRY";
      payload: { text: string; author: string };
    }
  | { type: "TOGGLE_THEME" }
  | { type: "UPDATE_AVATAR"; payload: { avatar: string } }
  | { type: "UPDATE_PARTNER_AVATAR"; payload: { avatar: string } }
  | { type: "UPDATE_NAME"; payload: { name: string } }
  | { type: "UPDATE_PARTNER_NAME"; payload: { name: string } };

/* =========================================================
   INITIAL STATE
========================================================= */

const INITIAL_STATE: AppState = {
  theme: "light",

  me: {
    name: "Mubasharah",
    avatar:
      "https://api.dicebear.com/9.x/micah/svg?seed=Mubasharah&backgroundColor=ffdfbf,ffd5dc",
    mood: "🥺 Missing you",
    hasSharedToday: false,
  },

  partner: {
    name: "Usman",
    avatar:
      "https://api.dicebear.com/9.x/micah/svg?seed=Usman&backgroundColor=b6e3f4,c0aede",
    mood: "🥰 Happy",
    hasSharedToday: false,
  },

  relationship: {
    startDate: "2024-07-10",
    nextMeetDate: "2026-12-01",
    distance: "13,144 miles",
    currentStreak: 0,
    longestStreak: 0,
  },

  diaryEntries: [
    {
      id: 1,
      date: new Date(Date.now() - 86400000).toISOString(),
      author: "Usman",
      text: "Today was exhausting, but your call made everything better.",
      reactions: ["❤️", "🥺"],
    },
    {
      id: 2,
      date: new Date(Date.now() - 86400000).toISOString(),
      author: "Mubasharah",
      text:
        "I wanted to call you all day. Missed you a little extra today 🥺 My day was good, but it would've been better with you.",
      reactions: ["🥰"],
    },
  ],

  memories: [
    "July 9, 2024 - The day our very first conversation began.",
    "July 10, 2024 - The day our relationship officially started.",
    "July 9, 2025 - The first time we met in our lives.",
    "July 10, 2025 - The day we got to spend time alone together and created so many beautiful, unforgettable memories.",
    "Our first video call that lasted 4 hours.",
    "The first time you said I love you.",
    "That random 3 AM conversation about aliens.",
  ],

  letters: [
    {
      id: 1,
      title: "Open when you miss me",
      unlockDate: null,
      author: "Usman",
      isOpened: false,
    },
    {
      id: 2,
      title: "Open on our anniversary",
      unlockDate: "2027-07-10T00:00:00",
      author: "Usman",
      isOpened: false,
    },
  ],

  dailyQuestion:
    "What is one memory of us that instantly makes you smile?",
};

/* =========================================================
   CONTEXT
========================================================= */

const AppContext = createContext<{
  state: AppState;
  dispatch: (action: Action) => void;
} | null>(null);

const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used inside AppContext.Provider");
  }

  return context;
};

/* =========================================================
   REUSABLE COMPONENTS
========================================================= */

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-rose-50/50 dark:border-slate-700/50 ${className}`}
  >
    {children}
  </div>
);

const Button = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  fullWidth = false,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  className?: string;
  fullWidth?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
}) => {
  const base =
    "px-6 py-3 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-rose-400 text-white hover:bg-rose-500 shadow-md shadow-rose-200 dark:shadow-none",
    secondary:
      "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-slate-700 dark:text-rose-300",
    outline:
      "border-2 border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-slate-600 dark:text-slate-300",
    ghost:
      "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
        <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
            {title}
          </h3>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/* =========================================================
   AUTH SCREEN
========================================================= */

const AuthScreen = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: name.trim(),
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Account created successfully ❤️");
        } else {
          setMessage(
            "Account created ❤️ Check your email and confirm your account, then come back and log in."
          );
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      setErrorMessage(error?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 via-rose-50 to-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-5">
            <Heart size={38} className="text-rose-400 fill-rose-200" />
          </div>

          <h1 className="text-4xl font-black text-slate-800">Between Us</h1>

          <p className="text-slate-500 mt-2">
            Your little place, no matter the distance.
          </p>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-rose-100 border border-rose-100">
          <div className="grid grid-cols-2 bg-slate-100 rounded-2xl p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage("");
                setMessage("");
              }}
              className={`py-3 rounded-xl text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Log in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage("");
                setMessage("");
              }}
              className={`py-3 rounded-xl text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">
                  Your name
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mubasharah"
                  className="mt-2 w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-2 w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 ml-1">
                Password
              </label>

              <div className="relative mt-2">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  className="w-full px-4 py-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-3">
                {errorMessage}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl p-3">
                {message}
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              className="mt-2"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Enter Between Us"
                : "Create Our Space"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-5">
            A private little space for two ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   HOME
========================================================= */

const HomeTab = () => {
  const { state, dispatch } = useApp();

  const [shareOpen, setShareOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [showHearts, setShowHearts] = useState(false);

  const start = new Date(`${state.relationship.startDate}T00:00:00`);
  const nextMeet = new Date(`${state.relationship.nextMeetDate}T00:00:00`);
  const now = new Date();

  const daysTogether = Math.max(
    0,
    Math.floor((now.getTime() - start.getTime()) / 86400000)
  );

  const daysUntilMeet = Math.max(
    0,
    Math.ceil((nextMeet.getTime() - now.getTime()) / 86400000)
  );

  const share = () => {
    if (!shareText.trim()) return;

    dispatch({
      type: "ADD_DIARY_ENTRY",
      payload: {
        text: shareText.trim(),
        author: state.me.name,
      },
    });

    setShareText("");
    setShareOpen(false);
  };

  const sendHearts = () => {
    setShowHearts(true);
    window.setTimeout(() => setShowHearts(false), 1800);
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img
              src={state.me.avatar}
              className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover"
              alt={state.me.name}
            />

            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 text-xs shadow">
              {state.me.mood.split(" ")[0]}
            </div>
          </div>

          <span className="text-sm font-medium dark:text-slate-200">
            {state.me.name}
          </span>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="bg-white/70 dark:bg-slate-800 px-3 py-1 rounded-full text-xs text-rose-500 font-semibold flex gap-1 items-center">
            <MapPin size={12} />
            {state.relationship.distance}
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-px bg-rose-200" />
            <Heart size={20} className="text-rose-400 fill-rose-300" />
            <div className="w-8 h-px bg-rose-200" />
          </div>
        </div>

        <button
          onClick={sendHearts}
          className="flex flex-col items-center gap-2 relative"
        >
          {showHearts && (
            <div className="absolute -top-10 flex gap-1">
              <Heart
                size={15}
                className="text-rose-500 fill-rose-500 animate-bounce"
              />
              <Heart
                size={20}
                className="text-pink-400 fill-pink-400 animate-bounce"
              />
              <Heart
                size={14}
                className="text-rose-300 fill-rose-300 animate-bounce"
              />
            </div>
          )}

          <div className="relative">
            <img
              src={state.partner.avatar}
              className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover"
              alt={state.partner.name}
            />

            <div className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-800 rounded-full p-1 text-xs shadow">
              {state.partner.mood.split(" ")[0]}
            </div>
          </div>

          <span className="text-sm font-medium dark:text-slate-200">
            {state.partner.name}
          </span>
        </button>
      </div>
            <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <Flame
            size={28}
            className={
              state.me.hasSharedToday && state.partner.hasSharedToday
                ? "text-orange-500 fill-orange-500"
                : "text-slate-300 dark:text-slate-600"
            }
          />

          <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {state.relationship.currentStreak}
          </span>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            Day Streak
          </span>
        </Card>

        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <Calendar size={28} className="text-rose-400" />

          <span className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {daysTogether}
          </span>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            Days Together
          </span>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-rose-100 to-pink-50 dark:from-slate-800 dark:to-slate-800 border-none relative overflow-hidden">
        <Clock
          size={90}
          className="absolute -right-5 -top-5 text-rose-200 dark:text-slate-700 opacity-50"
        />

        <div className="relative z-10">
          <p className="text-sm text-rose-600 dark:text-rose-300 font-medium">
            Seeing you again
          </p>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black text-rose-500 dark:text-rose-400">
              {daysUntilMeet}
            </span>

            <span className="text-lg font-bold text-rose-400">days</span>
          </div>

          <p className="text-xs text-rose-500/70 dark:text-slate-400 mt-2">
            Every day is one day closer to you ♡
          </p>
        </div>
      </Card>

      <Card className="text-center border-2 border-rose-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          How was your day?
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-5">
          Leave a little piece of your day for {state.partner.name}.
        </p>

        {!state.me.hasSharedToday ? (
          <Button fullWidth onClick={() => setShareOpen(true)}>
            <Sparkles size={18} />
            Share Your Day
          </Button>
        ) : (
          <div className="w-full py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl font-medium flex justify-center items-center gap-2">
            <Check size={18} />
            You shared today!
          </div>
        )}

        <div className="flex justify-between items-center mt-5 text-xs">
          <div className="flex items-center gap-2">
            <img
              src={state.me.avatar}
              className="w-7 h-7 rounded-full object-cover"
              alt=""
            />

            <span
              className={
                state.me.hasSharedToday
                  ? "text-green-500 font-medium"
                  : "text-slate-400"
              }
            >
              {state.me.hasSharedToday ? "✓ Shared" : "Waiting..."}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={
                state.partner.hasSharedToday
                  ? "text-green-500 font-medium"
                  : "text-slate-400"
              }
            >
              {state.partner.hasSharedToday ? "✓ Shared" : "Waiting..."}
            </span>

            <img
              src={state.partner.avatar}
              className="w-7 h-7 rounded-full object-cover"
              alt=""
            />
          </div>
        </div>
      </Card>

      <Card className="bg-slate-50 dark:bg-slate-800 border-dashed">
        <div className="flex gap-3">
          <div className="bg-white dark:bg-slate-700 p-2 rounded-full h-fit shadow-sm">
            <MessageCircle size={18} className="text-indigo-400" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Daily Question
            </span>

            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed mt-1">
              “{state.dailyQuestion}”
            </p>

            <button
              onClick={() => setShareOpen(true)}
              className="text-xs text-rose-500 font-semibold mt-3"
            >
              Answer in Diary →
            </button>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Your Day"
      >
        <textarea
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          placeholder={`Tell ${state.partner.name} about your day...`}
          className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl resize-none outline-none focus:ring-2 focus:ring-rose-200"
        />

        <Button fullWidth onClick={share} className="mt-4">
          Share with {state.partner.name}
        </Button>
      </Modal>
    </div>
  );
};

/* =========================================================
   DIARY
========================================================= */

const REACTION_EMOJIS = [
  "❤️",
  "🥺",
  "🥰",
  "😘",
  "😂",
  "😭",
  "🫶",
  "💗",
  "✨",
  "🤭",
  "🫂",
  "💋",
];

const DiaryTab = () => {
  const { state } = useApp();

  const [reactionEntry, setReactionEntry] =
    useState<DiaryEntry | null>(null);

  const [entries, setEntries] =
    useState<DiaryEntry[]>(state.diaryEntries);

  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    setEntries(state.diaryEntries);
  }, [state.diaryEntries]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [entries]
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const addReaction = (emoji: string) => {
    if (!reactionEntry) return;

    setEntries((current) =>
      current.map((entry) =>
        entry.id === reactionEntry.id
          ? {
              ...entry,
              reactions: [...(entry.reactions || []), emoji],
            }
          : entry
      )
    );

    setReactionEntry(null);
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="flex justify-between items-center sticky top-0 bg-rose-50/95 dark:bg-slate-900/95 backdrop-blur-md py-2 z-20">
        <div>
          <p className="text-xs text-rose-400 font-semibold mb-1">
            OUR LITTLE WORLD
          </p>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            {state.me.name} & {state.partner.name}'s Diary
          </h1>
        </div>

        <button
          onClick={() => setCalendarOpen(true)}
          className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-sm text-rose-500 active:scale-95 transition"
          aria-label="Open diary calendar"
        >
          <Calendar size={20} />
        </button>
      </div>

      {sortedEntries.length === 0 ? (
        <Card className="text-center py-10">
          <Book size={36} className="mx-auto text-rose-300 mb-3" />

          <h3 className="font-bold dark:text-white">Your diary is empty</h3>

          <p className="text-sm text-slate-400 mt-2">
            Your shared thoughts will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-8 relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-rose-200 dark:bg-slate-700" />

          {sortedEntries.map((entry, index) => {
            const isMe = entry.author === state.me.name;

            const avatar = isMe
              ? state.me.avatar
              : state.partner.avatar;

            const showDate =
              index === 0 ||
              formatDate(entry.date) !==
                formatDate(sortedEntries[index - 1].date);

            return (
              <div key={entry.id} className="relative">
                {showDate && (
                  <div className="ml-12 mb-3">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 bg-rose-50 dark:bg-slate-900 px-2">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                )}

                <div className="flex gap-3 items-start">
                  <div className="z-10 bg-white dark:bg-slate-800 p-1 rounded-full shadow-sm">
                    <img
                      src={avatar}
                      className="w-8 h-8 rounded-full object-cover"
                      alt={entry.author}
                    />
                  </div>

                  <Card
                    className={`flex-1 p-4 ${
                      isMe
                        ? "bg-rose-50/70 dark:bg-slate-800"
                        : "bg-white dark:bg-slate-800"
                    }`}
                  >
                    <div className="flex justify-between items-center gap-3">
                      <span className="font-semibold text-sm dark:text-slate-100">
                        {entry.author}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {new Date(entry.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2 whitespace-pre-wrap">
                      {entry.text}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      {entry.reactions?.map((emoji, i) => (
                        <button
                          key={`${entry.id}-${emoji}-${i}`}
                          className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full px-2.5 py-1 text-sm shadow-sm active:scale-90 transition"
                        >
                          {emoji}
                        </button>
                      ))}

                      <button
                        onClick={() => setReactionEntry(entry)}
                        className="ml-auto text-xs text-rose-400 font-semibold flex items-center gap-1 px-2 py-1 rounded-full hover:bg-rose-50 dark:hover:bg-slate-700"
                      >
                        <Plus size={14} />
                        React
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={reactionEntry !== null}
        onClose={() => setReactionEntry(null)}
        title="Send a reaction"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Pick something that says exactly how this made you feel.
        </p>

        <div className="grid grid-cols-4 gap-3">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => addReaction(emoji)}
              className="text-3xl bg-slate-50 dark:bg-slate-800 rounded-2xl aspect-square flex items-center justify-center hover:scale-110 active:scale-90 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Diary Calendar"
      >
        <div className="space-y-3">
          {Array.from(
            new Set(sortedEntries.map((entry) => formatDate(entry.date)))
          ).map((date) => {
            const count = sortedEntries.filter(
              (entry) => formatDate(entry.date) === date
            ).length;

            return (
              <div
                key={date}
                className="flex items-center justify-between p-4 bg-rose-50 dark:bg-slate-800 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-rose-400" />

                  <span className="font-medium text-sm dark:text-white">
                    {date}
                  </span>
                </div>

                <span className="text-xs bg-white dark:bg-slate-700 px-3 py-1 rounded-full text-slate-500 dark:text-slate-300">
                  {count} {count === 1 ? "entry" : "entries"}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
};

/* =========================================================
   US TAB
========================================================= */

const UsTab = () => {
  const { state } = useApp();

  const [memoryOpen, setMemoryOpen] = useState(false);
  const [addMemoryOpen, setAddMemoryOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const [randomMemory, setRandomMemory] = useState("");
  const [newMemory, setNewMemory] = useState("");

  const [memories, setMemories] =
    useState<string[]>(state.memories);

  const [photos, setPhotos] = useState<string[]>(() => {
    try {
      return JSON.parse(
        localStorage.getItem("betweenUsPhotos") || "[]"
      );
    } catch {
      return [];
    }
  });

    useEffect(() => {
    localStorage.setItem(
      "betweenUsPhotos",
      JSON.stringify(photos)
    );
  }, [photos]);

  const pullMemory = () => {
    if (!memories.length) return;

    const memory =
      memories[Math.floor(Math.random() * memories.length)];

    setRandomMemory(memory);
    setMemoryOpen(true);
  };

  const saveMemory = () => {
    if (!newMemory.trim()) return;

    setMemories((current) => [
      newMemory.trim(),
      ...current,
    ]);

    setNewMemory("");
    setAddMemoryOpen(false);
  };

  const uploadPhotos = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setPhotos((current) => [
            reader.result as string,
            ...current,
          ]);
        }
      };

      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  return (
    <div className="space-y-7 pb-28">
      <div className="pt-2">
        <p className="text-xs text-rose-400 font-semibold">
          OUR STORY
        </p>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
          {state.me.name} & {state.partner.name}
        </h1>
      </div>

      <Card className="bg-gradient-to-br from-amber-50 to-rose-50 dark:from-slate-800 dark:to-slate-800 border-none text-center p-7 relative overflow-hidden">
        <Sparkles
          className="absolute top-4 left-4 text-amber-300"
          size={22}
        />

        <Sparkles
          className="absolute bottom-4 right-4 text-rose-300"
          size={20}
        />

        <div className="w-20 h-24 mx-auto bg-white/70 dark:bg-slate-700/60 rounded-t-3xl rounded-b-xl border-4 border-white dark:border-slate-600 shadow-inner flex items-center justify-center mb-4">
          <Heart
            size={34}
            className="text-rose-400 fill-rose-200"
          />
        </div>

        <h2 className="text-xl font-bold dark:text-white">
          Memory Jar
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
          {memories.length} memories we never want to forget.
        </p>

        <div className="flex gap-2 justify-center mt-5">
          <Button
            variant="secondary"
            onClick={pullMemory}
            className="px-4"
          >
            <Sparkles size={16} />
            Pull
          </Button>

          <Button
            onClick={() => setAddMemoryOpen(true)}
            className="px-4"
          >
            <Plus size={16} />
            Add Memory
          </Button>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Flame size={18} className="text-orange-500" />
            Core Milestones
          </h3>

          <span className="text-xs text-slate-400">
            Our timeline
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <div className="text-3xl">💬</div>
            <p className="text-sm font-bold mt-2 dark:text-white">
              First Chat
            </p>
            <p className="text-xs text-slate-400 mt-1">
              July 9, 2024
            </p>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-3xl">❤️</div>
            <p className="text-sm font-bold mt-2 dark:text-white">
              Us, Officially
            </p>
            <p className="text-xs text-slate-400 mt-1">
              July 10, 2024
            </p>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-3xl">✈️</div>
            <p className="text-sm font-bold mt-2 dark:text-white">
              First Meet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              July 9, 2025
            </p>
          </Card>

          <Card className="p-4 text-center">
            <div className="text-3xl">✨</div>
            <p className="text-sm font-bold mt-2 dark:text-white">
              Our Special Day
            </p>
            <p className="text-xs text-rose-400 mt-1">
              July 10, 2025
            </p>
          </Card>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Camera size={18} className="text-indigo-400" />
            Photo Dump
          </h3>

          <button
            onClick={() => setGalleryOpen(true)}
            className="text-xs text-rose-500 font-semibold"
          >
            View All
          </button>
        </div>

        {photos.length === 0 ? (
          <label className="block cursor-pointer">
            <div className="border-2 border-dashed border-rose-200 dark:border-slate-700 rounded-3xl p-8 text-center bg-white/50 dark:bg-slate-800/40">
              <Camera
                size={32}
                className="mx-auto text-rose-300 mb-3"
              />

              <p className="font-semibold text-slate-700 dark:text-white">
                Add your real memories
              </p>

              <p className="text-xs text-slate-400 mt-1">
                No random photos — only yours.
              </p>

              <div className="inline-flex items-center gap-1 text-sm text-rose-500 font-semibold mt-4">
                <Plus size={16} />
                Add Photos
              </div>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={uploadPhotos}
            />
          </label>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 6).map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setGalleryOpen(true)}
                  className="aspect-square rounded-xl overflow-hidden bg-slate-100"
                >
                  <img
                    src={photo}
                    alt={`Memory ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            <label className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-rose-500 cursor-pointer bg-rose-50 dark:bg-slate-800 rounded-2xl py-3">
              <Plus size={17} />
              Add More Photos

              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={uploadPhotos}
              />
            </label>
          </>
        )}
      </div>

      <Modal
        isOpen={memoryOpen}
        onClose={() => setMemoryOpen(false)}
        title="A Special Memory"
      >
        <div className="text-center py-6">
          <Heart
            size={48}
            className="mx-auto text-rose-400 fill-rose-100 mb-5"
          />

          <p className="text-lg font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
            “{randomMemory}”
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={addMemoryOpen}
        onClose={() => setAddMemoryOpen(false)}
        title="Save a Memory"
      >
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Write something about the two of you that you never
          want to forget.
        </p>

        <textarea
          value={newMemory}
          onChange={(e) => setNewMemory(e.target.value)}
          placeholder="The day we..."
          className="w-full h-36 p-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl resize-none outline-none focus:ring-2 focus:ring-rose-200"
        />

        <Button
          fullWidth
          onClick={saveMemory}
          className="mt-4"
        >
          <Heart size={17} />
          Keep This Forever
        </Button>
      </Modal>

      <Modal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title="Our Photo Dump"
      >
        {photos.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">
            No photos added yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="aspect-square rounded-2xl overflow-hidden"
              >
                <img
                  src={photo}
                  alt={`Our memory ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
/* =========================================================
   LETTERS TAB
========================================================= */

const LettersTab = () => {
  const { state } = useApp();

  const [letters, setLetters] = useState<Letter[]>(state.letters);
  const [newLetterOpen, setNewLetterOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [unlockDate, setUnlockDate] = useState("");

  const [letterContents, setLetterContents] = useState<
    Record<string, string>
  >(() => {
    try {
      return JSON.parse(
        localStorage.getItem("betweenUsLetterContents") || "{}"
      );
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "betweenUsLetterContents",
      JSON.stringify(letterContents)
    );
  }, [letterContents]);

  const createLetter = () => {
    if (!title.trim() || !content.trim()) return;

    const id = Date.now();

    const newLetter: Letter = {
      id,
      title: title.trim(),
      unlockDate: unlockDate
        ? new Date(`${unlockDate}T00:00:00`).toISOString()
        : null,
      author: state.me.name,
      isOpened: false,
    };

    setLetters((current) => [newLetter, ...current]);

    setLetterContents((current) => ({
      ...current,
      [String(id)]: content.trim(),
    }));

    setTitle("");
    setContent("");
    setUnlockDate("");
    setNewLetterOpen(false);
  };

  const openLetter = (letter: Letter) => {
    const isLocked =
      letter.unlockDate &&
      new Date(letter.unlockDate).getTime() > Date.now();

    if (isLocked) return;

    setSelectedLetter(letter);
  };

  return (
    <div className="space-y-6 pb-28">
      <div className="flex justify-between items-center pt-2">
        <div>
          <p className="text-xs text-rose-400 font-semibold">
            WORDS FOR LATER
          </p>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            Letters
          </h1>
        </div>

        <Button
          variant="secondary"
          className="px-4 py-2"
          onClick={() => setNewLetterOpen(true)}
        >
          <Plus size={16} />
          New
        </Button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Write something they can keep, open now, or save for a
        special day.
      </p>

      <div className="space-y-4">
        {letters.map((letter) => {
          const isLocked = Boolean(
            letter.unlockDate &&
              new Date(letter.unlockDate).getTime() > Date.now()
          );

          return (
            <button
              key={letter.id}
              type="button"
              onClick={() => openLetter(letter)}
              className="w-full text-left"
            >
              <Card
                className={`relative overflow-hidden transition active:scale-[0.98] ${
                  isLocked ? "opacity-80" : ""
                }`}
              >
                <div className="flex gap-4 items-center">
                  <div
                    className={`p-3 rounded-full ${
                      isLocked
                        ? "bg-slate-100 dark:bg-slate-700 text-slate-400"
                        : "bg-rose-100 dark:bg-rose-900/30 text-rose-500"
                    }`}
                  >
                    {isLocked ? (
                      <Lock size={24} />
                    ) : (
                      <Mail size={24} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {letter.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      From {letter.author}
                    </p>

                    {isLocked && letter.unlockDate && (
                      <p className="text-[11px] text-rose-400 mt-2">
                        Opens{" "}
                        {new Date(
                          letter.unlockDate
                        ).toLocaleDateString(undefined, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>

                  {!isLocked && (
                    <ArrowRight
                      size={20}
                      className="text-rose-400 shrink-0"
                    />
                  )}
                </div>
              </Card>
            </button>
          );
        })}
      </div>

      <Modal
        isOpen={newLetterOpen}
        onClose={() => setNewLetterOpen(false)}
        title="Write a Letter"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">
              Letter title
            </label>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Open when you miss me..."
              className="mt-2 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">
              Your letter
            </label>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Dear ${state.partner.name}...`}
              className="mt-2 w-full h-44 px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl resize-none outline-none focus:ring-2 focus:ring-rose-200"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">
              Keep locked until
            </label>

            <input
              type="date"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="mt-2 w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none"
            />

            <p className="text-[11px] text-slate-400 mt-2">
              Leave this empty if they can open it immediately.
            </p>
          </div>

          <Button fullWidth onClick={createLetter}>
            <Mail size={17} />
            Save Letter
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={selectedLetter !== null}
        onClose={() => setSelectedLetter(null)}
        title={selectedLetter?.title || "Letter"}
      >
        {selectedLetter && (
          <div className="py-4">
            <div className="w-14 h-14 mx-auto bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-5">
              <Heart
                size={27}
                className="text-rose-500 fill-rose-200"
              />
            </div>

            <p className="text-xs text-center text-slate-400 mb-5">
              From {selectedLetter.author}
            </p>

            <p className="text-slate-700 dark:text-slate-200 leading-7 whitespace-pre-wrap">
              {letterContents[String(selectedLetter.id)] ||
                "This little letter is waiting for its words. ❤️"}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* =========================================================
   PROFILE / SETTINGS
========================================================= */

const ProfileTab = () => {
  const { state, dispatch } = useApp();

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [editNameOpen, setEditNameOpen] = useState<
    "me" | "partner" | null
  >(null);

  const [nameDraft, setNameDraft] = useState("");

  const editName = (person: "me" | "partner") => {
    setNameDraft(
      person === "me" ? state.me.name : state.partner.name
    );

    setEditNameOpen(person);
  };

  const saveName = () => {
    if (!editNameOpen || !nameDraft.trim()) return;

    dispatch({
      type:
        editNameOpen === "me"
          ? "UPDATE_NAME"
          : "UPDATE_PARTNER_NAME",
      payload: {
        name: nameDraft.trim(),
      },
    });

    setEditNameOpen(null);
    setNameDraft("");
  };

  const readImage = (
    event: React.ChangeEvent<HTMLInputElement>,
    person: "me" | "partner"
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result !== "string") return;

      dispatch({
        type:
          person === "me"
            ? "UPDATE_AVATAR"
            : "UPDATE_PARTNER_AVATAR",
        payload: {
          avatar: reader.result,
        },
      });
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  const exportData = () => {
    const data = JSON.stringify(state, null, 2);

    const blob = new Blob([data], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "between-us-memories.json";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-7 pb-28">
      <div className="pt-2">
        <p className="text-xs text-rose-400 font-semibold">
          YOUR SPACE
        </p>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
          Settings
        </h1>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={state.me.avatar}
                alt={state.me.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
              />

              <label
                htmlFor="my-avatar"
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md active:scale-90 transition"
              >
                <Camera size={16} />
              </label>

              <input
                id="my-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readImage(e, "me")}
              />
            </div>

            <button
              onClick={() => editName("me")}
              className="mt-3 flex items-center gap-2 group"
            >
              <span className="font-bold dark:text-white">
                {state.me.name}
              </span>

              <span className="w-6 h-6 rounded-full bg-rose-50 dark:bg-slate-700 flex items-center justify-center text-[11px] text-rose-400 group-active:scale-90">
                ✦
              </span>
            </button>

            <span className="text-[11px] text-slate-400 mt-1">
              You
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <img
                src={state.partner.avatar}
                alt={state.partner.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
              />

              <label
                htmlFor="partner-avatar"
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md active:scale-90 transition"
              >
                <Camera size={16} />
              </label>

              <input
                id="partner-avatar"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => readImage(e, "partner")}
              />
            </div>

            <button
              onClick={() => editName("partner")}
              className="mt-3 flex items-center gap-2 group"
            >
              <span className="font-bold dark:text-white">
                {state.partner.name}
              </span>

              <span className="w-6 h-6 rounded-full bg-rose-50 dark:bg-slate-700 flex items-center justify-center text-[11px] text-rose-400 group-active:scale-90">
                ✦
              </span>
            </button>

            <span className="text-[11px] text-slate-400 mt-1">
              Your person
            </span>
          </div>
        </div>
      </Card>

       <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2 mb-3">
          App Settings
        </h3>

        <Card className="p-2 divide-y divide-slate-100 dark:divide-slate-700">
          <div className="flex justify-between items-center p-4">
            <div>
              <p className="text-sm font-medium dark:text-slate-200">
                Dark Mode
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Switch whenever your mood changes.
              </p>
            </div>

            <button
              onClick={() =>
                dispatch({
                  type: "TOGGLE_THEME",
                })
              }
              className={`w-12 h-7 rounded-full transition relative ${
                state.theme === "dark"
                  ? "bg-rose-400"
                  : "bg-slate-200"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                  state.theme === "dark"
                    ? "translate-x-[22px]"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center p-4">
            <div>
              <p className="text-sm font-medium dark:text-slate-200">
                Notifications
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                For shared thoughts and little updates.
              </p>
            </div>

            <button
              onClick={() =>
                setNotificationsEnabled((value) => !value)
              }
              className={`w-12 h-7 rounded-full transition relative ${
                notificationsEnabled
                  ? "bg-rose-400"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                  notificationsEnabled
                    ? "translate-x-[22px]"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <button
            onClick={exportData}
            className="w-full flex justify-between items-center p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl"
          >
            <div>
              <p className="text-sm font-medium dark:text-slate-200">
                Export Memories
              </p>

              <p className="text-[11px] text-slate-400 mt-1">
                Keep a copy of your current app data.
              </p>
            </div>

            <ArrowRight size={18} className="text-slate-300" />
          </button>
        </Card>
      </div>

      <Button
        variant="outline"
        fullWidth
        onClick={logout}
        className="border-slate-200 dark:border-slate-700"
      >
        <LogOut size={17} />
        Log Out
      </Button>

      <p className="text-center text-[11px] text-slate-400">
        Between Us ♡ made for your little world.
      </p>

      <Modal
        isOpen={editNameOpen !== null}
        onClose={() => setEditNameOpen(null)}
        title={
          editNameOpen === "partner"
            ? "Edit Their Name"
            : "Edit Your Name"
        }
      >
        <input
          autoFocus
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              saveName();
            }
          }}
          placeholder="Name or nickname"
          className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800 dark:text-white rounded-2xl outline-none focus:ring-2 focus:ring-rose-200"
        />

        <Button fullWidth onClick={saveName} className="mt-4">
          <Check size={17} />
          Save Name
        </Button>
      </Modal>
    </div>
  );
};
function NavButton({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all ${
        isActive
          ? "text-rose-500"
          : "text-slate-400 hover:text-rose-400"
      }`}
    >
      <div className={isActive ? "scale-110" : ""}>
        {icon}
      </div>

      <span className="text-[10px] font-medium">
        {label}
      </span>
    </button>
  );
}
/* =========================================================
   MAIN APP
========================================================= */

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<TabName>(getInitialTab);

  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("betweenUsData");

    if (!saved) return INITIAL_STATE;

    try {
      const parsed = JSON.parse(saved);

      return {
        ...INITIAL_STATE,
        ...parsed,

        me: {
          ...INITIAL_STATE.me,
          ...(parsed.me || {}),
        },

        partner: {
          ...INITIAL_STATE.partner,
          ...(parsed.partner || {}),
        },

        relationship: {
          ...INITIAL_STATE.relationship,
          ...(parsed.relationship || {}),
        },

        diaryEntries: Array.isArray(parsed.diaryEntries)
          ? parsed.diaryEntries
          : INITIAL_STATE.diaryEntries,

        memories: Array.isArray(parsed.memories)
          ? parsed.memories
          : INITIAL_STATE.memories,

        letters: Array.isArray(parsed.letters)
          ? parsed.letters
          : INITIAL_STATE.letters,
      };
    } catch {
      return INITIAL_STATE;
    }
  });

  /* -------------------------
     SUPABASE AUTH
  ------------------------- */

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;

        setSession(data.session);
        setAuthLoading(false);
      })
      .catch(() => {
        if (!mounted) return;

        setSession(null);
        setAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setAuthLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
useEffect(() => {
  if (!session?.user?.id) return;

  const loadProfiles = async () => {
    // 1. Get logged-in user's profile
    const { data: myProfile, error: myError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (myError || !myProfile) {
      console.error("Error loading my profile:", myError);
      return;
    }

    // 2. Get partner from the same couple
    const { data: partnerProfile, error: partnerError } = await supabase
      .from("profiles")
      .select("*")
      .eq("couple_id", myProfile.couple_id)
      .neq("id", session.user.id)
      .maybeSingle();

    if (partnerError) {
      console.error("Error loading partner profile:", partnerError);
    }

    // 3. Put Supabase data into the app
    setState((previous) => ({
      ...previous,

      me: {
        ...previous.me,
        name: myProfile.display_name || previous.me.name,
        avatar: myProfile.avatar_url || previous.me.avatar,
        mood: myProfile.mood || previous.me.mood,
      },

      partner: partnerProfile
        ? {
            ...previous.partner,
            name: partnerProfile.display_name || previous.partner.name,
            avatar: partnerProfile.avatar_url || previous.partner.avatar,
            mood: partnerProfile.mood || previous.partner.mood,
          }
        : previous.partner,
    }));
  };

  loadProfiles();
}, [session]);
  /* -------------------------
     DISPATCH
  ------------------------- */

  const dispatch = (action: Action) => {
    switch (action.type) {
      case "ADD_DIARY_ENTRY":
        if (session?.user?.id) {
  supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", session.user.id)
    .single()
    .then(({ data: profile, error: profileError }) => {
      if (profileError || !profile?.couple_id) {
        console.error("Could not find couple:", profileError);
        return;
      }

      supabase
        .from("diary_entries")
        .insert({
          couple_id: profile.couple_id,
          author_id: session.user.id,
          content: action.payload.text,
          entry_date: new Date().toISOString().split("T")[0],
        })
        .then(({ error }) => {
          if (error) {
            console.error("Error saving diary entry:", error);
          }
        });
    });
        }
        setState((previous) => {
          const newEntry: DiaryEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            author: action.payload.author,
            text: action.payload.text,
            reactions: [],
          };

          const shouldIncreaseStreak =
            previous.partner.hasSharedToday &&
            !previous.me.hasSharedToday;

          const newStreak = shouldIncreaseStreak
            ? previous.relationship.currentStreak + 1
            : previous.relationship.currentStreak;

          return {
            ...previous,

            diaryEntries: [
              newEntry,
              ...previous.diaryEntries,
            ],

            me: {
              ...previous.me,
              hasSharedToday: true,
            },

            relationship: {
              ...previous.relationship,
              currentStreak: newStreak,
              longestStreak: Math.max(
                previous.relationship.longestStreak,
                newStreak
              ),
            },
          };
        });

        break;

      case "TOGGLE_THEME":
        setState((previous) => ({
          ...previous,
          theme:
            previous.theme === "light"
              ? "dark"
              : "light",
        }));

        break;

      case "UPDATE_AVATAR":
        setState((previous) => ({
          ...previous,
          me: {
            ...previous.me,
            avatar: action.payload.avatar,
          },
        }));

        break;

      case "UPDATE_PARTNER_AVATAR":
        setState((previous) => ({
          ...previous,
          partner: {
            ...previous.partner,
            avatar: action.payload.avatar,
          },
        }));

        break;

      case "UPDATE_NAME":
        setState((previous) => ({
          ...previous,
          me: {
            ...previous.me,
            name: action.payload.name,
          },
        }));

        break;

      case "UPDATE_PARTNER_NAME":
        setState((previous) => ({
          ...previous,
          partner: {
            ...previous.partner,
            name: action.payload.name,
          },
        }));

        break;

      default:
        break;
    }
  };

/* -------------------------
     SAVE DATA
  ------------------------- */

  useEffect(() => {
    localStorage.setItem(
      "betweenUsData",
      JSON.stringify(state)
    );
  }, [state]);

  /* -------------------------
     THEME
  ------------------------- */

  useEffect(() => {
    if (state.theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#0f172a";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#fff1f2";
    }
  }, [state.theme]);

  /* -------------------------
     KEEP SAME PAGE ON REFRESH
  ------------------------- */

  const changeTab = (tab: TabName) => {
    setActiveTab(tab);

    localStorage.setItem(
      "betweenUsActiveTab",
      tab
    );

    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}#/${tab}`
    );
  };

  useEffect(() => {
    localStorage.setItem(
      "betweenUsActiveTab",
      activeTab
    );

    if (
      window.location.hash !==
      `#/${activeTab}`
    ) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#/${activeTab}`
      );
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
        .replace("#/", "")
        .replace("#", "") as TabName;

      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener(
      "hashchange",
      handleHashChange
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  /* -------------------------
     RESET DAILY STATUS
     AFTER LOCAL MIDNIGHT
  ------------------------- */

  useEffect(() => {
    const todayKey = new Date().toLocaleDateString(
      "en-CA"
    );

    const savedDay = localStorage.getItem(
      "betweenUsCurrentDay"
    );

    if (savedDay !== todayKey) {
      setState((previous) => ({
        ...previous,

        me: {
          ...previous.me,
          hasSharedToday: false,
        },

        partner: {
          ...previous.partner,
          hasSharedToday: false,
        },
      }));

      localStorage.setItem(
        "betweenUsCurrentDay",
        todayKey
      );
    }

    const interval = window.setInterval(() => {
      const currentDay =
        new Date().toLocaleDateString("en-CA");

      const storedDay =
        localStorage.getItem(
          "betweenUsCurrentDay"
        );

      if (storedDay !== currentDay) {
        setState((previous) => ({
          ...previous,

          me: {
            ...previous.me,
            hasSharedToday: false,
          },

          partner: {
            ...previous.partner,
            hasSharedToday: false,
          },
        }));

        localStorage.setItem(
          "betweenUsCurrentDay",
          currentDay
        );
      }
    }, 60000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

/* -------------------------
     RENDER TAB
  ------------------------- */

  const renderTab = () => {
    switch (activeTab) {
      case "home":
        return <HomeTab />;

      case "diary":
        return <DiaryTab />;

      case "us":
        return <UsTab />;

      case "letters":
        return <LettersTab />;

      case "profile":
        return <ProfileTab />;

      default:
        return <HomeTab />;
    }
  };

  /* -------------------------
     AUTH LOADING
  ------------------------- */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Heart
            size={44}
            className="mx-auto text-rose-400 fill-rose-200 animate-pulse"
          />

          <p className="text-sm text-slate-400 mt-4">
            Opening your little world...
          </p>
        </div>
      </div>
    );
  }

  /* -------------------------
     NOT LOGGED IN
  ------------------------- */

  if (!session) {
    return <AuthScreen />;
  }

  /* -------------------------
     APP
  ------------------------- */

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      <div
        className={`min-h-screen font-sans ${
          state.theme === "dark"
            ? "text-slate-200"
            : "text-slate-800"
        }`}
      >
        <div className="max-w-md mx-auto h-[100dvh] bg-rose-50 dark:bg-slate-900 relative shadow-2xl sm:border-x sm:border-slate-200 dark:sm:border-slate-800 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-rose-100/60 to-transparent dark:from-slate-800/60 dark:to-transparent pointer-events-none" />

          <main className="relative z-10 h-full overflow-y-auto hide-scrollbar px-5 pt-8">
            {renderTab()}
          </main>

          <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-rose-100 dark:border-slate-800 px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] flex justify-between items-center">
            <NavButton
              icon={<Home />}
              label="Home"
              isActive={
                activeTab === "home"
              }
              onClick={() =>
                changeTab("home")
              }
            />

            <NavButton
              icon={<Book />}
              label="Diary"
              isActive={
                activeTab === "diary"
              }
              onClick={() =>
                changeTab("diary")
              }
            />

            <NavButton
              icon={<Heart />}
              label="Us"
              isActive={
                activeTab === "us"
              }
              onClick={() =>
                changeTab("us")
              }
            />

            <NavButton
              icon={<Mail />}
              label="Letters"
              isActive={
                activeTab === "letters"
              }
              onClick={() =>
                changeTab("letters")
              }
            />

            <NavButton
              icon={<User />}
              label="Profile"
              isActive={
                activeTab === "profile"
              }
              onClick={() =>
                changeTab("profile")
              }
            />
          </nav>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }

              .hide-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }

              @keyframes scale-in-center {
                0% {
                  transform: scale(0.94);
                  opacity: 0;
                }

                100% {
                  transform: scale(1);
                  opacity: 1;
                }
              }

              .scale-in-center {
                animation: scale-in-center 0.22s ease-out both;
              }

              button,
              label,
              input,
              textarea {
                -webkit-tap-highlight-color: transparent;
              }
            `,
          }}
        />
      </div>
    </AppContext.Provider>
  );
}
