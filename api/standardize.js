const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function (req, res) {
    // 1. Autoriser les requêtes CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    try {
        // 2. Récupérer le texte brut
        const { texteBrut } = req.body;

        if (!texteBrut) {
            return res.status(400).json({ error: "Texte brut manquant." });
        }

        // 3. Initialiser Gemini (Mise à jour vers le modèle le plus rapide et intelligent)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // 4. Le NOUVEAU Prompt intelligent (Assistant + Correcteur)
        const prompt = `
        Tu es l'assistant de Rédaction Expert du projet Technosmart. 
        Tu vas recevoir un texte de l'utilisateur. Analyse-le et détermine dans quel cas on se trouve :

        CAS 1 - UNE INSTRUCTION : Si l'utilisateur te donne un ordre de création (ex: 'rédige une note pour dire que le client est injoignable', 'je veux une note indiquant un refus'). 
        Dans ce cas, AGIS COMME UN RÉDACTEUR. Invente la note de manière très professionnelle, structurée et prête à l'emploi.

        CAS 2 - DES NOTES BRUTES : Si l'utilisateur te donne des notes rapides et brouillonnes (ex: informations en vrac, abréviations, erreurs).
        Dans ce cas, AGIS COMME UN CORRECTEUR avec les 4 règles de Technosmart :
        1. Politesse et Neutralité : Traduis les insultes en termes pro ("agression verbale").
        2. Zéro faute : Corrige l'orthographe, la grammaire et mets une ponctuation parfaite.
        3. Exhaustivité : Ne supprime JAMAIS une donnée technique, une action ou un numéro de téléphone.
        4. Clarté : Formate le texte de manière structurée avec des tirets (Contexte, Action, Résultat).

        RÈGLE ABSOLUE POUR TOUS LES CAS : Ne réponds QUE par la note finale. Aucune phrase d'introduction du type "Voici la note :", aucune phrase de conclusion. Ton texte remplacera directement celui de l'utilisateur.
        
        Texte fourni par l'utilisateur : "${texteBrut}"
        `;

        const result = await model.generateContent(prompt);
        const texteCorrige = result.response.text();

        return res.status(200).json({ texteStandardise: texteCorrige.trim() });

    } catch (error) {
        console.error("Erreur IA Vercel:", error);
        return res.status(500).json({ error: "Erreur de connexion au cerveau IA." });
    }
};
