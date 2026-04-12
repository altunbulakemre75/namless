import {
  LLMProvider,
  QuestionSpec,
  RawQuestion,
  CostEstimate,
} from "./llm-provider";

const SONNET_INPUT_COST = 3 / 1_000_000; // $3 per 1M tokens
const SONNET_OUTPUT_COST = 15 / 1_000_000;
const HAIKU_INPUT_COST = 0.25 / 1_000_000;
const HAIKU_OUTPUT_COST = 1.25 / 1_000_000;

export class ClaudeProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "claude-sonnet-4-5-20241022") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateQuestion(spec: QuestionSpec): Promise<RawQuestion> {
    const prompt = this.buildQuestionPrompt(spec);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    const content = data.content[0].text;
    return this.parseQuestionResponse(content);
  }

  async generateExplanation(
    soruMetni: string,
    siklar: string[],
    dogruSik: number,
    secilenSik: number
  ): Promise<string> {
    const prompt = `Bir LGS ogrencisine asagidaki soruyu acikla.
Ogrenci ${siklar[secilenSik]} sikkini secti, dogru cevap ${siklar[dogruSik]}.
Neden yanlis oldugunu ve dogru cevabi adim adim acikla.
8. sinif seviyesinde, anlasilir bir dille yaz.

Soru: ${soruMetni}
Siklar:
${siklar.map((s, i) => `${String.fromCharCode(65 + i)}) ${s}`).join("\n")}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20241022", // aciklama icin Haiku yeterli
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return data.content[0].text;
  }

  estimateCost(spec: QuestionSpec): CostEstimate {
    const isHard = spec.zorluk >= 3;
    const inputTokens = isHard ? 800 : 500;
    const outputTokens = isHard ? 600 : 400;

    const costPerInput = isHard ? SONNET_INPUT_COST : HAIKU_INPUT_COST;
    const costPerOutput = isHard ? SONNET_OUTPUT_COST : HAIKU_OUTPUT_COST;

    return {
      inputTokens,
      outputTokens,
      tahminiMaliyet: inputTokens * costPerInput + outputTokens * costPerOutput,
    };
  }

  private buildQuestionPrompt(spec: QuestionSpec): string {
    return `Sen bir LGS soru yazarisin. Asagidaki kriterlere gore bir coktan secmeli soru uret.

Ders: ${spec.ders}
Konu: ${spec.topicIsim}
Zorluk: ${spec.zorluk}/3
Kazanimlar: ${spec.kazanimlar.join(", ")}

Kurallar:
- 4 sikli coktan secmeli
- 8. sinif MEB mufredatina uygun
- Zorluk ${spec.zorluk}: ${spec.zorluk === 1 ? "dogrudan bilgi" : spec.zorluk === 2 ? "yorum gerektiren" : "analiz ve sentez gerektiren"}
- Celdiriciler mantikli olmali (rastgele degil, tipik ogrenci hatalarina dayali)

${spec.ornekSorular.length > 0 ? `Ornek sorular (benzer tarzi kullan):\n${spec.ornekSorular.join("\n---\n")}` : ""}

Ciktini su JSON formatinda ver:
{
  "soruMetni": "...",
  "siklar": ["A", "B", "C", "D"],
  "dogruSik": 0,
  "aciklama": "..."
}`;
  }

  private parseQuestionResponse(text: string): RawQuestion {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI response does not contain valid JSON");
    }
    return JSON.parse(jsonMatch[0]);
  }
}
