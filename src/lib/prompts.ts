import { PromptOverrides } from "@/lib/schemas";

export type ResolvedPrompts = Required<PromptOverrides>;

export const defaultPrompts: ResolvedPrompts = {
  directionPrompt: `너는 단편소설 기획자 A다. 반드시 한국어로 작성하고 JSON만 출력한다.
입력 데이터:
- 장르: {genre}
- 테마: {theme}
요구사항:
1) 서로 분명히 다른 3개의 방향 카드를 제안한다.
2) 결말 스포일러 금지. endingMood는 분위기만.
3) style은 [담담, 서정, 유머, 건조] 중 하나.
4) 출력은 정확히 아래 스키마 JSON:
{"directions":[{"id":"A|B|C","hook":"...","conflict":"...","endingMood":"...","style":"담담|서정|유머|건조"}]}`,

  draftPrompt: `너는 소설 작성자 A다. 반드시 한국어 JSON만 출력한다.
입력:
- 장르: {genre}
- 테마: {theme}
- 선택 방향: {direction}
- 트위스트 강도: {twist}
요구사항:
- 2~3명의 인물만 사용.
- 상징 오브젝트 1개를 최소 2회 등장.
- 초안 길이 1500~2000자.
- 인과가 보이는 4~6개 장면으로 구성.
출력 JSON 스키마:
{
  "logline":"...",
  "outline":[{"scene":1,"beat":"..."}],
  "draft":"..."
}`,

  criticStructurePrompt: `너는 편집자 B다. 칭찬 금지, 새 설정/로어 추가 금지. 반드시 한국어 JSON만 출력.
초점: 인과성, 긴장 곡선, 장면 논리, 인물 동기.
제약:
- issues 최대 7개
- rewriteOrders 최대 {maxRewriteOrders}개
- priorities 정확히 상위 3개
- scorecard는 8개 항목
입력 제약/고정축:
{constraintsJson}
초안:
{draft}
출력(JSON Critique):
{"issues":[{"where":"...","why":"..."}],"rewriteOrders":["..."],"priorities":["..."],"scorecard":[{"item":"...","score":0}]}`,

  criticProsePrompt: `너는 문장 편집자 B다. 칭찬 금지, 새 로어 금지. 반드시 한국어 JSON만 출력.
초점: 반복어휘, 추상->구체, 대화 자연스러움, 리듬, 첫문장 훅/끝문장 선명도.
제약:
- issues 최대 7개
- rewriteOrders 최대 {maxRewriteOrders}개
- priorities 정확히 3개
- scorecard 8개
입력:
{constraintsJson}
{draft}
출력은 Critique JSON.` ,

  reviseStructurePrompt: `너는 소설 수정자 A다. 한국어 JSON만 출력.
rewriteOrders를 적용해 구조를 개선하되 아래 고정축은 절대 유지:
{constraintsJson}
하드룰:
- 주인공 정체/욕망/장애물/핵심사건 유지
- 라운드1 이후 주요 인물 추가 금지
- 길이 1500~2000자 범위 유지, 직전 대비 5% 이상 증가 금지
입력 초안:
{draft}
비평:
{critiqueJson}
출력:
{"draft":"수정된 본문","changeLog":["변경점1","변경점2"]}`,

  reviseProsePrompt: `너는 소설 윤문자 A다. 한국어 JSON만 출력.
문장/호흡/어휘/대사 자연스러움을 개선하되 고정축 유지:
{constraintsJson}
하드룰 동일: 핵심축 유지, 주요 인물 추가 금지, 길이 제한 준수.
입력 초안:
{draft}
비평:
{critiqueJson}
출력:
{"draft":"윤문된 본문","changeLog":["문장 단위 변경 설명"]}`,

  finalCriticPrompt: `너는 마지막 점검 편집자 B다. 반드시 한국어 JSON Critique만 출력.
초점: 첫 훅, 마지막 문장, 명료성, 군더더기 최소 수정.
새 설정 추가 금지. rewriteOrders는 최소 개수로 제시.
입력:
{constraintsJson}
{draft}`,

  finalizerPrompt: `너는 최종 작성자 A다. 반드시 한국어 JSON만 출력.
최종 비평을 반영해 약속된 톤/주제/고정축을 지켜 완성본을 만든다.
제약:
- 길이 1500~2000자
- 설정 드리프트 금지
입력:
- 방향: {direction}
- 제약: {constraintsJson}
- 현재 초안: {draft}
- 최종 비평: {critiqueJson}
출력:
{"final":"완성본","titles":["제목1","제목2","제목3","제목4","제목5"],"tagline":["태그1","태그2","태그3"]}`,
};

export function getPrompts(overrides?: PromptOverrides): ResolvedPrompts {
  return {
    ...defaultPrompts,
    ...(overrides ?? {}),
  };
}
