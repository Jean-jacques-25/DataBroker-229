import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Compass,
  Award,
  Briefcase,
  Layers,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Camera,
  Search,
  AlertTriangle,
  FileText
} from "lucide-react";
import { Mission, Submission, User, FieldType, UserRole, AgentLevel } from "../types";

interface AgentWorkspaceProps {
  currentUser: User;
  missions: Mission[];
  submissions: Submission[];
  withdrawals: any[];
  onRefreshData: () => void;
}

export default function AgentWorkspace({
  currentUser,
  missions,
  submissions,
  withdrawals,
  onRefreshData
}: AgentWorkspaceProps) {
  const [filterCity, setFilterCity] = useState("");
  const [proximityOnly, setProximityOnly] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

  // Form states
  const [formAnswers, setFormAnswers] = useState<Record<string, string>>({});
  const [formPhoto, setFormPhoto] = useState<string>("");
  const [formGps, setFormGps] = useState<{ lat: number; lng: number } | null>(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Withdrawal states
  const [withdrawAmountPts, setWithdrawAmountPts] = useState(100);
  const [withdrawProvider, setWithdrawProvider] = useState<"MTN" | "MOOV" | "CELTIIS">("MTN");
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setFormGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => console.log("Géolocalisation indisponible localement")
      );
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!selectedMission) return;

    // Check validation
    for (const field of selectedMission.fields) {
      if (field.required && !formAnswers[field.id]) {
        setFormError(`Le champ "${field.label}" est obligatoire pour valider la collecte.`);
        return;
      }
    }

    if (selectedMission.requirePhoto && !formPhoto) {
      setFormError("Une photo d'étalage ou de structure est obligatoire pour cette campagne.");
      return;
    }

    setIsSubmitting(true);
    try {
      const resp = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: selectedMission.id,
          agentPhone: currentUser.phone,
          agentName: currentUser.name,
          answers: formAnswers,
          photoBase64: formPhoto,
          gpsLocation: formGps || coords || { lat: 6.3654, lng: 2.4183 }
        })
      });

      if (resp.ok) {
        setFormSuccess("Rapport de collecte envoyé avec succès ! Modération sous 24h.");
        setFormAnswers({});
        setFormPhoto("");
        onRefreshData();
        setTimeout(() => setSelectedMission(null), 2000);
      } else {
        const d = await resp.json();
        setFormError(d.message || "Erreur lors de la transmission du rapport.");
      }
    } catch {
      setFormError("Erreur réseau. Vérifiez votre connexion internet MTN/Moov/Celtiis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");

    if (withdrawAmountPts > currentUser.points) {
      setWithdrawError("Solde de points insuffisant pour valider ce retrait.");
      return;
    }

    if (withdrawAmountPts < 50) {
      setWithdrawError("Le montant minimum de retrait est de 50 points (500 FCFA).");
      return;
    }

    try {
      const resp = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: currentUser.phone,
          amountPts: withdrawAmountPts,
          provider: withdrawProvider
        })
      });

      if (resp.ok) {
        setWithdrawSuccess(`Demande de transfert Mobile Money enregistrée !`);
        setWithdrawAmountPts(100);
        onRefreshData();
      } else {
        const d = await resp.json();
        setWithdrawError(d.message || "Échec de l'opération.");
      }
    } catch {
      setWithdrawError("Erreur serveur temporaire.");
    }
  };

  const filteredMissions = missions.filter((m) => {
    if (m.status !== "active") return false;
    if (filterCity && !m.zoneName.toLowerCase().includes(filterCity.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE: LISTE DES CAMPAGNES DISPONIBLES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <div className="sm:flex justify-between items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-emerald-400" />
                  Campagnes de collecte disponibles
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Sélectionnez une mission à exécuter sur le terrain</p>
              </div>

              {/* Moteur de recherche */}
              <div className="relative mt-3 sm:mt-0 max-w-xs w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrer par Ville/Zone..."
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  className="w-full bg-slate-950 text-xs border border-slate-800 text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {filteredMissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                Aucune campagne de collecte active ne correspond à vos critères en ce moment au Bénin.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMissions.map((mission) => {
                  const rewardFcfa = mission.budgetAgentFcfa;
                  const rewardPoints = Math.floor(rewardFcfa / 10);
                  return (
                    <div
                      key={mission.id}
                      onClick={() => {
                        setSelectedMission(mission);
                        setFormAnswers({});
                        setFormPhoto("");
                        setFormError("");
                        setFormSuccess("");
                      }}
                      className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between group relative overflow-hidden ${
                        selectedMission?.id === mission.id
                          ? "bg-slate-800/80 border-emerald-500/80 shadow-emerald-950/20 shadow-lg"
                          : "bg-slate-950/50 border-slate-850 hover:bg-slate-900/60 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" /> {mission.zoneName}
                          </span>
                          <span className="text-[14px] font-black font-mono text-emerald-400">
                            +{rewardPoints} pts
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                          {mission.title}
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                          {mission.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500">
                        <span className="font-medium text-slate-400">
                          Quota : <b className="text-slate-200">{mission.totalSubmissionsCount || 0}/{mission.totalRequired}</b>
                        </span>
                        <span className="font-mono text-emerald-500/80 font-bold">
                          ~ {rewardFcfa.toLocaleString()} FCFA
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUESTIONNAIRE MOBILE DYNAMIQUE DE COLLECTE */}
          {selectedMission && (
            <div id="agent-survey-form-block" className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl transition-all animate-fade-in">
              <div className="flex justify-between items-start pb-4 border-b border-slate-800 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Formulaire Terrain Express</span>
                  <h3 className="text-base font-black text-white mt-0.5">{selectedMission.title}</h3>
                </div>
                <button
                  onClick={() => setSelectedMission(null)}
                  className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-950 border border-slate-800"
                >
                  Fermer
                </button>
              </div>

              <form onSubmit={handleSubmissionSubmit} className="space-y-5 text-left">
                {selectedMission.fields.map((field) => (
                  <div key={field.id} className="flex flex-col space-y-1.5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === FieldType.LONG_TEXT ? (
                      <textarea
                        rows={3}
                        placeholder="Renseignez votre observation détaillée..."
                        value={formAnswers[field.id] || ""}
                        onChange={(e) => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    ) : field.type === FieldType.MULTIPLE_CHOICE ? (
                      <div className="flex gap-4">
                        {["Oui", "Non"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setFormAnswers({ ...formAnswers, [field.id]: opt })}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                              formAnswers[field.id] === opt
                                ? "bg-emerald-600 text-slate-900 border-emerald-500 shadow-md"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Saisissez la valeur textuelle..."
                        value={formAnswers[field.id] || ""}
                        onChange={(e) => setFormAnswers({ ...formAnswers, [field.id]: e.target.value })}
                        className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                ))}

                {/* Bloc d'envoi de photo d'étalage */}
                {selectedMission.requirePhoto && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-400" /> Photo de preuve d'étalage macro-économique <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
                    />
                    {formPhoto && (
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-slate-800 mt-2">
                        <img src={formPhoto} alt="Preuve" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* GPS auto attachment telemetry banner */}
                <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-850 rounded-xl text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    Coordonnées GPS capturées :{" "}
                    <b className="font-mono text-slate-200">
                      {formGps ? `${formGps.lat.toFixed(5)}, ${formGps.lng.toFixed(5)}` : "Recherche de signal..."}
                    </b>
                  </span>
                </div>

                {formError && <p className="text-xs font-bold text-rose-400 bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">{formError}</p>}
                {formSuccess && <p className="text-xs font-bold text-emerald-400 bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">{formSuccess}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-900 font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> {isSubmitting ? "Transmission en cours..." : "Transmettre le rapport terrain"}
                </button>
              </form>
            </div>
          )}

          {/* HISTORIQUE PERSONNEL DES RAPPORTS DE COLLECTE */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl">
            <h4 className="font-black text-sm text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Vos derniers rapports envoyés
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {submissions.filter((s) => s.agentPhone === currentUser.phone).length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">Vous n'avez pas encore envoyé de rapport.</p>
              ) : (
                submissions
                  .filter((s) => s.agentPhone === currentUser.phone)
                  .map((sub) => {
                    const currentMission = missions.find((m) => m.id === sub.missionId);
                    const isApproved = sub.status === "approved";
                    const isRejected = sub.status === "rejected";

                    return (
                      <div key={sub.id} className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between items-center text-xs text-left">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-200 block">{currentMission?.title || "Campagne Inconnue"}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">Rapport ID: {sub.id}</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          {isApproved ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Approuvé
                            </span>
                          ) : isRejected ? (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Rejeté
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[9px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> En attente
                            </span>
                          )}
                          {sub.feedback && (
                            <span className="block text-[10px] text-amber-400 italic max-w-[150px] truncate mt-1">
                              "{sub.feedback}"
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* COLONNE DROITE: FINANCE MOVO/MTN/CELTIIS & SÉCURITÉ */}
        <div className="space-y-6">
          
          {/* GUICHET DE RETRAIT MOBILE MONEY SOMBRE */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl text-left">
            <h4 className="font-black text-sm text-white mb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              Guichet de Retrait Automatique
            </h4>
            <p className="text-[11px] text-slate-400 mb-4">Échangez vos points en FCFA (Taux fixe : 1 pt = 10 FCFA)</p>

            <form onSubmit={handleWithdrawalRequest} className="space-y-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Montant à retirer (en points)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={withdrawAmountPts}
                    onChange={(e) => setWithdrawAmountPts(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 text-xs font-black text-white border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-emerald-400 font-mono">
                    = {(withdrawAmountPts * 10).toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Réseau de transfert béninois</label>
                <select
                  value={withdrawProvider}
                  onChange={(e: any) => setWithdrawProvider(e.target.value)}
                  className="w-full bg-slate-950 text-xs font-bold text-white border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="MTN">MTN Mobile Money 🟡</option>
                  <option value="MOOV">Moov Money 🟢</option>
                  <option value="CELTIIS">Celtiis Cash 🟦</option>
                </select>
              </div>

              {withdrawError && <p className="text-xs text-rose-400 bg-rose-950/20 p-2.5 rounded-xl border border-rose-900/20 font-medium">{withdrawError}</p>}
              {withdrawSuccess && <p className="text-xs text-emerald-400 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/20 font-medium">{withdrawSuccess}</p>}

              <button
                type="submit"
                className="w-full bg-slate-100 hover:bg-white text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Demander le transfert MoMo
              </button>
            </form>

            {/* Suivi des transferts passés */}
            <h5 className="font-bold text-xs text-slate-200 mt-6 mb-2 border-t border-slate-850 pt-4">Historique de vos retraits</h5>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {withdrawals.filter((w) => w.phone === currentUser.phone).length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-2">Aucun retrait demandé.</p>
              ) : (
                withdrawals
                  .filter((w) => w.phone === currentUser.phone)
                  .map((w, idx) => {
                    const isCompleted = w.status === "completed";
                    return (
                      <div key={idx} className="p-2 bg-slate-950 border border-slate-850 rounded-lg flex justify-between items-center text-[10px]">
                        <div>
                          <span className="font-black text-slate-300 block">{w.provider || "MOMO"} • {w.amountPts} pts</span>
                          <span className="text-[9px] text-slate-500 font-mono">{new Date(w.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-slate-200">
                            +{w.amountFcfa.toLocaleString()} FCFA
                          </div>
                          <span className={`inline-block text-[8px] font-black uppercase px-1.5 mt-0.5 rounded-full ${
                            isCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"
                          }`}>
                            {isCompleted ? "Transféré" : "En cours"}
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* CHARTE DE SÉCURITÉ ANTI-FRAUDE SOMBRE */}
          <div className="bg-amber-950/20 border border-amber-900/40 rounded-2xl p-4 text-slate-400 text-xs text-left shadow-lg">
            <h5 className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Politique Anti-Fraude Bénin
            </h5>
            <p className="mt-2 leading-relaxed text-[11px] text-slate-400">
              Chaque soumission sur une mission doit impérativement provenir de coordonnées GPS uniques et être séparée de minimum 50 mètres.
              L'utilisation de photos d'étalage dupliquées entraînera le rejet automatique de la collecte et la suspension immédiate du compte de l'agent.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}