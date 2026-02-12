import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { 
  Trophy, 
  Users, 
  FileText, 
  ShieldCheck, 
  Globe, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  X,
  Settings,
  Download,
  Trash2,
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  Edit2,
  Plus,
  Phone,
  User,
  ShieldAlert
} from 'lucide-react';
import { Language, RegistrationData, Player, Message } from './types';
import { getTournamentAssistance } from './geminiService';

const ADMIN_PASSWORD = 'admin123';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputPassword, setInputPassword] = useState("");
  const correctPassword = "lohar789";   // apna password yahan change karo
  const [lang, setLang] = useState<Language>('ur');
  const [step, setStep] = useState<'welcome' | 'form' | 'success' | 'admin'>('welcome');
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  
  useEffect(() => {
  fetchRegistrations();
}, []);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);

  const [editingRegId, setEditingRegId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<RegistrationData, 'regId' | 'timestamp'>>({
    teamName: '',
    captainName: '',
    captainContact: '',
    viceCaptainName: '',
    viceCaptainContact: '',
    alternativeContact: '',
    players: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, name: '' })),
    teamType: 'non-jamaati',
    agreedToTerms: false
  });
  const toggleLang = () => setLang(prev => prev === 'en' ? 'ur' : 'en');

  const handlePlayerChange = (id: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      players: prev.players.map(p => p.id === id ? { ...p, name } : p)
    }));
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      captainName: '',
      captainContact: '',
      viceCaptainName: '',
      viceCaptainContact: '',
      alternativeContact: '',
      players: Array.from({ length: 11 }, (_, i) => ({ id: i + 1, name: '' })),
      teamType: 'non-jamaati',
      agreedToTerms: false
    });
    setEditingRegId(null);
  };

  const fetchRegistrations = async () => {
  try {
    const snapshot = await getDocs(collection(db, "registrations"));
    const data = snapshot.docs.map(docItem => ({
      regId: docItem.id,
      ...docItem.data()
    })) as RegistrationData[];

    setRegistrations(data.reverse());
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const isPlayersComplete = formData.players.every(p => p.name.trim() !== '');
  const isContactsComplete =
    formData.captainName &&
    formData.captainContact &&
    formData.viceCaptainName &&
    formData.viceCaptainContact &&
    formData.alternativeContact;

  if (formData.teamName && isPlayersComplete && isContactsComplete && formData.agreedToTerms) {

    try {
      if (editingRegId) {
        await updateDoc(doc(db, "registrations", editingRegId), {
          ...formData,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log("About to save:", formData);
        await addDoc(collection(db, "registrations"), {
        console.log("Saved successfully");
          ...formData,
          timestamp: new Date().toISOString()
        });
      }

      await fetchRegistrations();

      if (adminAuth) setStep('admin');
      else setStep('success');

      resetForm();

    } catch (error) {
      console.error("Error saving data:", error);
      alert("Error saving data");
    }

  } else {
    alert(lang === 'ur'
      ? 'براہ کرم تمام معلومات مکمل کریں'
      : 'Please complete all information');
  }
};

  const handleAdminLogin = async (e?: React.FormEvent) => {
  if (e) e.preventDefault();

  if (adminPasswordInput === ADMIN_PASSWORD) {
    setAdminAuth(true);
    setStep('admin');
    setIsLoginModalOpen(false);
    setAdminPasswordInput('');
    setLoginError(false);

    await fetchRegistrations();   // ab sahi chalega
  } else {
    setLoginError(true);
    setTimeout(() => setLoginError(false), 2000);
  }
};

  const startEdit = (reg: RegistrationData) => {
    setFormData({
      teamName: reg.teamName,
      captainName: reg.captainName || '',
      captainContact: reg.captainContact || '',
      viceCaptainName: reg.viceCaptainName || '',
      viceCaptainContact: reg.viceCaptainContact || '',
      alternativeContact: reg.alternativeContact || '',
      players: reg.players,
      teamType: reg.teamType,
      agreedToTerms: reg.agreedToTerms
    });
    setEditingRegId(reg.regId);
    setStep('form');
  };

  const exportToCSV = () => {
    if (registrations.length === 0) return;
    
    const headers = [
      'Reg ID', 'Date', 'Team Name', 'Type', 
      'Captain Name', 'Captain Contact', 
      'Vice Captain Name', 'Vice Captain Contact', 
      'Alternative Contact', 
      ...Array.from({length: 11}, (_, i) => `Player ${i+1}`)
    ];
    
    const rows = registrations.map(reg => [
      reg.regId,
      new Date(reg.timestamp).toLocaleDateString(),
      `"${reg.teamName}"`,
      reg.teamType,
      `"${reg.captainName}"`,
      `"${reg.captainContact}"`,
      `"${reg.viceCaptainName}"`,
      `"${reg.viceCaptainContact}"`,
      `"${reg.alternativeContact}"`,
      ...reg.players.map(p => `"${p.name}"`)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lohar_wadha_teams_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteRegistration = async (id: string) => {
  if (window.confirm(lang === 'ur'
    ? 'کیا آپ اس رجسٹریشن کو حذف کرنا چاہتے ہیں؟'
    : 'Delete this registration?')) {

    try {
      await deleteDoc(doc(db, "registrations", id));
      await fetchRegistrations();
    } catch (error) {
      console.error("Delete error:", error);
    }
  }
};

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { role: 'user', text: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);

    const history = messages.map(m => ({ 
      role: m.role, 
      parts: [{ text: m.text }] 
    }));

    const response = await getTournamentAssistance(chatInput, history);
    setMessages(prev => [...prev, { role: 'model', text: response || '' }]);
    setIsThinking(false);
  };

  const content = {
    en: {
      title: "Lohar Wadha Tournament",
      subtitle: "Official Registration Portal",
      announcement: "Registration for the upcoming Lohar Wadha Tournament is now open for all teams.",
      teamName: "Team Name",
      captainName: "Captain Name",
      captainContact: "Captain Contact Number",
      viceCaptainName: "Vice Captain Name",
      viceCaptainContact: "Vice Captain Contact Number",
      alternativeContact: "Alternative Contact Number",
      teamType: "Team Category",
      jamaati: "Jamaati",
      nonJamaati: "Non-Jamaati",
      player: "Player",
      terms: "Terms & Conditions",
      submit: editingRegId ? "Update Registration" : "Register Team",
      back: "Back",
      start: "Get Started",
      successTitle: "Registration Submitted!",
      successMsg: "Your team has been successfully registered. We will contact you soon with the schedule.",
      chatTitle: "Tournament Assistant",
      adminTitle: "Management Dashboard",
      totalTeams: "Total Registrations",
      export: "Download CSV",
      noData: "No registrations found.",
      loginTitle: "Management Login",
      loginPrompt: "Enter management password to access the dashboard",
      loginBtn: "Access Dashboard",
      invalidPass: "Invalid Password",
      addTeam: "Add New Team",
      editTeam: "Edit Team Details",
      rules: [
        "Tournament entry fee will be 10,000 per team.",
        "Entry fee must be paid before the tournament starts.",
        "Balls and tape will be provided by the committee.",
        "Punctuality is mandatory; late teams will face over cuts.",
        "Teams creating disturbance will be disqualified immediately.",
        "The umpire's decision will be final.",
        "Contact committee members directly for any complaints.",
        "Arguing with the umpire during the match is strictly prohibited.",
        "Only players listed in the form can play; no outsiders allowed.",
        "Matches will be 6 overs; semi-finals and finals will be 7 overs."
      ]
    },
    ur: {
      title: "لوہار وادھا ٹورنامنٹ",
      subtitle: "آفیشل رجسٹریشن پورٹل",
      announcement: "لوہار وادھا ٹورنامنٹ کے لیے ٹیموں کی رجسٹریشن کا باقاعدہ آغاز کیا جا رہا ہے۔",
      teamName: "ٹیم کا نام",
      captainName: "کپتان کا نام",
      captainContact: "کپتان کا رابطہ نمبر",
      viceCaptainName: "نائب کپتان کا نام",
      viceCaptainContact: "نائب کپتان کا رابطہ نمبر",
      alternativeContact: "متبادل رابطہ نمبر",
      teamType: "ٹیم کی قسم",
      jamaati: "جماعتی",
      nonJamaati: "غیر جماعتی",
      player: "کھلاڑی",
      terms: "قواعد و ضوابط",
      submit: editingRegId ? "معلومات اپ ڈیٹ کریں" : "رجسٹریشن مکمل کریں",
      back: "واپس",
      start: "رجسٹریشن شروع کریں",
      successTitle: "رجسٹریشن کامیاب!",
      successMsg: "آپ کی ٹیم کامیابی کے ساتھ رجسٹر ہو چکی ہے۔ ہم جلد ہی آپ سے شیڈول کے لیے رابطہ کریں گے۔",
      chatTitle: "ٹورنامنٹ اسسٹنٹ",
      adminTitle: "مینجمنٹ ڈیش بورڈ",
      totalTeams: "کل رجسٹریشنز",
      export: "CSV ڈاؤن لوڈ کریں",
      noData: "کوئی رجسٹریشن نہیں ملی۔",
      loginTitle: "مینجمنٹ لاگ ان",
      loginPrompt: "ڈیش بورڈ تک رسائی کے لیے مینجمنٹ پاس ورڈ درج کریں",
      loginBtn: "رسائی حاصل کریں",
      invalidPass: "غلط پاس ورڈ",
      addTeam: "نئی ٹیم شامل کریں",
      editTeam: "ٹیم کی معلومات تبدیل کریں",
      rules: [
        "ٹورنامنٹ کی انٹری فیس 10,000 روپے فی ٹیم ہوگی۔",
        "انٹری فیس ٹورنامنٹ شروع ہونے سے پہلے جمع کروانا ضروری ہے۔",
        "ٹورنامنٹ میں بالز اور ٹیپ کمیٹی فراہم کرے گی۔",
        "وقت کی پابندی ہر ٹیم پر لازم ہے، مقررہ وقت پر نہ آنے والی ٹیموں کے اوورز کاٹے جائیں گے۔",
        "ٹورنامنٹ میں بدمزگی پھیلانے والی ٹیم کو بلا تاخیر باہر کر دیا جائے گا۔",
        "امپائر کا فیصلہ حتمی ہوگا۔",
        "کسی بھی قسم کی شکایت ہو تو براہِ راست کمیٹی ممبران سے رابطہ کریں۔",
        "کسی بھی کھلاڑی کو دورانِ میچ امپائر سے بحث کرنا سختی سے منع ہے۔",
        "رجسٹریشن فارم پر دیے گئے کھلاڑیوں کے علاوہ کوئی بھی غیر مقصود کھلاڑی نہیں کھیل سکتا۔",
        "ٹورنامنٹ کا ہر میچ 6 اوورز پر مشتمل ہوگا جبکہ فائنل اور سیمی فائنل 7، 7 اوورز کے ہوں گے۔"
      ]
    }
  };

  const t = content[lang];
  const isRTL = lang === 'ur';

  if (!isLoggedIn) {
  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      flexDirection: "column",
      gap: "10px"
    }}>
      <h2>Enter Password to Access</h2>

      <input
        type="password"
        placeholder="Enter Password"
        value={inputPassword}
        onChange={(e) => setInputPassword(e.target.value)}
        style={{ padding: "8px" }}
      />

      <button
        onClick={() => {
          if (inputPassword === correctPassword) {
            setIsLoggedIn(true);
          } else {
            alert("Wrong Password");
          }
        }}
        style={{ padding: "8px 15px" }}
      >
        Login
      </button>
    </div>
  );
}

  return (
    <div className={`min-h-screen flex flex-col ${isRTL ? 'font-urdu' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
          setStep('welcome');
          resetForm();
        }}>
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-emerald-900 leading-tight">{t.title}</h1>
            <p className="text-xs text-emerald-600 font-medium opacity-80">{t.subtitle}</p>
          </div>
        </div>
        <button 
          onClick={toggleLang}
          className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors text-sm font-semibold text-gray-700"
        >
          <Globe size={16} />
          {lang === 'en' ? 'Urdu (اردو)' : 'English'}
        </button>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {step === 'welcome' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
              <div className="h-48 bg-emerald-700 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <Users size={80} className="text-emerald-300 relative z-10 opacity-50" />
                <h2 className="absolute text-3xl font-bold text-white z-10 bottom-6">{t.subtitle}</h2>
              </div>
              <div className="p-8">
                <div className="mb-8">
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    {t.announcement}
                  </p>
                  
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-xl shadow-inner">
                    <h3 className="flex items-center gap-2 font-bold text-amber-800 mb-4 text-xl">
                      <ShieldAlert size={24} className="text-amber-600" />
                      {t.terms}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {t.rules.map((rule, idx) => (
                        <div key={idx} className="bg-white/50 p-3 rounded-xl border border-amber-100 flex gap-3 items-start">
                          <span className="shrink-0 bg-amber-200 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-amber-700">
                            {idx + 1}
                          </span>
                          <p className="text-amber-900 text-sm leading-snug">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setStep('form')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-5 rounded-2xl shadow-xl hover:shadow-emerald-200/50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
                >
                  <FileText size={24} />
                  {t.start}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100">
              <div className="mb-8 border-b border-gray-100 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {editingRegId ? <Edit2 className="text-emerald-600" /> : <FileText className="text-emerald-600" />}
                  {editingRegId ? t.editTeam : t.subtitle}
                </h2>
              </div>

              {/* Team Basics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.teamName}</label>
                  <input 
                    required
                    type="text" 
                    value={formData.teamName}
                    onChange={e => setFormData({...formData, teamName: e.target.value})}
                    placeholder={lang === 'ur' ? 'ٹیم کا نام یہاں لکھیں' : 'Enter Team Name'}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none bg-gray-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.teamType}</label>
                  <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, teamType: 'jamaati'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.teamType === 'jamaati' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      {t.jamaati}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, teamType: 'non-jamaati'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.teamType === 'non-jamaati' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      {t.nonJamaati}
                    </button>
                  </div>
                </div>
              </div>

              {/* Captain and Contacts Section */}
              <div className="space-y-6 mb-10 p-6 bg-emerald-50/30 rounded-3xl border border-emerald-100/50">
                <h3 className="font-bold text-emerald-900 flex items-center gap-2 border-b border-emerald-100 pb-2">
                  <User size={18} className="text-emerald-600" />
                  {lang === 'ur' ? 'کپتان اور نائب کپتان کی معلومات' : 'Captain & Vice Captain Information'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Captain Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <User size={14} className="text-emerald-600" /> {t.captainName}
                      </label>
                      <input 
                        required
                        type="text" 
                        value={formData.captainName}
                        onChange={e => setFormData({...formData, captainName: e.target.value})}
                        placeholder={lang === 'ur' ? 'کپتان کا نام لکھیں' : 'Enter Captain Name'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Phone size={14} className="text-emerald-600" /> {t.captainContact}
                      </label>
                      <input 
                        required
                        type="tel" 
                        value={formData.captainContact}
                        onChange={e => setFormData({...formData, captainContact: e.target.value})}
                        placeholder="03xx-xxxxxxx"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Vice Captain Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <User size={14} className="text-emerald-600" /> {t.viceCaptainName}
                      </label>
                      <input 
                        required
                        type="text" 
                        value={formData.viceCaptainName}
                        onChange={e => setFormData({...formData, viceCaptainName: e.target.value})}
                        placeholder={lang === 'ur' ? 'نائب کپتان کا نام لکھیں' : 'Enter Vice Captain Name'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Phone size={14} className="text-emerald-600" /> {t.viceCaptainContact}
                      </label>
                      <input 
                        required
                        type="tel" 
                        value={formData.viceCaptainContact}
                        onChange={e => setFormData({...formData, viceCaptainContact: e.target.value})}
                        placeholder="03xx-xxxxxxx"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Alternative Contact - Full Width */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Phone size={14} className="text-emerald-600" /> {t.alternativeContact}
                    </label>
                    <input 
                      required
                      type="tel" 
                      value={formData.alternativeContact}
                      onChange={e => setFormData({...formData, alternativeContact: e.target.value})}
                      placeholder="03xx-xxxxxxx"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Players Grid */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Users className="text-emerald-600" size={20} />
                  {lang === 'ur' ? 'کھلاڑیوں کی فہرست (11 کھلاڑی لازمی ہیں)' : 'Players List (11 Players Mandatory)'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.players.map((player) => (
                    <div key={player.id} className="relative group">
                      <div className={`absolute top-1/2 -translate-y-1/2 px-3 text-emerald-600 opacity-50 font-bold ${isRTL ? 'right-0' : 'left-0'}`}>
                        {player.id}.
                      </div>
                      <input 
                        required
                        type="text" 
                        value={player.name}
                        onChange={(e) => handlePlayerChange(player.id, e.target.value)}
                        placeholder={`${t.player} ${player.id}`}
                        className={`w-full py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-2xl flex items-start gap-4 border border-gray-200">
                <input 
                  id="agree"
                  required
                  type="checkbox" 
                  checked={formData.agreedToTerms}
                  onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})}
                  className="mt-1 w-6 h-6 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer select-none font-medium leading-relaxed">
                  {lang === 'ur' 
                    ? 'میں تصدیق کرتا ہوں کہ میں نے تمام قواعد و ضوابط پڑھ لیے ہیں اور ان سے اتفاق کرتا ہوں۔ میں یہ بھی تصدیق کرتا ہوں کہ فراہم کردہ تمام معلومات درست ہیں۔'
                    : 'I confirm that I have read and agree to all terms and conditions. I also certify that all information provided is accurate.'}
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                type="button"
                onClick={() => {
                  if (adminAuth) setStep('admin');
                  else setStep('welcome');
                  resetForm();
                }}
                className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
              >
                {t.back}
              </button>
              <button 
                type="submit"
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:shadow-emerald-200/50 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={20} />
                {t.submit}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="max-w-md mx-auto text-center py-12 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-emerald-100 shadow-xl">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.successTitle}</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {t.successMsg}
            </p>
            <div className="p-6 border-2 border-dashed border-emerald-200 rounded-3xl bg-emerald-50/50 mb-8 text-left space-y-2" dir="ltr">
              <h4 className="font-bold text-emerald-900 text-lg">Team: {registrations[0]?.teamName}</h4>
              <p className="text-sm text-emerald-700 font-medium"><User className="inline h-3 w-3 mr-1" /> Captain: {registrations[0]?.captainName}</p>
              <p className="text-sm text-emerald-700 font-medium"><ShieldCheck className="inline h-3 w-3 mr-1" /> Type: {registrations[0]?.teamType.toUpperCase()}</p>
              <p className="text-xs text-gray-500 mt-2">Registration ID: <span className="font-black text-emerald-600">{registrations[0]?.regId}</span></p>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setStep('welcome');
              }}
              className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-emerald-700 transition-all"
            >
              {lang === 'ur' ? 'ہوم پیج پر جائیں' : 'Go to Homepage'}
            </button>
          </div>
        )}

        {step === 'admin' && adminAuth && (
          <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <button 
                  onClick={() => {
                    setStep('welcome');
                    resetForm();
                  }}
                  className="text-emerald-600 flex items-center gap-1 text-sm font-bold mb-2 hover:translate-x-[-4px] transition-transform"
                >
                  <ChevronLeft size={16} />
                  {t.back}
                </button>
                <h2 className="text-3xl font-bold text-gray-900">{t.adminTitle}</h2>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <button 
                  onClick={() => {
                    resetForm();
                    setStep('form');
                  }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md"
                >
                  <Plus size={18} />
                  {t.addTeam}
                </button>
                <button 
                  onClick={exportToCSV}
                  disabled={registrations.length === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                >
                  <Download size={18} />
                  {t.export}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium">{t.totalTeams}</p>
                <p className="text-4xl font-black text-emerald-600">{registrations.length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium">{t.jamaati}</p>
                <p className="text-4xl font-black text-blue-600">{registrations.filter(r => r.teamType === 'jamaati').length}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium">{t.nonJamaati}</p>
                <p className="text-4xl font-black text-orange-600">{registrations.filter(r => r.teamType === 'non-jamaati').length}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left" dir="ltr">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reg ID</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Team / Captain</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Vice Captain</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contacts</th>
                      <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          {t.noData}
                        </td>
                      </tr>
                    ) : (
                      registrations.map((reg) => (
                        <tr key={reg.regId} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-emerald-700 mb-1">{reg.regId}</div>
                            <div className="text-xs text-gray-400">{new Date(reg.timestamp).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900">{reg.teamName}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <User size={10} /> {reg.captainName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{reg.viceCaptainName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              reg.teamType === 'jamaati' 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {reg.teamType.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-xs text-gray-600 font-medium">C: {reg.captainContact}</div>
                            <div className="text-xs text-gray-600">V: {reg.viceCaptainContact}</div>
                            <div className="text-xs text-gray-400">A: {reg.alternativeContact}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => startEdit(reg)}
                                className="text-emerald-500 hover:text-emerald-700 p-2 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => deleteRegistration(reg.regId)}
                                className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="bg-emerald-600 p-8 text-center relative">
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">{t.loginTitle}</h3>
              <p className="text-emerald-100 text-sm mt-2 opacity-80">{t.loginPrompt}</p>
            </div>
            <form onSubmit={handleAdminLogin} className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <input 
                    autoFocus
                    type={showPassword ? "text" : "password"}
                    value={adminPasswordInput}
                    onChange={e => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 rounded-xl border ${loginError ? 'border-red-500 animate-shake' : 'border-gray-200'} focus:ring-2 focus:ring-emerald-500 transition-all outline-none`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 ${isRTL ? 'left-3' : 'right-3'}`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {loginError && (
                  <p className="text-red-500 text-xs font-bold animate-in slide-in-from-top-1">
                    {t.invalidPass}
                  </p>
                )}
              </div>
              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Lock size={18} />
                {t.loginBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* AI Assistant FAB & Chat */}
      <div className="fixed bottom-6 right-6 z-[60]" dir="ltr">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group relative"
          >
            <MessageSquare size={24} />
            <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs py-1 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Need Help?
            </span>
          </button>
        ) : (
          <div className="w-[90vw] sm:w-[380px] h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-4">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} />
                <span className="font-bold">{t.chatTitle}</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-emerald-500 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block max-w-[80%]">
                    <p className="text-sm text-gray-600">
                      Hello! I'm your Tournament Assistant. Ask me anything about the registration process or the new rules.
                    </p>
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    m.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 p-3 rounded-2xl shadow-sm flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-2 shrink-0">
              <input 
                type="text" 
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <button 
                onClick={handleChatSend}
                disabled={isThinking}
                className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="py-12 bg-white border-t border-gray-100 mt-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="font-bold text-gray-900 mb-1">By Order</p>
          <p className="text-gray-500 text-sm">Tournament Management - Lohar Wadha</p>
          
          <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} All Rights Reserved</p>
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors uppercase tracking-widest"
            >
              <Lock size={12} />
              {lang === 'ur' ? 'مینجمنٹ لاگ ان' : 'Management Login'}
            </button>
          </div>
        </div>
      </footer>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default App;
