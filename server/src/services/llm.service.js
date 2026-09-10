const { Mistral } = require("@mistralai/mistralai");

const FALLBACK_MODEL = "open-mistral-nemo";
const apiKey = process.env.LLM_API_KEY || "dummy_key";

function resolveModelName(requestedModel) {
  if (!requestedModel) return FALLBACK_MODEL;
  if (
    requestedModel === "mistral-large-latest" ||
    requestedModel.startsWith("mistral-large")
  ) {
    return FALLBACK_MODEL;
  }
  return requestedModel;
}

function normalizeSummaryResult(result) {
  if (!result || typeof result !== "object") return result;

  const keyConcepts = Array.isArray(result.keyConcepts)
    ? result.keyConcepts.map((item) => String(item))
    : [];

  const takeaways = Array.isArray(result.takeaways)
    ? result.takeaways.map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const action = item.action || item.title || "Takeaway";
          const insight =
            item.insight || item.description || item.summary || "";
          return insight ? `${action}: ${insight}` : String(action);
        }
        return String(item ?? "");
      })
    : [];

  return {
    ...result,
    keyConcepts,
    takeaways,
  };
}

const llmModel = resolveModelName(
  process.env.LLM_MODEL || "mistral-large-latest",
);
const client = new Mistral({ apiKey });

async function callModel({ model, messages, responseFormat }) {
  try {
    return await client.chat.complete({ model, messages, responseFormat });
  } catch (error) {
    const isTierBlocked =
      error?.status === 403 ||
      error?.code === 1910 ||
      /not available in your subscription tier|tier_not_allowed/i.test(
        error?.message || "",
      );

    if (isTierBlocked && model !== FALLBACK_MODEL) {
      console.warn(
        `[LLM] Model ${model} is unavailable for this subscription. Retrying with ${FALLBACK_MODEL}.`,
      );
      return client.chat.complete({
        model: FALLBACK_MODEL,
        messages,
        responseFormat,
      });
    }

    throw error;
  }
}

function isGenericQuestion(question) {
  const q = question.toLowerCase().trim();
  return (
    q.includes("summarize") ||
    q.includes("summary") ||
    q.includes("main idea") ||
    q.includes("main point") ||
    q.includes("key concepts") ||
    q.includes("key takeaways") ||
    q.includes("what is this video about") ||
    q.includes("what is this lecture about") ||
    q.includes("what is the lecture about") ||
    q.includes("what is the video about") ||
    q === "explain the most important concept simply."
  );
}

async function generateChatResponse(question, contextChunks, videoSummary) {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const contextString = contextChunks
    .map(
      (chunk, i) =>
        `[Source ${i + 1} | ${formatTime(chunk.startTime)}–${formatTime(chunk.endTime)}]\n${chunk.text}`,
    )
    .join("\n\n");

  const systemPrompt = `You are StudyStream, an AI tutor that helps students learn from video lectures.

Your ONLY source of information is the transcript context (and the overall video summary metadata, if provided) below.
Do NOT use any outside knowledge, training data, or general facts — even if you are confident about them.
Do NOT invent timestamps or fabricate explanations.

If the provided context does not contain enough information to answer the question, respond with:
"I couldn't find enough information about that in this lecture. Try asking about a topic that's covered in the video."

Style Guidelines:
- Be concise and educational. 
- When relevant, reference the source timestamp (e.g. "At 02:15, the lecture explains...").
- For general questions (like summarizing the lecture, explaining the main idea, or listing key concepts), provide a concise response:
  * 1 short direct explanation paragraph (1-2 sentences)
  * Followed by 2 to 4 useful supporting bullet points.
  * Do not make it verbose or dump unrelated concepts.`;

  let userPrompt = "";
  const isGeneric = isGenericQuestion(question);

  if (isGeneric && videoSummary) {
    userPrompt += `Here is the high-level summary of the entire lecture:
Title: ${videoSummary.title}
Summary: ${videoSummary.summary}
Key Concepts: ${(videoSummary.keyConcepts || []).join(", ")}
Takeaways: ${(videoSummary.takeaways || []).join(", ")}

---

`;
  }

  userPrompt += `Transcript context from this lecture:

${contextString}

---

Student question: ${question}`;

  try {
    const startTime = Date.now();
    const chatResponse = await callModel({
      model: llmModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const duration = Date.now() - startTime;

    return {
      content: chatResponse.choices[0].message.content,
      latency: duration,
    };
  } catch (error) {
    console.error("[LLM] Error generating chat response:", error.message);
    throw error;
  }
}

async function generateSummary(segments) {
  // Use first 100 segments to keep within token limits
  const text = segments
    .slice(0, 100)
    .map((s) => s.text)
    .join(" ");

  const prompt = `Based on the following transcript snippet from an educational video, generate:
1. Title
2. Short summary (2-3 sentences)
3. Key concepts (as a list of short phrases, max 8 items)
4. Important takeaways (as a list of actionable insights, max 6 items)

Format the response as a JSON object with keys: title, summary, keyConcepts, takeaways.

Transcript:
${text}`;

  try {
    const response = await callModel({
      model: llmModel,
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
    });

    return normalizeSummaryResult(
      JSON.parse(response.choices[0].message.content),
    );
  } catch (error) {
    console.error("[LLM] Error generating summary:", error.message);
    throw error;
  }
}

async function generateQuiz(segments) {
  const text = segments
    .slice(0, 100)
    .map((s) => s.text)
    .join(" ");

  const prompt = `Based on the following transcript snippet, generate a 5-question multiple choice quiz.
Each question should have 4 options (A, B, C, D).
Format the response as a JSON object with a "questions" key containing an array of objects, where each object has:
- question (string)
- options (array of 4 strings)
- correctAnswer (the exact string of the correct option)
- explanation (brief explanation of why the answer is correct)

Transcript:
${text}`;

  try {
    const response = await callModel({
      model: llmModel,
      messages: [{ role: "user", content: prompt }],
      responseFormat: { type: "json_object" },
    });

    let result = JSON.parse(response.choices[0].message.content);
    // Normalise: handle both array and object wrapping
    if (Array.isArray(result)) return result;
    if (result.questions) return result.questions;
    if (result.quiz) return result.quiz;
    return result;
  } catch (error) {
    console.error("[LLM] Error generating quiz:", error.message);
    throw error;
  }
}

module.exports = {
  resolveModelName,
  normalizeSummaryResult,
  generateChatResponse,
  generateSummary,
  generateQuiz,
};
