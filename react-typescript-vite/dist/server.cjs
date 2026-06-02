var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
} else {
  console.warn("GEMINI_API_KEY is not defined. AI features will fallback to offline mock rules.");
}
app.use(import_express.default.json({ limit: "15mb" }));
app.use(import_express.default.urlencoded({ limit: "15mb", extended: true }));
var DB_PATH = import_path.default.join(process.cwd(), "db.json");
function getGpsDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function stringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
var db = {
  users: {},
  missions: {},
  submissions: {},
  withdrawals: {},
  supportTickets: {},
  notifications: {},
  fraudLogs: [],
  platformConfig: {
    marginPercent: 40,
    minGpsDistanceMeters: 50,
    pointsToFcfaRate: 10
  }
};
function loadDatabase() {
  try {
    if (import_fs.default.existsSync(DB_PATH)) {
      const contents = import_fs.default.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(contents);
      console.log("Persistent Database loaded successfully. Users:", Object.keys(db.users).length);
    } else {
      prepopulateDB();
      saveDatabase();
    }
  } catch (err) {
    console.error("Failed to load local DB. Prepopulating fresh copy.", err);
    prepopulateDB();
  }
}
function saveDatabase() {
  try {
    import_fs.default.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist database to disk", err);
  }
}
function prepopulateDB() {
  db = {
    users: {
      "+22999999999": {
        phone: "+22999999999",
        name: "Admin DataBroker229",
        email: "jeanjacquesaguin30@gmail.com",
        role: "admin" /* ADMIN */,
        points: 0,
        level: "ELITE" /* ELITE */,
        score: 100,
        isSuspended: false,
        createdAt: "2026-05-10T12:00:00Z"
      },
      "+22961000001": {
        phone: "+22961000001",
        name: "Saliou Koffi",
        email: "salioukoffi@gmail.com",
        role: "agent" /* AGENT */,
        points: 420,
        level: "BRONZE" /* BRONZE */,
        score: 94,
        isSuspended: false,
        createdAt: "2026-05-11T09:00:00Z"
      },
      "+22962000002": {
        phone: "+22962000002",
        name: "Bernice Dossou",
        email: "bernice.dossou@gmail.com",
        role: "agent" /* AGENT */,
        points: 2450,
        level: "GOLD" /* GOLD */,
        score: 98,
        isSuspended: false,
        createdAt: "2026-05-12T08:30:00Z"
      },
      "+22955000001": {
        phone: "+22955000001",
        name: "Jean-Jacques Aguin",
        email: "jeanjacquesaguin30@gmail.com",
        role: "client" /* CLIENT */,
        points: 0,
        level: "BRONZE" /* BRONZE */,
        score: 100,
        isSuspended: false,
        createdAt: "2026-05-13T10:00:00Z"
      }
    },
    missions: {
      "m-1": {
        id: "m-1",
        title: "V\xE9rification Huile d'Arachide Dantokpa (Cotonou)",
        description: "Enqu\xEAte sur la disponibilit\xE9 et les prix de vente au d\xE9tail de l'huile d'arachide de marque 'Auri' et les marques concurrentes au march\xE9 Dantokpa. Prendre des photos claires et g\xE9olocalis\xE9es du rayon d'\xE9talage.",
        clientPhone: "+22955000001",
        clientName: "Jean-Jacques Aguin",
        status: "active" /* ACTIVE */,
        pointsPerCollect: 120,
        // 1200 FCFA
        budgetAgentFcfa: 1200,
        totalCostClientFcfa: 2e3,
        // Client pays 2000 FCFA (Includes platform markup 40%)
        fields: [
          { id: "f-1", type: "text" /* TEXT */, label: "Nom de la boutique / Marchand", required: true },
          { id: "f-2", type: "number" /* NUMBER */, label: "Prix bouteille 1L (FCFA)", required: true },
          { id: "f-3", type: "select" /* SELECT */, label: "Disponibilit\xE9 d'autres marques d'huile", required: true, options: ["Seulement Auri", "Auri + Marques concurrentes", "Pas d'huile Auri"] },
          { id: "f-4", type: "photo" /* PHOTO */, label: "Photo claire de l'\xE9tag\xE8re de revente", required: true },
          { id: "f-5", type: "gps" /* GPS */, label: "Localisation GPS de la collecte", required: true }
        ],
        zone: {
          type: "market",
          name: "March\xE9 Dantokpa",
          lat: 6.3688,
          lng: 2.4411,
          radiusKm: 1
        },
        totalRequired: 5,
        collectedCount: 2,
        createdAt: "2026-05-15T08:00:00Z",
        expiresAt: "2026-06-15T23:59:59Z"
      },
      "m-2": {
        id: "m-2",
        title: "Pr\xE9sence Canettes Boissons gazeuses (Porto-Novo)",
        description: "Contr\xF4ler la pr\xE9sence et le prix public recommand\xE9 de canettes de boissons Coca-Cola 33cl et Pepsi 33cl aupr\xE8s de revendeurs, boutiques de quartier ou sup\xE9rettes \xE0 Porto-Novo.",
        clientPhone: "+22955000001",
        clientName: "Jean-Jacques Aguin",
        status: "active" /* ACTIVE */,
        pointsPerCollect: 80,
        // 800 FCFA
        budgetAgentFcfa: 800,
        totalCostClientFcfa: 1334,
        fields: [
          { id: "f-a", type: "text" /* TEXT */, label: "Nom du point de vente", required: true },
          { id: "f-b", type: "select" /* SELECT */, label: "Leader visible en rayon", required: true, options: ["Coca-Cola", "Pepsi", "A \xE9galit\xE9"] },
          { id: "f-c", type: "number" /* NUMBER */, label: "Prix constat\xE9 Coca-Cola (FCFA)", required: true },
          { id: "f-d", type: "photo" /* PHOTO */, label: "Photo des bouteilles au frais", required: false },
          { id: "f-e", type: "gps" /* GPS */, label: "Position GPS", required: true }
        ],
        zone: {
          type: "city",
          name: "Porto-Novo",
          lat: 6.4969,
          lng: 2.6289,
          radiusKm: 5
        },
        totalRequired: 10,
        collectedCount: 0,
        createdAt: "2026-05-18T14:00:00Z",
        expiresAt: "2026-06-25T23:59:59Z"
      },
      "m-3": {
        id: "m-3",
        title: "Contr\xF4le Ciment Bouclier Cotonou",
        description: "V\xE9rifier le co\xFBt r\xE9el et la disponibilit\xE9 du sac de Ciment NOCIBE ou SCB en comparaison au prix plafonn\xE9 par l'\xC9tat b\xE9ninois.",
        clientPhone: "+22955000001",
        clientName: "Jean-Jacques Aguin",
        status: "en_attente_paiement" /* EN_ATTENTE_PAIEMENT */,
        pointsPerCollect: 150,
        // 1500 FCFA
        budgetAgentFcfa: 1500,
        totalCostClientFcfa: 2500,
        fields: [
          { id: "f1", type: "text" /* TEXT */, label: "Quincaillerie", required: true },
          { id: "f2", type: "number" /* NUMBER */, label: "Prix constat\xE9 du sac de 50kg (FCFA)", required: true },
          { id: "f3", type: "boolean" /* BOOLEAN */, label: "Facture fournie sur demande ?", required: true },
          { id: "f4", type: "photo" /* PHOTO */, label: "Photo ext\xE9rieure de la quincaillerie", required: true },
          { id: "f5", type: "gps" /* GPS */, label: "Localisation GPS", required: true }
        ],
        zone: {
          type: "city",
          name: "Cotonou",
          lat: 6.3654,
          lng: 2.4183,
          radiusKm: 8
        },
        totalRequired: 8,
        collectedCount: 0,
        createdAt: "2026-05-19T10:00:00Z",
        expiresAt: "2026-06-10T23:59:59Z"
      }
    },
    submissions: {
      "s-1": {
        id: "s-1",
        missionId: "m-1",
        missionTitle: "V\xE9rification Huile d'Arachide Dantokpa (Cotonou)",
        agentPhone: "+22962000002",
        agentName: "Bernice Dossou",
        status: "approved",
        answers: {
          "f-1": "\xC9tablissements Gbogan, All\xE9e Centrale Dantokpa",
          "f-2": "1350",
          "f-3": "Auri + Marques concurrentes"
        },
        photoUrl: "placeholder_arachide_approved",
        gpsLocation: { lat: 6.3685, lng: 2.441 },
        fraudScore: "faible",
        fraudAlerts: [],
        createdAt: "2026-05-16T10:15:00Z"
      },
      "s-2": {
        id: "s-2",
        missionId: "m-1",
        missionTitle: "V\xE9rification Huile d'Arachide Dantokpa (Cotonou)",
        agentPhone: "+22961000001",
        agentName: "Saliou Koffi",
        status: "approved",
        answers: {
          "f-1": "Boutique Chez Maman Ch\xE9rie, Zone Ouest Dantokpa",
          "f-2": "1400",
          "f-3": "Seulement Auri"
        },
        photoUrl: "placeholder_arachide_approved_2",
        gpsLocation: { lat: 6.369, lng: 2.4415 },
        fraudScore: "faible",
        fraudAlerts: [],
        createdAt: "2026-05-17T11:45:00Z"
      },
      "s-3": {
        id: "s-3",
        missionId: "m-1",
        missionTitle: "V\xE9rification Huile d'Arachide Dantokpa (Cotonou)",
        agentPhone: "+22961000001",
        agentName: "Saliou Koffi",
        status: "pending",
        answers: {
          "f-1": "Kiosque d'en face, Boutique Gbogan",
          "f-2": "1340",
          "f-3": "Pas d'huile Auri"
        },
        photoUrl: "placeholder_arachide_approved",
        // Simulating duplicate photo
        gpsLocation: { lat: 6.3685, lng: 2.441 },
        // Simulating duplicate GPS
        fraudScore: "eleve",
        fraudAlerts: ["Photo identique \xE0 la collecte s-1 (Bernice Dossou)", "Position GPS identique \xE0 la collecte s-1 \xE0 moins de 5 m\xE8tres"],
        createdAt: "2026-05-19T17:00:00Z"
      }
    },
    withdrawals: {
      "w-1": {
        id: "w-1",
        agentPhone: "+22962000002",
        agentName: "Bernice Dossou",
        pointsQuantity: 1500,
        amountFcfa: 15e3,
        status: "pending",
        paymentMethod: "MTN MoMo (+22955256871)",
        createdAt: "2026-05-18T19:00:00Z"
      }
    },
    supportTickets: {
      "t-1": {
        id: "t-1",
        senderPhone: "+22961000001",
        senderName: "Saliou Koffi",
        category: "gps_photo",
        description: "Mon GPS ne semble pas se mettre \xE0 jour sur la carte quand je suis \xE0 l'int\xE9rieur du grand hangar de Dantokpa.",
        createdAt: "2026-05-18T15:20:00Z"
      }
    },
    notifications: {
      "+22961000001": [
        {
          id: "n-1",
          recipientPhone: "+22961000001",
          title: "Nouvelle Mission Disponible",
          message: "La mission 'Pr\xE9sence Canettes Boissons gazeuses (Porto-Novo)' est d\xE9sormais ouverte !",
          isRead: false,
          createdAt: "2026-05-18T14:02:00Z"
        }
      ],
      "+22962000002": [
        {
          id: "n-2",
          recipientPhone: "+22962000002",
          title: "Collecte Valid\xE9e \u{1F1E8}\u{1F1F3}",
          message: "F\xE9licitations Bernice, votre collecte s-1 a \xE9t\xE9 valid\xE9e d'un score parfait de 95% +120 points !",
          isRead: false,
          createdAt: "2026-05-17T09:00:00Z"
        }
      ]
    },
    fraudLogs: [
      {
        id: "fl-1",
        submissionId: "s-3",
        agentPhone: "+22961000001",
        type: "duplicate_photo",
        description: "La base64/photo fournie correspond exactement \xE0 la signature de s-1.",
        severity: "high",
        createdAt: "2026-05-19T17:00:05Z"
      },
      {
        id: "fl-2",
        submissionId: "s-3",
        agentPhone: "+22961000001",
        type: "gps_duplicate",
        description: "Le point de g\xE9olocalisation correspond exactement au point s-1.",
        severity: "medium",
        createdAt: "2026-05-19T17:00:07Z"
      }
    ],
    platformConfig: {
      marginPercent: 40,
      minGpsDistanceMeters: 50,
      pointsToFcfaRate: 10
    }
  };
}
loadDatabase();
app.post("/api/inscription", (req, res) => {
  const { name, phone, email, role } = req.body;
  if (!phone || !name || !role) {
    return res.status(400).json({ error: "Le nom, le t\xE9l\xE9phone et le r\xF4le sont obligatoires." });
  }
  const cleanPhone = phone.trim();
  if (db.users[cleanPhone]) {
    return res.status(400).json({ error: "Ce num\xE9ro de t\xE9l\xE9phone est d\xE9j\xE0 enregistr\xE9." });
  }
  const newUser = {
    phone: cleanPhone,
    name: name.trim(),
    email: email ? email.trim() : "",
    role: role === "admin" /* ADMIN */ ? "agent" /* AGENT */ : role,
    // Admin cannot be created publicly
    points: 0,
    level: "BRONZE" /* BRONZE */,
    score: 100,
    isSuspended: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.users[cleanPhone] = newUser;
  if (!db.notifications[cleanPhone]) {
    db.notifications[cleanPhone] = [];
  }
  db.notifications[cleanPhone].push({
    id: `n-${Date.now()}`,
    recipientPhone: cleanPhone,
    title: "Bienvenue sur DataBroker229 !",
    message: `Bonjour ${newUser.name}. Slogan officiel : "Des donn\xE9es terrain fiables, partout au B\xE9nin." Notre \xE9quipe vous souhaite un bon succ\xE8s !`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  return res.json({ success: true, user: newUser });
});
app.post("/api/connexion", (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Le num\xE9ro de t\xE9l\xE9phone est requis." });
  }
  const cleanPhone = phone.trim();
  const user = db.users[cleanPhone];
  if (!user) {
    return res.status(404).json({ error: "Ce num\xE9ro de t\xE9l\xE9phone n'existe pas. Veuillez vous inscrire." });
  }
  if (user.isSuspended) {
    return res.status(403).json({ error: "Ce compte a \xE9t\xE9 suspendu pour activit\xE9s suspectes r\xE9it\xE9r\xE9es." });
  }
  return res.json({ success: true, user });
});
app.post("/api/logout", (req, res) => {
  return res.json({ success: true });
});
app.get("/api/profile", (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: "Param\xE8tre phone requis." });
  }
  const user = db.users[phone];
  if (!user) {
    return res.status(404).json({ error: "Introuvable." });
  }
  return res.json(user);
});
app.get("/api/missions", (req, res) => {
  const { status, clientPhone, city, zoneType, lat, lng, proximityFlag } = req.query;
  let list = Object.values(db.missions);
  if (status) {
    list = list.filter((m) => m.status === status);
  } else {
  }
  if (clientPhone) {
    list = list.filter((m) => m.clientPhone === clientPhone);
  }
  if (city) {
    const term = city.toLowerCase();
    list = list.filter((m) => m.zone.name.toLowerCase().includes(term));
  }
  if (zoneType) {
    list = list.filter((m) => m.zone.type === zoneType);
  }
  if (proximityFlag === "true" && lat && lng) {
    const agentLat = parseFloat(lat);
    const agentLng = parseFloat(lng);
    list = list.map((m) => {
      let distanceKm = 999;
      if (m.zone.lat && m.zone.lng) {
        distanceKm = getGpsDistance(agentLat, agentLng, m.zone.lat, m.zone.lng);
      }
      return { ...m, distanceKm };
    });
    list.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }
  return res.json(list);
});
app.post("/api/missions", (req, res) => {
  const {
    title,
    description,
    clientPhone,
    clientName,
    zone,
    fields,
    totalRequired,
    budgetAgentFcfa
  } = req.body;
  if (!title || !clientPhone || !totalRequired || !budgetAgentFcfa) {
    return res.status(400).json({ error: "Des informations de base sont manquantes pour cr\xE9er la mission." });
  }
  const marginFrac = 1 - db.platformConfig.marginPercent / 100;
  const calculatedClientCost = Math.round(budgetAgentFcfa * totalRequired / marginFrac);
  const pointsPerCollect = Math.round(budgetAgentFcfa / db.platformConfig.pointsToFcfaRate);
  const missionId = `m-${Date.now()}`;
  const newMission = {
    id: missionId,
    title,
    description,
    clientPhone,
    clientName,
    status: "en_attente_paiement" /* EN_ATTENTE_PAIEMENT */,
    // Flow starts here
    pointsPerCollect,
    budgetAgentFcfa,
    totalCostClientFcfa: calculatedClientCost,
    fields: fields || [{ id: "f-gps", type: "gps" /* GPS */, label: "Position GPS", required: true }],
    zone: zone || { type: "any", name: "B\xE9nin National" },
    totalRequired,
    collectedCount: 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
    // 30 days default
  };
  db.missions[missionId] = newMission;
  if (!db.notifications["+22999999999"]) db.notifications["+22999999999"] = [];
  db.notifications["+22999999999"].push({
    id: `n-${Date.now()}`,
    recipientPhone: "+22999999999",
    title: "Nouvelle mission soumise",
    message: `Le client ${clientName} a soumis la mission '${title}'. En attente de validation de paiement (${calculatedClientCost} FCFA).`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  return res.json({ success: true, mission: newMission });
});
app.post("/api/missions/ai-suggest", async (req, res) => {
  const { prompt, clientCity } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "La description textuelle de votre besoin est indispensable." });
  }
  if (!ai) {
    return res.json({
      title: `Collecte: ${prompt.slice(0, 30)}...`,
      description: `Collecte terrain intelligente au B\xE9nin pour recueillir: ${prompt}`,
      zone: { type: "city", name: clientCity || "Cotonou", lat: 6.3654, lng: 2.4183, radiusKm: 5 },
      totalRequired: 10,
      budgetAgentFcfa: 1500,
      totalCostClientFcfa: 25e3,
      pointsPerCollect: 150,
      fields: [
        { id: "f1", type: "text" /* TEXT */, label: "Lieu exact ou nom du commerce", required: true },
        { id: "f2", type: "number" /* NUMBER */, label: "Prix indicatif relev\xE9 (FCFA)", required: true },
        { id: "f3", type: "select" /* SELECT */, label: "Le produit est-il visible au public ?", required: true, options: ["Oui", "Non", "En r\xE9serve seulement"] },
        { id: "f4", type: "photo" /* PHOTO */, label: "Photo d'\xE9talage en situation r\xE9elle", required: true },
        { id: "f5", type: "gps" /* GPS */, label: "Validation GPS requise", required: true }
      ]
    });
  }
  try {
    const aiPrompt = `Tu es un assistant expert pour DataBroker229, le leader de l'intelligence commerciale terrain au B\xE9nin.
Le client formule sa demande de collecte d'informations libres en fran\xE7ais: "${prompt}".
G\xE9n\xE8re une proposition de mission structur\xE9e r\xE9pondant rigoureusement \xE0 cette demande.
Tu dois renvoyer obligatoirement un objet JSON valide reprenant exactement ces cl\xE9s :
 {
  "title": "Titre professionnel court et frappant",
  "description": "Une explication d\xE9taill\xE9e et claire pour motiver les agents collecteurs qui se rendront sur place",
  "zone": {
    "type": "city" | "market" | "radius",
    "name": "Nom de la ville ou du march\xE9 cibl\xE9 du B\xE9nin (ex: Dantokpa, Cotonou, Porto-Novo, Parakou)",
    "lat": 6.36, // Coordonn\xE9es g\xE9ographiques approximatives b\xE9ninoises appropri\xE9es
    "lng": 2.44,
    "radiusKm": 5 // distance km sugg\xE9r\xE9e
  },
  "totalRequired": 10, // Nombre recommand\xE9 de collectes \xE0 faire (entre 5 et 30)
  "budgetAgentFcfa": 1200, // Budget recommand\xE9 pay\xE9 \xE0 l'agent par collecte (entre 500 et 4000 FCFA selon la complexit\xE9)
  "fields": [
     // Maximum 5 champs appropri\xE9s pertinents.
     // Chaque champ a: id ("f1", "f2", etc.), type ("text", "number", "boolean", "select", "photo", "gps"), label ("libell\xE9 clair en fran\xE7ais"), required (true/false), options (si type "select", ex: ["Choix A", "Choix B"])
  ]
 }
Assure-toi que la liste des champs form\xE9s poss\xE8de toujours au moins un champ de type "photo" obligatoire et un de type "gps" obligatoire pour contrer la fraude.
Reste dans la th\xE9matique du B\xE9nin et des donn\xE9es de terrain.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    const bodyText = response.text || "{}";
    const data = JSON.parse(bodyText.trim());
    const totalRequired = data.totalRequired || 10;
    const budgetAgent = data.budgetAgentFcfa || 1e3;
    const marginFrac = 1 - db.platformConfig.marginPercent / 100;
    data.totalCostClientFcfa = Math.round(budgetAgent * totalRequired / marginFrac);
    data.pointsPerCollect = Math.round(budgetAgent / db.platformConfig.pointsToFcfaRate);
    return res.json(data);
  } catch (err) {
    console.error("AI Generation error:", err);
    return res.status(500).json({ error: "L'IA n'a pas pu structurer la mission. Formulaire classique propos\xE9 en secours." });
  }
});
app.post("/api/submissions", (req, res) => {
  const { missionId, agentPhone, answers, photoUrl, gpsLocation } = req.body;
  if (!missionId || !agentPhone || !answers) {
    return res.status(400).json({ error: "Informations de collecte incompl\xE8tes." });
  }
  const agent = db.users[agentPhone];
  if (!agent) {
    return res.status(404).json({ error: "Agent introuvable." });
  }
  const mission = db.missions[missionId];
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable." });
  }
  if (mission.status !== "active" /* ACTIVE */) {
    return res.status(400).json({ error: "Cette mission n'est plus active." });
  }
  let fraudScore = "faible";
  const fraudAlerts = [];
  if (photoUrl) {
    const photoHash = stringHash(photoUrl);
    const allSubs = Object.values(db.submissions);
    const duplicatePhoto = allSubs.find((s) => s.photoUrl && stringHash(s.photoUrl) === photoHash);
    if (duplicatePhoto) {
      fraudScore = "eleve";
      fraudAlerts.push(`Photo identique suspect\xE9e (concordance avec collecte ${duplicatePhoto.id} par ${duplicatePhoto.agentName})`);
    }
  }
  if (gpsLocation) {
    const currentLat = parseFloat(gpsLocation.lat);
    const currentLng = parseFloat(gpsLocation.lng);
    if (mission.zone.lat && mission.zone.lng && mission.zone.radiusKm) {
      const distanceToZone = getGpsDistance(currentLat, currentLng, mission.zone.lat, mission.zone.lng);
      if (distanceToZone > mission.zone.radiusKm) {
        fraudScore = "eleve";
        fraudAlerts.push(`Hors Zone : Collecte effectu\xE9e \xE0 ${distanceToZone.toFixed(2)} km du centre d'\xE9tude (${mission.zone.name}) alors que la port\xE9e maximale est de ${mission.zone.radiusKm} km.`);
      }
    }
    const allSubs = Object.values(db.submissions);
    for (const sub of allSubs) {
      if (sub.missionId === missionId && sub.gpsLocation) {
        const distMeters = getGpsDistance(currentLat, currentLng, sub.gpsLocation.lat, sub.gpsLocation.lng) * 1e3;
        if (distMeters < db.platformConfig.minGpsDistanceMeters) {
          if (fraudScore !== "eleve") fraudScore = "moyen";
          fraudAlerts.push(`Localisation suspecte : trop proche d'une collecte existante (${sub.id} \xE0 seulement ${distMeters.toFixed(1)} m\xE8tres).`);
        }
      }
    }
  }
  const submissionId = `s-${Date.now()}`;
  const newSubmission = {
    id: submissionId,
    missionId,
    missionTitle: mission.title,
    agentPhone,
    agentName: agent.name,
    status: "pending",
    answers,
    photoUrl,
    gpsLocation,
    fraudScore,
    fraudAlerts,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.submissions[submissionId] = newSubmission;
  fraudAlerts.forEach((alertText) => {
    db.fraudLogs.push({
      id: `fl-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      submissionId,
      agentPhone,
      type: alertText.includes("Photo") ? "duplicate_photo" : "gps_outside",
      description: alertText,
      severity: fraudScore === "eleve" ? "high" : "medium",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  if (!db.notifications["+22999999999"]) db.notifications["+22999999999"] = [];
  db.notifications["+22999999999"].push({
    id: `n-${Date.now()}`,
    recipientPhone: "+22999999999",
    title: `Collecte soumise - ${mission.title}`,
    message: `L'agent ${agent.name} a soumis un relev\xE9. Score de suspicion : ${fraudScore.toUpperCase()}`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  return res.json({ success: true, submission: newSubmission });
});
app.post("/api/submissions/action", (req, res) => {
  const { submissionId, action, feedback } = req.body;
  if (!submissionId || !action) {
    return res.status(400).json({ error: "submissionId et action sont obligatoires." });
  }
  const sub = db.submissions[submissionId];
  if (!sub) {
    return res.status(404).json({ error: "Collecte introuvable." });
  }
  if (sub.status !== "pending") {
    return res.status(400).json({ error: "Cette collecte a d\xE9j\xE0 \xE9t\xE9 trait\xE9e." });
  }
  const mission = db.missions[sub.missionId];
  const agent = db.users[sub.agentPhone];
  if (action === "approve") {
    sub.status = "approved";
    sub.feedback = feedback || "Donn\xE9es conformes, merci !";
    if (mission) {
      mission.collectedCount += 1;
      if (mission.collectedCount >= mission.totalRequired) {
        mission.status = "terminee" /* TERMINEE */;
        if (!db.notifications[mission.clientPhone]) db.notifications[mission.clientPhone] = [];
        db.notifications[mission.clientPhone].push({
          id: `n-${Date.now()}`,
          recipientPhone: mission.clientPhone,
          title: `Mission termin\xE9e : ${mission.title}`,
          message: `F\xE9licitations, vos ${mission.totalRequired} collectes sont enti\xE8rement compil\xE9es ! Vos rapports Excel et PDF sont g\xE9n\xE9r\xE9s et pr\xEAts au t\xE9l\xE9chargement. Slogan officiel : "Des donn\xE9es terrain fiables, partout au B\xE9nin."`,
          isRead: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
    if (agent) {
      let multiplier = 1;
      if (agent.level === "SILVER" /* SILVER */) multiplier = 1.05;
      else if (agent.level === "GOLD" /* GOLD */) multiplier = 1.1;
      else if (agent.level === "ELITE" /* ELITE */) multiplier = 1.15;
      const basePoints = mission ? mission.pointsPerCollect : 100;
      const rewardedPoints = Math.round(basePoints * multiplier);
      agent.points += rewardedPoints;
      const oldLevel = agent.level;
      if (agent.points >= 5e3) {
        agent.level = "ELITE" /* ELITE */;
      } else if (agent.points >= 2e3) {
        agent.level = "GOLD" /* GOLD */;
      } else if (agent.points >= 500) {
        agent.level = "SILVER" /* SILVER */;
      }
      agent.score = Math.min(100, agent.score + 1);
      if (!db.notifications[sub.agentPhone]) db.notifications[sub.agentPhone] = [];
      db.notifications[sub.agentPhone].push({
        id: `n-${Date.now()}`,
        recipientPhone: sub.agentPhone,
        title: "Collecte Valid\xE9e ! \u{1F389}",
        message: `Votre relev\xE9 pour '${sub.missionTitle}' a \xE9t\xE9 approuv\xE9. Vous gagnez ${rewardedPoints} points (incluant Bonus de Niveau). Votre solde est de ${agent.points} pts.`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      if (agent.level !== oldLevel) {
        db.notifications[sub.agentPhone].push({
          id: `n-${Date.now()}-lvl`,
          recipientPhone: sub.agentPhone,
          title: "Nouveau Niveau Atteint ! \u{1F3C6}",
          message: `F\xE9licitations ! Vous \xEAtes pass\xE9 au niveau ${agent.level}. Vos bonus de gain passent \xE0 +${(multiplier - 1) * 100}% !`,
          isRead: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
  } else {
    sub.status = "rejected";
    sub.feedback = feedback || "Motif : Photo floue ou donn\xE9es non concordantes.";
    if (agent) {
      agent.score = Math.max(50, agent.score - 5);
      if (agent.score < 60) {
        agent.isSuspended = true;
        db.notifications["+22999999999"].push({
          id: `n-${Date.now()}-susp`,
          recipientPhone: "+22999999999",
          title: "Agent Suspendu Automatiquement",
          message: `L'agent ${agent.name} (${agent.phone}) a \xE9t\xE9 suspendu car son score de fiabilit\xE9 est tomb\xE9 \xE0 ${agent.score}% suite \xE0 un rejet.`,
          isRead: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      if (!db.notifications[sub.agentPhone]) db.notifications[sub.agentPhone] = [];
      db.notifications[sub.agentPhone].push({
        id: `n-${Date.now()}-rej`,
        recipientPhone: sub.agentPhone,
        title: "Collecte Rejet\xE9e \u26A0\uFE0F",
        message: `Votre relev\xE9 pour '${sub.missionTitle}' a \xE9t\xE9 refus\xE9. Motif : ${sub.feedback}. Votre r\xE9putation est \xE0 ${agent.score}%`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  saveDatabase();
  return res.json({ success: true, submission: sub, agent });
});
app.post("/api/withdrawals", (req, res) => {
  const { phone, points, method } = req.body;
  if (!phone || !points || !method) {
    return res.status(400).json({ error: "Num\xE9ro, points et m\xE9thode obligatoires." });
  }
  const agent = db.users[phone];
  if (!agent) {
    return res.status(404).json({ error: "Agent introuvable." });
  }
  const qty = parseInt(points);
  if (qty < 50) {
    return res.status(400).json({ error: "Le seuil minimal de retrait est de 50 points (500 FCFA)." });
  }
  if (agent.points < qty) {
    return res.status(400).json({ error: "Solde de points insuffisant." });
  }
  const amountFcfa = qty * db.platformConfig.pointsToFcfaRate;
  agent.points -= qty;
  const withdrawalId = `w-${Date.now()}`;
  const newRequest = {
    id: withdrawalId,
    agentPhone: phone,
    agentName: agent.name,
    pointsQuantity: qty,
    amountFcfa,
    status: "pending",
    paymentMethod: method,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.withdrawals[withdrawalId] = newRequest;
  if (!db.notifications["+22999999999"]) db.notifications["+22999999999"] = [];
  db.notifications["+22999999999"].push({
    id: `n-${Date.now()}`,
    recipientPhone: "+22999999999",
    title: "Demande de Retrait Re\xE7ue \u{1F4B5}",
    message: `L'agent ${agent.name} demande ${qty} points (${amountFcfa} FCFA) via ${method}.`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  return res.json({ success: true, balance: agent.points, withdrawal: newRequest });
});
app.post("/api/withdrawals/approve", (req, res) => {
  const { withdrawalId } = req.body;
  if (!withdrawalId) {
    return res.status(400).json({ error: "withdrawalId obligatoire." });
  }
  const wr = db.withdrawals[withdrawalId];
  if (!wr) {
    return res.status(404).json({ error: "Demande introuvable." });
  }
  wr.status = "completed";
  if (!db.notifications[wr.agentPhone]) db.notifications[wr.agentPhone] = [];
  db.notifications[wr.agentPhone].push({
    id: `n-${Date.now()}`,
    recipientPhone: wr.agentPhone,
    title: "Retrait Approuv\xE9 ! \u{1F4B0}",
    message: `Votre transfert de ${wr.amountFcfa} FCFA (${wr.pointsQuantity} pts) a \xE9t\xE9 vers\xE9 avec succ\xE8s via ${wr.paymentMethod}. Merci pour votre d\xE9vouement sur le terrain !`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  return res.json({ success: true, withdrawal: wr });
});
app.post("/api/missions/pay-confirm", (req, res) => {
  const { missionId } = req.body;
  const mission = db.missions[missionId];
  if (!mission) {
    return res.status(404).json({ error: "Mission introuvable." });
  }
  mission.status = "active" /* ACTIVE */;
  if (!db.notifications[mission.clientPhone]) db.notifications[mission.clientPhone] = [];
  db.notifications[mission.clientPhone].push({
    id: `n-${Date.now()}`,
    recipientPhone: mission.clientPhone,
    title: "Mission Activ\xE9e \u{1F389}",
    message: `Le paiement pour '${mission.title}' a \xE9t\xE9 valid\xE9. Les agents du B\xE9nin re\xE7oivent l'alerte d\xE8s maintenant.`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  Object.values(db.users).forEach((u) => {
    if (u.role === "agent" /* AGENT */) {
      if (!db.notifications[u.phone]) db.notifications[u.phone] = [];
      db.notifications[u.phone].push({
        id: `n-${Date.now()}-alert`,
        recipientPhone: u.phone,
        title: "Nouvelle Mission Disponible ! \u{1F1E7}\u{1F1EF}",
        message: `Une mission pr\xE8s de vous : '${mission.title}' offrant +${mission.pointsPerCollect} points par soumission !`,
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  saveDatabase();
  return res.json({ success: true, mission });
});
app.post("/api/support", (req, res) => {
  const { phone, name, category, description, screenshot } = req.body;
  if (!phone || !category || !description) {
    return res.status(400).json({ error: "Les champs t\xE9l\xE9phone, cat\xE9gorie et description sont requis." });
  }
  const ticketId = `t-${Date.now()}`;
  const newTicket = {
    id: ticketId,
    senderPhone: phone,
    senderName: name || "Anonyme",
    category,
    description,
    screenshot,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  db.supportTickets[ticketId] = newTicket;
  if (!db.notifications["+22999999999"]) db.notifications["+22999999999"] = [];
  db.notifications["+22999999999"].push({
    id: `n-${Date.now()}`,
    recipientPhone: "+22999999999",
    title: "Ticket de support soumis",
    message: `Ticket (${category}) de la part de ${name || phone}. Description: ${description.slice(0, 50)}...`,
    isRead: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  saveDatabase();
  return res.json({ success: true, ticket: newTicket });
});
app.post("/api/chatbot", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Votre message est vide." });
  }
  if (!ai) {
    return res.json({
      reply: `D\xE9sol\xE9, je suis en mode maintenance locale. Slogan officiel : "Des donn\xE9es terrain fiables, partout au B\xE9nin." Pour toute assistance urgente, contactez notre support officiel au WhatsApp : +229 55256871 (Email : jeanjacquesaguin30@gmail.com).`
    });
  }
  try {
    const activeMissionsSummary = Object.values(db.missions).map((m) => `- ${m.title} (${m.zone.name}): +${m.pointsPerCollect} points.`).join("\n");
    const systemInstruction = `Tu es l'assistant IA officiel de DataBroker229 \u{1F1E7}\u{1F1EF} (le r\xE9seau d'intelligence terrain au B\xE9nin).
Slogan de l'entreprise: "Des donn\xE9es terrain fiables, partout au B\xE9nin."
Email de l'assistance : jeanjacquesaguin30@gmail.com
WhatsApp de l'assistance : +229 55256871 (Lien vers WhatsApp: wa.me/22955256871)

Ta mission :
- Conseiller chaleureusement et efficacement les agents collecteurs, les clients et les curieux.
- Expliquer le bar\xEAme officiel b\xE9ninois : 1 point = 10 FCFA (seuil minimum de retrait : 50 points soit 500 FCFA).
- Pr\xE9senter la gamification :
  \u{1F4A1} BRONZE : 0 \xE0 499 pts (bonus 0%)
  \u{1F948} SILVER : 500 \xE0 1999 pts (bonus +5%)
  \u{1F947} GOLD : 2000 \xE0 4999 pts (bonus +10%)
  \u{1F3C6} ELITE : 5000+ pts (bonus +15%)
- \xC9voquer les contr\xF4les anti-fraude rigoureux : double soumission de photos ou de coordonn\xE9es GPS identiques refus\xE9e, g\xE9olocalisation v\xE9rifi\xE9e avec un seuil minimal de 50 m\xE8tres.
- Si la question de l'utilisateur concerne une assistance technique avanc\xE9e, un litige de paiement ou un bug, ou si tu ne connais pas la r\xE9ponse avec certitude, tu dois imp\xE9rativement formuler mot pour mot la phrase suivante en conclusion :
"Je n\u2019ai pas trouv\xE9 une r\xE9ponse pr\xE9cise \xE0 votre probl\xE8me. Contactez le support DataBroker229 \u{1F1E7}\u{1F1EF} sur WhatsApp : +229 55256871"
et donner le lien direct.

Voici les missions actuellement actives sur la plateforme :
${activeMissionsSummary}

R\xE9ponds de mani\xE8re conviviale, professionnelle et ancr\xE9e au B\xE9nin (utilise de temps en temps des expressions polies).`;
    const chatHistory = history || [];
    const contents = [...chatHistory, { role: "user", parts: [{ text: message }] }];
    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });
    return res.json({ reply: result.text || "Quelque chose s'est mal pass\xE9." });
  } catch (err) {
    console.error("Chatbot generation error:", err);
    return res.json({
      reply: "Je rencontre une micro-coupure r\xE9seau. N'h\xE9sitez pas \xE0 poser votre question ou contactez-nous directement sur notre support WhatsApp au +229 55256871 !"
    });
  }
});
app.get("/api/notifications", (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.json([]);
  const list = db.notifications[phone] || [];
  return res.json(list);
});
app.post("/api/notifications/read", (req, res) => {
  const { phone } = req.body;
  if (phone && db.notifications[phone]) {
    db.notifications[phone].forEach((n) => n.isRead = true);
    saveDatabase();
  }
  return res.json({ success: true });
});
app.get("/api/admin/stats", (req, res) => {
  const usersList = Object.values(db.users);
  const missionsList = Object.values(db.missions);
  const subsList = Object.values(db.submissions);
  const withdrawalsList = Object.values(db.withdrawals);
  const stats = {
    totalUsers: usersList.length,
    agentsCount: usersList.filter((u) => u.role === "agent" /* AGENT */).length,
    clientsCount: usersList.filter((u) => u.role === "client" /* CLIENT */).length,
    totalMissions: missionsList.length,
    activeMissions: missionsList.filter((m) => m.status === "active" /* ACTIVE */).length,
    pendingPaymentMissions: missionsList.filter((m) => m.status === "en_attente_paiement" /* EN_ATTENTE_PAIEMENT */).length,
    completedMissions: missionsList.filter((m) => m.status === "terminee" /* TERMINEE */).length,
    totalSubmissions: subsList.length,
    pendingSubmissions: subsList.filter((s) => s.status === "pending").length,
    approvedSubmissions: subsList.filter((s) => s.status === "approved").length,
    rejectedSubmissions: subsList.filter((s) => s.status === "rejected").length,
    pendingWithdrawals: withdrawalsList.filter((w) => w.status === "pending").length,
    paidWithdrawalsAmountFcfa: withdrawalsList.filter((w) => w.status === "completed").reduce((sum, w) => sum + w.amountFcfa, 0),
    platformRevenuesFcfa: Object.values(db.missions).reduce((sum, m) => {
      if (m.status !== "en_attente_paiement" /* EN_ATTENTE_PAIEMENT */) {
        return sum + (m.totalCostClientFcfa - m.budgetAgentFcfa * m.totalRequired);
      }
      return sum;
    }, 0),
    fraudAlertsCount: db.fraudLogs.length,
    marginPercent: db.platformConfig.marginPercent,
    minGpsDistanceMeters: db.platformConfig.minGpsDistanceMeters
  };
  return res.json({
    stats,
    fraudLogs: db.fraudLogs.slice(-15),
    // Last 15 alerts
    allWithdrawals: withdrawalsList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    allUsers: usersList,
    allSubmissions: subsList.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  });
});
app.post("/api/admin/config", (req, res) => {
  const { marginPercent, minGpsDistanceMeters } = req.body;
  if (marginPercent !== void 0) {
    db.platformConfig.marginPercent = parseFloat(marginPercent);
  }
  if (minGpsDistanceMeters !== void 0) {
    db.platformConfig.minGpsDistanceMeters = parseInt(minGpsDistanceMeters);
  }
  saveDatabase();
  return res.json({ success: true, config: db.platformConfig });
});
app.get("/api/export/csv", (req, res) => {
  const { missionId } = req.query;
  if (!missionId) {
    return res.status(400).send("missionId requis");
  }
  const mission = db.missions[missionId];
  if (!mission) {
    return res.status(404).send("Mission introuvable.");
  }
  const subs = Object.values(db.submissions).filter((s) => s.missionId === missionId && s.status === "approved");
  const baseHeaders = ["Collect ID", "Agent Phone", "Agent Nom", "Date Soumission", "GPS Latitude", "GPS Longitude"];
  const dynamicFieldHeaders = mission.fields.map((f) => f.label);
  const headers = [...baseHeaders, ...dynamicFieldHeaders];
  const rows = subs.map((s) => {
    const baseFields = [
      s.id,
      s.agentPhone,
      s.agentName,
      s.createdAt,
      s.gpsLocation?.lat || "",
      s.gpsLocation?.lng || ""
    ];
    const dynamicFields = mission.fields.map((f) => {
      const val = s.answers[f.id] || "";
      return `"${val.replace(/"/g, '""')}"`;
    });
    return [...baseFields, ...dynamicFields].join(",");
  });
  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="DataBroker229_Mission_${missionId}.csv"`);
  return res.status(200).send(csvContent);
});
app.get("/databroker229-export.zip", (req, res) => {
  const filePath = import_path.default.join(process.cwd(), "public", "databroker229-export.zip");
  if (import_fs.default.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="databroker229-export.zip"');
    return res.sendFile(filePath);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist", "databroker229-export.zip");
    if (import_fs.default.existsSync(distPath)) {
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="databroker229-export.zip"');
      return res.sendFile(distPath);
    }
    return res.status(404).send("Le fichier export ZIP n'est pas encore g\xE9n\xE9r\xE9 sur le serveur. Veuillez patienter ou contacter l'administrateur.");
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`=========================================`);
    console.log(`DataBroker229 Benin backend started.`);
    console.log(`Server listening at http://localhost:${PORT}`);
    console.log(`=========================================`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
