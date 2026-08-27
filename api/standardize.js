module.exports = async function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Méthode non autorisée" });

    try {
        const { texteBrut } = req.body;
        if (!texteBrut) return res.status(400).json({ error: "Texte brut manquant." });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: "Clé API manquante." });

        // ÉTAPE 1 : Détection automatique du modèle autorisé
        const listReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listReq.json();

        if (!listReq.ok) {
            return res.status(500).json({ error: `Erreur d'accès API: ${listData.error?.message || 'Clé non valide'}` });
        }

        const models = listData.models || [];
        
        // On cherche en priorité "1.5-flash", sinon "1.5-pro", sinon n'importe quel "gemini" valide
        let targetModel = models.find(m => m.name.includes("gemini-1.5-flash") && m.supportedGenerationMethods?.includes("generateContent"));
        if (!targetModel) {
            targetModel = models.find(m => m.name.includes("gemini-1.5-pro") && m.supportedGenerationMethods?.includes("generateContent"));
        }
        if (!targetModel) {
            targetModel = models.find(m => m.name.includes("gemini") && m.supportedGenerationMethods?.includes("generateContent"));
        }

        if (!targetModel) {
            return res.status(500).json({ error: "Aucun modèle Gemini de génération trouvé pour ta clé." });
        }

        // ÉTAPE 2 : Appel de l'IA avec le nom de modèle parfait
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

        const genReq = await fetch(`https://generativelanguage.googleapis.com/v1beta/${targetModel.name}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const genData = await genReq.json();

        if (!genReq.ok) {
            return res.status(500).json({ error: `Erreur IA: ${genData.error?.message || 'Erreur inconnue'}` });
        }

        const texteCorrige = genData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!texteCorrige) return res.status(500).json({ error: "Réponse vide de l'IA." });

        return res.status(200).json({ texteStandardise: texteCorrige.trim() });

    } catch (error) {
        console.error("Erreur serveur:", error);
        return res.status(500).json({ error: `Serveur: ${error.message}` });
    }
};
