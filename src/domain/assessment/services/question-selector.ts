import { Question } from "../../curriculum/entities/question";
import { Mastery } from "../entities/mastery";
import { Attempt } from "../entities/attempt";

export type SelectionMode = "DIAGNOSTIC" | "DAILY" | "REVIEW";

interface ScoredQuestion {
  question: Question;
  skor: number;
}

// Agirliklar
const WEIGHTS = {
  konuZayifligi: 0.35,
  zorlukUyumu: 0.25,
  tazelik: 0.2,
  kaynakCesitliligi: 0.1,
  yanlisTekrar: 0.1,
};

export class QuestionSelector {
  /**
   * Cok kriterli agirlikli ornekleme ile soru secer.
   * Mimarinin en kritik biliseni.
   */
  select(
    candidates: Question[],
    count: number,
    mode: SelectionMode,
    masteries: Mastery[],
    recentAttempts: Attempt[]
  ): Question[] {
    if (candidates.length <= count) return candidates;

    const masteryMap = new Map(masteries.map((m) => [m.topicId, m]));
    const recentQuestionIds = new Set(recentAttempts.map((a) => a.questionId));
    const recentTopicCounts = this.countRecentTopics(recentAttempts);

    // 1. Her adaya skor ver
    const scored: ScoredQuestion[] = candidates.map((question) => ({
      question,
      skor: this.scoreQuestion(
        question,
        mode,
        masteryMap,
        recentQuestionIds,
        recentTopicCounts
      ),
    }));

    // 2. Agirlikli rastgele ornekleme (weighted random sampling)
    return this.weightedSample(scored, count);
  }

  private scoreQuestion(
    question: Question,
    mode: SelectionMode,
    masteryMap: Map<string, Mastery>,
    recentQuestionIds: Set<string>,
    recentTopicCounts: Map<string, number>
  ): number {
    const mastery = masteryMap.get(question.topicId);
    const masterySkor = mastery?.skor ?? 50;

    // Konu zayifligi: dusuk mastery = yuksek skor
    const konuZayifligi = (100 - masterySkor) / 100;

    // Zorluk uyumu: kullanici seviyesine ±1
    const idealZorluk = masterySkor < 40 ? 1 : masterySkor < 70 ? 2 : 3;
    const zorlukFark = Math.abs(question.zorluk - idealZorluk);
    const zorlukUyumu = zorlukFark === 0 ? 1 : zorlukFark === 1 ? 0.5 : 0.1;

    // Tazelik: son 14 gunde gormediyse +
    const tazelik = recentQuestionIds.has(question.id) ? 0.1 : 1;

    // Kaynak cesitliligi
    const kaynakCesitliligi = 0.5; // basit v0 implementasyonu

    // Ayni konudan ust uste gelmesin
    const topicCount = recentTopicCounts.get(question.topicId) ?? 0;
    const yanlisTekrar = Math.max(0, 1 - topicCount * 0.3);

    return (
      WEIGHTS.konuZayifligi * konuZayifligi +
      WEIGHTS.zorlukUyumu * zorlukUyumu +
      WEIGHTS.tazelik * tazelik +
      WEIGHTS.kaynakCesitliligi * kaynakCesitliligi +
      WEIGHTS.yanlisTekrar * yanlisTekrar
    );
  }

  private weightedSample(
    scored: ScoredQuestion[],
    count: number
  ): Question[] {
    const result: Question[] = [];
    const remaining = [...scored];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      const totalWeight = remaining.reduce((sum, s) => sum + s.skor, 0);
      let random = Math.random() * totalWeight;

      for (let j = 0; j < remaining.length; j++) {
        random -= remaining[j].skor;
        if (random <= 0) {
          result.push(remaining[j].question);
          remaining.splice(j, 1);
          break;
        }
      }
    }

    return result;
  }

  private countRecentTopics(attempts: Attempt[]): Map<string, number> {
    // Not: Bu basit versiyon. Gercekte question -> topic mapping gerekir.
    // Simdilik bos dondurelim, infrastructure katmaninda zenginlestirilir.
    return new Map();
  }
}
