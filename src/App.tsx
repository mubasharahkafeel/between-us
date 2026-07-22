import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { 
  Heart, Home, Book, Image as ImageIcon, Mail, User, 
  Flame, Clock, Calendar, Sparkles, Smile, MessageCircle, 
  Send, ChevronLeft, ChevronRight, MapPin, Camera, Lock,
  Plus, X, Check, ArrowRight
} from 'lucide-react';


// --- Mock Initial State ---
const INITIAL_STATE = {
  theme: 'light',
  me: {
    name: "Mubasharah",
    avatar: "https://api.dicebear.com/9.x/micah/svg?seed=Mubasharah&backgroundColor=ffdfbf,ffd5dc",
    mood: "🥺 Missing you",
    hasSharedToday: false
  },
  partner: {
    name: "Usman",
    avatar: "https://api.dicebear.com/9.x/micah/svg?seed=Usman&backgroundColor=b6e3f4,c0aede",
    mood: "🥰 Happy",
    hasSharedToday: true
  },
  relationship: {
    startDate: new Date('2024-07-10'),
    nextMeetDate: new Date('2026-12-01'), // December 2026 estimate
    distance: "13,144 miles",
    currentStreak: 0,
    longestStreak: 0
  },
  diaryEntries: [
    {
      id: 1,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      author: 'Usman',
      text: "Today was exhausting, but your call made everything better.",
      reactions: ['❤️', '🥹']
    },
    {
      id: 2,
      date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      author: 'Mubasharah',
      text: "I wanted to call you all day. Miss you ❤️ Had a pretty good day at work though.",
      reactions: ['🫂']
    }
  ],
  memories: [
    "July 9, 2024 - The day our very first conversation began.",
    "July 10, 2024 - The day our relationship officially started.",
    "July 9, 2025 - The first time we met in our lives.",
    "July 10, 2025 - The day we got to spend time alone together and created so many beautiful, unforgettable memories.",
    "Our first video call that lasted 4 hours",
    "The first time you said I love you",
    "That random 3 AM conversation about aliens",
  ],
  letters: [
    { id: 1, title: "Open when you miss me", unlockDate: null, author: "Usman", isOpened: false },
    { id: 2, title: "Open on our anniversary", unlockDate: new Date('2027-07-10'), author: "Usman", isOpened: false },
  ],
  dailyQuestion: "What is one memory of us that instantly makes you smile?"
};

const AppContext = createContext();


// --- Reusable UI Components ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-rose-50/50 dark:border-slate-700/50 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = "", fullWidth = false }) => {
  const baseStyle = "px-6 py-3 rounded-2xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-rose-400 text-white hover:bg-rose-500 shadow-rose-200 dark:shadow-none shadow-md",
    secondary: "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-slate-700 dark:text-rose-300",
    outline: "border-2 border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-slate-600 dark:text-slate-300",
    ghost: "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
  };
  
  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
        <div className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};


// --- Tabs ---
const HomeTab = () => {
  const { state, dispatch } = useContext(AppContext);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareText, setShareText] = useState("");
  const [showHearts, setShowHearts] = useState(false);

  // Calculate days together
  const daysTogether = Math.floor((new Date() - state.relationship.startDate) / (1000 * 60 * 60 * 24));
  const daysUntilMeet = Math.ceil((state.relationship.nextMeetDate - new Date()) / (1000 * 60 * 60 * 24));

  const handleShare = () => {
    if (!shareText.trim()) return;
    dispatch({ type: 'ADD_DIARY_ENTRY', payload: { text: shareText, author: state.me.name } });
    setIsShareModalOpen(false);
    setShareText("");
  };

  const triggerHearts = () => {
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Profiles */}
      <div className="flex justify-between items-center relative">
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
             <img src={state.me.avatar} className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover" alt="Me" />
             <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm text-xs border border-slate-100 dark:border-slate-700">
                {state.me.mood.split(' ')[0]}
             </div>
          </div>
          <span className="text-sm font-medium dark:text-slate-200">{state.me.name}</span>
        </div>

        <div className="flex flex-col items-center justify-center flex-1">
           <div className="bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full text-xs text-rose-500 dark:text-rose-400 font-semibold mb-2 flex items-center gap-1">
             <MapPin size={12} /> {state.relationship.distance}
           </div>
           <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600">
             <div className="h-px w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
             <Heart size={20} className="text-rose-300 animate-pulse fill-rose-300" />
             <div className="h-px w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-2 relative cursor-pointer" onClick={triggerHearts}>
          {showHearts && (
             <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                <Heart size={16} className="text-rose-500 animate-bounce fill-rose-500" style={{ animationDelay: '0ms' }} />
                <Heart size={20} className="text-pink-400 animate-bounce fill-pink-400" style={{ animationDelay: '100ms' }} />
                <Heart size={14} className="text-rose-400 animate-bounce fill-rose-400" style={{ animationDelay: '200ms' }} />
             </div>
          )}
          <div className="relative hover:scale-105 transition-transform">
             <img src={state.partner.avatar} className="w-16 h-16 rounded-full border-4 border-white dark:border-slate-800 shadow-sm object-cover" alt="Partner" />
             <div className="absolute -bottom-1 -left-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm text-xs border border-slate-100 dark:border-slate-700">
                {state.partner.mood.split(' ')[0]}
             </div>
          </div>
          <span className="text-sm font-medium dark:text-slate-200">{state.partner.name}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex flex-col items-center justify-center p-4 text-center">
          <Flame className={`mb-1 ${state.me.hasSharedToday && state.partner.hasSharedToday ? 'text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-slate-300 dark:text-slate-600'}`} size={28} />
          <span className="text-2xl font-bold text-slate-800 dark:text-white">{state.relationship.currentStreak}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Day Streak</span>
        </Card>
        
        <Card className="flex flex-col items-center justify-center p-4 text-center">
           <Calendar className="text-rose-400 mb-1" size={28} />
           <span className="text-2xl font-bold text-slate-800 dark:text-white">{daysTogether}</span>
           <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Days Together</span>
        </Card>
      </div>

      {/* Countdown Card */}
      <Card className="bg-gradient-to-r from-rose-100 to-pink-50 dark:from-slate-800 dark:to-slate-800/80 border-none relative overflow-hidden">
        <div className="absolute -right-4 -top-4 text-rose-200 dark:text-slate-700 opacity-50">
          <Clock size={80} />
        </div>
        <div className="relative z-10">
          <p className="text-sm text-rose-600/80 dark:text-rose-300 font-medium mb-1">Seeing you in Dec 2026 (~)</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-rose-500 dark:text-rose-400">{daysUntilMeet}</span>
            <span className="text-lg font-bold text-rose-400/80 dark:text-rose-300/80">days</span>
          </div>
          <p className="text-xs text-rose-500/60 dark:text-slate-400 mt-2 font-medium">Date isn't fixed, but my heart is ready 🥹❤️</p>
        </div>
      </Card>

      {/* Daily Check-in Card */}
      <Card className="flex flex-col items-center text-center p-6 border-2 border-rose-100 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">How was your day?</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Leave a little piece of your day for {state.partner.name}.</p>
        
        {!state.me.hasSharedToday ? (
           <Button className="w-full mb-6 animate-pulse shadow-lg" onClick={() => setIsShareModalOpen(true)}>
             <Sparkles size={18} /> Share Your Day
           </Button>
        ) : (
           <div className="w-full py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-2xl mb-6 font-medium flex items-center justify-center gap-2">
             <Check size={18} /> You shared today!
           </div>
        )}

        <div className="w-full flex justify-between items-center text-sm px-2">
          <div className="flex items-center gap-2">
             <img src={state.me.avatar} className="w-6 h-6 rounded-full" alt="Me" />
             <span className={state.me.hasSharedToday ? "text-green-500 font-medium" : "text-slate-400"}>
               {state.me.hasSharedToday ? "✓ Shared" : "Waiting..."}
             </span>
          </div>
          <div className="flex items-center gap-2">
             <span className={state.partner.hasSharedToday ? "text-green-500 font-medium" : "text-slate-400"}>
               {state.partner.hasSharedToday ? "✓ Shared" : "Waiting..."}
             </span>
             <img src={state.partner.avatar} className="w-6 h-6 rounded-full" alt="Partner" />
          </div>
        </div>
        
        {state.me.hasSharedToday && state.partner.hasSharedToday && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 w-full text-xs text-rose-500 dark:text-rose-400 font-semibold">
            Streak saved! You both showed up today ❤️
          </div>
        )}
      </Card>

      {/* Daily Question */}
      <Card className="bg-slate-50 dark:bg-slate-800 border-dashed">
        <div className="flex gap-3">
           <div className="mt-1 bg-white dark:bg-slate-700 p-2 rounded-full h-fit shadow-sm">
             <MessageCircle size={18} className="text-indigo-400" />
           </div>
           <div>
             <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1 block">Daily Question</span>
             <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
               "{state.dailyQuestion}"
             </p>
             <button className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-2 hover:underline">
               Answer in Diary &rarr;
             </button>
           </div>
        </div>
      </Card>

      {/* Share Modal */}
      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Your Day">
        <textarea 
          className="w-full h-40 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-rose-200 dark:focus:ring-slate-600 resize-none outline-none dark:text-white"
          placeholder={`Tell ${state.partner.name} about your day... what made you smile?`}
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
        />
        <div className="flex gap-2 mt-4">
           <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
             <ImageIcon size={20} />
           </button>
           <button className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors">
             <Smile size={20} />
           </button>
           <div className="flex-1"></div>
           <Button onClick={handleShare} className="px-8">Post</Button>
        </div>
      </Modal>
    </div>
  );
};


const DiaryTab = () => {
  const { state } = useContext(AppContext);
  
  // Group entries by date (mocking simple display)
  const sortedEntries = [...state.diaryEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatDate = (dateString) => {
    const options = { month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="flex justify-between items-center sticky top-0 bg-rose-50/90 dark:bg-slate-900/90 backdrop-blur-md pt-2 pb-4 z-10">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{state.me.name} & {state.partner.name}'s Diary</h1>
        <button className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm text-rose-500">
          <Calendar size={20} />
        </button>
      </div>

      <div className="space-y-8 relative">
        {/* Vertical Timeline Line */}
        <div className="absolute left-6 top-2 bottom-2 w-px bg-rose-200 dark:bg-slate-700 -z-10"></div>

        {sortedEntries.map((entry, index) => {
          const isMe = entry.author === state.me.name;
          const avatar = isMe ? state.me.avatar : state.partner.avatar;
          
          return (
            <div key={entry.id} className="relative">
              {/* Date Header (if it was grouped, for now just show date on each or assume same day) */}
              {index === 0 || formatDate(entry.date) !== formatDate(sortedEntries[index-1].date) ? (
                 <div className="ml-14 mb-4 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 bg-rose-50 dark:bg-slate-900 inline-block px-2">
                   {formatDate(entry.date)}
                 </div>
              ) : null}

              <div className="flex gap-4 items-start">
                <div className="bg-white dark:bg-slate-800 p-1 rounded-full shadow-sm border border-rose-100 dark:border-slate-700 z-10 mt-1">
                   <img src={avatar} alt={entry.author} className="w-8 h-8 rounded-full" />
                </div>
                
                <Card className={`flex-1 p-4 ${isMe ? 'bg-rose-50/50 dark:bg-slate-800' : 'bg-white dark:bg-slate-800'}`}>
                  <div className="flex justify-between items-center mb-2">
                     <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{entry.author}</span>
                     <span className="text-xs text-slate-400">
                       {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                     </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-3 whitespace-pre-wrap">
                    {entry.text}
                  </p>
                  
                  {/* Reactions Bar */}
                  <div className="flex gap-2 items-center">
                    {entry.reactions?.map((reaction, i) => (
                      <span key={i} className="bg-white dark:bg-slate-700 shadow-sm rounded-full px-2 py-1 text-sm border border-slate-100 dark:border-slate-600">
                        {reaction}
                      </span>
                    ))}
                    <button className="text-slate-300 dark:text-slate-500 hover:text-rose-400 text-xs ml-auto flex items-center gap-1">
                      <Plus size={14} /> React
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


const UsTab = () => {
  const { state } = useContext(AppContext);
  const [randomMemory, setRandomMemory] = useState(null);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const pullRandomMemory = () => {
    const memory = state.memories[Math.floor(Math.random() * state.memories.length)];
    setRandomMemory(memory);
    setIsMemoryModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white pt-2">{state.me.name} & {state.partner.name}</h1>

      {/* Memory Jar */}
      <Card className="bg-gradient-to-br from-amber-50 to-rose-50 dark:from-slate-800 dark:to-slate-800 border-none text-center p-8 relative overflow-hidden">
        <Sparkles className="absolute top-4 left-4 text-amber-200" size={24} />
        <Sparkles className="absolute bottom-4 right-4 text-rose-200" size={20} />
        
        <div className="w-20 h-24 mx-auto bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-t-3xl rounded-b-xl border-4 border-white/80 dark:border-slate-600 shadow-inner flex items-center justify-center mb-4 relative">
           <div className="absolute top-0 w-full h-3 bg-amber-100/80 dark:bg-slate-600/80 rounded-t-xl -mt-3"></div>
           <Heart className="text-rose-400 fill-rose-200/50" size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Memory Jar</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Take a trip down memory lane. {state.memories.length} memories saved.</p>
        
        <Button variant="secondary" onClick={pullRandomMemory} className="mx-auto rounded-full">
           Pull a Memory
        </Button>
      </Card>

      {/* Milestones */}
      <div>
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Flame className="text-orange-500" size={18}/> Core Milestones
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
           <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
             <div className="text-3xl mb-2">💬</div>
             <p className="text-sm font-bold text-slate-700 dark:text-slate-200">First Chat</p>
             <p className="text-xs text-slate-400 mt-1">July 9, 2024</p>
           </div>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
             <div className="text-3xl mb-2">✈️</div>
             <p className="text-sm font-bold text-slate-700 dark:text-slate-200">First Meet</p>
             <p className="text-xs text-slate-400 mt-1">July 9, 2025</p>
           </div>
           <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 text-center">
             <div className="text-3xl mb-2">✨</div>
             <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Our Day</p>
             <p className="text-xs text-rose-400 mt-1">July 10, 2025</p>
           </div>
        </div>
      </div>

      {/* Photo Gallery Mock */}
      <div>
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <Camera size={18} className="text-indigo-400"/> Photo Dump
           </h3>
           <button className="text-xs text-rose-500 font-medium">View All</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map((i) => (
             <div key={i} className="aspect-square bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden relative">
               <img src={`https://picsum.photos/seed/us${i}/200`} alt="Memory" className="w-full h-full object-cover" />
             </div>
          ))}
        </div>
      </div>

      {/* Memory Modal */}
      <Modal isOpen={isMemoryModalOpen} onClose={() => setIsMemoryModalOpen(false)} title="A Special Memory">
        <div className="text-center py-8">
           <Heart className="mx-auto text-rose-400 fill-rose-100 mb-4" size={48} />
           <p className="text-lg font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed">
             "{randomMemory}"
           </p>
        </div>
      </Modal>
    </div>
  );
};


const LettersTab = () => {
  const { state } = useContext(AppContext);
  
  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      <div className="flex justify-between items-center pt-2 mb-2">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Letters</h1>
        <Button variant="secondary" className="px-3 py-2 text-sm"><Plus size={16}/> New</Button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-6">Private words for special moments.</p>

      <div className="space-y-4">
        {state.letters.map((letter) => {
          const isLocked = letter.unlockDate && new Date(letter.unlockDate) > new Date();
          
          return (
            <Card key={letter.id} className={`relative overflow-hidden ${isLocked ? 'opacity-80 grayscale-[20%]' : ''}`}>
              <div className="flex gap-4 items-center">
                <div className={`p-3 rounded-full ${isLocked ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'}`}>
                  {isLocked ? <Lock size={24} /> : <Mail size={24} />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100">{letter.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    From {letter.author}
                    {isLocked && letter.unlockDate && (
                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded ml-2">
                        Opens {new Date(letter.unlockDate).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                {!isLocked && (
                  <button className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition">
                    <ArrowRight size={20} />
                  </button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  );
};


const ProfileTab = () => {
  const { state, dispatch } = useContext(AppContext);
  
  const toggleTheme = () => {
    dispatch({ type: 'TOGGLE_THEME' });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        dispatch({ type: 'UPDATE_AVATAR', payload: { avatar: reader.result } });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white pt-2">Settings</h1>
      
      <div className="flex flex-col items-center relative">
        <div className="relative">
          <img src={state.me.avatar} className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md mb-4 object-cover" alt="Me" />
          <label htmlFor="avatar-upload" className="absolute bottom-4 right-0 bg-rose-500 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-rose-600 transition-colors">
            <Camera size={14} />
          </label>
          <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
        <h2 className="text-xl font-bold dark:text-white">{state.me.name}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Paired with {state.partner.name} ❤️</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2 mb-2">App Settings</h3>
        
        <Card className="p-2 divide-y divide-slate-100 dark:divide-slate-700/50">
           <div className="flex justify-between items-center p-3">
             <span className="text-sm font-medium dark:text-slate-200">Dark Mode</span>
             <button 
                onClick={toggleTheme}
                className={`w-12 h-6 rounded-full transition-colors relative ${state.theme === 'dark' ? 'bg-rose-400' : 'bg-slate-200'}`}
             >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${state.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
             </button>
           </div>
           <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
             <span className="text-sm font-medium dark:text-slate-200">Notifications</span>
             <span className="text-xs text-slate-400">On &rarr;</span>
           </div>
           <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
             <span className="text-sm font-medium dark:text-slate-200">App Theme Color</span>
             <div className="flex gap-2">
               <div className="w-4 h-4 rounded-full bg-rose-400 border border-slate-200"></div>
               <div className="w-4 h-4 rounded-full bg-indigo-400"></div>
               <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
             </div>
           </div>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2 mb-2">Privacy & Data</h3>
        <Card className="p-2 divide-y divide-slate-100 dark:divide-slate-700/50">
           <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-slate-700 dark:text-slate-200">
             <span className="text-sm font-medium">Export Memories</span>
           </div>
           <div className="flex justify-between items-center p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition text-red-500">
             <span className="text-sm font-medium">Unpair & Delete Data</span>
           </div>
        </Card>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  // Custom Reducer-like state management for simplicity in single file
  const [state, setState] = useState(INITIAL_STATE);

  const dispatch = (action) => {
    switch (action.type) {
      case 'ADD_DIARY_ENTRY':
        setState(prev => {
          const newEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            author: action.payload.author,
            text: action.payload.text,
            reactions: []
          };
          return {
            ...prev,
            diaryEntries: [newEntry, ...prev.diaryEntries],
            me: { ...prev.me, hasSharedToday: true },
            relationship: {
              ...prev.relationship,
              // Simple mock logic: if partner also shared, increase streak
              currentStreak: prev.partner.hasSharedToday && !prev.me.hasSharedToday 
                ? prev.relationship.currentStreak + 1 
                : prev.relationship.currentStreak
            }
          };
        });
        break;
      case 'TOGGLE_THEME':
        setState(prev => ({
          ...prev,
          theme: prev.theme === 'light' ? 'dark' : 'light'
        }));
        break;
      case 'UPDATE_AVATAR':
        setState(prev => ({
          ...prev,
          me: { ...prev.me, avatar: action.payload.avatar }
        }));
        break;
      default:
        break;
    }
  };

  // Apply theme class to body
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0f172a'; // slate-900
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#fff1f2'; // rose-50
    }
  }, [state.theme]);

  // Tab Rendering Logic
  const renderTab = () => {
    switch(activeTab) {
      case 'home': return <HomeTab />;
      case 'diary': return <DiaryTab />;
      case 'us': return <UsTab />;
      case 'letters': return <LettersTab />;
      case 'profile': return <ProfileTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      <div className={`min-h-screen font-sans ${state.theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
        {/* Main Content Area - Mobile constrained view */}
        <div className="max-w-md mx-auto min-h-screen bg-rose-50 dark:bg-slate-900 relative shadow-2xl sm:border-x sm:border-slate-200 dark:sm:border-slate-800 overflow-hidden">
          
          {/* Subtle Background Elements */}
          <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-rose-100/50 to-transparent dark:from-slate-800/50 dark:to-transparent pointer-events-none"></div>
          
          {/* Content Padding */}
          <div className="px-5 pt-8 h-full overflow-y-auto hide-scrollbar">
            {renderTab()}
          </div>

          {/* Bottom Navigation */}
          <div className="absolute bottom-0 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-rose-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center z-50">
            <NavButton icon={<Home />} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavButton icon={<Book />} label="Diary" isActive={activeTab === 'diary'} onClick={() => setActiveTab('diary')} />
            <NavButton icon={<Heart />} label="Us" isActive={activeTab === 'us'} onClick={() => setActiveTab('us')} />
            <NavButton icon={<Mail />} label="Letters" isActive={activeTab === 'letters'} onClick={() => setActiveTab('letters')} />
            <NavButton icon={<User />} label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          </div>
        </div>
      </div>
      
      {/* Required CSS for animations and hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes scale-in-center {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .scale-in-center { animation: scale-in-center 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both; }
      `}} />
    </AppContext.Provider>
  );
}

// Sub-component for Navigation Buttons to keep main cleaner
const NavButton = ({ icon, label, isActive, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'text-rose-500 scale-110' : 'text-slate-400 hover:text-rose-400'}`}
    >
      {React.cloneElement(icon, { size: 24, className: isActive ? 'fill-rose-100 dark:fill-rose-900/50' : '' })}
      <span className="text-[10px] font-semibold">{label}</span>
      {/* Active Indicator Dot */}
      {isActive && <div className="w-1 h-1 bg-rose-500 rounded-full absolute -bottom-2"></div>}
    </button>
  );
                  }
