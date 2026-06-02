import React, { useState } from "react";
import { 
  PlusCircle, 
  BarChart3, 
  Database, 
  Layers, 
  Filter, 
  Download, 
  CheckCircle2, 
  FileSpreadsheet, 
  TrendingUp, 
  MapPin 
} from "lucide-react";
import { Mission, Submission, User, FieldType, UserRole } from "../types";

interface ClientWorkspaceProps {
  currentUser: User;
  missions: Mission[];
  submissions: Submission[];
  onRefreshData: () => void;
}

export default function ClientWorkspace({
  currentUser,
  missions,
  submissions,
  onRefreshData
}: ClientWorkspaceProps) {
  // Navigation interne
  const [activeTab, setActiveTab] = useState<"campaigns" | "create" | "data">("campaigns");

  // Formulaire de création de campagne
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [campaignZone, setCampaignZone] = useState("Cotonou");
  const [requiredSubmissions, setRequiredSubmissions] = useState(10);
  const [budgetFcfa, setBudgetFcfa] = useState(5000);
  const [requirePhoto, setRequirePhoto] = useState(true);
  
  // Champs dynamiques
  const [fields, setFields] = useState<Array<{ id: string; label: string; type: FieldType; required: boolean }>>([
    { id: "f1", label: "Nom du point de vente", type: FieldType.SHORT_TEXT, required: true }
  ]);

  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Filtrage de la base de données des rapports acquis
  const [selectedMissionFilter, setSelectedMissionFilter] = useState("");

  const handleAddField = () => {
    const newId = `f_${Date.now()}`;
    setFields([...fields, { id: newId, label: "", type: FieldType.SHORT_TEXT, required: true }]);
  };

  const handleRemoveField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: string, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };
    setFields(updated);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!campaignTitle || !campaignDesc) {
      setFormError("Veuillez renseigner le titre et la description de la campagne.");
      return;
    }

    // Validation des champs vides
    if (fields.some(f => !f.label.trim())) {
      setFormError("Tous les libellés de votre questionnaire doivent être remplis.");
      return;
    }

    setIsCreating(true);
    try {
      const resp = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientPhone: currentUser.phone,
          clientName: currentUser.name,
          title: campaignTitle,
          description: campaignDesc,
          zoneName: campaignZone,
          totalRequired: requiredSubmissions,
          budgetTotalFcfa: budgetFcfa,
          requirePhoto,
          fields
        })
      });

      if (resp.ok) {
        setFormSuccess("Votre campagne a été lancée ! Elle est désormais visible par les Agents.");
        setCampaignTitle("");
        setCampaignDesc("");
        setFields([{ id: "f1", label: "Nom du point de vente", type: FieldType.SHORT_TEXT, required: true }]);
        onRefreshData();
        setTimeout(() => setActiveTab("campaigns"), 1500);
      } else {
        const d = await resp.json();
        setFormError(d.message || "Erreur lors de la création.");
      }
    } catch {
      setFormError("Erreur réseau. Impossible de contacter le serveur.");
    } finally {
      setIsCreating(false);
    }
  };

  // Calculs KPI pour le client
  const clientMissions = missions.filter(m => m.clientPhone === currentUser.phone);
  const totalSpent = clientMissions.reduce((acc, m) => acc + m.budgetTotalFcfa, 0);
  
  const clientSubmissions = submissions.filter(s => 
    clientMissions.some(m => m.id === s.missionId) && s.status === "approved"
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 md:p-8">
      
      {/* ONGLETS DE NAVIGATION ESPACE CLIENT */}
      <div className="flex border-b border-slate-800/80 mb-8 max-w-md bg-slate-950 p-1 rounded-xl border border-slate-850">
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all w-full justify-center ${
            activeTab === "campaigns" ? "bg-slate-900 text-emerald-400 shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Suivi
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all w-full justify-center ${
            activeTab === "create" ? "bg-slate-900 text-emerald-400 shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          <PlusCircle className="w-4 h-4" /> Lancer une Campagne
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all w-full justify-center ${
            activeTab === "data" ? "bg-slate-900 text-emerald-400 shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" /> Rapports Acquis
        </button>
      </div>

      {/* CONTENU : 1. SUIVI & STATISTIQUES */}
      {activeTab === "campaigns" && (
        <div className="space-y-8 animate-fade-in">
          {/* Cartes KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Campagnes Ouvertes</span>
              <div className="text-2xl font-black text-white mt-1">{clientMissions.length}</div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Déploiement national
              </span>
            </div>
            <div className="p-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rapports Certifiés</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{clientSubmissions.length}</div>
              <span className="text-[10px] text-slate-400 block mt-1">Données validées par modération</span>
            </div>
            <div className="p-5 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Budget Engagé</span>
              <div className="text-2xl font-black text-white mt-1">{totalSpent.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span></div>
              <span className="text-[10px] text-amber-400 block mt-1">Garantie DataBroker229</span>
            </div>
          </div>

          {/* Tableau de suivi des campagnes */}
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl text-left">
            <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" /> État d'avancement de vos projets
            </h3>
            
            {clientMissions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                Vous n'avez lancé aucune campagne de collecte pour l'instant.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Campagne</th>
                      <th className="p-3">Zone géographique</th>
                      <th className="p-3">Progression des Rapports</th>
                      <th className="p-3">Budget</th>
                      <th className="p-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {clientMissions.map((m) => {
                      const approvedCount = submissions.filter(s => s.missionId === m.id && s.status === "approved").length;
                      const pct = Math.min(100, Math.round((approvedCount / m.totalRequired) * 100));
                      
                      return (
                        <tr key={m.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="p-3 font-bold text-white max-w-[180px] truncate">{m.title}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 rounded-md inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-500" /> {m.zoneName}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-slate-950 h-2 rounded-full border border-slate-800 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="font-mono font-bold text-slate-200">{approvedCount}/{m.totalRequired} ({pct}%)</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{m.budgetTotalFcfa.toLocaleString()} FCFA</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              m.status === "active" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                            }`}>
                              {m.status === "active" ? "En cours" : "Clôturée"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENU : 2. CONFIGURATEUR DE CAMPAGNE (QUESTIONNAIRE) */}
      {activeTab === "create" && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl max-w-2xl mx-auto text-left animate-fade-in">
          <div className="mb-6">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-400" /> Configurer une nouvelle campagne de collecte
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Établissez votre cahier des charges pour les Agents sur le terrain.</p>
          </div>

          <form onSubmit={handleCreateCampaign} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-300">Intitulé du projet</label>
                <input
                  type="text"
                  placeholder="Ex: Disponibilité Ciment Bouclier"
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-300">Zone géographique ciblée (Bénin)</label>
                <select
                  value={campaignZone}
                  onChange={(e) => setCampaignZone(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white font-bold border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Cotonou">Cotonou Littoral 🇧🇯</option>
                  <option value="Calavi">Abomey-Calavi</option>
                  <option value="Porto-Novo">Porto-Novo Ouémé</option>
                  <option value="Parakou">Parakou Borgou</option>
                  <option value="Bohicon">Bohicon / Abomey Zou</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-xs font-bold text-slate-300">Brève description de la mission</label>
              <textarea
                rows={3}
                placeholder="Décrivez précisément ce que l'agent doit inspecter, vérifier ou compter..."
                value={campaignDesc}
                onChange={(e) => setCampaignDesc(e.target.value)}
                className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-300">Nombre de rapports requis (Quota)</label>
                <input
                  type="number"
                  value={requiredSubmissions}
                  onChange={(e) => setRequiredSubmissions(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 text-xs text-white border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-xs font-bold text-slate-300">Budget total alloué (FCFA)</label>
                <input
                  type="number"
                  value={budgetFcfa}
                  onChange={(e) => setBudgetFcfa(parseInt(e.target.value) || 1000)}
                  className="w-full bg-slate-950 text-xs font-bold text-emerald-400 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Sécurité : Preuve Photo */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-850 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Exiger une preuve photographique</span>
                <span className="text-[10px] text-slate-500">Oblige l'agent à envoyer un cliché géolocalisé de l'étalage.</span>
              </div>
              <input
                type="checkbox"
                checked={requirePhoto}
                onChange={(e) => setRequirePhoto(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded border-slate-800 bg-slate-950"
              />
            </div>

            {/* CONSTRUCTEUR DE QUESTIONNAIRE DYNAMIQUE */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                <span className="text-xs font-black text-slate-200 uppercase tracking-wide">Champs & Critères d'enquêtes</span>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  + Ajouter un critère
                </button>
              </div>

              {fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    placeholder="Ex: Prix constaté au kilo"
                    value={field.label}
                    onChange={(e) => handleFieldChange(idx, "label", e.target.value)}
                    className="sm:col-span-1.5 bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <select
                    value={field.type}
                    onChange={(e) => handleFieldChange(idx, "type", e.target.value)}
                    className="bg-slate-950 text-xs text-white border border-slate-800 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={FieldType.SHORT_TEXT}>Texte court</option>
                    <option value={FieldType.LONG_TEXT}>Rapport détaillé</option>
                    <option value={FieldType.MULTIPLE_CHOICE}>Choix Oui / Non</option>
                  </select>
                  <button
                    type="button"
                    disabled={fields.length === 1}
                    onClick={() => handleRemoveField(idx)}
                    className="text-[11px] font-bold text-rose-400 hover:text-rose-300 disabled:opacity-30"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>

            {formError && <p className="text-xs font-bold text-rose-400 bg-rose-950/20 p-3 rounded-xl border border-rose-900/30">{formError}</p>}
            {formSuccess && <p className="text-xs font-bold text-emerald-400 bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">{formSuccess}</p>}

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-900 font-black text-xs py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/20"
            >
              {isCreating ? "Déploiement en cours..." : "Lancer et financer la campagne"}
            </button>
          </form>
        </div>
      )}

      {/* CONTENU : 3. ACCÈS AUX RAPPORTS ET BASES DE DONNÉES ACQUISES */}
      {activeTab === "data" && (
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-xl text-left space-y-6 animate-fade-in">
          <div className="sm:flex justify-between items-center gap-4">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" /> Base de données des rapports acquis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Consultez et exportez les rapports validés par notre équipe de modération.</p>
            </div>

            {/* Filtre par projet */}
            <div className="flex items-center gap-2 mt-3 sm:mt-0">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMissionFilter}
                onChange={(e) => setSelectedMissionFilter(e.target.value)}
                className="bg-slate-950 text-xs border border-slate-800 text-white px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="">Toutes les campagnes</option>
                {clientMissions.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Liste des extractions */}
          {clientSubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
              Aucun rapport certifié n'est disponible pour l'extraction à ce jour.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  onClick={() => alert("Génération du tableur Excel / CSV de vos données béninoises...")}
                  className="bg-slate-100 hover:bg-white text-slate-950 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow transition-all"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Exporter la sélection (.CSV)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientSubmissions
                  .filter(s => !selectedMissionFilter || s.missionId === selectedMissionFilter)
                  .map((sub) => {
                    const currentM = missions.find(m => m.id === sub.missionId);
                    return (
                      <div key={sub.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 relative overflow-hidden">
                        <div className="flex justify-between items-start border-b border-slate-900 pb-2">
                          <div>
                            <span className="text-[10px] text-slate-500 block font-mono">ID: {sub.id}</span>
                            <span className="text-xs font-bold text-slate-200">{currentM?.title}</span>
                          </div>
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Certifié
                          </span>
                        </div>

                        {/* Réponses dynamiques récoltées */}
                        <div className="space-y-1.5 text-[11px]">
                          {Object.entries(sub.answers).map(([fieldId, val]) => {
                            const label = currentM?.fields.find(f => f.id === fieldId)?.label || fieldId;
                            return (
                              <p key={fieldId} className="text-slate-400">
                                <b className="text-slate-300">{label} :</b> {val}
                              </p>
                            );
                          })}
                        </div>

                        {/* Vignette photo si présente */}
                        {sub.photoBase64 && (
                          <div className="pt-2 border-t border-slate-900/60 flex items-center gap-3">
                            <img src={sub.photoBase64} alt="Preuve terrain" className="w-14 h-10 object-cover rounded-md border border-slate-800" />
                            <span className="text-[10px] text-slate-500 font-mono">
                              GPS: {sub.gpsLocation.lat.toFixed(4)}, {sub.gpsLocation.lng.toFixed(4)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}