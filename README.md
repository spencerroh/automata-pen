# Short-Story A/B Studio

Next.js + TypeScript 기반의 단편소설 A/B 핑퐁 스튜디오입니다.

## Setup

```bash
npm install
cp .env.example .env.local
# .env.local에 OPENAI_API_KEY 입력
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Security notes

- `OPENAI_API_KEY`는 서버 라우트(`app/api/*`)에서만 사용됩니다.
- 클라이언트 코드에 API 키를 주입하지 않습니다.
- 키 로그 출력은 하지 않습니다.

## How to use

1. Genre/Theme 입력
2. **Generate direction cards** 클릭
3. 카드 1개 선택 + 라운드(2~10), twist, editMode 설정
4. **Start loop**
5. **Next round** 또는 **Auto-complete** 진행
6. 완성 시 최종 이야기, 제목 5개, 태그라인 3개 확인

## Prompt Settings

- Settings 패널에서 각 단계 프롬프트를 textarea로 수정 가능
- localStorage(`ab_story_prompts_v1`)로 리로드 후에도 유지
- Reset to defaults 지원
- JSON export(copy) / import(paste) 지원

## Future improvements

- 사용자 인증 + 개인 워크스페이스
- API rate limit + abuse 방지
- LoopState 서버 DB 저장
- streaming 응답 UX 개선
- 평가 지표 시각화
