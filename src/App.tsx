import { useState, useEffect, useCallback, useMemo } from "react";
import { LoginScreen, useAuth } from "./auth";
import { TextDisplay } from "./components/TextDisplay";
import { TitleBar } from "./components/TitleBar";
import { LibraryScreen } from "./components/LibraryScreen";
import { TextInputView } from "./components/TextInputView";
import { ProcessingState } from "./components/ProcessingState";
import { ManageTagsDialog } from "./components/ManageTagsDialog";
import { WordCommentDialog } from "./components/WordCommentDialog";
import { CommentsPanel } from "./components/CommentsPanel";
import { CalendarScreen, visibleMonthRange } from "./components/CalendarScreen";
import { DateSessionsPanel } from "./components/DateSessionsPanel";
import { SessionDialog } from "./components/SessionDialog";
import { SyncSizeIndicator } from "./components/SyncSizeIndicator";
import { useIdentity } from "./hooks/useIdentity";
import { useSessions } from "./hooks/useSessions";
import type { SessionMutation } from "./hooks/useSessions";
import { clearSyncState } from "./utils/syncDirty";
import { markCommentRead } from "./utils/readComments";
import { todayInZone } from "./utils/dateTimeFormat";
import { usePinyinVisibility } from "./hooks/usePinyinVisibility";
import { useTextZoom } from "./hooks/useTextZoom";
import { useTheme } from "./hooks/useTheme";
import { useColorPalette } from "./hooks/useColorPalette";
import { useTextLoader } from "./hooks/useTextLoader";
import { useElapsedTime } from "./hooks/useElapsedTime";

function App() {
  const { state: authState } = useAuth();
  if (authState.status === "locked") {
    return <LoginScreen />;
  }
  const isAuthorizedDevice = authState.role === "pierre";
  return <AuthedApp isAuthorizedDevice={isAuthorizedDevice} />;
}

interface AuthedAppProps {
  isAuthorizedDevice: boolean;
}

function AuthedApp({ isAuthorizedDevice }: AuthedAppProps) {
  const {
    previews,
    activeText,
    isLoading,
    appView,
    setView,
    createText,
    openText,
    updatePinyin,
    splitSegment,
    mergeSegments,
    updateComment,
    toggleLock,
    deleteText,
    refreshPreviews,
    isProcessing,
    processingError,
    tags,
    refreshTags,
    filterTagIds,
    setFilterTagIds,
    sortAsc,
    toggleSort,
  } = useTextLoader();
  const [pinyinVisible, setPinyinVisible] = usePinyinVisibility();
  const { zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom } = useTextZoom();
  const [theme, toggleTheme] = useTheme();
  const { paletteId, setPalette, palettes } = useColorPalette();
  const { formatted: elapsedTime } = useElapsedTime(isProcessing);
  const [showManageTags, setShowManageTags] = useState(false);
  const [commentDialogSegIndex, setCommentDialogSegIndex] = useState<number | null>(null);
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false);
  const identity = useIdentity(isAuthorizedDevice ? "pierre" : "common");
  // syncConfigured is always true in the PWA — credentials are loaded via
  // AuthProvider before this component renders.
  const syncConfigured = true;

  // Calendar state — hoisted so the panel can outlive grid cell renders.
  const today = useMemo(() => todayInZone(identity.timeZone), [identity.timeZone]);
  const [calendarYearMonth, setCalendarYearMonth] = useState<{ year: number; month: number }>(() => {
    const [y, mo] = today.split("-").map(Number);
    return { year: y, month: mo };
  });
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string | null>(null);
  const [sessionDialogState, setSessionDialogState] = useState<
    { mode: "create"; defaultDate: string } | { mode: "edit"; sessionId: number } | null
  >(null);
  const {
    sessions: calendarSessions,
    loadRange: loadSessionsRange,
    createSession,
    updateSession,
    deleteSession,
    refresh: refreshSessions,
  } = useSessions();

  // Suppress Space key on all buttons — Enter is the only activation key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " && e.target instanceof HTMLButtonElement) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Suppress default browser context menu on right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);


  const handleAddText = useCallback(() => {
    setView("input");
  }, [setView]);

  const handleSubmit = useCallback((title: string, rawInput: string) => {
    createText(title, rawInput);
  }, [createText]);

  const handleCancel = useCallback(() => {
    setView("library");
  }, [setView]);

  const handleBack = useCallback(() => {
    refreshPreviews();
    setView("library");
  }, [setView, refreshPreviews]);

  const handleShowPinyin = useCallback(() => {
    setPinyinVisible(true);
  }, [setPinyinVisible]);

  const handleTagsChanged = useCallback(async () => {
    await refreshTags();
    await refreshPreviews();
  }, [refreshTags, refreshPreviews]);

  const handleCloseManageTags = useCallback(() => {
    setShowManageTags(false);
    // Clean up filter if any selected tag was deleted
    setFilterTagIds((prev) => prev.filter((id) => tags.some((t) => t.id === id)));
  }, [tags, setFilterTagIds]);

  const handleDataImportComplete = useCallback(async () => {
    clearSyncState();
    await refreshTags();
    await refreshPreviews();
    await refreshSessions();
    setFilterTagIds([]);
  }, [refreshTags, refreshPreviews, refreshSessions, setFilterTagIds]);

  const handleDataResetComplete = useCallback(async () => {
    clearSyncState();
    await refreshTags();
    await refreshPreviews();
    await refreshSessions();
    setFilterTagIds([]);
  }, [refreshTags, refreshPreviews, refreshSessions, setFilterTagIds]);

  const handleSyncPullComplete = useCallback(async () => {
    await refreshTags();
    await refreshPreviews();
    await refreshSessions();
    setFilterTagIds([]);
    if (appView === "reading") setView("library");
  }, [refreshTags, refreshPreviews, refreshSessions, setFilterTagIds, appView, setView]);

  const handleToggleCalendarView = useCallback(() => {
    setView(appView === "calendar" ? "library" : "calendar");
  }, [appView, setView]);

  // Load sessions for the visible month + adjacent overflow whenever the
  // calendar view is active or the month/year changes.
  useEffect(() => {
    if (appView !== "calendar") return;
    const { from, to } = visibleMonthRange(calendarYearMonth.year, calendarYearMonth.month);
    loadSessionsRange(from, to).catch((err) => console.error("Failed to load sessions:", err));
  }, [appView, calendarYearMonth, loadSessionsRange]);

  const handleCalendarSelectDate = useCallback((date: string) => {
    setCalendarSelectedDate(date);
  }, []);

  const panelDate = calendarSelectedDate ?? today;

  const handleAddSessionFromPanel = useCallback(() => {
    setSessionDialogState({ mode: "create", defaultDate: panelDate });
  }, [panelDate]);

  const handleEditSessionFromPanel = useCallback((id: number) => {
    setSessionDialogState({ mode: "edit", sessionId: id });
  }, []);

  const handleCloseSessionDialog = useCallback(() => {
    setSessionDialogState(null);
  }, []);

  const handleSessionSave = useCallback(
    async (id: number | null, input: SessionMutation) => {
      if (id == null) {
        await createSession(input, identity.name);
      } else {
        await updateSession(id, input);
      }
      setSessionDialogState(null);
    },
    [createSession, updateSession, identity.name],
  );

  const handleSessionDelete = useCallback(
    async (id: number) => {
      await deleteSession(id);
      setSessionDialogState(null);
    },
    [deleteSession],
  );

  const handleToggleSessionDone = useCallback(
    async (id: number) => {
      const s = calendarSessions.find((x) => x.id === id);
      if (!s) return;
      await updateSession(id, {
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        kind: s.kind,
        done: !s.done,
        notes: s.notes,
        textIds: s.textIds,
      });
    },
    [calendarSessions, updateSession],
  );

  const editingSession =
    sessionDialogState?.mode === "edit"
      ? calendarSessions.find((s) => s.id === sessionDialogState.sessionId) ?? null
      : null;

  // Default comments panel state: open if text has comments
  useEffect(() => {
    if (activeText) {
      const hasComments = activeText.segments.some(
        (seg) => seg.type === "word" && !!seg.word.comment,
      );
      setCommentsPanelOpen(hasComments);
    }
  }, [activeText?.id]);

  const handleOpenCommentDialog = useCallback((segmentIndex: number) => {
    if (activeText) {
      const seg = activeText.segments[segmentIndex];
      if (seg?.type === "word" && seg.word.commentAt) {
        markCommentRead(activeText.id, segmentIndex, seg.word.commentAt);
      }
    }
    setCommentDialogSegIndex(segmentIndex);
  }, [activeText]);

  const handleCommentSave = useCallback(async (segmentIndex: number, comment: string | null) => {
    await updateComment(segmentIndex, comment, identity.name);
    setCommentDialogSegIndex(null);
  }, [updateComment, identity.name]);

  const handleCommentClose = useCallback(() => {
    setCommentDialogSegIndex(null);
  }, []);

  const showBack = appView === "reading";

  const renderContent = () => {
    if (isLoading) return null;

    switch (appView) {
      case "library":
        return (
          <LibraryScreen
            previews={previews}
            onOpenText={openText}
            onDeleteText={deleteText}
            onToggleLock={toggleLock}
            tags={tags}
            onTagsChanged={handleTagsChanged}
            filterActive={filterTagIds.length > 0}
            isAuthorizedDevice={isAuthorizedDevice}
            timeZone={identity.timeZone}
          />
        );
      case "input":
        return (
          <div className="bg-surface text-content h-screen pt-16 pb-4 flex flex-col">
            <TextInputView
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        );
      case "processing":
        return (
          <div className="bg-surface text-content h-screen pt-24 pb-12 flex flex-col">
            <ProcessingState
              isProcessing={isProcessing}
              error={processingError}
              elapsedTime={elapsedTime}
              onProcess={handleCancel}
              onRetry={handleCancel}
              onEdit={handleCancel}
            />
          </div>
        );
      case "calendar":
        return (
          <div className="bg-surface text-content h-screen flex pt-12">
            <div className="flex-1 min-w-0 overflow-y-auto" style={{ direction: "rtl" }}>
              <div style={{ direction: "ltr" }}>
                <CalendarScreen
                  year={calendarYearMonth.year}
                  month={calendarYearMonth.month}
                  onChangeYearMonth={(year, month) => setCalendarYearMonth({ year, month })}
                  sessions={calendarSessions}
                  selectedDate={calendarSelectedDate}
                  onSelectDate={handleCalendarSelectDate}
                  timeZone={identity.timeZone}
                />
              </div>
            </div>
            <DateSessionsPanel
              date={panelDate}
              sessions={calendarSessions}
              texts={previews}
              onAddSession={handleAddSessionFromPanel}
              onEditSession={handleEditSessionFromPanel}
              onToggleDone={handleToggleSessionDone}
              timeZone={identity.timeZone}
            />
          </div>
        );
      case "reading":
        return (
          <div className="bg-surface text-content h-screen flex pt-12">
            {/* direction:rtl on the scroll container puts its scrollbar on the
                left edge (text area's inner left); direction:ltr on the inner
                wrapper restores normal reading flow. */}
            <div className="flex-1 min-w-0 overflow-y-auto" style={{ direction: "rtl" }}>
              <div className="px-2 lg:px-8 pt-12 pb-12 flex justify-center" style={{ direction: "ltr" }}>
                <div className="max-w-5xl flex-1 min-w-0">
                  {activeText && (
                    <TextDisplay text={activeText} showPinyin={pinyinVisible} zoomLevel={zoomLevel} onPinyinEdit={updatePinyin} onShowPinyin={handleShowPinyin} onSplitSegment={splitSegment} onMergeSegments={mergeSegments} onComment={handleOpenCommentDialog} />
                  )}
                </div>
              </div>
            </div>
            {activeText && (
              <CommentsPanel
                textId={activeText.id}
                segments={activeText.segments}
                isOpen={commentsPanelOpen}
                onToggle={() => setCommentsPanelOpen((prev) => !prev)}
                onCommentClick={handleOpenCommentDialog}
                locked={activeText.locked}
                timeZone={identity.timeZone}
              />
            )}
          </div>
        );
    }
  };

  return (
    <>
      <TitleBar
        appView={appView}
        pinyinVisible={pinyinVisible}
        onPinyinToggle={setPinyinVisible}
        zoomLevel={zoomLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        isMinZoom={isMinZoom}
        isMaxZoom={isMaxZoom}
        palettes={palettes}
        selectedPaletteId={paletteId}
        onPaletteSelect={setPalette}
        theme={theme}
        onThemeToggle={toggleTheme}
        onBack={handleBack}
        showBack={showBack}
        rawInput={activeText?.rawInput ?? ""}
        onAddText={handleAddText}
        titleText={
          appView === "reading"
            ? activeText?.title ?? ""
            : appView === "calendar"
            ? "Calendar"
            : "Library"
        }
        onManageTags={() => setShowManageTags(true)}
        tags={tags}
        filterTagIds={filterTagIds}
        onFilterTagIds={setFilterTagIds}
        sortAsc={sortAsc}
        onToggleSort={toggleSort}
        onDataImportComplete={handleDataImportComplete}
        onDataResetComplete={handleDataResetComplete}
        isAuthorizedDevice={isAuthorizedDevice}
        syncConfigured={syncConfigured}
        onSyncPullComplete={handleSyncPullComplete}
        onToggleCalendarView={handleToggleCalendarView}
        identityName={identity.name}
        identityTimeZone={identity.timeZone}
      />
      {renderContent()}
      <ManageTagsDialog
        open={showManageTags}
        onClose={handleCloseManageTags}
        tags={tags}
        onTagsChanged={handleTagsChanged}
      />
      {activeText && commentDialogSegIndex !== null && (() => {
        const seg = activeText.segments[commentDialogSegIndex];
        const word = seg?.type === "word" ? seg.word : null;
        return (
          <WordCommentDialog
            open={true}
            word={word}
            segmentIndex={commentDialogSegIndex}
            textId={activeText.id}
            onSave={handleCommentSave}
            onClose={handleCommentClose}
          />
        );
      })()}
      {sessionDialogState && (
        <SessionDialog
          open
          session={editingSession}
          defaultDate={
            sessionDialogState.mode === "create" ? sessionDialogState.defaultDate : panelDate
          }
          texts={previews}
          onSave={handleSessionSave}
          onDelete={handleSessionDelete}
          onClose={handleCloseSessionDialog}
          timeZone={identity.timeZone}
        />
      )}
      <SyncSizeIndicator />
    </>
  );
}

export default App;
