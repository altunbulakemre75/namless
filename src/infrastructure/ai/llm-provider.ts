// AI Soyutlama Katmani
// Claude bugün, Gemini yarın — model degistirmek 1 dosyada olur

export interface QuestionSpec {
  topicId: string;
  topicIsim: string;
  ders: string;
  zorluk: number;
  kazanimlar: string[];
  ornekSorular: string[]; // cikmis sorulardan ornekler
}

export interface RawQuestion {
  soruMetni: string;
  siklar: string[];
  dogruSik: number;
  aciklama: string;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  tahminiMaliyet: number; // USD
}

export interface LLMProvider {
  generateQuestion(spec: QuestionSpec): Promise<RawQuestion>;
  generateExplanation(
    soruMetni: string,
    siklar: string[],
    dogruSik: number,
    secilenSik: number
  ): Promise<string>;
  estimateCost(spec: QuestionSpec): CostEstimate;
}
