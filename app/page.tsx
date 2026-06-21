"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Home, Utensils, ShieldAlert, User, LogIn, LogOut, Sparkles, ChevronDown, ChevronRight, Coffee, Moon, MapPin, Search, ArrowRight, BarChart3, Users, ChefHat, MessageSquare, BookOpen, Bookmark, Send, Heart } from "lucide-react"

// 🔥 카카오맵 라이브러리 불러오기
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk"

// 🔥 Firebase 모듈 및 설정 불러오기
import { auth, db } from "@/lib/firebase"
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore"

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL as string;

export default function OhangSiktakMain() {
  const [activeTab, setActiveTab] = useState("saju")
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)

  const isAdmin = user?.email === ADMIN_EMAIL

  const [isKakaoLoading, kakaoError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_APP_KEY as string, 
    libraries: ["clusterer", "drawing", "services"],
  })

  const [mapCenter, setMapCenter] = useState({ lat: 37.5445, lng: 126.9712 })
  const [searchInput, setSearchInput] = useState("")

  const [realLunchRest, setRealLunchRest] = useState<any>(null)
  const [realDinnerRest, setRealDinnerRest] = useState<any>(null)
  const [realFamilyRest, setRealFamilyRest] = useState<any>(null)

  // 🔥 레시피 상태에 가족(family) 속성 추가
  const [recipeData, setRecipeData] = useState<{lunch: any, dinner: any, family?: any} | null>(null);
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);

  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    { role: "ai", content: "안녕하세요! 오행식탁 AI 상담소입니다.\n\n오늘 몸 상태나 기분이 어떠신가요? 사주 원국과 대조하여 맞춤형 식재료를 처방해 드릴게요! 😊" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [savedScraps, setSavedScraps] = useState<any[]>([]);

  const [companionSaju, setCompanionSaju] = useState({
    name: "", birthDate: "", isTimeUnknown: false, birthHour: "00", birthMinute: "00", gender: "male", locationType: "city", birthCity: "인천", jasiLaw: "tongjasi"
  });
  const [isCompanionAdvancedOpen, setIsCompanionAdvancedOpen] = useState(false);
  const [familyResult, setFamilyResult] = useState<any>(null);
  const [isFamilyLoading, setIsFamilyLoading] = useState(false);

  const [sajuInput, setSajuInput] = useState({
    name: "", birthDate: "", isTimeUnknown: false, birthHour: "00", birthMinute: "00", gender: "male", locationType: "city", birthCity: "인천", jasiLaw: "tongjasi"
  })

  const [aiResult, setAiResult] = useState<null | {
    todayIljin: string, mainElement: string, ohangAnalysis: { wood: number, fire: number, earth: number, gold: number, water: number },
    lunchMenu: { name: string, reason: string, ohangType: string }, dinnerMenu: { name: string, reason: string, ohangType: string }, todayFortune: string
  }>(null)

  const ohangGuideInfo = {
    wood: { title: "🌳 목(木)", desc: "신맛이 나는 과일류나 푸른색 나물 채소 중심 처방" },
    fire: { title: "🔥 화(火)", desc: "쓴맛이 나는 산채류나 붉은색 식재료 중심 처방" },
    earth: { title: "⛰️ 토(土)", desc: "단맛을 내는 황색 근채류 중심 처방" },
    gold: { title: "🪨 금(金)", desc: "매운맛이 나는 흰색 식재료 중심 처방" },
    water: { title: "💧 수(水)", desc: "짠맛이 나는 해조류나 검은색 식재료 중심 처방" }
  };

  const getLowestElements = () => {
    if (!aiResult) return [];
    const sortedElements = Object.entries(aiResult.ohangAnalysis).sort((a, b) => (a[1] as number) - (b[1] as number));
    return sortedElements.slice(0, 2).map(item => item[0]);
  };

  const KOREA_CITIES = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "해외"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const userData = docSnap.data()
          if (userData.sajuInput) setSajuInput(userData.sajuInput)
          if (userData.aiResult) { setAiResult(userData.aiResult); setHasAnalyzed(true) }
          if (userData.scraps) setSavedScraps(userData.scraps)
          if (userData.companionSaju) setCompanionSaju(userData.companionSaju)
          if (userData.familyResult) setFamilyResult(userData.familyResult)
        }
      } else {
        setHasAnalyzed(false); setAiResult(null); setSavedScraps([]);
        setCompanionSaju({ name: "", birthDate: "", isTimeUnknown: false, birthHour: "00", birthMinute: "00", gender: "male", locationType: "city", birthCity: "인천", jasiLaw: "tongjasi" });
        setFamilyResult(null);
        setSajuInput({ name: "", birthDate: "", isTimeUnknown: false, birthHour: "00", birthMinute: "00", gender: "male", locationType: "city", birthCity: "인천", jasiLaw: "tongjasi" })
        if (activeTab === "admin") setActiveTab("home")
      }
    });
    return () => unsubscribe()
  }, [activeTab])

  // 🔥 백그라운드 자동 로딩 useEffect는 완전히 삭제했습니다. (버튼 클릭 시에만 로드되도록)

  useEffect(() => {
    if (activeTab !== "map") return;
    const kakao = (window as any).kakao;
    if (!kakao || !kakao.maps || !kakao.maps.services) return;
    const ps = new kakao.maps.services.Places();
    const searchOptions = { location: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng), radius: 3000, sort: kakao.maps.services.SortBy.DISTANCE };
    
    const searchPlaceWithFallback = (menuName: string, setRest: any) => {
      const cleanName = menuName.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').trim();
      const words = cleanName.split(' ');
      const fallbackWord = words.length > 0 ? words[words.length - 1] : "맛집";
      ps.keywordSearch(cleanName, (data: any, status: any) => {
        if (status === kakao.maps.services.Status.OK) { setRest(data[0]); } else {
          ps.keywordSearch(fallbackWord, (data2: any, status2: any) => {
            if (status2 === kakao.maps.services.Status.OK) { setRest(data2[0]); } else {
              ps.keywordSearch("맛집", (data3: any, status3: any) => {
                if (status3 === kakao.maps.services.Status.OK) setRest(data3[0]); else setRest(null);
              }, searchOptions);
            }
          }, searchOptions);
        }
      }, searchOptions);
    };

    if (aiResult) {
      searchPlaceWithFallback(aiResult.lunchMenu.name, setRealLunchRest);
      searchPlaceWithFallback(aiResult.dinnerMenu.name, setRealDinnerRest);
    }
    if (familyResult) {
      searchPlaceWithFallback(familyResult.menuName, setRealFamilyRest);
    }
  }, [aiResult, familyResult, mapCenter, activeTab]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      if (sajuInput.name && sajuInput.birthDate) {
        await setDoc(doc(db, "users", result.user.uid), { sajuInput, aiResult, updatedAt: new Date().toISOString() }, { merge: true })
      }
    } catch (error) {}
  }

  const handleFirebaseLogout = async () => {
    try { await signOut(auth); if (activeTab === "admin") setActiveTab("home") } catch (error) {}
  }

  const handleFetchTodayMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sajuInput.name || !sajuInput.birthDate) { alert("이름과 생년월일 입력해주세요!"); return }
    setIsLoading(true)
    try {
      const timeInfo = sajuInput.isTimeUnknown ? "모름" : `${sajuInput.birthHour}시 ${sajuInput.birthMinute}분`;
      const genderInfo = sajuInput.gender === "male" ? "남성" : "여성";
      const sajuString = `이름: ${sajuInput.name}, 생일: ${sajuInput.birthDate}, 시간: ${timeInfo}, 지역: ${sajuInput.birthCity}, 성별: ${genderInfo}, 자시법: ${sajuInput.jasiLaw === 'tongjasi' ? '통자시' : '야자시'}`;

      const res = await fetch('/api/recommend', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userSaju: sajuString })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiResult(data.result);
      setHasAnalyzed(true);
      setRecipeData(null); 

      if (auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), { sajuInput, aiResult: data.result, updatedAt: new Date().toISOString() }, { merge: true })
      }
    } catch (error) { alert("AI 서버 통신 에러"); } finally { setIsLoading(false); }
  }

  const handleSearchLocation = () => {
    const kakao = (window as any).kakao;
    if (!kakao || !kakao.maps || !kakao.maps.services) { alert("지도 서비스 준비 안됨"); return; }
    if (!searchInput.trim()) return;
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(searchInput, (data: any, status: any) => {
      if (status === kakao.maps.services.Status.OK) {
        setMapCenter({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
      } else alert("검색 결과가 존재하지 않거나 오류");
    });
  }

  // 🔥 레시피 불러오기 버튼 함수 (가족 메뉴까지 한 번에 로드)
  const handleFetchRecipes = async () => {
    if (!aiResult) return alert("사주 분석 결과가 없습니다. 메인 탭에서 먼저 진행해주세요.");
    
    setIsLoadingRecipe(true);
    try {
      const resLunch = await fetch('/api/recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menuName: aiResult.lunchMenu.name }) });
      const lunchData = await resLunch.json();
      
      const resDinner = await fetch('/api/recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menuName: aiResult.dinnerMenu.name }) });
      const dinnerData = await resDinner.json();

      let familyData = null;
      if (familyResult) {
        const resFamily = await fetch('/api/recipe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menuName: familyResult.menuName }) });
        const fData = await resFamily.json();
        familyData = fData.result;
      }

      setRecipeData({ lunch: lunchData.result, dinner: dinnerData.result, family: familyData });
    } catch (e) {
      alert("레시피를 생성하는 도중 오류가 발생했습니다.");
    } finally {
      setIsLoadingRecipe(false);
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const newMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const sajuContext = aiResult 
        ? `사용자 이름: ${sajuInput.name}, 사용자 사주 핵심 기운: ${aiResult.mainElement}, 점심: ${aiResult.lunchMenu.name}`
        : "아직 사주를 분석하지 않은 일반 사용자";

      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, userSaju: sajuContext })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMessages(prev => [...prev, { role: "ai", content: data.result }]);
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "ai", content: "앗, 통신에 문제가 생겼어요. 다시 시도해주세요." }]);
    } finally { setIsChatLoading(false); }
  }

  const isItemSaved = (itemType: string, dataObj: any) => {
    return savedScraps.find(scrap => {
      if (scrap.type !== itemType) return false;
      if (itemType === 'diet') return scrap.data.name === dataObj.name;
      if (itemType === 'recipe') return scrap.data.menu === dataObj.menu;
      if (itemType === 'place') {
        if (scrap.data.menuName && dataObj.menuName) {
          return scrap.data.place_name === dataObj.place_name && scrap.data.menuName === dataObj.menuName;
        }
        return scrap.data.place_name === dataObj.place_name;
      }
      if (itemType === 'family') return scrap.data.menuName === dataObj.menuName;
      return false;
    });
  };

  const handleToggleScrapbook = async (itemType: string, dataObj: any) => {
    if (!auth.currentUser) {
      alert("로그인이 필요한 기능입니다. 좌측 메뉴 하단에서 로그인해주세요.");
      return;
    }
    try {
      const existingScrap = isItemSaved(itemType, dataObj);
      const userRef = doc(db, "users", auth.currentUser.uid);

      if (existingScrap) {
        const updatedScraps = savedScraps.filter(s => s.id !== existingScrap.id);
        await updateDoc(userRef, { scraps: updatedScraps });
        setSavedScraps(updatedScraps);
      } else {
        const newScrapItem = { id: new Date().getTime().toString(), type: itemType, data: dataObj, savedAt: new Date().toISOString() };
        await updateDoc(userRef, { scraps: arrayUnion(newScrapItem) });
        setSavedScraps(prev => [...prev, newScrapItem]);
        alert("마이페이지 스크랩북에 안전하게 저장되었습니다! 📁");
      }
    } catch (error) {
      alert("스크랩 처리 중 오류가 발생했습니다.");
    }
  }

  const handleAnalyzeFamily = async () => {
    if (!aiResult) return alert("먼저 메인 탭에서 본인의 사주 명식을 분석해주세요.");
    if (!companionSaju.name || !companionSaju.birthDate) return alert("동행인의 이름과 생년월일을 입력해주세요.");
    
    setIsFamilyLoading(true);
    try {
      const userTimeInfo = sajuInput.isTimeUnknown ? "모름" : `${sajuInput.birthHour}시 ${sajuInput.birthMinute}분`;
      const userGenderInfo = sajuInput.gender === "male" ? "남성" : "여성";
      const userStr = `이름: ${sajuInput.name}, 생일: ${sajuInput.birthDate}, 시간: ${userTimeInfo}, 지역: ${sajuInput.birthCity}, 성별: ${userGenderInfo}, 자시법: ${sajuInput.jasiLaw === 'tongjasi' ? '통자시' : '야자시'}`;

      const compTimeInfo = companionSaju.isTimeUnknown ? "모름" : `${companionSaju.birthHour}시 ${companionSaju.birthMinute}분`;
      const compGenderInfo = companionSaju.gender === "male" ? "남성" : "여성";
      const companionStr = `이름: ${companionSaju.name}, 생일: ${companionSaju.birthDate}, 시간: ${compTimeInfo}, 지역: ${companionSaju.birthCity}, 성별: ${compGenderInfo}, 자시법: ${companionSaju.jasiLaw === 'tongjasi' ? '통자시' : '야자시'}`;

      const res = await fetch('/api/family', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userSaju: userStr, companionSaju: companionStr })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setFamilyResult(data.result);
      setRecipeData(null); // 가족 궁합을 새로 분석하면 기존 캐싱된 레시피 초기화

      if (auth.currentUser) {
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          companionSaju: companionSaju,
          familyResult: data.result,
          updatedAt: new Date().toISOString()
        }, { merge: true })
      }

    } catch (error) {
      alert("가족 궁합을 분석하는 데 실패했습니다.");
    } finally {
      setIsFamilyLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 h-screen overflow-y-auto">
        <div>
          <div className="flex items-center gap-2 px-2 py-4 mb-2 border-b border-slate-100">
            <span className="text-xl font-bold tracking-tight text-purple-600">☯️ 오행식탁</span>
          </div>
          <nav className="space-y-1.5 mt-4">
            <p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider mb-2">Main Services</p>
            <Button variant={activeTab === "home" ? "default" : "ghost"} className="w-full justify-start gap-3" onClick={() => setActiveTab("home")}><Home className="size-4" /> 메인 홈</Button>
            <Button variant={activeTab === "saju" ? "default" : "ghost"} className="w-full justify-start gap-3 text-purple-600 hover:text-purple-700" onClick={() => setActiveTab("saju")}><Sparkles className="size-4" /> 내 사주 명식 입력</Button>
            <Button variant={activeTab === "diet" ? "default" : "ghost"} className="w-full justify-start gap-3" onClick={() => setActiveTab("diet")}><Utensils className="size-4" /> 주간/일일 식단 추천</Button>
            <Button variant={activeTab === "map" ? "default" : "ghost"} className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700" onClick={() => setActiveTab("map")}><MapPin className="size-4" /> 오행 맛집 지도</Button>
            
            <div className="pt-4 pb-1"><p className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider mb-2">Expansion</p></div>
            <Button variant={activeTab === "family" ? "default" : "ghost"} className="w-full justify-start gap-3 text-indigo-600 hover:text-indigo-700" onClick={() => setActiveTab("family")}><Users className="size-4" /> 가족/지인 밥상 조합</Button>
            <Button variant={activeTab === "recipe" ? "default" : "ghost"} className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700" onClick={() => setActiveTab("recipe")}><ChefHat className="size-4" /> AI 추천 식단 레시피</Button>
            <Button variant={activeTab === "chatbot" ? "default" : "ghost"} className="w-full justify-start gap-3 text-sky-600 hover:text-sky-700" onClick={() => setActiveTab("chatbot")}><MessageSquare className="size-4" /> AI 오행 챗봇 상담소</Button>
            <Button variant={activeTab === "encyclopedia" ? "default" : "ghost"} className="w-full justify-start gap-3 text-teal-600 hover:text-teal-700" onClick={() => setActiveTab("encyclopedia")}><BookOpen className="size-4" /> 오행 식재료 도감</Button>
            <Button variant={activeTab === "mypage" ? "default" : "ghost"} className="w-full justify-start gap-3" onClick={() => setActiveTab("mypage")}><Bookmark className="size-4" /> 마이페이지 & 스크랩북</Button>
            
            {isAdmin && (
              <div className="pt-4"><Button variant={activeTab === "admin" ? "default" : "ghost"} className="w-full justify-start gap-3 text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setActiveTab("admin")}><ShieldAlert className="size-4" /> 관리자 페이지</Button></div>
            )}
          </nav>
        </div>
        <div className="border-t border-slate-100 pt-4 space-y-2 mt-8">
          {user ? (
            <div className="space-y-2">
              <div className="text-[11px] text-emerald-600 font-semibold px-2 bg-emerald-50 py-1.5 rounded-md text-center border border-emerald-200 truncate">☁️ {user.displayName || "유저"}님 동기화 중 {isAdmin && "(👑 관리자)"}</div>
              <Button variant="outline" className="w-full gap-2 text-rose-600 hover:bg-rose-50" onClick={handleFirebaseLogout}><LogOut className="size-4" /> 로그아웃</Button>
            </div>
          ) : (
            <Button variant="default" className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white shadow-xs" onClick={handleGoogleLogin}><LogIn className="size-4" /> Google 로그인</Button>
          )}
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-bold">
            {activeTab === "home" && "🏠 메인 홈"}
            {activeTab === "saju" && "🔮 나의 사주 명식 정보 입력"}
            {activeTab === "diet" && "🥗 오행 맞춤형 추천 식단 (일일/주간)"}
            {activeTab === "map" && "🗺️ 내 기운을 채워줄 주변 오행 맛집 추천"}
            {activeTab === "family" && "👨‍👩‍👧‍👦 가족/지인 궁합 밥상"}
            {activeTab === "recipe" && "🍳 AI 추천 식단 레시피"}
            {activeTab === "chatbot" && "💬 AI 오행 챗봇 상담소"}
            {activeTab === "encyclopedia" && "📖 오행 식재료 도감"}
            {activeTab === "mypage" && "📁 마이페이지 & 스크랩북"}
            {activeTab === "admin" && "⚙️ 시스템 관리자"}
          </h1>
          <div className="text-sm">
            {user ? (
              <span className="text-emerald-600 font-bold">● {user.displayName} {isAdmin ? "👑 관리자" : "회원"} 모드 활성화</span>
            ) : (
              <span className="text-slate-400">비회원 모드 (클라우드 보관하려면 연동을 누르세요)</span>
            )}
          </div>
        </header>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[550px]">
          
          {activeTab === "home" && (
            <div className="space-y-6">
              <Alert><AlertTitle>시스템 안내</AlertTitle><AlertDescription>오행식탁 플랫폼에 오신 것을 환영합니다! [내 사주 명식 입력] 탭에서 사주를 분석한 뒤, 맞춤 솔루션과 다양한 확장 기능을 확인해보세요.</AlertDescription></Alert>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-purple-50/50"><h3 className="font-semibold text-purple-800 mb-2">실시간 일진(日辰) 분석 식단</h3><p className="text-sm text-slate-600">매일 동적으로 변화하는 오늘의 기운과 타고난 오행을 대조하여 완벽한 점심, 저녁 처방 식단을 제공합니다.</p></div>
                <div className="p-4 border border-slate-200 rounded-lg bg-emerald-50/50"><h3 className="font-semibold text-emerald-800 mb-2">위치기반 오행 맛집 탐색</h3><p className="text-sm text-slate-600">지도 API 연동하여 내 부족한 기운을 보완하는 레시피를 판매하는 인근 식당을 실시간 트래킹합니다.</p></div>
              </div>
            </div>
          )}

          {activeTab === "saju" && (
            <div className="max-w-xl mx-auto space-y-6">
              <form onSubmit={handleFetchTodayMenu} className="space-y-5 border border-slate-200 p-6 rounded-xl bg-white shadow-xs">
                <div className="flex justify-between items-center border-b pb-2"><h3 className="text-base font-semibold text-slate-800 flex items-center gap-2"><User className="size-4 text-purple-500" /> 명식 정보 입력</h3>{user && <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded">원격 백업 켜짐</span>}</div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500">이름</label><input type="text" placeholder="이름을 입력하세요" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-purple-500 transition-all" value={sajuInput.name} onChange={(e) => setSajuInput({...sajuInput, name: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500">생년월일</label><input type="date" className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-purple-500 transition-all" value={sajuInput.birthDate} onChange={(e) => setSajuInput({...sajuInput, birthDate: e.target.value})} /></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500">태어난 지역 (출생지)</label><select className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 focus:bg-white focus:outline-purple-500 transition-all" value={sajuInput.birthCity} onChange={(e) => setSajuInput({...sajuInput, birthCity: e.target.value})}>{KOREA_CITIES.map(city => (<option key={city} value={city}>{city}</option>))}</select></div>
                <div className="space-y-2"><div className="flex justify-between items-center"><label className="text-xs font-semibold text-slate-500">시간</label><label className="flex items-center gap-2 text-xs cursor-pointer select-none text-slate-600"><input type="checkbox" className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 size-3.5" checked={sajuInput.isTimeUnknown} onChange={(e) => setSajuInput({...sajuInput, isTimeUnknown: e.target.checked})} /> 모름</label></div><div className="flex gap-2"><select disabled={sajuInput.isTimeUnknown} className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 disabled:opacity-40" value={sajuInput.birthHour} onChange={(e) => setSajuInput({...sajuInput, birthHour: e.target.value})}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (<option key={h} value={h}>{h}시</option>))}</select><select disabled={sajuInput.isTimeUnknown} className="flex-1 p-2 border border-slate-200 rounded-lg text-sm bg-slate-50/50 disabled:opacity-40" value={sajuInput.birthMinute} onChange={(e) => setSajuInput({...sajuInput, birthMinute: e.target.value})}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (<option key={m} value={m}>{m}분</option>))}</select></div></div>
                <div className="space-y-1.5"><label className="text-xs font-semibold text-slate-500">성별</label><div className="flex w-32 bg-slate-100 p-1 rounded-lg"><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.gender === "male" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setSajuInput({...sajuInput, gender: "male"})}>남</button><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.gender === "female" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setSajuInput({...sajuInput, gender: "female"})}>여</button></div></div>
                <div className="space-y-2 pt-3 border-t border-slate-100"><button type="button" className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>{isAdvancedOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />} 고급 설정</button>{isAdvancedOpen && (<div className="space-y-2 mt-2 pl-4 border-l-2 border-purple-100"><label className="text-xs font-semibold text-slate-500 block">자시법 (子時法)</label><div className="flex bg-slate-100 p-1 rounded-lg w-48"><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.jasiLaw === "tongjasi" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`} onClick={() => setSajuInput({...sajuInput, jasiLaw: "tongjasi"})}>통자시</button><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${sajuInput.jasiLaw === "yajasi" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"}`} onClick={() => setSajuInput({...sajuInput, jasiLaw: "yajasi"})}>야자시</button></div></div>)}</div>
                <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-5 rounded-lg shadow-sm flex items-center justify-center gap-2">{isLoading ? (<><span className="animate-spin inline-block size-4 border-2 border-white border-t-transparent rounded-full"></span> AI 엔진이 사주 명식을 도출 중...</>) : "내 사주 원국 분석하기 🔮"}</Button>
              </form>
              {hasAnalyzed && aiResult && (
                <div className="border border-purple-100 p-6 rounded-xl bg-purple-50/30 space-y-5">
                  <div><span className="text-[10px] font-bold uppercase bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1 w-max"><BarChart3 className="size-3" /> 타고난 사주 오행 분석 결과</span><h3 className="text-base font-bold text-slate-800 mt-2">{sajuInput.name || "사용자"}님의 사주 원국 일주</h3><p className="text-xs text-purple-900 font-medium mt-0.5 bg-white p-2 rounded-lg border border-purple-100">{aiResult.mainElement}</p></div>
                  <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-3 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-700">☯️ 사주 원국 내 오행 분포도</h4>
                    <div className="space-y-2">
                      <div><div className="flex justify-between text-[11px]"><span>木 (나무 기운)</span><span>{aiResult.ohangAnalysis.wood}개</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-blue-500 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.wood * 20, 100)}%`}}></div></div></div>
                      <div><div className="flex justify-between text-[11px]"><span>火 (불 기운)</span><span>{aiResult.ohangAnalysis.fire}개</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-red-500 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.fire * 20, 100)}%`}}></div></div></div>
                      <div><div className="flex justify-between text-[11px]"><span>土 (흙 기운)</span><span className="text-rose-500 font-bold">{aiResult.ohangAnalysis.earth === 0 ? "0개 (결핍/부족 ⚠️)" : `${aiResult.ohangAnalysis.earth}개`}</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-amber-500 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.earth * 20, 100)}%`}}></div></div></div>
                      <div><div className="flex justify-between text-[11px]"><span>金 (쇠 기운)</span><span>{aiResult.ohangAnalysis.gold}개</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-slate-400 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.gold * 20, 100)}%`}}></div></div></div>
                      <div><div className="flex justify-between text-[11px]"><span>水 (물 기운)</span><span>{aiResult.ohangAnalysis.water}개</span></div><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-slate-800 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.water * 20, 100)}%`}}></div></div></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-md"><div><p className="text-xs font-bold opacity-90">사주 원국 분석이 완료되었습니다!</p><p className="text-[11px] opacity-75 mt-0.5">오늘 일진과 결합한 AI의 점심·저녁 추천 식단을 확인해 보세요.</p></div><Button size="sm" className="bg-white text-purple-700 hover:bg-slate-50 font-bold text-xs shrink-0 flex items-center gap-1 shadow-sm" onClick={() => setActiveTab("diet")}>오늘의 식단 처방 보기 <ArrowRight className="size-3" /></Button></div>
                </div>
              )}
            </div>
          )}

          {activeTab === "diet" && (
            <div className="max-w-2xl mx-auto space-y-8">
              {!aiResult ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-slate-400"><Utensils className="size-12 mx-auto mb-3 text-slate-300" /><p className="text-sm font-medium">아직 분석된 사주 결과가 없습니다.</p><p className="text-xs mt-1 text-slate-400">[내 사주 명식 입력] 탭에서 사주 분석 버튼을 먼저 실행해주세요.</p><Button variant="outline" size="sm" className="mt-4 border-purple-200 text-purple-600" onClick={() => setActiveTab("saju")}>사주 입력하러 가기</Button></div>
              ) : (
                <>
                  <div className="border border-purple-100 p-6 rounded-xl bg-purple-50/20 space-y-6">
                    <div><div className="flex items-center gap-2"><span className="text-[11px] font-bold uppercase bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">LLM Real-time Diet Prescription</span></div><h3 className="text-lg font-bold text-slate-800 mt-2">{aiResult.todayIljin} 맞춤 처방 식단</h3><p className="text-xs text-slate-500 mt-0.5">분석 대상: <span className="font-semibold text-purple-900">{sajuInput.name || user?.displayName || "사용자"}님</span></p></div>
                    <div className="bg-purple-950 text-purple-100 p-4 rounded-xl text-xs leading-relaxed shadow-xs"><div className="font-bold text-purple-300 mb-1">💬 AI의 일진 한 줄 가이드</div>"{aiResult.todayFortune}"</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 점심 식단 */}
                      <div className="bg-white p-4 rounded-xl border border-amber-100 space-y-2 shadow-xs relative group">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-amber-700 flex items-center gap-1"><Coffee className="size-3.5" /> 오늘의 추천 점심</span><span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-100">{aiResult.lunchMenu.ohangType}</span></div>
                        <h4 className="text-base font-bold text-slate-800 pr-8">{aiResult.lunchMenu.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-50">{aiResult.lunchMenu.reason}</p>
                        {(() => {
                          const isSaved = isItemSaved('diet', aiResult.lunchMenu);
                          return (
                            <Button variant="ghost" size="icon" 
                              className={`absolute top-9 right-2 h-8 w-8 transition-colors ${isSaved ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'}`} 
                              onClick={() => handleToggleScrapbook('diet', aiResult.lunchMenu)}>
                              <Heart className="size-4" fill={isSaved ? "currentColor" : "none"} />
                            </Button>
                          )
                        })()}
                      </div>
                      {/* 저녁 식단 */}
                      <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-2 shadow-xs relative group">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-blue-700 flex items-center gap-1"><Moon className="size-3.5" /> 오늘의 추천 저녁</span><span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded border border-blue-100">{aiResult.dinnerMenu.ohangType}</span></div>
                        <h4 className="text-base font-bold text-slate-800 pr-8">{aiResult.dinnerMenu.name}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-50">{aiResult.dinnerMenu.reason}</p>
                        {(() => {
                          const isSaved = isItemSaved('diet', aiResult.dinnerMenu);
                          return (
                            <Button variant="ghost" size="icon" 
                              className={`absolute top-9 right-2 h-8 w-8 transition-colors ${isSaved ? 'text-blue-500 bg-blue-50' : 'text-slate-400 hover:text-blue-500 hover:bg-blue-50'}`} 
                              onClick={() => handleToggleScrapbook('diet', aiResult.dinnerMenu)}>
                              <Heart className="size-4" fill={isSaved ? "currentColor" : "none"} />
                            </Button>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-slate-700">📋 오행별 고정 대체 식단 가이드</h4>
                    <Accordion type="single" collapsible className="w-full bg-slate-50 border rounded-lg px-4">
                      {getLowestElements().map((elKey, idx) => {
                        const guide = ohangGuideInfo[elKey as keyof typeof ohangGuideInfo];
                        return (<AccordionItem key={elKey} value={`item-${idx}`}><AccordionTrigger>{guide.title}의 기운 보완 식단</AccordionTrigger><AccordionContent className="pb-4 text-xs text-slate-600">{guide.desc}</AccordionContent></AccordionItem>);
                      })}
                    </Accordion>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "map" && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div><h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1.5"><MapPin className="size-4" /> 현재 설정된 위치 기반 맛집 트래킹</h3><p className="text-xs text-emerald-700 mt-1">{(sajuInput.name || user) ? `[${sajuInput.name || user?.displayName}]님의 부족한 기운 맞춤형 레시피 음식점을 내 주변에서 매핑합니다.` : "상단의 사주 정보를 먼저 입력하면 주변 맞춤형 식당 목록이 자동 필터링됩니다."}</p></div>
                <div className="flex gap-2 w-full md:w-auto"><input type="text" placeholder="강남역, 용산구 청파동 등" className="p-1.5 text-xs border rounded-md bg-white w-full md:w-40 outline-none focus:border-emerald-500" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} /><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0" onClick={handleSearchLocation}><Search className="size-3" /> 검색</Button></div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-100 rounded-xl border border-slate-200 relative min-h-[350px] overflow-hidden shadow-inner flex items-center justify-center">
                  {isKakaoLoading ? (<span className="text-sm text-slate-500 animate-pulse">지도 데이터를 불러오는 중... 🗺️</span>) : kakaoError ? (<span className="text-sm text-rose-500">지도를 불러올 수 없습니다. 앱키나 도메인 설정을 확인해주세요.</span>) : (
                    <Map center={mapCenter} style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }} level={4}>
                      {realLunchRest && (<MapMarker position={{ lat: parseFloat(realLunchRest.y), lng: parseFloat(realLunchRest.x) }}><div className="p-1 text-[11px] font-bold text-amber-800 text-center bg-white shadow-sm border border-amber-200 rounded whitespace-nowrap">🍛 {realLunchRest.place_name}</div></MapMarker>)}
                      {realDinnerRest && (<MapMarker position={{ lat: parseFloat(realDinnerRest.y), lng: parseFloat(realDinnerRest.x) }}><div className="p-1 text-[11px] font-bold text-blue-800 text-center bg-white shadow-sm border border-blue-200 rounded whitespace-nowrap">🍲 {realDinnerRest.place_name}</div></MapMarker>)}
                      {realFamilyRest && (<MapMarker position={{ lat: parseFloat(realFamilyRest.y), lng: parseFloat(realFamilyRest.x) }}><div className="p-1 text-[11px] font-bold text-indigo-800 text-center bg-white shadow-sm border border-indigo-200 rounded whitespace-nowrap">👩‍👩‍👦 {realFamilyRest.place_name}</div></MapMarker>)}
                    </Map>
                  )}
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500">📍 검색된 진짜 음식점 리스트</h4>
                  
                  {/* 점심 지도 추천 맛집 */}
                  <div className="p-3.5 border border-amber-200 rounded-xl bg-amber-50/20 space-y-1 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-800 pr-6">{realLunchRest ? realLunchRest.place_name : (aiResult ? "메뉴 검색 실패" : "고꼬카레 숙대점")}</span>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{aiResult ? aiResult.lunchMenu.ohangType : "土 기운 매칭"}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">추천 메뉴: {aiResult ? aiResult.lunchMenu.name : "단호박 버섯카레 라이스"}</p>
                    <p className="text-[11px] text-slate-400 pr-8">📍 {realLunchRest ? realLunchRest.address_name : "캠퍼스 정문 도보 5분"}</p>
                    {(() => {
                      const placeData = {
                        place_name: realLunchRest ? realLunchRest.place_name : "고꼬카레 숙대점",
                        address_name: realLunchRest ? realLunchRest.address_name : "캠퍼스 정문 도보 5분",
                        ohangType: aiResult ? aiResult.lunchMenu.ohangType : "土 기운 매칭",
                        menuName: aiResult ? aiResult.lunchMenu.name : "단호박 버섯카레 라이스"
                      };
                      const isSaved = isItemSaved('place', placeData);
                      return (
                        <Button variant="ghost" size="icon" 
                          className={`absolute bottom-2 right-2 h-6 w-6 transition-colors ${isSaved ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-100'}`} 
                          onClick={() => handleToggleScrapbook('place', placeData)}>
                          <Heart className="size-3.5" fill={isSaved ? "currentColor" : "none"} />
                        </Button>
                      )
                    })()}
                  </div>
                  
                  {/* 저녁 지도 추천 맛집 */}
                  <div className="p-3.5 border border-blue-200 rounded-xl bg-blue-50/20 space-y-1 relative group">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-800 pr-6">{realDinnerRest ? realDinnerRest.place_name : (aiResult ? "메뉴 검색 실패" : "어선생 생선구이 백반")}</span>
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">{aiResult ? aiResult.dinnerMenu.ohangType : "水 기운 매칭"}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-700">추천 메뉴: {aiResult ? aiResult.dinnerMenu.name : "화덕 삼치구이와 달래장"}</p>
                    <p className="text-[11px] text-slate-400 pr-8">📍 {realDinnerRest ? realDinnerRest.address_name : "효창공원앞역 2번 출구 부근"}</p>
                    {(() => {
                      const placeData = {
                        place_name: realDinnerRest ? realDinnerRest.place_name : "어선생 생선구이 백반",
                        address_name: realDinnerRest ? realDinnerRest.address_name : "효창공원앞역 2번 출구 부근",
                        ohangType: aiResult ? aiResult.dinnerMenu.ohangType : "水 기운 매칭",
                        menuName: aiResult ? aiResult.dinnerMenu.name : "화덕 삼치구이와 달래장"
                      };
                      const isSaved = isItemSaved('place', placeData);
                      return (
                        <Button variant="ghost" size="icon" 
                          className={`absolute bottom-2 right-2 h-6 w-6 transition-colors ${isSaved ? 'text-blue-500 hover:bg-blue-100' : 'text-slate-300 hover:text-blue-500 hover:bg-blue-100'}`} 
                          onClick={() => handleToggleScrapbook('place', placeData)}>
                          <Heart className="size-3.5" fill={isSaved ? "currentColor" : "none"} />
                        </Button>
                      )
                    })()}
                  </div>
                  
                  {/* 가족 지도 추천 맛집 */}
                  {familyResult && (
                    <div className="p-3.5 border border-indigo-200 rounded-xl bg-indigo-50/20 space-y-1 relative group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-800 pr-6">{realFamilyRest ? realFamilyRest.place_name : "궁합 메뉴 검색 실패"}</span>
                        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">{familyResult.ohangType}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700">궁합 메뉴: {familyResult.menuName}</p>
                      <p className="text-[11px] text-slate-400 pr-8">📍 {realFamilyRest ? realFamilyRest.address_name : "주변 검색 안됨"}</p>
                      {(() => {
                        const placeData = {
                          place_name: realFamilyRest ? realFamilyRest.place_name : "가족 궁합 메뉴 식당",
                          address_name: realFamilyRest ? realFamilyRest.address_name : "-",
                          ohangType: familyResult.ohangType,
                          menuName: familyResult.menuName
                        };
                        const isSaved = isItemSaved('place', placeData);
                        return (
                          <Button variant="ghost" size="icon" 
                            className={`absolute bottom-2 right-2 h-6 w-6 transition-colors ${isSaved ? 'text-indigo-500 hover:bg-indigo-100' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-100'}`} 
                            onClick={() => handleToggleScrapbook('place', placeData)}>
                            <Heart className="size-3.5" fill={isSaved ? "currentColor" : "none"} />
                          </Button>
                        )
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isAdmin && activeTab === "admin" && (
            <div className="space-y-4">
              <p className="text-slate-600">시스템 모니터링 및 전체 식재료 카테고리 관리 화면입니다.</p>
              <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center text-slate-400">실제 Firebase DB(Firestore) 조회가 활성화되었습니다. 회원 데이터 트래킹 및 통계 로직을 안심하고 설계하세요.</div>
            </div>
          )}

          {activeTab === "family" && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <Alert className="bg-indigo-50 border-indigo-200"><Users className="size-4 text-indigo-600" /><AlertTitle className="text-indigo-800 font-bold">두 사람을 위한 교집합 밥상</AlertTitle><AlertDescription className="text-indigo-700">나와 동행인의 사주를 함께 분석하여, 서로에게 부족한 기운을 동시에 채워줄 수 있는 완벽한 궁합 메뉴를 AI가 찾아냅니다.</AlertDescription></Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 border border-slate-200 rounded-xl bg-white shadow-sm flex flex-col">
                  <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 flex justify-between items-center">👤 기준 인물 (나) {sajuInput.name && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">데이터 연동됨</span>}</h4>
                  <p className="text-sm text-slate-500 mb-4">{sajuInput.name ? "메인 탭에서 입력한 사주 정보가 자동으로 적용되었습니다." : "먼저 내 사주 명식을 입력해주세요."}</p>
                  {sajuInput.name && (
                    <div className="p-4 bg-slate-50 rounded-lg text-xs font-medium text-slate-700 border border-slate-100 space-y-2 mt-auto">
                      <p><span className="text-slate-400 w-12 inline-block">이름:</span> {sajuInput.name}</p>
                      <p><span className="text-slate-400 w-12 inline-block">생일:</span> {sajuInput.birthDate}</p>
                      <p><span className="text-slate-400 w-12 inline-block">지역:</span> {sajuInput.birthCity}</p>
                      <p><span className="text-slate-400 w-12 inline-block">시간:</span> {sajuInput.isTimeUnknown ? "모름" : `${sajuInput.birthHour}시 ${sajuInput.birthMinute}분`}</p>
                      <p><span className="text-slate-400 w-12 inline-block">성별:</span> {sajuInput.gender === "male" ? "남성" : "여성"}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border border-indigo-200 rounded-xl bg-indigo-50/50 shadow-sm relative">
                  <h4 className="font-bold text-indigo-800 border-b border-indigo-100 pb-2 mb-4">👥 동행인 정보 입력</h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-indigo-700">이름</label><input type="text" placeholder="동행인 이름" className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-indigo-500 transition-all" value={companionSaju.name} onChange={(e) => setCompanionSaju({...companionSaju, name: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-indigo-700">생년월일</label><input type="date" className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-indigo-500 transition-all" value={companionSaju.birthDate} onChange={(e) => setCompanionSaju({...companionSaju, birthDate: e.target.value})} /></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-indigo-700">태어난 지역</label><select className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-indigo-500 transition-all" value={companionSaju.birthCity} onChange={(e) => setCompanionSaju({...companionSaju, birthCity: e.target.value})}>{KOREA_CITIES.map(city => (<option key={city} value={city}>{city}</option>))}</select></div>
                    <div className="space-y-2"><div className="flex justify-between items-center"><label className="text-xs font-semibold text-indigo-700">시간</label><label className="flex items-center gap-2 text-xs cursor-pointer text-indigo-700"><input type="checkbox" className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 size-3.5" checked={companionSaju.isTimeUnknown} onChange={(e) => setCompanionSaju({...companionSaju, isTimeUnknown: e.target.checked})} /> 모름</label></div><div className="flex gap-2"><select disabled={companionSaju.isTimeUnknown} className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm bg-white disabled:opacity-40" value={companionSaju.birthHour} onChange={(e) => setCompanionSaju({...companionSaju, birthHour: e.target.value})}>{Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (<option key={h} value={h}>{h}시</option>))}</select><select disabled={companionSaju.isTimeUnknown} className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm bg-white disabled:opacity-40" value={companionSaju.birthMinute} onChange={(e) => setCompanionSaju({...companionSaju, birthMinute: e.target.value})}>{Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (<option key={m} value={m}>{m}분</option>))}</select></div></div>
                    <div className="space-y-1.5"><label className="text-xs font-semibold text-indigo-700">성별</label><div className="flex w-32 bg-white/50 p-1 rounded-lg border border-indigo-100"><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${companionSaju.gender === "male" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-500"}`} onClick={() => setCompanionSaju({...companionSaju, gender: "male"})}>남</button><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${companionSaju.gender === "female" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-500"}`} onClick={() => setCompanionSaju({...companionSaju, gender: "female"})}>여</button></div></div>
                    <div className="space-y-2 pt-3 border-t border-indigo-100"><button type="button" className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors" onClick={() => setIsCompanionAdvancedOpen(!isCompanionAdvancedOpen)}>{isCompanionAdvancedOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />} 고급 설정</button>{isCompanionAdvancedOpen && (<div className="space-y-2 mt-2 pl-4 border-l-2 border-indigo-200"><label className="text-xs font-semibold text-indigo-700 block">자시법 (子時法)</label><div className="flex bg-white/50 p-1 rounded-lg w-48 border border-indigo-100"><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${companionSaju.jasiLaw === "tongjasi" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-500"}`} onClick={() => setCompanionSaju({...companionSaju, jasiLaw: "tongjasi"})}>통자시</button><button type="button" className={`flex-1 py-1 text-xs font-medium rounded-md transition-all ${companionSaju.jasiLaw === "yajasi" ? "bg-white text-indigo-900 shadow-sm" : "text-indigo-500"}`} onClick={() => setCompanionSaju({...companionSaju, jasiLaw: "yajasi"})}>야자시</button></div></div>)}</div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleAnalyzeFamily} 
                disabled={isFamilyLoading || !sajuInput.name || !companionSaju.name} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 font-bold text-lg transition-all shadow-md"
              >
                {isFamilyLoading ? (<><span className="animate-spin inline-block size-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> 오행 상호작용 및 궁합 분석 중...</>) : "교집합 궁합 메뉴 분석하기 🥢"}
              </Button>

              {familyResult && (
                <div className="mt-8 space-y-6">
                  <div className="border-2 border-indigo-100 bg-white rounded-xl p-6 shadow-sm relative overflow-hidden">
                    <h3 className="text-lg font-bold text-indigo-900 mb-4">⚖️ 두 사람의 사주 오행 비교 및 궁합</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <h4 className="text-xs font-bold text-slate-700 mb-3">👤 {sajuInput.name}님의 오행</h4>
                        {aiResult && (
                          <div className="space-y-2">
                            <div><div className="flex justify-between text-[11px]"><span>木 (나무)</span><span>{aiResult.ohangAnalysis.wood}개</span></div><div className="w-full bg-slate-200 h-2 rounded-full"><div className="bg-blue-500 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.wood * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px]"><span>火 (불)</span><span>{aiResult.ohangAnalysis.fire}개</span></div><div className="w-full bg-slate-200 h-2 rounded-full"><div className="bg-red-500 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.fire * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px]"><span>土 (흙)</span><span>{aiResult.ohangAnalysis.earth}개</span></div><div className="w-full bg-slate-200 h-2 rounded-full"><div className="bg-amber-500 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.earth * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px]"><span>金 (쇠)</span><span>{aiResult.ohangAnalysis.gold}개</span></div><div className="w-full bg-slate-200 h-2 rounded-full"><div className="bg-slate-400 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.gold * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px]"><span>水 (물)</span><span>{aiResult.ohangAnalysis.water}개</span></div><div className="w-full bg-slate-200 h-2 rounded-full"><div className="bg-slate-800 h-full" style={{width: `${Math.min(aiResult.ohangAnalysis.water * 20, 100)}%`}}></div></div></div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                        <h4 className="text-xs font-bold text-indigo-800 mb-3">👥 {companionSaju.name}님의 오행</h4>
                        {familyResult.companionOhang && (
                          <div className="space-y-2">
                            <div><div className="flex justify-between text-[11px] text-indigo-900"><span>木 (나무)</span><span>{familyResult.companionOhang.wood}개</span></div><div className="w-full bg-indigo-100 h-2 rounded-full"><div className="bg-blue-500 h-full" style={{width: `${Math.min(familyResult.companionOhang.wood * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px] text-indigo-900"><span>火 (불)</span><span>{familyResult.companionOhang.fire}개</span></div><div className="w-full bg-indigo-100 h-2 rounded-full"><div className="bg-red-500 h-full" style={{width: `${Math.min(familyResult.companionOhang.fire * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px] text-indigo-900"><span>土 (흙)</span><span>{familyResult.companionOhang.earth}개</span></div><div className="w-full bg-indigo-100 h-2 rounded-full"><div className="bg-amber-500 h-full" style={{width: `${Math.min(familyResult.companionOhang.earth * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px] text-indigo-900"><span>金 (쇠)</span><span>{familyResult.companionOhang.gold}개</span></div><div className="w-full bg-indigo-100 h-2 rounded-full"><div className="bg-slate-400 h-full" style={{width: `${Math.min(familyResult.companionOhang.gold * 20, 100)}%`}}></div></div></div>
                            <div><div className="flex justify-between text-[11px] text-indigo-900"><span>水 (물)</span><span>{familyResult.companionOhang.water}개</span></div><div className="w-full bg-indigo-100 h-2 rounded-full"><div className="bg-slate-800 h-full" style={{width: `${Math.min(familyResult.companionOhang.water * 20, 100)}%`}}></div></div></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                      <p className="text-sm text-indigo-800 font-bold mb-1">💬 AI 궁합 풀이</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{familyResult.compatibility}</p>
                    </div>
                  </div>

                  <div className="border-2 border-indigo-200 bg-white rounded-xl p-6 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">✨ AI가 찾은 최고의 시너지 밥상</h3>
                      {(() => {
                        const isSaved = isItemSaved('family', familyResult);
                        return (
                          <Button variant="outline" size="sm" className={`border-indigo-200 transition-colors ${isSaved ? 'text-indigo-600 bg-indigo-100' : 'text-indigo-600 hover:bg-indigo-50'}`} onClick={() => handleToggleScrapbook('family', familyResult)}>
                            <Heart className="size-3.5 mr-1" fill={isSaved ? "currentColor" : "none"} /> 
                            {isSaved ? '스크랩 취소' : '궁합 스크랩'}
                          </Button>
                        )
                      })()}
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">필요 공통 기운: {familyResult.commonElement}</span>
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full">{familyResult.ohangType}</span>
                    </div>
                    <h4 className="text-xl font-extrabold text-slate-800 mb-2">{familyResult.menuName}</h4>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">{familyResult.reason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🔥 3. 레시피 탭 (새로고침 버튼 추가 및 가족 레시피 병합 렌더링) */}
          {activeTab === "recipe" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {!aiResult ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-slate-400">
                  <ChefHat className="size-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm font-medium">아직 분석된 식단이 없습니다.</p>
                  <p className="text-xs mt-1">[식단 추천] 탭을 먼저 확인해주세요.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">🍳 맞춤형 AI 셰프 레시피</h3>
                      <p className="text-xs text-slate-500 mt-1">사주 분석 및 가족 궁합 결과를 바탕으로 레시피를 생성합니다.</p>
                    </div>
                    <Button onClick={handleFetchRecipes} disabled={isLoadingRecipe} className="bg-amber-500 hover:bg-amber-600 text-white gap-2 shadow-sm transition-all">
                      {isLoadingRecipe ? <span className="animate-spin inline-block size-4 border-2 border-white border-t-transparent rounded-full"></span> : <Sparkles className="size-4" />}
                      {recipeData ? "레시피 다시 생성" : "레시피 결과 보기"}
                    </Button>
                  </div>

                  {isLoadingRecipe ? (
                    <div className="text-center py-12 border border-dashed border-amber-200 rounded-xl text-amber-500 bg-amber-50/30">
                      <span className="animate-spin inline-block size-8 border-4 border-amber-400 border-t-transparent rounded-full mb-3"></span>
                      <p className="text-sm font-bold">마스터 셰프 AI가 레시피를 작성 중입니다...</p>
                      <p className="text-xs mt-1 text-slate-500">각 메뉴당 레시피를 가져오느라 약 10~20초 정도 소요될 수 있습니다.</p>
                    </div>
                  ) : !recipeData ? (
                    <div className="text-center py-12 border border-dashed rounded-xl text-slate-400">
                      <p className="text-sm font-medium">우측 상단의 [레시피 결과 보기] 버튼을 눌러주세요.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* 점심 레시피 */}
                      <div className="border border-amber-200 bg-amber-50 rounded-xl overflow-hidden shadow-sm relative">
                        <div className="bg-amber-100 px-4 py-2 font-bold text-amber-800 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2"><Coffee className="size-4" /> 점심: {recipeData.lunch.menu}</div>
                          {(() => {
                            const isSaved = isItemSaved('recipe', recipeData.lunch);
                            return (
                              <Button variant="ghost" size="sm" className={`h-6 transition-colors ${isSaved ? 'text-amber-700 bg-amber-200' : 'text-amber-700 hover:bg-amber-200'}`} onClick={() => handleToggleScrapbook('recipe', recipeData.lunch)}>
                                <Heart className="size-3.5 mr-1" fill={isSaved ? "currentColor" : "none"} /> 
                                {isSaved ? '저장됨' : '저장'}
                              </Button>
                            )
                          })()}
                        </div>
                        <div className="p-4 flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-3">
                            <h5 className="text-xs font-bold text-slate-500">필요한 식재료</h5>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                              {recipeData.lunch.ingredients.map((ing: string, i: number) => (<li key={i}>{ing}</li>))}
                            </ul>
                          </div>
                          <div className="flex-[2] space-y-3">
                            <h5 className="text-xs font-bold text-slate-500">조리 순서</h5>
                            <div className="bg-white p-4 rounded-lg border border-amber-100 text-xs text-slate-600 space-y-2">
                              {recipeData.lunch.steps.map((step: string, i: number) => (<p key={i}>{step}</p>))}
                            </div>
                            <p className="text-[11px] font-bold text-amber-600 mt-2">💡 셰프의 팁: {recipeData.lunch.tip}</p>
                          </div>
                        </div>
                      </div>

                      {/* 저녁 레시피 */}
                      <div className="border border-blue-200 bg-blue-50 rounded-xl overflow-hidden shadow-sm relative">
                        <div className="bg-blue-100 px-4 py-2 font-bold text-blue-800 text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2"><Moon className="size-4" /> 저녁: {recipeData.dinner.menu}</div>
                          {(() => {
                            const isSaved = isItemSaved('recipe', recipeData.dinner);
                            return (
                              <Button variant="ghost" size="sm" className={`h-6 transition-colors ${isSaved ? 'text-blue-700 bg-blue-200' : 'text-blue-700 hover:bg-blue-200'}`} onClick={() => handleToggleScrapbook('recipe', recipeData.dinner)}>
                                <Heart className="size-3.5 mr-1" fill={isSaved ? "currentColor" : "none"} /> 
                                {isSaved ? '저장됨' : '저장'}
                              </Button>
                            )
                          })()}
                        </div>
                        <div className="p-4 flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-3">
                            <h5 className="text-xs font-bold text-slate-500">필요한 식재료</h5>
                            <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                              {recipeData.dinner.ingredients.map((ing: string, i: number) => (<li key={i}>{ing}</li>))}
                            </ul>
                          </div>
                          <div className="flex-[2] space-y-3">
                            <h5 className="text-xs font-bold text-slate-500">조리 순서</h5>
                            <div className="bg-white p-4 rounded-lg border border-blue-100 text-xs text-slate-600 space-y-2">
                              {recipeData.dinner.steps.map((step: string, i: number) => (<p key={i}>{step}</p>))}
                            </div>
                            <p className="text-[11px] font-bold text-blue-600 mt-2">💡 셰프의 팁: {recipeData.dinner.tip}</p>
                          </div>
                        </div>
                      </div>

                      {/* 🔥 가족 궁합 레시피 렌더링 */}
                      {recipeData.family && (
                        <div className="border border-indigo-200 bg-indigo-50 rounded-xl overflow-hidden shadow-sm relative">
                          <div className="bg-indigo-100 px-4 py-2 font-bold text-indigo-800 text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2"><Users className="size-4" /> 가족 궁합 요리: {recipeData.family.menu}</div>
                            {(() => {
                              const isSaved = isItemSaved('recipe', recipeData.family);
                              return (
                                <Button variant="ghost" size="sm" className={`h-6 transition-colors ${isSaved ? 'text-indigo-700 bg-indigo-200' : 'text-indigo-700 hover:bg-indigo-200'}`} onClick={() => handleToggleScrapbook('recipe', recipeData.family)}>
                                  <Heart className="size-3.5 mr-1" fill={isSaved ? "currentColor" : "none"} /> 
                                  {isSaved ? '저장됨' : '저장'}
                                </Button>
                              )
                            })()}
                          </div>
                          <div className="p-4 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-3">
                              <h5 className="text-xs font-bold text-slate-500">필요한 식재료</h5>
                              <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                                {recipeData.family.ingredients.map((ing: string, i: number) => (<li key={i}>{ing}</li>))}
                              </ul>
                            </div>
                            <div className="flex-[2] space-y-3">
                              <h5 className="text-xs font-bold text-slate-500">조리 순서</h5>
                              <div className="bg-white p-4 rounded-lg border border-indigo-100 text-xs text-slate-600 space-y-2">
                                {recipeData.family.steps.map((step: string, i: number) => (<p key={i}>{step}</p>))}
                              </div>
                              <p className="text-[11px] font-bold text-indigo-600 mt-2">💡 셰프의 팁: {recipeData.family.tip}</p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "chatbot" && (
            <div className="flex flex-col h-[500px] border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
              <div className="bg-sky-600 text-white p-3 flex items-center gap-2 shadow-sm z-10">
                <MessageSquare className="size-5" />
                <span className="font-bold text-sm">오행식탁 통합 AI 어시스턴트</span>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
                {chatMessages.map((msg, idx) => (
                  msg.role === "ai" ? (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="bg-sky-100 p-2 rounded-full shrink-0"><Sparkles className="size-4 text-sky-600" /></div>
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none max-w-[80%] shadow-sm text-sm text-slate-700 whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex items-start gap-2 flex-row-reverse">
                      <div className="bg-purple-100 p-2 rounded-full shrink-0"><User className="size-4 text-purple-600" /></div>
                      <div className="bg-purple-600 text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] shadow-sm text-sm whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                  )
                ))}
                
                {isChatLoading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-sky-100 p-2 rounded-full shrink-0"><Sparkles className="size-4 text-sky-600" /></div>
                    <div className="text-sm text-slate-400 p-3 flex items-center gap-2">
                      <span className="animate-bounce">●</span><span className="animate-bounce delay-100">●</span><span className="animate-bounce delay-200">●</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <input 
                  type="text" 
                  placeholder="AI에게 증상이나 궁금한 점을 물어보세요..." 
                  className="flex-1 bg-slate-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-sky-500 outline-none" 
                  value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} disabled={isChatLoading}
                />
                <Button className="bg-sky-600 hover:bg-sky-700 rounded-full px-4" onClick={handleSendMessage} disabled={isChatLoading}>
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === "encyclopedia" && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-4"><BookOpen className="size-5 text-teal-600" /><h3 className="font-bold text-lg text-slate-800">오행별 핵심 식재료 백과사전</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="border border-green-200 bg-green-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"><h4 className="font-bold text-green-800 text-base mb-2">🌳 목(木)의 식재료</h4><p className="text-xs text-green-700 mb-3">간, 담낭 보호 / 신맛 / 푸른색</p><div className="flex flex-wrap gap-1"><span className="text-[10px] bg-white border border-green-200 px-2 py-1 rounded-md text-slate-600">부추</span><span className="text-[10px] bg-white border border-green-200 px-2 py-1 rounded-md text-slate-600">시금치</span></div></div>
                <div className="border border-red-200 bg-red-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"><h4 className="font-bold text-red-800 text-base mb-2">🔥 화(火)의 식재료</h4><p className="text-xs text-red-700 mb-3">심장, 소장 보호 / 쓴맛 / 붉은색</p><div className="flex flex-wrap gap-1"><span className="text-[10px] bg-white border border-red-200 px-2 py-1 rounded-md text-slate-600">토마토</span><span className="text-[10px] bg-white border border-red-200 px-2 py-1 rounded-md text-slate-600">팥</span></div></div>
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"><h4 className="font-bold text-amber-800 text-base mb-2">⛰️ 토(土)의 식재료</h4><p className="text-xs text-amber-700 mb-3">비장, 위장 보호 / 단맛 / 황색</p><div className="flex flex-wrap gap-1"><span className="text-[10px] bg-white border border-amber-200 px-2 py-1 rounded-md text-slate-600">단호박</span><span className="text-[10px] bg-white border border-amber-200 px-2 py-1 rounded-md text-slate-600">청국장</span></div></div>
                <div className="border border-slate-300 bg-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"><h4 className="font-bold text-slate-800 text-base mb-2">🪨 금(金)의 식재료</h4><p className="text-xs text-slate-600 mb-3">폐, 대장 보호 / 매운맛 / 흰색</p><div className="flex flex-wrap gap-1"><span className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded-md text-slate-600">마늘</span><span className="text-[10px] bg-white border border-slate-300 px-2 py-1 rounded-md text-slate-600">양파</span></div></div>
                <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"><h4 className="font-bold text-indigo-800 text-base mb-2">💧 수(水)의 식재료</h4><p className="text-xs text-indigo-700 mb-3">신장, 방광 보호 / 짠맛 / 검은색</p><div className="flex flex-wrap gap-1"><span className="text-[10px] bg-white border border-indigo-200 px-2 py-1 rounded-md text-slate-600">미역</span><span className="text-[10px] bg-white border border-indigo-200 px-2 py-1 rounded-md text-slate-600">검은콩</span></div></div>
              </div>
            </div>
          )}

          {activeTab === "mypage" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {!user ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-slate-400"><Bookmark className="size-12 mx-auto mb-3 text-slate-300" /><p className="text-sm font-medium">로그인이 필요한 서비스입니다.</p><p className="text-xs mt-1">좌측 하단의 Google 계정 연동을 진행해주세요.</p></div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 p-6 bg-slate-100 rounded-xl border border-slate-200">
                    <div className="size-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">{user.displayName?.charAt(0) || "U"}</div>
                    <div><h3 className="font-bold text-lg text-slate-800">{user.displayName}님의 기록실</h3><p className="text-xs text-slate-500">{user.email}</p>{aiResult && <div className="mt-2 text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full w-max font-bold">대표 기운: {aiResult.mainElement}</div>}</div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-700 flex items-center gap-2 border-b pb-2"><Bookmark className="size-4 text-emerald-600" /> 나의 스크랩북</h4>
                    
                    {savedScraps.length === 0 ? (
                      <p className="text-sm text-slate-400 py-4 text-center">아직 저장된 스크랩이 없습니다. 곳곳에서 하트(저장) 버튼을 눌러보세요!</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedScraps.map((scrap) => {
                          if (scrap.type === 'diet') {
                            return (
                              <div key={scrap.id} className="p-4 border border-amber-200 rounded-xl bg-amber-50/30 shadow-xs relative">
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-md flex items-center w-max gap-1 mb-2"><Utensils className="size-3" /> 추천 식단</span>
                                <p className="font-bold text-slate-800">{scrap.data.name}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scrap.data.reason}</p>
                                <p className="text-[9px] text-slate-400 mt-3 absolute bottom-3 right-4">{new Date(scrap.savedAt).toLocaleDateString()}</p>
                              </div>
                            )
                          } else if (scrap.type === 'recipe') {
                            return (
                              <div key={scrap.id} className="p-4 border border-rose-200 rounded-xl bg-rose-50/30 shadow-xs relative">
                                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-1 rounded-md flex items-center w-max gap-1 mb-2"><ChefHat className="size-3" /> 레시피 노트</span>
                                <p className="font-bold text-slate-800">{scrap.data.menu}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">핵심 재료: {scrap.data.ingredients?.join(', ')}</p>
                                <p className="text-[9px] text-slate-400 mt-3 absolute bottom-3 right-4">{new Date(scrap.savedAt).toLocaleDateString()}</p>
                              </div>
                            )
                          } else if (scrap.type === 'place') {
                            return (
                              <div key={scrap.id} className="p-4 border border-emerald-200 rounded-xl bg-emerald-50/30 shadow-xs relative">
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md flex items-center w-max gap-1 mb-2"><MapPin className="size-3" /> 오행 맛집</span>
                                <p className="font-bold text-slate-800">{scrap.data.place_name}</p>
                                <p className="text-xs text-slate-500 mt-1">{scrap.data.address_name}</p>
                                <p className="text-[10px] text-emerald-600 font-semibold mt-1">추천 메뉴: {scrap.data.menuName}</p>
                                <p className="text-[9px] text-slate-400 mt-3 absolute bottom-3 right-4">{new Date(scrap.savedAt).toLocaleDateString()}</p>
                              </div>
                            )
                          } else if (scrap.type === 'family') {
                            return (
                              <div key={scrap.id} className="p-4 border border-indigo-200 rounded-xl bg-indigo-50/30 shadow-xs relative">
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-md flex items-center w-max gap-1 mb-2"><Users className="size-3" /> 가족 궁합 메뉴</span>
                                <p className="font-bold text-slate-800">{scrap.data.menuName}</p>
                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{scrap.data.commonElement}</p>
                                <p className="text-[9px] text-slate-400 mt-3 absolute bottom-3 right-4">{new Date(scrap.savedAt).toLocaleDateString()}</p>
                              </div>
                            )
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}