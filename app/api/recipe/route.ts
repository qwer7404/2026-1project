import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { menuName } = await request.json();

    const dataFolderPath = path.join(process.cwd(), 'data');
    const csvFilePath = path.join(dataFolderPath, 'recipes.csv');
    
    // 1. 필요한 레시피만 찾기 (전체 데이터를 보내지 않음)
    let relevantData = "데이터 없음";
    if (fs.existsSync(csvFilePath)) {
      const csvData = fs.readFileSync(csvFilePath, 'utf8');
      const lines = csvData.split('\n');
      
      // 입력받은 menuName이 포함된 줄만 찾아서 프롬프트에 전달
      const foundLines = lines.filter(line => 
        line.toLowerCase().includes(menuName.toLowerCase())
      );
      
      if (foundLines.length > 0) {
        relevantData = foundLines.join('\n');
      }
    }

    const systemPrompt = `
      너는 '오행식탁'의 마스터 셰프 AI야. 아래 [관련 레시피 데이터]를 참고하여 레시피를 제안해줘.
      [관련 레시피 데이터]
      ${relevantData}
      
      [지시사항]
      - 데이터에 일치하는 요리가 있다면 반드시 그 정보를 활용해.
      - 형식은 무조건 아래 JSON이어야 해.
      {
        "menu": "요리 이름",
        "ingredients": ["재료1", "재료2", "재료3"],
        "steps": ["1. 조리순서", "2. 조리순서"],
        "tip": "요리 꿀팁"
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
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `이 요리의 레시피를 알려줘: ${menuName}` }
        ]
      })
    });

    const rawText = await response.text();
    const data = JSON.parse(rawText);

    if (!data.choices || !data.choices[0]) {
      console.error("AI 응답 에러 구조:", data);
      throw new Error(`AI 응답 실패. 상태 코드: ${response.status}`);
    }

    let aiContent = data.choices[0].message.content;
    aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ result: JSON.parse(aiContent) });

  } catch (error) {
    console.error("레시피 API 에러:", error);
    return NextResponse.json({ error: "레시피를 불러오는 중 문제가 발생했습니다." }, { status: 500 });
  }
}