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

        // 3. Initialiser Gemini avec gemini-pro (universel et stable)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });

        // 4. Les 4 règles d'or (System Prompt)
        const prompt = `
        Tu es l'assistant Qualité intraitable du projet Technosmart. 
        Standardise cette note d'appel en respectant STRICTEMENT ces 4 règles :
        1. Politesse et Neutralité : Traduis les insultes en termes pro ("agression verbale", "propos injurieux").
        2. Zéro faute : Corrige l'orthographe, la grammaire et mets une ponctuation parfaite.
        3. Exhaustivité : Ne supprime JAMAIS une donnée technique, une action ou un numéro de téléphone.
        4. Clarté : Formate le texte de manière structurée avec des tirets (Contexte, Action, Résultat).
        
        Ne réponds que par la note corrigée, aucune phrase d'introduction ou de conclusion.
        
        Note brute à corriger : "${texteBrut}"
        `;

        const result = await model.generateContent(prompt);
        const texteCorrige = result.response.text();

        return res.status(200).json({ texteStandardise: texteCorrige.trim() });

    } catch (error) {
        console.error("Erreur IA Vercel:", error);
        return res.status(500).json({ error: "Erreur de connexion au cerveau IA." });
    }
};
