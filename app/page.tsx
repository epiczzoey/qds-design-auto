"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DynamicPreview from "@/components/DynamicPreview";

interface Generation {
  id: string;
  prompt: string;
  style: string | null;
  code: string;
  css?: string | null; // 서버 생성 Tailwind CSS
  status: string;
  screenshot_url: string | null;
  created_at: string;
  _count?: {
    assets: number;
  };
}

export default function Home() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("default");
  const [loading, setLoading] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<Generation | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [history, setHistory] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // 이미지 업로드 관련 state
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // base64
  const [imageFile, setImageFile] = useState<File | null>(null);

  // 히스토리 로드
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/generations?limit=20");
      const data = await response.json();

      if (response.ok) {
        setHistory(data.generations || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 카드 클릭 이벤트 방지

    if (!confirm("정말로 이 컴포넌트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/generations/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "삭제 실패");
      }

      toast({
        title: "삭제 완료",
        description: "컴포넌트가 성공적으로 삭제되었습니다.",
      });

      // 현재 보고 있던 항목이면 초기화
      if (currentGeneration?.id === id) {
        setCurrentGeneration(null);
      }

      // 히스토리 새로고침
      loadHistory();
    } catch (err) {
      console.error("Delete failed:", err);
      toast({
        title: "삭제 실패",
        description: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAll = async () => {
    if (history.length === 0) {
      toast({
        title: "삭제할 항목 없음",
        description: "히스토리가 비어있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`정말로 모든 컴포넌트 (${history.length}개)를 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`)) {
      return;
    }

    // 두 번째 확인
    if (!confirm("⚠️ 마지막 확인: 모든 히스토리와 스크린샷이 영구적으로 삭제됩니다. 계속하시겠습니까?")) {
      return;
    }

    try {
      setHistoryLoading(true);

      const response = await fetch("/api/generations", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "전체 삭제 실패");
      }

      toast({
        title: "전체 삭제 완료",
        description: `${data.deleted}개의 컴포넌트와 ${data.deletedFiles}개의 파일이 삭제되었습니다.`,
      });

      // 현재 항목 초기화
      setCurrentGeneration(null);

      // 히스토리 새로고침
      loadHistory();
    } catch (err) {
      console.error("Delete all failed:", err);
      toast({
        title: "전체 삭제 실패",
        description: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
      setHistoryLoading(false);
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 타입 확인
    if (!file.type.startsWith("image/")) {
      toast({
        title: "잘못된 파일 형식",
        description: "이미지 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    // 이미지 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "이미지는 5MB 이하여야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);

    // Base64 변환
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceImage(reader.result as string);
      toast({
        title: "이미지 업로드 완료",
        description: "참조 이미지가 추가되었습니다.",
      });
    };
    reader.onerror = () => {
      toast({
        title: "업로드 실패",
        description: "이미지를 읽을 수 없습니다.",
        variant: "destructive",
      });
    };
    reader.readAsDataURL(file);
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setReferenceImage(null);
    setImageFile(null);
    
    // input 초기화
    const input = document.getElementById("image-upload") as HTMLInputElement;
    if (input) input.value = "";
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "입력 오류",
        description: "프롬프트를 입력해주세요",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setCurrentGeneration(null);

    toast({
      title: "생성 중...",
      description: referenceImage 
        ? "참조 이미지를 분석하여 컴포넌트를 생성하고 있습니다..."
        : "AI가 컴포넌트를 생성하고 있습니다.",
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt, 
          style,
          referenceImage // 이미지 추가
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "생성 실패");
      }

      // Generation ID로 전체 데이터 다시 조회
      const fullGeneration = await fetch(`/api/generations/${data.id}`).then(r => r.json()).catch(() => data);

      setCurrentGeneration(fullGeneration);
      
      toast({
        title: "생성 완료!",
        description: "컴포넌트가 성공적으로 생성되었습니다.",
      });

      // 히스토리 새로고침
      loadHistory();
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다";
      
      toast({
        title: "생성 실패",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    if (!currentGeneration) return;

    const blob = new Blob([currentGeneration.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `component-${currentGeneration.id}.tsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "다운로드 완료",
      description: "코드가 다운로드되었습니다.",
    });
  };

  const loadFromHistory = (generation: Generation) => {
    setCurrentGeneration(generation);
    setPrompt(generation.prompt);
    setStyle(generation.style || "default");
    setActiveTab("preview");
    
    toast({
      title: "불러오기 완료",
      description: `"${generation.prompt.slice(0, 30)}..." 을(를) 불러왔습니다.`,
    });

    // 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-bg text-fg">
      <Toaster />
      
      {/* Header */}
      <header className="border-b border-border bg-white sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-primary">QDS Design Auto</h1>
          <p className="text-sm text-muted-foreground mt-1">
            디자인 시스템 기반 자동 컴포넌트 생성 도구
          </p>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {/* Input Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>컴포넌트 생성</CardTitle>
            <CardDescription>
              프롬프트를 입력하여 디자인 시스템 기반 React 컴포넌트를 생성하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                스타일 프리셋
              </label>
              <Select value={style} onValueChange={setStyle} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="스타일 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Dark)</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="modern">Modern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 이미지 업로드 섹션 */}
            <div className="border border-border rounded-lg p-4 bg-muted/30">
              <label className="block text-sm font-medium mb-2">
                📷 참조 이미지 (선택사항)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                비슷한 디자인의 컴포넌트를 생성하려면 이미지를 업로드하세요 (최대 5MB)
              </p>
              
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={loading}
                />
                <Button
                  onClick={() => document.getElementById("image-upload")?.click()}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  type="button"
                >
                  {referenceImage ? "📷 이미지 변경" : "📷 이미지 선택"}
                </Button>
                
                {referenceImage && (
                  <Button
                    onClick={handleRemoveImage}
                    variant="ghost"
                    size="sm"
                    disabled={loading}
                    type="button"
                  >
                    ❌ 제거
                  </Button>
                )}

                {imageFile && (
                  <span className="text-xs text-muted-foreground">
                    {imageFile.name} ({Math.round(imageFile.size / 1024)}KB)
                  </span>
                )}
              </div>
              
              {/* 이미지 미리보기 */}
              {referenceImage && (
                <div className="mt-3 relative border border-border rounded-md overflow-hidden bg-bg">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-48 object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg">
                    참조 이미지
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                프롬프트
              </label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 현대적인 로그인 폼을 만들어주세요. 이메일과 비밀번호 입력 필드, 로그인 버튼이 필요합니다."
                disabled={loading}
                className="min-h-[120px] resize-y"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {loading ? "생성 중..." : "생성하기"}
            </Button>
          </CardContent>
        </Card>

        {/* Loading Skeleton */}
        {loading && (
          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {currentGeneration && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Left: Preview & Code Tabs */}
            <Card>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "preview" | "code")}>
                <TabsList className="w-full">
                  <TabsTrigger value="preview" className="flex-1">미리보기</TabsTrigger>
                  <TabsTrigger value="code" className="flex-1">코드</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="p-4 space-y-4">
                  {/* iOS-style Preview with iPhone 14 Pro ratio (390:844) */}
                  <div className="flex justify-center bg-gradient-to-br from-muted to-bg rounded-xl p-6">
                    <div className="relative w-full max-w-[390px]">
                      {/* Screen Container - 테두리 제거 */}
                      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl" style={{ aspectRatio: "390/844" }}>
                        {/* iOS Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-12 bg-white z-50 px-6 flex items-center justify-between">
                          {/* 시간 */}
                          <div className="text-sm font-semibold text-black">
                            9:41
                          </div>
                          
                          {/* Dynamic Island 영역 (빈 공간) */}
                          <div className="flex-1"></div>
                          
                          {/* 상태 아이콘 */}
                          <div className="flex items-center gap-1">
                            {/* 신호 */}
                            <svg className="w-4 h-4" fill="black" viewBox="0 0 24 24">
                              <path d="M2 20h4v-8H2v8zm6 0h4V4H8v16zm6 0h4v-12h-4v12zm6-16v16h4V4h-4z"/>
                            </svg>
                            {/* WiFi */}
                            <svg className="w-4 h-4" fill="black" viewBox="0 0 24 24">
                              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                            </svg>
                            {/* 배터리 */}
                            <svg className="w-6 h-4" fill="none" stroke="black" strokeWidth="1.5" viewBox="0 0 24 24">
                              <rect x="2" y="6" width="18" height="12" rx="2" />
                              <path d="M20 10v4" />
                              <rect x="4" y="8" width="14" height="8" fill="black" />
                            </svg>
                          </div>
                        </div>

                        {/* 컴포넌트 영역 (Status Bar + Tab Bar 고려한 높이) */}
                        <div className="pt-12 pb-20" style={{ height: "100%" }}>
                          <DynamicPreview 
                            code={currentGeneration.code} 
                            css={currentGeneration.css}
                            className="w-full h-full overflow-auto" 
                          />
                        </div>

                        {/* 탭바 UI */}
                        <div className="absolute bottom-0 left-0 right-0 h-20 bg-white z-50">
                          <div className="flex items-center justify-around h-full px-2 border-t border-gray-200">
                            {/* Home 탭 */}
                            <div className="flex flex-col items-center justify-center flex-1 py-2">
                              <svg className="w-6 h-6 mb-1" fill="none" stroke="#ff422e" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path d="M9 22V12h6v10" />
                              </svg>
                              <span className="text-xs font-medium text-primary">ホーム</span>
                            </div>

                            {/* Search 탭 */}
                            <div className="flex flex-col items-center justify-center flex-1 py-2">
                              <svg className="w-6 h-6 mb-1" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" />
                              </svg>
                              <span className="text-xs text-gray-400">さがす</span>
                            </div>

                            {/* Sell 탭 (중앙, 강조) */}
                            <div className="flex flex-col items-center justify-center flex-1 py-2">
                              <div className="w-12 h-12 -mt-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M12 5v14M5 12h14" />
                                </svg>
                              </div>
                              <span className="text-xs text-gray-400 mt-1">出品</span>
                            </div>

                            {/* Notifications 탭 */}
                            <div className="flex flex-col items-center justify-center flex-1 py-2">
                              <svg className="w-6 h-6 mb-1" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
                              </svg>
                              <span className="text-xs text-gray-400">お知らせ</span>
                            </div>

                            {/* My Page 탭 */}
                            <div className="flex flex-col items-center justify-center flex-1 py-2">
                              <svg className="w-6 h-6 mb-1" fill="none" stroke="#9CA3AF" strokeWidth="2" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                              </svg>
                              <span className="text-xs text-gray-400">マイページ</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Device Label */}
                      <div className="text-center mt-3 text-xs text-muted-foreground">
                        iPhone 14 Pro (390 × 844)
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="p-4 space-y-4">
                  <pre className="bg-bg text-fg p-4 rounded-lg overflow-x-auto text-xs border border-border min-h-[500px] max-h-[500px] overflow-y-auto font-mono">
                    <code>{currentGeneration.code}</code>
                  </pre>
                  <Button
                    onClick={downloadCode}
                    variant="secondary"
                    className="w-full"
                  >
                    📥 코드 다운로드 (.tsx)
                  </Button>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Right: Info & Screenshot */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>생성 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">ID</dt>
                    <dd className="text-sm font-mono mt-1 break-all">{currentGeneration.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">프롬프트</dt>
                    <dd className="text-sm mt-1">{currentGeneration.prompt}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">스타일</dt>
                    <dd className="text-sm mt-1">{currentGeneration.style || "default"}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">상태</dt>
                    <dd className="text-sm mt-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        currentGeneration.status === "completed"
                          ? "bg-green-500/20 text-green-700"
                          : "bg-primary/20 text-primary"
                      }`}>
                        {currentGeneration.status}
                      </span>
                    </dd>
                  </div>
                </CardContent>
              </Card>

              {currentGeneration.screenshot_url && (
                <Card>
                  <CardHeader>
                    <CardTitle>스크린샷</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <img
                      src={currentGeneration.screenshot_url}
                      alt="Component Screenshot"
                      className="w-full rounded-lg border border-border"
                    />
                    <Button
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <a href={currentGeneration.screenshot_url} download>
                        🖼️ 이미지 다운로드
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* History Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>히스토리</CardTitle>
                <CardDescription>
                  최근 생성된 컴포넌트 목록 {history.length > 0 && `(${history.length}개)`}
                </CardDescription>
              </div>
              {history.length > 0 && (
                <Button
                  onClick={handleDeleteAll}
                  size="sm"
                  className="shrink-0 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  전체 삭제
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">아직 생성된 컴포넌트가 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">위에서 프롬프트를 입력하여 컴포넌트를 생성해보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {history.map((gen) => (
                  <div
                    key={gen.id}
                    className="group relative bg-white hover:bg-gray-50 rounded-lg border border-border overflow-hidden transition-all hover:scale-105 cursor-pointer shadow-sm"
                    onClick={() => loadFromHistory(gen)}
                  >
                    {/* Header: 프롬프트 + 뱃지 + 삭제 버튼 */}
                    <div className="relative p-3 bg-white border-b border-gray-100">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium line-clamp-2 flex-1 pr-2">
                          {gen.prompt}
                        </p>
                        
                        {/* Status Badge */}
                        <span
                          className={`flex-shrink-0 text-xs px-2 py-1 rounded font-medium ${
                            gen.status === "completed"
                              ? "bg-green-500/20 text-green-700"
                              : gen.status === "failed"
                              ? "bg-red-500/20 text-red-700"
                              : "bg-gray-500/20 text-gray-700"
                          }`}
                        >
                          {gen.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(gen.created_at).toLocaleDateString("ko-KR", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        
                        {/* Delete Button (hover시 표시) */}
                        <button
                          onClick={(e) => handleDelete(e, gen.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 hover:bg-gray-800 text-white rounded px-2 py-1 text-xs font-medium shadow-sm"
                          title="삭제"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* Preview with Gradient Fade */}
                    <div className="relative bg-gray-200 overflow-hidden" style={{ height: '240px' }}>
                      {gen.status === "completed" && gen.code ? (
                        <>
                          <div className="w-full h-full overflow-hidden">
                            <DynamicPreview 
                              code={gen.code}
                              css={gen.css}
                              className="w-full h-full origin-top pointer-events-none"
                              style={{ transform: 'scale(0.35)', transformOrigin: 'top center', width: '285%', height: '285%' }}
                            />
                          </div>
                          {/* White Gradient Fade */}
                          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none"></div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-center text-muted-foreground bg-gray-50">
                          <div>
                            <div className="text-sm mb-1">
                              {gen.status === "completed" ? "미리보기 없음" : "생성 중..."}
                            </div>
                            <div className="text-xs opacity-70">
                              {gen.status === "completed" ? "클릭하여 보기" : gen.status}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
