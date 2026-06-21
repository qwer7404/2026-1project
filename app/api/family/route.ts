// app/api/family/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userSaju, companionSaju } = await request.json();

    if (!userSaju || !companionSaju) {
      return NextResponse.json({ error: "사용자와 동행인의 사주 정보가 모두 필요합니다." }, { status: 400 });
    }

    const systemPrompt = `
      당신은 명리학(사주팔자)과 영양학에 정통한 '오행식탁'의 최고 AI 셰프입니다.
      사용자 A(본인)와 사용자 B(동행인)의 사주 정보를 바탕으로, 동행인의 사주 오행을 수치화하고, 두 사람의 궁합을 분석한 뒤, 모두에게 유익한 교집합 오행 기운을 찾고 이를 보완할 수 있는 '같이 먹기 좋은 요리' 1가지를 추천해주세요.

      [반드시 아래 JSON 형식으로만 대답할 것. 다른 말은 절대 금지]
      {
        "companionOhang": {
          "wood": 1,
          "fire": 2,
          "earth": 0,
          "gold": 3,
          "water": 2
        },
        "compatibility": "두 사람의 오행 상호작용 및 궁합 요약 (2~3줄)",
        "commonElement": "두 사람에게 공통으로 필요한 오행 기운 (예: 木과 火)",
        "menuName": "추천 메뉴 이름 (예: 소고기 버섯 전골 🍲)",
        "reason": "왜 이 메뉴가 두 사람의 사주 기운을 조화롭게 채워주는지 1~2줄로 설명",
        "ohangType": "메인 오행 속성 (예: 木, 火 기운 보완)"
      }
    `;

    const userPrompt = `
      - 사용자 A(본인) 사주 요약: ${userSaju}
      - 사용자 B(동행인) 사주 요약: ${companionSaju}
      이 두 사람이 함께 먹을 때 최고의 시너지를 내는 궁합 밥상을 추천해주세요.
    `;

    const response = await fetch('https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FACTCHAT_API_KEY}`
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    const rawText = await response.text();
    console.log("\n=== 가족 궁합 AI 원본 응답 ===");
    console.log(rawText);
    console.log("========================\n");

    if (!response.ok) throw new Error(`API 통신 에러: ${response.status}`);

    const data = JSON.parse(rawText);
    let aiContent = data.choices[0].message.content;

    // 🔥 에러가 나지 않도록 정규식을 아예 빼고 순수 문자열 자르기로 수정
    aiContent = aiContent.trim();
    if (aiContent.startsWith("```json")) {
      aiContent = aiContent.substring(7);
    }
    if (aiContent.endsWith("```")) {
      aiContent = aiContent.substring(0, aiContent.length - 3);
    }
    aiContent = aiContent.trim();

    const aiResultJson = JSON.parse(aiContent);
    return NextResponse.json({ result: aiResultJson });

  } catch (error) {
    console.error("가족 궁합 API 통신 에러:", error);
    return NextResponse.json({ error: "가족 궁합 메뉴를 분석하는 중 오류가 발생했습니다." }, { status: 500 });
  }
}