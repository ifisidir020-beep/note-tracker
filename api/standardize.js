const { GoogleGenerativeAI } = require("@google/generative-ai");

module.exports = async function (req, res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") return res.status(200).end();

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // On demande à Google : "Montre-moi la liste de TOUS les modèles auxquels j'ai accès"
        const request = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await request.json();
        
        return res.status(200).json({ modelesDisponibles: data });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
