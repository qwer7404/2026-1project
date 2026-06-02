"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Home, Utensils, ShieldAlert, User, LogIn, LogOut, Sparkles, ChevronDown, ChevronRight, Coffee, Moon, MapPin, Search, ArrowRight, BarChart3 } from "lucide-react"

// 🔥 1. Firebase 모듈 및 설정 불러오기
import { auth, db } from "@/lib/firebase"
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth"
import { doc, getDoc, setDoc } from "firebase/firestore"

export default function OhangSiktakMain() {
  const [activeTab, setActiveTab] = useState("saju")
  const [user, setUser] = useState<FirebaseUser | null>(null) // 실제 구글 유저 상태 저장
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  // 상세 사주 입력 폼 상태 관리
  const [sajuInput, setSajuInput] = useState({
    name: "",
    birthDate: "",
    isTimeUnknown: false,
    birthHour: "00",
    birthMinute: "00",
    gender: "male",
    locationType: "city",
    birthCity: "인천",
    jasiLaw: "tongjasi"
  })

  // AI 분석 결과 상태 관리
  const [aiResult, setAiResult] = useState<null | {
    todayIljin: string,
    mainElement: string,
    ohangAnalysis: { wood: number, fire: number, earth: number, gold: number, water: number },
    lunchMenu: { name: string, reason: string, ohangType: string },
    dinnerMenu: { name: string, reason: string, ohangType: string },
    todayFortune: string
  }>(null)

  // 🔥 2. 유저 인증 상태 실시간 감지 및 데이터 자동 로드
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        // 구글 로그인 성공 시, Firestore에서 이 유저의 저장된 사주 명식이 있는지 조회
        const docRef = doc(db, "users", currentUser.uid)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const userData = docSnap.data()
          if (userData.sajuInput) setSajuInput(userData.sajuInput)
          if (userData.aiResult) {
            setAiResult(userData.aiResult)
            setHasAnalyzed(true)
          }
        }
      } else {
        // 로그아웃 시 상태 초기화
        setHasAnalyzed(false)
        setAiResult(null)
        setSajuInput({
          name: "",
          birthDate: "",
          isTimeUnknown: false,
          birthHour: "00",
          birthMinute: "00",
          gender: "male",
          locationType: "city",
          birthCity: "인천",
          jasiLaw: "tongjasi"
        })
      }
    });

    return () => unsubscribe()
  }, [])

  // 🔥 3. 구글 팝업 로그인 및 최초 사주 업로드 기능
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const loggedInUser = result.user

      // 로그인하는 순간 폼에 입력해둔 데이터가 있다면 Firestore에 즉시 백업 동기화
      if (sajuInput.name && sajuInput.birthDate) {
        await setDoc(doc(db, "users", loggedInUser.uid), {
          sajuInput,
          aiResult,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }
    } catch (error) {
      console.error("로그인 실패:", error)
      alert("구글 인증 처리에 실패했습니다.")
    }
  }

  // 🔥 4. 로그아웃 기능
  const handleFirebaseLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("로그아웃 실패:", error)
    }
  }

  // 사주 오행 및 일진 분석 실행 함수
  const handleFetchTodayMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sajuInput.name || !sajuInput.birthDate) {
      alert("이름과 생년월일을 입력해주세요!")
      return
    }

    setIsLoading(true)

    setTimeout(async () => {
      const mockResult = {
        todayIljin: `2026년 5월 26일 (병인日 - 붉은 호랑이의 날)🐯`,
        mainElement: "🔥 Gyeongjin(경진)일주 - 총명하며 다재다능한 괴강(魁罡)의 기운",
        ohangAnalysis: { wood: 1, fire: 3, earth: 0, gold: 2, water: 2 },
        lunchMenu: {
          name: "🍛 호박 버섯 카레 라이스",
          ohangType: "土 (흙의 기운 보완)",
          reason: "오늘 일진은 불(火)의 기운이 강한 병인일입니다. 원국에 흙(土)이 부족한 상태에서 화 기운이 치솟으면 위장이 약해지기 쉬우므로, 위장 기능을 안정시켜 주는 노란색 단호박 카레가 점심 최고의 보약 식단입니다."
        },
        dinnerMenu: {
          name: "🐟 삼치 구이와 달래 된장국",
          ohangType: "水 / 土 (물과 흙의 조화)",
          reason: "저녁에는 치솟은 화(火) 기운을 제어할 수 있도록 맑은 수(水) 기운의 생선구이와 성질이 따뜻하면서도 소화를 돕는 된장국으로 하루의 오행 밸런스를 완벽하게 마무리하는 것이 좋습니다."
        },
        todayFortune: "생각지 못한 아이디어가 샘솟는 기분 좋은 날입니다. 다만 기운이 앞설 수 있으니 중요한 미팅이나 학업 결정은 점심 식사를 마친 후에 차분하게 진행하세요."
      }

      setAiResult(mockResult)
      setHasAnalyzed(true)
      setIsLoading(false)

      // 🔥 만약 로그인된 상태에서 사주를 새로 돌렸다면 Firestore 데이터베이스에도 즉시 원격 저장
      if (auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          sajuInput,
          aiResult: mockResult,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }
    }, 1250)
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 왼쪽 사이드바 메뉴 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 px-2 py-4 mb-6">
            <span className="text-xl font-bold tracking-tight text-purple-600">☯️ 오행식탁</span>
          </div>
          
          <nav className="space-y-1">
            <Button 
              variant={activeTab === "home" ? "default" : "ghost"} 
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab("home")}
            >
              <Home className="size-4" /> 메인 홈
            </Button>
            <Button 
              variant={activeTab === "saju" ? "default" : "ghost"} 
              className="w-full justify-start gap-3 text-purple-600 hover:text-purple-700"
              onClick={() => setActiveTab("saju")}
            >
              <Sparkles className="size-4" /> 내 사주 명식 입력 ✨
            </Button>
            <Button 
              variant={activeTab === "diet" ? "default" : "ghost"} 
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab("diet")}
            >
              <Utensils className="size-4" /> 주간 및 일일 식단 추천
            </Button>
            <Button 
              variant={activeTab === "map" ? "default" : "ghost"} 
              className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700"
              onClick={() => setActiveTab("map")}
            >
              <MapPin className="size-4" /> 오행 맛집 지도 📍
            </Button>
            <Button 
              variant={activeTab === "admin" ? "default" : "ghost"} 
              className="w-full justify-start gap-3"
              onClick={() => setActiveTab("admin")}
            >
              <ShieldAlert className="size-4" /> 관리자 페이지
            </Button>
          </nav>
        </div>

        {/* 하단 클라우드 계정 연동 시스템 */}
        <div className="border-t border-slate-100 pt-4 space-y-2">
          {user ? (
            <div className="space-y-2">
              <div className="text-[11px] text-emerald-600 font-semibold px-2 bg-emerald-50 py-1.5 rounded-md text-center border border-emerald-200 truncate">
                ☁️ {user.displayName || "유저"}님 클라우드 동기화 중
              </div>
              <Button variant="outline" className="w-full gap-2 text-rose-600 hover:bg-rose-50" onClick={handleFirebaseLogout}>
                <LogOut className="size-4" /> 로그아웃 및 초기화
              </Button>
            </div>
          ) : (
            <Button variant="default" className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-xs" onClick={handleGoogleLogin}>
              <LogIn className="size-4" /> Google 계정으로 연동 (저장)
            </Button>
          )}
        </div>
      </aside>

      {/* 오른쪽 메인 콘텐츠 영역 */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold">
            {activeTab === "home" && "🏠 메인 홈"}
            {activeTab === "saju" && "🔮 나의 사주 명식 정보 입력"}
            {activeTab === "diet" && "🥗 오행 맞춤형 추천 식단 (일일/주간)"}
            {activeTab === "map" && "🗺️ 내 기운을 채워줄 주변 오행 맛집 추천"}
            {activeTab === "admin" && "⚙️ 시스템 관리자"}
          </h1>
          <div className="text-sm">
            {user ? (
              <span className="text-emerald-600 font-bold">● {user.displayName} 회원 모드 활성화</span>
            ) : (
              <span className="text-slate-400">비회원 모드 (클라우드 보관하려면 연동을 누르세요)</span>
            )}
          </div>
        </header>

        {/* 탭별 화면 전환 콘텐츠 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[550px]">
          
          {/* 1. 메인 홈 화면 */}
          {activeTab === "home" && (
            <div className="space-y-6">
              <Alert>
                <AlertTitle>시스템 안내</AlertTitle>
                <AlertDescription>오행식탁 플랫폼에 오신 것을 환영합니다! [내 사주 명식 입력] 탭에서 사주를 분석한 뒤, [식단 추천]과 [맛집 지도]에서 맞춤 솔루션을 확인해보세요.</AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-purple-50/50">
                  <h3 className="font-semibold text-purple-800 mb-2">실시간 일진(日辰) 분석 식단</h3>
                  <p className="text-sm text-slate-600">매일 동적으로 변화하는 오늘의 기운과 타고난 오행을 대조하여 완벽한 점심, 저녁 처방 식단을 제공합니다.</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-emerald-50/50">
                  <h3 className="font-semibold text-emerald-800 mb-2">위치기반 오행 맛집 탐색</h3>
                  <p className="text-sm text-slate-600">지도 API를 연동하여 내 부족한 기운을 보완하는 레시피를 판매하는 인근 식당을 실시간 트래킹합니다.</p>
                </div>
              </div>
            </div>
          )}

          {/* 2. 내 사주 입력 화면 */}
          {activeTab === "saju" && (
            <div className="max-w-xl mx-auto space-y-6">
              <form onSubmit={handleFetchTodayMenu} className="space-y-5 border border-slate-200 p-6 rounded-xl bg-white shadow-xs">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <User className="size-4 text-purple-500" /> 명식 정보 입력
                  </h3>
                  {user && <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">원격 백업 켜짐</span>}
                </div>

                {/* 이름 입력 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">이름</label>
                  <input 
                    type="text" 
                    placeholder="이름을 입력하세요" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-purple-500 transition-all"
                    value={sajuInput.name}
                    onChange={(e) => setSajuInput({...sajuInput, name: e.target.value})}
                  />
                </div>

                {/* 생년월일 입력 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">생년월일</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-purple-500 transition-all"
                    value={sajuInput.birthDate}
                    onChange={(e) => setSajuInput({...sajuInput, birthDate: e.target.value})}
                  />
                </div>

                {/* 시간 선택 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-500">시간</label>
                    <label className="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-600">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 size-3.5"
                        checked={sajuInput.isTimeUnknown}
                        onChange={(e) => setSajuInput({...sajuInput, isTimeUnknown: e.target.checked})}
                      />
                      모름
                    </label>
                  </div>
                  
                  <div className="flex gap-2">
                    <select 
                      disabled={sajuInput.isTimeUnknown}
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 disabled:opacity-40"
                      value={sajuInput.birthHour}
                      onChange={(e) => setSajuInput({...sajuInput, birthHour: e.target.value})}
                    >
                      {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                        <option key={h} value={h}>{h}시</option>
                      ))}
                    </select>
                    <select 
                      disabled={sajuInput.isTimeUnknown}
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 disabled:opacity-40"
                      value={sajuInput.birthMinute}
                      onChange={(e) => setSajuInput({...sajuInput, birthMinute: e.target.value})}
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                        <option key={m} value={m}>{m}분</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 성별 선택 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">성별</label>
                  <div className="flex w-32 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.gender === "male" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                      onClick={() => setSajuInput({...sajuInput, gender: "male"})}
                    >
                      남
                    </button>
                    <button
                      type="button"
                      className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.gender === "female" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`}
                      onClick={() => setSajuInput({...sajuInput, gender: "female"})}
                    >
                      여
                    </button>
                  </div>
                </div>

                {/* 고급설정 아코디언 토글 */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  >
                    {isAdvancedOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                    고급 설정
                  </button>

                  {isAdvancedOpen && (
                    <div className="space-y-2 mt-2 pl-4 border-l-2 border-purple-100">
                      <label className="text-xs font-semibold text-slate-500 block">자시법 (子時法)</label>
                      <div className="flex bg-slate-100 p-1 rounded-lg w-48">
                        <button
                          type="button"
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.jasiLaw === "tongjasi" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
                          onClick={() => setSajuInput({...sajuInput, jasiLaw: "tongjasi"})}
                        >
                          통자시
                        </button>
                        <button
                          type="button"
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.jasiLaw === "yajasi" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`}
                          onClick={() => setSajuInput({...sajuInput, jasiLaw: "yajasi"})}
                        >
                          야자시
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-5 rounded-lg shadow-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin inline-block size-4 border-2 border-white border-t-transparent rounded-full"></span>
                      AI 엔진이 사주 명식을 도출 중...
                    </>
                  ) : (
                    "내 사주 원국 분석하기 🔮"
                  )}
                </Button>
              </form>

              {/* 사주 분석 완료 결과 노출 영역 */}
              {hasAnalyzed && aiResult && (
                <div className="border border-purple-100 p-6 rounded-xl bg-purple-50/30 space-y-5">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-max">
                      <BarChart3 className="size-3" /> 타고난 사주 오행 분석 결과
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-2">{sajuInput.name || "사용자"}님의 사주 원국 일주</h3>
                    <p className="text-xs text-purple-900 font-medium mt-0.5 bg-white p-2 rounded-lg border border-purple-100">{aiResult.mainElement}</p>
                  </div>

                  {/* 오행 차트 */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-700">☯️ 사주 원국 내 오행 분포도</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[11px]"><span>木 (나무 기운)</span><span>{aiResult.ohangAnalysis.wood}개</span></div>
                        <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-blue-500 h-full" style={{width: `${aiResult.ohangAnalysis.wood * 25}%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px]"><span>火 (불 기운)</span><span>{aiResult.ohangAnalysis.fire}개</span></div>
                        <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-red-500 h-full" style={{width: `${aiResult.ohangAnalysis.fire * 25}%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px]"><span>土 (흙 기운)</span><span className="text-rose-500 font-bold">0개 (결핍/부족 ⚠️)</span></div>
                        <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-amber-500 h-full" style={{width: `0%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px]"><span>金 (쇠 기운)</span><span>{aiResult.ohangAnalysis.gold}개</span></div>
                        <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-slate-400 h-full" style={{width: `${aiResult.ohangAnalysis.gold * 25}%`}}></div></div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px]"><span>水 (물 기운)</span><span>{aiResult.ohangAnalysis.water}개</span></div>
                        <div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-slate-800 h-full" style={{width: `${aiResult.ohangAnalysis.water * 25}%`}}></div></div>
                      </div>
                    </div>
                  </div>

                  {/* 식단추천 바로가기 버튼 */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md">
                    <div>
                      <p className="text-xs font-bold opacity-90">사주 원국 분석이 완료되었습니다!</p>
                      <p className="text-[11px] opacity-75 mt-0.5">오늘 일진과 결합한 AI의 점심·저녁 추천 식단을 확인해 보세요.</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-white text-purple-700 hover:bg-slate-50 font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm"
                      onClick={() => setActiveTab("diet")}
                    >
                      오늘의 식단 처방 보기 <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. 주간 및 일일 식단 추천 화면 */}
          {activeTab === "diet" && (
            <div className="max-w-2xl mx-auto space-y-8">
              
              {!aiResult ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-slate-400">
                  <Utensils className="size-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">아직 분석된 사주 결과가 없습니다.</p>
                  <p className="text-xs mt-1 text-slate-400">[내 사주 명식 입력] 탭에서 사주 분석 버튼을 먼저 실행해주세요.</p>
                  <Button variant="outline" size="sm" className="mt-4 border-purple-200 text-purple-600" onClick={() => setActiveTab("saju")}>사주 입력하러 가기</Button>
                </div>
              ) : (
                <>
                  {/* 일일 점심 / 저녁 추천 카드 */}
                  <div className="border border-purple-100 p-6 rounded-xl bg-purple-50/20 space-y-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">LLM Real-time Diet Prescription</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mt-2">{aiResult.todayIljin} 맞춤 처방 식단</h3>
                      <p className="text-xs text-slate-500 mt-0.5">분석 대상: <span className="font-semibold text-purple-900">{sajuInput.name || user?.displayName || "사용자"}님</span></p>
                    </div>

                    {/* AI 한줄 조언 가이드 */}
                    <div className="bg-purple-950 text-purple-100 p-4 rounded-xl text-xs leading-relaxed shadow-xs">
                      <div className="font-bold text-purple-300 mb-1">💬 AI의 일진 한 줄 가이드</div>
                      "{aiResult.todayFortune}"
                    </div>

                    {/* 점심/저녁 배치 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 점심 */}
                      <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                            <Coffee className="size-3.5" /> 오늘의 추천 점심
                          </span>
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100">
                            {aiResult.lunchMenu.ohangType}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800">{aiResult.lunchMenu.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-50">
                          {aiResult.lunchMenu.reason}
                        </p>
                      </div>

                      {/* 저녁 */}
                      <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-blue-700 flex items-center gap-1">
                            <Moon className="size-3.5" /> 오늘의 추천 저녁
                          </span>
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100">
                            {aiResult.dinnerMenu.ohangType}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-800">{aiResult.dinnerMenu.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-50">
                          {aiResult.dinnerMenu.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 오행별 고정 대체 식단 가이드 */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700">📋 오행별 고정 대체 식단 가이드</h4>
                    <Accordion type="single" collapsible className="w-full bg-slate-50 border rounded-lg px-4">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>🌳 목(木)의 기운 보완 식단</AccordionTrigger>
                        <AccordionContent className="pb-4 text-xs text-slate-600">신맛이 나는 과일류나 푸른색 나물 채소(브로콜리, 시금치) 중심의 건강 처방 가이드입니다.</AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>⛰️ 토(土)의 기운 보완 식단</AccordionTrigger>
                        <AccordionContent className="pb-4 text-xs text-slate-600">단맛을 내는 황색 근채류(단호박, 고구마, 밤)나 청국장 등을 활용해 소화기를 보호하는 식단입니다.</AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 4. 오행 맛집 지도 화면 */}
          {activeTab === "map" && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                    <MapPin className="size-4" /> 현재 설정된 위치 기반 맛집 트래킹
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    {(sajuInput.name || user) ? `[${sajuInput.name || user?.displayName}]님의 부족한 기운[土/水] 맞춤형 레시피 음식점을 내 주변에서 매핑합니다.` : "상단의 사주 정보를 먼저 입력하면 주변 맞춤형 식당 목록이 자동 필터링됩니다."}
                  </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <input type="text" placeholder="서울시 용산구 청파동" className="p-1.5 text-xs border rounded-md bg-white w-full md:w-40" readOnly />
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"><Search className="size-3" /> 검색</Button>
                </div>
              </div>

              {/* 지도 그래픽 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-100 rounded-xl border border-slate-200 relative min-h-[350px] flex items-center justify-center overflow-hidden shadow-inner">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#e2e8f0_2px,transparent_1px)] [background-size:16px_16px] bg-slate-300"></div>
                  
                  <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <MapPin className="size-8 text-rose-500 fill-rose-500 mx-auto" />
                    <span className="text-[10px] font-bold bg-white text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded-full shadow-md">
                      🍛 황색카레 본점 (土 기운 보완)
                    </span>
                  </div>
                  <div className="absolute bottom-1/4 right-1/3 text-center">
                    <MapPin className="size-8 text-blue-500 fill-blue-500 mx-auto" />
                    <span className="text-[10px] font-bold bg-white text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded-full shadow-md">
                      🐟 용산 삼치명가 (水 기운 보완)
                    </span>
                  </div>

                  <div className="z-10 bg-white/90 backdrop-blur-md p-3 rounded-lg border text-center text-xs shadow-md max-w-xs">
                    <p className="font-semibold text-slate-800">🗺️ 지도 API 연동부 (Kakao Maps SDK)</p>
                  </div>
                </div>

                {/* 맛집 리스트 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500">📍 추천 레시피 판매 음식점 리스트</h4>
                  
                  <div className="p-3.5 border border-amber-200 rounded-xl bg-amber-50/20 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-800">고꼬카레 숙대점</span>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">土 기운 매칭</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">추천 메뉴: 단호박 버섯카레 라이스</p>
                    <p className="text-[11px] text-slate-400">📍 캠퍼스 정문 도보 5분 | ⭐️ 4.8</p>
                  </div>

                  <div className="p-3.5 border border-blue-200 rounded-xl bg-blue-50/20 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-800">어선생 생선구이 백반</span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">水 기운 매칭</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">추천 메뉴: 화덕 삼치구이와 달래장</p>
                    <p className="text-[11px] text-slate-400">📍 효창공원앞역 2번 출구 부근 | ⭐️ 4.6</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. 관리자 페이지 화면 */}
          {activeTab === "admin" && (
            <div className="space-y-4">
              <p className="text-slate-600">시스템 모니터링 및 전체 식재료 카테고리 관리 화면입니다.</p>
              <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">
                실제 Firebase DB(Firestore) 조회가 활성화되었습니다. 회원 데이터 트래킹 및 통계 로직을 안심하고 설계하세요.
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}