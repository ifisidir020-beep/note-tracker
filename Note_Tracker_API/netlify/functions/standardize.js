const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
    // 1. Autoriser ton extension à communiquer avec ce serveur (CORS)
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS"
    };

    // Gestion de la requête "preflight" (sécurité du navigateur)
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers, body: "" };
    }

    try {
        // 2. Récupérer le brouillon de l'agent
        const { texteBrut } = JSON.parse(event.body);

        // 3. Initialiser Gemini avec ta clé secrète (cachée dans Netlify)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 4. Le System Prompt avec tes 4 règles d'or
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

        // 5. On demande à l'IA de travailler
        const result = await model.generateContent(prompt);
        const texteCorrige = result.response.text();

        // 6. On renvoie le résultat propre à l'extension
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ texteStandardise: texteCorrige.trim() })
        };

    } catch (error) {
        console.error("Erreur IA:", error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ error: "Erreur de connexion au cerveau IA." }) 
        };
    }
};