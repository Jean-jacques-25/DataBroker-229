import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Compass,
  FileCheck,
  TrendingUp,
  AlertOctagon,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Check,
  X,
  CreditCard,
  AlertTriangle
} from "lucide-react";
import { Mission, Submission, User, WithdrawalRequest, FraudLog } from "../types";

interface AdminWorkspaceProps {
  onRefreshData: () => void;
}

export default function AdminWorkspace({ onRefreshData }: AdminWorkspaceProps) {
  const [stats, setStats] = useState<any>(null);
  const [submissionsQueue, setSubmissionsQueue] = useState<Submission[]>([]);
  const [withdrawalsQueue, setWithdrawalsQueue] = useState<WithdrawalRequest[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [fraudLogsList, setFraudLogsList] = useState<FraudLog[]>([]);

  // Propriétés globales de la plateforme
  const [marginPercent, setMarginPercent] = useState(40);
  const [minGpsDistanceMeters, setMinGpsDistanceMeters] = useState(50);
  const [configSuccess, setConfigSuccess] = useState("");

  // Retours (feedback) de modération
  const [subFeedback, setSubFeedback] = useState<Record<string, string>>({});

  const fetchAdminStats = async () => {
    try {
      const resp = await fetch("/api/admin/stats");
      if (resp.ok) {
        const data = await resp.json();
        setStats(data.stats);
        setSubmissionsQueue(data.submissionsQueue || []);
        setWithdrawalsQueue(data.withdrawalsQueue || []);
        setUsersList(data.users || []);
        setFraudLogsList(data.fraudLogs || []);
      }
    } catch {
      console.log("Erreur lors de la récupération des données admin.");
    }
  };

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const handleModerateSubmission = async (id: string, status: "approved" | "rejected") => {
    try {
      const resp = await fetch(`/api/admin/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          feedback: subFeedback[id] || ""
        })
      });

      if (resp.ok) {
        fetchAdminStats();
        onRefreshData();
      }
    } catch {
      alert("Erreur réseau lors de la modération.");
    }
  };

  const handleProcessWithdrawal = async (id: string, status: "completed" | "failed") => {
    try {
      const resp = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });

      if (resp.ok) {
        fetchAdminStats();
        onRefreshData();
      }
    } catch {
      alert("Erreur réseau lors du traitement du retrait.");
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSuccess("");
    try {
      const resp = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marginPercent, minGpsDistanceMeters })
      });
      if (resp.ok) {
        setConfigSuccess("Paramètres système mis à jour avec succès !");
        setTimeout(() => setConfigSuccess(""), 3000);
      }
    } catch {
      alert("Erreur lors de la sauvegarde de la configuration.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 md:p-8">
      
      {/* SECTION BANNER KPI SUPER-ADMIN */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Volume Collectes</span>
          <div className="text-xl font-black text-white mt-1">{stats?.totalSubmissions || 0}</div>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Alertes GPS</span>
          <div className="text-xl font-black text-rose-400 mt-1">{fraudLogsList.length}</div>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase">En attente MoMo</span>
          <div className="text-xl font-black text-yellow-400 mt-1">{withdrawalsQueue.length}</div>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-left">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Chiffre d'Affaires</span>
          <div className="text-xl font-black text-emerald-400 mt-1">{(stats?.totalVolumeFcfa || 0).toLocaleString()} F</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE PRINCIPALE : FILES D'ATTENTES DE VALIDATION */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* FILE 1 : MODÉRATION DES SOUUMISSIONS AGENTS */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl text-left">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              File de Modération des Collectes Terrain
            </h3>

            {submissionsQueue.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 border border-dashed border-slate-800 rounded-xl text-center bg-slate-950/30">
                Aucun rapport en attente de vérification pour le moment.
              </p>
            ) : (
              <div className="space-y-4">
                {submissionsQueue.map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                    <div className="flex justify-between items-start text-xs border-b border-slate-900 pb-2">
                      <div>
                        <span className="font-bold text-slate-200 block">Agent : {sub.agentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {sub.id}</span>
                      </div>
                      <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                        GPS: {sub.gpsLocation.lat.toFixed(4)}, {sub.gpsLocation.lng.toFixed(4)}
                      </span>
                    </div>

                    {/* Données de l'enquête */}
                    <div className="space-y-1 text-xs">
                      {Object.entries(sub.answers).map(([fId, val]) => (
                        <p key={fId} className="text-slate-400">
                          <b className="text-slate-300">{fId} :</b> {val}
                        </p>
                      ))}
                    </div>

                    {/* Image si uploadée */}
                    {sub.photoBase64 && (
                      <div className="pt-1">
                        <img src={sub.photoBase64} alt="Preuve Admin" className="w-32 h-20 object-cover rounded-lg border border-slate-800" />
                      </div>
                    )}

                    {/* Commentaire de rejet optionnel & Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <input
                        type="text"
                        placeholder="Motif si rejet (ex: Photo floue)..."
                        value={subFeedback[sub.id] || ""}
                        onChange={(e) => setSubFeedback({ ...subFeedback, [sub.id]: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      />
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleModerateSubmission(sub.id, "rejected")}
                          className="p-1.5 bg-rose-950/40 text-rose-400 border border-rose-900/40 rounded-lg hover:bg-rose-900/30 transition-all"
                          title="Rejeter la collecte"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleModerateSubmission(sub.id, "approved")}
                          className="px-3 py-1.5 bg-emerald-600 text-slate-900 font-black text-xs rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Valider (+Pts)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* FILE 2 : VALIDATION DES RETRAITS MOBILE MONEY */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-xl text-left">
            <h3 className="text-sm font-black text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Demandes de Virements MoMo / Celtiis en attente
            </h3>

            {withdrawalsQueue.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4 border border-dashed border-slate-800 rounded-xl text-center bg-slate-950/30">
                Aucun virement en attente de traitement bancaire.
              </p>
            ) : (
              <div className="space-y-2">
                {withdrawalsQueue.map((w) => (
                  <div key={w.id} className="p-3 bg-slate-950 border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-extrabold text-slate-200 block">{w.provider} Cash • {w.phone}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Valeur : <b className="text-emerald-400">{w.amountFcfa.toLocaleString()} FCFA</b> ({w.amountPts} pts)</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleProcessWithdrawal(w.id, "failed")}
                        className="px-2.5 py-1 text-[11px] bg-rose-950/30 border border-rose-900/40 text-rose-400 font-bold rounded-lg hover:bg-rose-950/50"
                      >
                        Échec
                      </button>
                      <button
                        onClick={() => handleProcessWithdrawal(w.id, "completed")}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 text-slate-950 font-black rounded-lg hover:bg-white"
                      >
                        Virement Effectué ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLONNE DROITE : PARAMÈTRES ET CONTRÔLE FRAUDE */}
        <div className="space-y-6">
          
          {/* CONFIGURATEUR SYSTÈME */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl text-left">
            <h4 className="font-black text-sm text-white mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" /> Paramètres Généraux
            </h4>
            <form onSubmit={handleUpdateConfig} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs text-slate-300">Marge bénéficiaire plateforme (%)</label>
                <input
                  type="number"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-xs text-slate-300">Distance GPS Anti-Collusion (mètres)</label>
                <input
                  type="number"
                  value={minGpsDistanceMeters}
                  onChange={(e) => setMinGpsDistanceMeters(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {configSuccess && (
                <p className="text-[11px] text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/20 p-2 rounded-lg">{configSuccess}</p>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-900 font-black text-xs py-2 rounded-xl transition-all"
              >
                Mettre à jour le système
              </button>
            </form>
          </div>

          {/* RÉSEAU DE SURVEILLANCE ANTI-FRAUDE */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl shadow-xl text-left">
            <h4 className="font-black text-sm text-rose-400 mb-3 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Journal des Suspicion de Fraudes
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {fraudLogsList.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-2 text-center">Aucun comportement suspect détecté.</p>
              ) : (
                fraudLogsList.map((log, index) => (
                  <div key={index} className="p-2.5 bg-rose-950/10 border border-rose-950/40 rounded-xl text-[11px] text-slate-300 space-y-1">
                    <div className="flex justify-between items-center text-rose-400 font-bold">
                      <span>{log.type === "gps_duplicate" ? "Doublon de Position" : "Alerte Télémétrie"}</span>
                      <span className="text-[9px] font-mono text-slate-500">{new Date(log.createdAt || Date.now()).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-400 text-[10px] leading-relaxed">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}