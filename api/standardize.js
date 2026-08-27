const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function (req, res) {
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
        const { texteBrut } = req.body;

        if (!texteBrut) {
            return res.status(400).json({ error: "Texte brut manquant." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Tu es l'assistant Qualité du projet Technosmart. 
        Standardise cette note d'appel en respectant ces 4 règles :
        1. Politesse et Neutralité : Traduis les insultes en termes pro ("agression verbale", "propos injurieux").
        2. Zéro faute : Corrige l'orthographe et la grammaire.
        3. Exhaustivité : Ne supprime jamais une donnée technique, une action ou un numéro.
        4. Clarté : Formate avec des tirets (Contexte, Action, Résultat).
        
        Ne réponds que par la note corrigée, sans introduction ni conclusion.
        
        Note brute : "${texteBrut}"
        `;

        const result = await model.generateContent(prompt);
        const texteCorrige = result.response.text();

        return res.status(200).json({ texteStandardise: texteCorrige.trim() });

    } catch (error) {
        console.error("Erreur IA Vercel:", error);
        return res.status(500).json({ error: `Erreur: ${error.message}` });
    }
};
