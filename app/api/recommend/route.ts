import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userSaju } = await request.json();

    const systemPrompt = `
      너는 사주명리학과 영양학을 결합한 헬스케어 AI '오행식탁'이야.
      사용자의 사주 정보를 바탕으로 부족한 오행을 파악하고, 이를 보완할 수 있는 오늘의 맞춤 식단을 추천해 줘.
      
      [반드시 아래 JSON 형식으로만 대답할 것. 다른 말은 절대 금지]
      {
        "todayIljin": "오늘 날짜와 일진 (예: 2026년 6월 19일 (무인日))",
        "mainElement": "사용자의 일주 및 핵심 기운 요약 (예: 🔥 병오일주 - 뜨거운 태양의 기운)",
        "ohangAnalysis": {
          "wood": 1, 
          "fire": 2, 
          "earth": 0, 
          "gold": 3, 
          "water": 2
        },
        "lunchMenu": {
          "name": "점심 메뉴 이름 (이모지 포함)",
          "ohangType": "보완되는 기운 (예: 土 (흙의 기운 보완))",
          "reason": "사주 관점에서 이 메뉴를 점심으로 추천하는 이유 2~3줄"
        },
        "dinnerMenu": {
          "name": "저녁 메뉴 이름 (이모지 포함)",
          "ohangType": "보완되는 기운 (예: 水 (물의 기운 보완))",
          "reason": "사주 관점에서 이 메뉴를 저녁으로 추천하는 이유 2~3줄"
        },
        "todayFortune": "오늘의 일진과 사주를 결합한 한 줄 조언"
      }
    `;

    const response = await fetch('https://factchat-cloud.mindlogic.ai/v1/gateway/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FACTCHAT_API_KEY}`
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        //response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `내 사주 정보: ${userSaju}` }
        ]
      })
    });

    const rawText = await response.text();

    // 🌟 터미널에 AI가 보낸 진짜 답변 찍기
    console.log("\n=== 학교 AI 원본 응답 ===");
    console.log(rawText);
    console.log("========================\n");

    if (!response.ok) {
      throw new Error(`API 통신 에러: ${response.status}`);
    }

    const data = JSON.parse(rawText);
    let aiContent = data.choices[0].message.content;

    // AI가 마크다운 껍데기(```json)를 씌워서 주면 벗겨내는 작업
    if (aiContent.startsWith("```json")) {
      aiContent = aiContent.replace(/```json\n?/, "").replace(/```$/, "").trim();
    }

    const aiResultJson = JSON.parse(aiContent);

    return NextResponse.json({ result: aiResultJson });

  } catch (error) {
    console.error("서버 통신 진짜 원인:", error);
    return NextResponse.json({ error: "AI 서버 연결 실패" }, { status: 500 });
  }
}