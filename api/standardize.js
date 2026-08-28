const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

module.exports = async function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

    try {
        const { texteBrut } = req.body;
        if (!texteBrut) return res.status(400).json({ error: "Texte brut manquant." });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // 🚨 DÉSACTIVATION DE LA CENSURE
        const safetySettings = [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];

        // On retourne sur l'ancien modèle robuste (gemini-pro)
        const model = genAI.getGenerativeModel({ model: "gemini-pro", safetySettings });

        const prompt = `
        Tu es l'assistant de Rédaction Expert du projet Technosmart. 
        Tu vas recevoir un texte de l'utilisateur. Analyse-le et détermine dans quel cas on se trouve :

        CAS 1 - UNE INSTRUCTION : Si l'utilisateur te donne un ordre de création (ex: 'rédige une note pour dire que le client est injoignable'). 
        Dans ce cas, AGIS COMME UN RÉDACTEUR. Invente la note de manière très professionnelle, structurée et prête à l'emploi.

        CAS 2 - DES NOTES BRUTES : Si l'utilisateur te donne des notes rapides et brouillonnes.
        Dans ce cas, AGIS COMME UN CORRECTEUR avec les 4 règles de Technosmart :
        1. Politesse et Neutralité : Traduis les insultes en termes pro ("agression verbale", "insatisfaction majeure").
        2. Zéro faute : Corrige l'orthographe, la grammaire et mets une ponctuation parfaite.
        3. Exhaustivité : Ne supprime JAMAIS une donnée technique, une action ou un numéro de téléphone.
        4. Clarté : Formate le texte de manière structurée avec des tirets (Contexte, Action, Résultat).

        RÈGLE ABSOLUE POUR TOUS LES CAS : Ne réponds QUE par la note finale. Aucune phrase d'introduction.
        
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
