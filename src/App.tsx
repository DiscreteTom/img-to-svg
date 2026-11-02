import {
  ArrowDown,
  Check,
  Copy,
  Download,
  FileImage,
  ImageIcon,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ComparisonViewer,
  type PreviewMode,
} from "./components/ComparisonViewer";
import { SettingsPanel } from "./components/SettingsPanel";
import {
  MAX_FILE_BYTES,
  copyText,
  downloadSvg,
  filenameStem,
  formatBytes,
  isSupportedImage,
  prepareImage,
  type SourceImage,
} from "./lib/image";
import { createSampleImage } from "./lib/sample";
import { disposeVectorizer, vectorizeImage } from "./lib/vectorizer";
import {
  DEFAULT_SETTINGS,
  buildTracerOptions,
  type TraceSettings,
} from "./vector-settings";

type ProgressPhase = "segment" | "compose" | "optimize";

interface UiMessage {
  key: string;
  values?: Record<string, string>;
}

function App() {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeJobRef = useRef(0);
  const noticeTimerRef = useRef<number | null>(null);

  const [source, setSource] = useState<SourceImage | null>(null);
  const [svg, setSvg] = useState("");
  const [svgUrl, setSvgUrl] = useState("");
  const [settings, setSettings] = useState<TraceSettings>(DEFAULT_SETTINGS);
  const [resultSettingsKey, setResultSettingsKey] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<ProgressPhase>("segment");
  const [error, setError] = useState<UiMessage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("compare");
  const [split, setSplit] = useState(52);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [loadingSample, setLoadingSample] = useState(false);

  const settingsKey = useMemo(() => JSON.stringify(settings), [settings]);
  const isDirty = Boolean(svg) && resultSettingsKey !== settingsKey;

  const svgPathCount = useMemo(
    () => (svg.match(/<path\b/gi) ?? []).length,
    [svg],
  );

  useEffect(() => {
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      t("meta.description"),
    );
  }, [i18n.resolvedLanguage, t]);

  useEffect(() => {
    return () => {
      activeJobRef.current += 1;
      disposeVectorizer();
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (source) URL.revokeObjectURL(source.url);
    };
  }, [source]);

  useEffect(() => {
    if (!svg) {
      setSvgUrl("");
      return;
    }

    const url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml;charset=utf-8" }),
    );
    setSvgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svg]);

  async function acceptFile(file: File): Promise<void> {
    setError(null);
    setNotice("");

    if (!isSupportedImage(file)) {
      setError({ key: "errors.unsupportedFile" });
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError({ key: "errors.fileTooLarge" });
      return;
    }

    activeJobRef.current += 1;
    disposeVectorizer();
    setIsConverting(false);

    try {
      const nextSource = await prepareImage(file);
      setSource(nextSource);
      setSvg("");
      setSvgUrl("");
      setPreviewMode("compare");
      setSplit(52);
      setProgress(0);
      setResultSettingsKey("");
    } catch (fileError) {
      setError({
        key: "errors.imageLoad",
        values:
          fileError instanceof Error
            ? { message: fileError.message }
            : undefined,
      });
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void acceptFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void acceptFile(file);
  }

  async function handleSample() {
    setLoadingSample(true);
    setError(null);
    try {
      await acceptFile(await createSampleImage());
    } catch (sampleError) {
      setError({
        key: "errors.sampleLoad",
        values:
          sampleError instanceof Error
            ? { message: sampleError.message }
            : undefined,
      });
    } finally {
      setLoadingSample(false);
    }
  }

  async function handleConvert() {
    if (!source || isConverting) return;

    const settingsSnapshot = { ...settings };
    const generation = ++activeJobRef.current;
    setError(null);
    setNotice("");
    setIsConverting(true);
    setProgress(2);
    setPhase("segment");

    try {
      const options = buildTracerOptions(settingsSnapshot, (event) => {
        if (generation !== activeJobRef.current) return;
        setPhase(event.phase);
        const total =
          event.phase === "segment"
            ? event.fraction * 0.72
            : event.phase === "compose"
              ? 0.72 + event.fraction * 0.2
              : 0.92 + event.fraction * 0.08;
        setProgress(Math.min(100, Math.max(2, Math.round(total * 100))));
      });

      const nextSvg = await vectorizeImage(source.file, options);
      if (generation !== activeJobRef.current) return;

      setSvg(nextSvg);
      setResultSettingsKey(JSON.stringify(settingsSnapshot));
      setProgress(100);
      setPhase("optimize");
      showNotice("notices.svgGenerated");
    } catch (conversionError) {
      if (generation !== activeJobRef.current) return;
      disposeVectorizer();
      setError(
        conversionError instanceof Error
          ? {
              key: "errors.conversionFailed",
              values: { message: conversionError.message },
            }
          : { key: "errors.conversionRetry" },
      );
    } finally {
      if (generation === activeJobRef.current) setIsConverting(false);
    }
  }

  function cancelConversion() {
    activeJobRef.current += 1;
    disposeVectorizer();
    setIsConverting(false);
    setProgress(0);
    showNotice("notices.conversionStopped");
  }

  async function handleCopy() {
    try {
      await copyText(svg);
      setCopied(true);
      showNotice("notices.svgCopied");
      window.setTimeout(() => setCopied(false), 1800);
    } catch (copyError) {
      setError({ key: "errors.copyFailed" });
    }
  }

  function handleDownload() {
    if (!source || !svg) return;
    downloadSvg(svg, `${filenameStem(source.file.name)}-vector.svg`);
    showNotice("notices.downloadStarted");
  }

  function resetWorkspace() {
    activeJobRef.current += 1;
    disposeVectorizer();
    setSource(null);
    setSvg("");
    setError(null);
    setNotice("");
    setIsConverting(false);
    setProgress(0);
  }

  function showNotice(key: string) {
    setNotice(key);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 2600);
  }

  const progressLabel = t(`progress.${phase}`);
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;

  return (
    <div className="site-shell">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#" aria-label={t("app.homeLabel")}>
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>img-to-svg</span>
        </a>
        <div className="topbar-meta">
          <span className="local-chip">
            <LockKeyhole size={13} aria-hidden="true" />
            {t("topbar.localProcessing")}
          </span>
          <div className="language-switch" aria-label={t("language.label")}>
            <button
              type="button"
              className={activeLanguage === "en" ? "is-active" : ""}
              aria-pressed={activeLanguage === "en"}
              title={t("language.switchToEnglish")}
              data-language="en"
              onClick={() => void i18n.changeLanguage("en")}
            >
              {t("language.english")}
            </button>
            <span aria-hidden="true" />
            <button
              type="button"
              className={activeLanguage === "zh-CN" ? "is-active" : ""}
              aria-pressed={activeLanguage === "zh-CN"}
              title={t("language.switchToChinese")}
              data-language="zh-CN"
              onClick={() => void i18n.changeLanguage("zh-CN")}
            >
              {t("language.chinese")}
            </button>
          </div>
        </div>
      </header>

      <main className="simple-main">
        <section className="converter-card" id="converter">
          <div className="converter-heading">
            <div>
              <span className="section-number">{t("converter.section")}</span>
              <h2>{t("converter.heading")}</h2>
            </div>
            <span className="engine-badge">
              <Sparkles size={14} aria-hidden="true" />
              {t("converter.engine")}
            </span>
          </div>

          <div className="converter-grid">
            <div className="preview-panel">
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-label={t("converter.fileInput")}
                onChange={handleFileInput}
              />

              {!source ? (
                <div
                  className={`dropzone${isDragging ? " is-dragging" : ""}`}
                  onDragEnter={() => setIsDragging(true)}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => {
                    if (event.currentTarget === event.target) {
                      setIsDragging(false);
                    }
                  }}
                  onDrop={handleDrop}
                >
                  <span className="dropzone-orbit" aria-hidden="true">
                    <ImageIcon size={32} strokeWidth={1.4} />
                  </span>
                  <div>
                    <h3>{t("converter.dropTitle")}</h3>
                    <p>{t("converter.dropDescription")}</p>
                  </div>
                  <div className="dropzone-actions">
                    <button
                      className="primary-small-button"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} aria-hidden="true" />
                      {t("converter.chooseImage")}
                    </button>
                    <button
                      className="text-button"
                      type="button"
                      disabled={loadingSample}
                      onClick={() => void handleSample()}
                    >
                      {loadingSample ? (
                        <LoaderCircle className="spin" size={14} />
                      ) : null}
                      {t("converter.trySample")}
                    </button>
                  </div>
                  <div className="dropzone-formats">
                    <span>PNG</span>
                    <span>JPG</span>
                    <span>WEBP</span>
                  </div>
                </div>
              ) : (
                <div className="loaded-preview">
                  <div className="file-toolbar">
                    <div className="file-summary">
                      <span className="file-icon">
                        <FileImage size={17} aria-hidden="true" />
                      </span>
                      <span>
                        <strong title={source.file.name}>
                          {source.file.name}
                        </strong>
                        <small>
                          {source.width} × {source.height} ·{" "}
                          {formatBytes(source.file.size)}
                        </small>
                      </span>
                    </div>
                    <button
                      className="replace-button"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t("converter.replaceImage")}
                    </button>
                  </div>

                  {svg && svgUrl ? (
                    <ComparisonViewer
                      sourceUrl={source.url}
                      sourceAlt={t("converter.sourceImageAlt", {
                        name: source.file.name,
                      })}
                      svgUrl={svgUrl}
                      split={split}
                      mode={previewMode}
                      onSplitChange={setSplit}
                      onModeChange={setPreviewMode}
                    />
                  ) : (
                    <div className="source-preview">
                      <img
                        src={source.url}
                        alt={t("converter.selectedImageAlt", {
                          name: source.file.name,
                        })}
                        draggable={false}
                      />
                      {isConverting && (
                        <>
                          <div className="scan-line" aria-hidden="true" />
                          <div className="conversion-overlay">
                            <span className="conversion-spinner">
                              <LoaderCircle
                                className="spin"
                                size={23}
                                aria-hidden="true"
                              />
                            </span>
                            <strong>{progressLabel}</strong>
                            <span>{progress}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {svg && (
                    <div className="result-meta">
                      <div className="result-stats">
                        <span>
                          <strong>{formatBytes(new Blob([svg]).size)}</strong>
                          {t("stats.svgSize")}
                        </span>
                        <span>
                          <strong>{svgPathCount}</strong>
                          {t("stats.vectorPaths")}
                        </span>
                        <span>
                          <strong>100%</strong>
                          {t("stats.scalable")}
                        </span>
                      </div>
                      <div className="result-actions">
                        <button
                          type="button"
                          onClick={() => void handleCopy()}
                        >
                          {copied ? (
                            <Check size={16} aria-hidden="true" />
                          ) : (
                            <Copy size={16} aria-hidden="true" />
                          )}
                          {copied
                            ? t("converter.copied")
                            : t("converter.copySvg")}
                        </button>
                        <button
                          className="download-button"
                          type="button"
                          onClick={handleDownload}
                        >
                          <Download size={16} aria-hidden="true" />
                          {t("converter.downloadSvg")}
                        </button>
                      </div>
                    </div>
                  )}

                  {!svg && !isConverting && (
                    <div className="preview-empty-note">
                      <span>
                        <ArrowDown size={14} aria-hidden="true" />
                      </span>
                      {t("converter.emptyHint")}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="error-banner" role="alert">
                  <span>!</span>
                  {t(error.key, error.values)}
                </div>
              )}

              {isDirty && !isConverting && (
                <div className="dirty-note">
                  {t("converter.dirtyHint")}
                </div>
              )}
            </div>

            <SettingsPanel
              settings={settings}
              sourceReady={Boolean(source)}
              isConverting={isConverting}
              isDirty={isDirty}
              hasResult={Boolean(svg)}
              progress={progress}
              progressLabel={progressLabel}
              onChange={setSettings}
              onConvert={() => void handleConvert()}
              onCancel={cancelConversion}
            />
          </div>

          <div className="converter-footer">
            <span>
              <LockKeyhole size={13} aria-hidden="true" />
              {t("converter.localMemory")}
            </span>
            <button type="button" onClick={resetWorkspace}>
              <RotateCcw size={13} aria-hidden="true" />
              {t("converter.clearWorkspace")}
            </button>
          </div>
        </section>
      </main>

      <div
        className={`toast${notice ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        <Check size={15} aria-hidden="true" />
        {notice ? t(notice) : ""}
      </div>
    </div>
  );
}

export default App;
