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

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "Clé API manquante sur Vercel." });
        }

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

        // Utilisation de l'endpoint v1 avec gemini-pro
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const googleErrorMsg = data.error?.message || JSON.stringify(data);
            return res.status(500).json({ error: `Google: ${googleErrorMsg}` });
        }

        const texteCorrige = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!texteCorrige) {
            return res.status(500).json({ error: "Réponse vide de l'IA." });
        }

        return res.status(200).json({ texteStandardise: texteCorrige.trim() });

    } catch (error) {
        console.error("Erreur serveur:", error);
        return res.status(500).json({ error: `Serveur: ${error.message}` });
    }
};
