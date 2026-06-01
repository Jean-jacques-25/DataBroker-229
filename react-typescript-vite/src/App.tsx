import React, { useState, useEffect } from "react";
import { UserRole, AgentLevel, Mission, Submission, User, WithdrawalRequest } from "./types";
import Navbar from "./components/Navbar";
import AgentWorkspace from "./components/AgentWorkspace";
import ClientWorkspace from "./components/ClientWorkspace";
import AdminWorkspace from "./components/AdminWorkspace";
import SupportForm from "./components/SupportForm";
import Chatbot from "./components/Chatbot";
import { Sparkles, Shield, UserCheck, Phone, Mail, HelpCircle, FileText, AlertTriangle, ArrowRight, CheckCircle2, MessageSquare, Users } from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.AGENT);
  
  // Login form states
  const [phone, setPhone] = useState("");
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole>(UserRole.AGENT);
  const [showRegister, setShowRegister] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Global data states fetched from server
  const [missions, setMissions] = useState<Mission[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Page active tabs (Workspace vs Contact Support)
  const [currentTab, setCurrentTab] = useState<"workspace" | "support">("workspace");
  const [chatBotOpen, setChatBotOpen] = useState(false);

  // Sync state data
  const loadData = async (userPhone?: string) => {
    try {
      const resp1 = await fetch("/api/missions");
      if (resp1.ok) {
        const ms = await resp1.json();
        setMissions(ms);
      }

      const resp2 = await fetch("/api/admin/stats");
      if (resp2.ok) {
        const statsData = await resp2.json();
        setSubmissions(statsData.allSubmissions || []);
        setWithdrawals(statsData.allWithdrawals || []);
        
        const phoneToQuery = userPhone || currentUser?.phone;
        if (phoneToQuery) {
          const matchedUser = statsData.allUsers.find((u: any) => u.phone === phoneToQuery);
          if (matchedUser) {
            setCurrentUser(matchedUser);
          }
        }
      }

      const phoneToQueryNotif = userPhone || currentUser?.phone;
      if (phoneToQueryNotif) {
        const resp3 = await fetch(`/api/notifications?phone=${encodeURIComponent(phoneToQueryNotif)}`);
        if (resp3.ok) {
          const list = await resp3.json();
          setNotifications(list);
        }
      }
    } catch (err) {
      console.warn("Failed syncing API states:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser?.phone]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!phone) {
      setAuthError("Veuillez saisir votre numéro de téléphone.");
      return;
    }

    try {
      const resp = await fetch("/api/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAuthError(resData.error || "Une erreur s'est produite.");
      } else {
        setCurrentUser(resData.user);
        setActiveRole(resData.user.role);
        setAuthSuccess("Connexion réussie ! Chargement de l'espace de données.");
        loadData(resData.user.phone);
      }
    } catch (err) {
      setAuthError("Échec de la communication avec le serveur backend.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!regName || !regPhone || !regRole) {
      setAuthError("Le nom complet, le numéro de téléphone et le rôle sont indispensables.");
      return;
    }

    try {
      const resp = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          email: regEmail || undefined,
          role: regRole
        })
      });

      const resData = await resp.json();
      if (!resp.ok) {
        setAuthError(resData.error || "Echec de l'inscription.");
      } else {
        setAuthSuccess("Compte créé avec succès ! Connectez-vous à présent.");
        setPhone(regPhone);
        setShowRegister(false);
      }
    } catch (err) {
      setAuthError("Erreur lors de la communication.");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      setCurrentUser(null);
      setPhone("");
      setRegName("");
      setRegPhone("");
      setNotifications([]);
    } catch (err) {
      console.warn(err);
    }
  };

  const handleMarkNotifRead = async () => {
    if (!currentUser) return;
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: currentUser.phone })
      });
      loadData();
    } catch (err) {
      console.warn(err);
    }
  };

  // Écran d'accueil public (Non connecté)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 md:p-8 text-slate-100 space-y-12 overflow-x-hidden">
        
        {/* SECTION PRINCIPALE : CONNEXION & IDENTITÉ */}
        <div className="w-full max-w-4xl bg-[#121b15]/95 border-2 border-emerald-500/25 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Bloc de Gauche : Identité Visuelle */}
          <div className="md:col-span-5 p-6 md:p-10 bg-gradient-to-br from-emerald-950 to-slate-900 border-r border-emerald-500/10 flex flex-col justify-between text-slate-100">
            <div>
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">
                DB
              </div>
              <h2 className="text-2xl font-black mt-6 leading-tight">
                DataBroker229 <span className="text-emerald-500 underline decoration-yellow-400">🇧🇯</span>
              </h2>
              <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mt-1">Bénin</p>

              <blockquote className="mt-8 italic text-xs text-slate-300 border-l-2 border-emerald-500 pl-3">
                "Des données terrain fiables, partout au Bénin."
              </blockquote>
            </div>

            <div className="space-y-4 pt-8">
              <div className="text-xs space-y-1.5 font-medium text-slate-300">
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-500 shrink-0" /> jeanjacquesaguin30@gmail.com
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" /> WhatsApp : +229 55256871
                </p>
              </div>

              <p className="text-[10px] text-slate-500">
                © 2026 DataBroker229 Inc. Tous droits réservés.
              </p>
            </div>
          </div>

          {/* Bloc de Droite : Formulaires de Connexion / Inscription */}
          <div className="md:col-span-7 p-6 md:p-10 bg-slate-900 flex flex-col justify-center space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-white">
                {showRegister ? "Créez votre compte de données" : "Accédez à la plateforme"}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                {showRegister ? "Inscrivez-vous et commencez à opérer" : "Connexion sécurisée par numéro de téléphone"}
              </p>
            </div>

            {authError && (
              <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/40 p-3 rounded-lg font-bold">
                ⚠️ {authError}
              </p>
            )}

            {authSuccess && (
              <p className="text-xs text-emerald-450 bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-lg font-bold">
                {authSuccess}
              </p>
            )}

            {!showRegister ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">Numéro de Téléphone Béninois *</label>
                  <input
                    id="login-phone-input"
                    type="text"
                    required
                    placeholder="Ex : +22997000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-emerald-500 font-mono"
                  />
                </div>

                <button
                  id="submit-login-btn"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-xs py-3 rounded-xl transition-all uppercase tracking-widest shadow-lg"
                >
                  Entrer
                </button>

                <div className="text-center pt-2">
                  <button
                    id="toggle-register-btn"
                    type="button"
                    onClick={() => {
                      setShowRegister(true);
                      setAuthError("");
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Pas encore de compte ? S'inscrire ici
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Nom Complet *</label>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      placeholder="Ex: Koffi Saliou"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">N° de Téléphone *</label>
                    <input
                      id="reg-phone-input"
                      type="text"
                      required
                      placeholder="Ex: +22961000001"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Courriel (Optionnel)</label>
                    <input
                      id="reg-email-input"
                      type="email"
                      placeholder="koffi@gmail.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">Rôle d'utilisation *</label>
                    <select
                      id="reg-role-select"
                      required
                      value={regRole}
                      onChange={(e: any) => setRegRole(e.target.value)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-emerald-500"
                    >
                      <option value={UserRole.AGENT}>Agent de terrain (collecte relevés)</option>
                      <option value={UserRole.CLIENT}>Client d'Enquêtes (création & rapports)</option>
                    </select>
                  </div>
                </div>

                <button
                  id="submit-register-btn"
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-xs py-3 rounded-xl transition-all uppercase tracking-widest shadow-lg"
                >
                  S'inscrire
                </button>

                <div className="text-center pt-2">
                  <button
                    id="toggle-login-btn"
                    type="button"
                    onClick={() => {
                      setShowRegister(false);
                      setAuthError("");
                    }}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    Déjà inscrit ? Se connecter ici
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* -------------------- NOUVELLES SECTIONS MARKTING -------------------- */}
        
        <div className="w-full max-w-4xl space-y-12 pt-6 border-t border-slate-800">
          
          {/* À PROPOS & POUR QUI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-850/40 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                <Shield className="w-5 h-5" />
                <h4>À propos de DataBroker229</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                DataBroker229 est une plateforme technologique béninoise dédiée à la collecte, au traitement et à la centralisation de données terrain ultra-précises. Nous connectons les entreprises et porteurs de projets avec un réseau d'agents auditeurs certifiés pour assurer des analyses transparentes et fiables à travers tout le Bénin.
              </p>
            </div>

            <div className="bg-slate-850/40 p-6 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                <Users className="w-5 h-5" />
                <h4>Pour qui ?</h4>
              </div>
              <ul className="text-xs text-slate-300 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Entreprises & Institutions :</strong> Pour commander des enquêtes de marché précises et obtenir des rapports détaillés.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <span><strong>Agents de Terrain :</strong> Pour effectuer des relevés de données rémunérés directement depuis leurs smartphones.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* COMMENT ÇA MARCHE */}
          <div className="bg-slate-850/20 p-6 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-emerald-400 mb-6 text-center uppercase tracking-wider">Comment ça marche ?</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-slate-800 border border-emerald-500/30 rounded-full flex items-center justify-center font-bold text-emerald-400 text-sm shadow">1</div>
                <h5 className="text-xs font-bold text-white">Inscription rapide</h5>
                <p className="text-[11px] text-slate-400">Créez votre compte sécurisé avec votre numéro de téléphone béninois en choisissant votre rôle.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-slate-800 border border-emerald-500/30 rounded-full flex items-center justify-center font-bold text-emerald-400 text-sm shadow">2</div>
                <h5 className="text-xs font-bold text-white">Action sur le terrain</h5>
                <p className="text-[11px] text-slate-400">Les clients créent des requêtes d'enquêtes et les agents exécutent les missions géolocalisées associées.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-10 h-10 bg-slate-800 border border-emerald-500/30 rounded-full flex items-center justify-center font-bold text-emerald-400 text-sm shadow">3</div>
                <h5 className="text-xs font-bold text-white">Validation & Rapports</h5>
                <p className="text-[11px] text-slate-400">L'administration valide la conformité des flux et génère des statistiques prêtes à l'exploitation.</p>
              </div>
            </div>
          </div>

          {/* TÉMOIGNAGES */}
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-4 justify-center">
              <MessageSquare className="w-5 h-5" />
              <h4>Témoignages de nos utilisateurs</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 italic text-slate-300 text-xs relative">
                "Grâce à DataBroker229, nous avons pu auditer la présence de nos produits dans plus de 50 points de vente à Cotonou en moins de 48 heures. Fiable et ultra-rapide !"
                <span className="block mt-2 font-bold text-emerald-500 not-italic text-[10px]">— Directeur Commercial, Agro-Industrie</span>
              </div>
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 italic text-slate-300 text-xs relative">
                "En tant qu'agent de collecte, l'application fonctionne à merveille. Mes rapports sont soumis instantanément et le suivi des validations est transparent."
                <span className="block mt-2 font-bold text-emerald-500 not-italic text-[10px]">— Saliou K., Agent de Terrain</span>
              </div>
            </div>
          </div>

          {/* REJOINDRE / CONTACT */}
          <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 p-6 rounded-2xl border border-emerald-500/20 text-center space-y-3">
            <h4 className="text-sm font-bold text-white">Une question particulière ou un besoin sur-mesure ?</h4>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">Notre équipe technique et support commercial reste disponible en ligne pour vous guider dans l'intégration de vos projets de collecte massifs.</p>
            <div className="pt-2 flex justify-center gap-4 text-xs font-bold">
              <a href="https://wa.me/22955256871" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1">
                <Phone className="w-4 h-4" /> Nous contacter sur WhatsApp
              </a>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // Reste de l'application (Interface connectée inchangée pour garder l'historique intact)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotifRead}
        onLogout={handleLogout}
        activeRole={activeRole}
        onChangeRole={setActiveRole}
        openChatbot={() => setChatBotOpen(true)}
        openSupport={() => setCurrentTab("support")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 flex flex-col space-y-6">
        <div className="flex items-center space-x-1 border-b border-slate-200">
          <button
            id="tab-workspace"
            onClick={() => setCurrentTab("workspace")}
            className={`px-4 py-2 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all ${
              currentTab === "workspace"
                ? "border-emerald-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Données du Réseau
          </button>
          <button
            id="tab-support"
            onClick={() => setCurrentTab("support")}
            className={`px-4 py-2 text-xs font-extrabold tracking-wider uppercase border-b-2 transition-all ${
              currentTab === "support"
                ? "border-emerald-600 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            Signaler un Problème
          </button>
        </div>

        {currentTab === "support" ? (
          <SupportForm currentUser={currentUser} />
        ) : (
          <div>
            {activeRole === UserRole.AGENT && (
              <AgentWorkspace
                currentUser={currentUser}
                missions={missions}
                submissions={submissions}
                withdrawals={withdrawals.filter((w) => w.agentPhone === currentUser.phone)}
                onRefreshData={() => loadData()}
              />
            )}

            {activeRole === UserRole.CLIENT && (
              <ClientWorkspace
                currentUser={currentUser}
                missions={missions}
                submissions={submissions}
                onRefreshData={() => loadData()}
              />
            )}

            {activeRole === UserRole.ADMIN && (
              <AdminWorkspace onRefreshData={() => loadData()} />
            )}
          </div>
        )}
      </main>

      <Chatbot isOpen={chatBotOpen} onClose={() => setChatBotOpen(false)} />

      {!chatBotOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            id="floating-trigger-chatbot-btn"
            onClick={() => setChatBotOpen(true)}
            className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-all transform hover:scale-105"
            title="Poser une question à l'assistant virtuel"
          >
            <HelpCircle className="w-7 h-7" />
          </button>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800 px-4 md:px-8 shrink-0">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <div>
            <h5 className="text-sm font-black text-white">
              DataBroker229 <span className="text-emerald-500 underline decoration-yellow-400">🇧🇯</span> Bénin
            </h5>
            <p className="text-xs text-slate-400 mt-1">
              "Des données terrain fiables, partout au Bénin."
            </p>
          </div>
          <div className="text-xs space-y-0.5 md:text-right">
            <p>Assistance officielle WhatsApp : <a href="https://wa.me/22955256871" target="_blank" rel="noreferrer" className="text-emerald-400 font-extrabold font-mono hover:underline">+229 55256871</a></p>
            <p>Email commercial : <a href="mailto:jeanjacquesaguin30@gmail.com" className="text-indigo-400 font-mono hover:underline">jeanjacquesaguin30@gmail.com</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}