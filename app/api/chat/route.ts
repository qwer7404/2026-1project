import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, userSaju } = await request.json();

    const systemPrompt = `
      너는 사주명리학과 영양학 전문가인 '오행식탁' 전속 AI 상담사야.
      사용자의 사주 정보를 참고해서, 사용자의 질문이나 증상에 맞는 따뜻하고 전문적인 조언(식재료 추천 등)을 해줘.
      말투는 친절하고 다정한 존댓말로 해주고, 답변은 너무 길지 않게 3~4문장으로 요약해줘.
      
      [사용자 사주 요약 정보]
      ${userSaju}
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
          { role: "user", content: message }
        ]
      })
    });

    const rawText = await response.text();
    if (!response.ok) throw new Error(`API 통신 에러: ${response.status}`);

    const data = JSON.parse(rawText);
    
    // 챗봇은 JSON 포맷팅 없이 그냥 텍스트만 바로 반환
    return NextResponse.json({ result: data.choices[0].message.content });

  } catch (error) {
    console.error("챗봇 API 에러:", error);
    return NextResponse.json({ error: "챗봇 서버 연결 실패" }, { status: 500 });
  }
}