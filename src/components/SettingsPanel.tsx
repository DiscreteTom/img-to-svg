import {
  Camera,
  ChevronDown,
  LoaderCircle,
  PenTool,
  Shapes,
  SlidersHorizontal,
  WandSparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PRESETS,
  type PresetId,
  type TraceSettings,
} from "../vector-settings";

const PRESET_ICONS = {
  artwork: Shapes,
  photo: Camera,
  lines: PenTool,
};

interface SettingsPanelProps {
  settings: TraceSettings;
  sourceReady: boolean;
  isConverting: boolean;
  isDirty: boolean;
  hasResult: boolean;
  progress: number;
  progressLabel: string;
  onChange: (settings: TraceSettings) => void;
  onConvert: () => void;
  onCancel: () => void;
}

export function SettingsPanel({
  settings,
  sourceReady,
  isConverting,
  isDirty,
  hasResult,
  progress,
  progressLabel,
  onChange,
  onConvert,
  onCancel,
}: SettingsPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { t } = useTranslation();

  function update<K extends keyof TraceSettings>(
    key: K,
    value: TraceSettings[K],
  ) {
    onChange({ ...settings, [key]: value });
  }

  const activePreset = PRESETS.find(
    (preset) =>
      preset.settings.preset === settings.preset &&
      preset.settings.clustering === settings.clustering &&
      preset.settings.maxColors === settings.maxColors &&
      preset.settings.filterSpeckle === settings.filterSpeckle,
  )?.id;

  return (
    <aside className="settings-panel" aria-label={t("settings.aria")}>
      <div className="settings-heading">
        <div>
          <span className="step-kicker">02</span>
          <h2>{t("settings.title")}</h2>
        </div>
        <SlidersHorizontal size={18} aria-hidden="true" />
      </div>

      <div
        className="preset-list"
        role="radiogroup"
        aria-label={t("settings.presetsAria")}
      >
        {PRESETS.map((preset) => {
          const Icon = PRESET_ICONS[preset.id as PresetId];
          const selected = activePreset === preset.id;
          return (
            <button
              className={`preset-card${selected ? " is-selected" : ""}`}
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(preset.settings)}
            >
              <span className="preset-icon">
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="preset-copy">
                <strong>{t(`presets.${preset.id}.label`)}</strong>
                <small>{t(`presets.${preset.id}.description`)}</small>
              </span>
              <span className="preset-check" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="settings-divider" />

      <div className="field-heading">
        <span>{t("settings.geometry")}</span>
        <span className="field-hint">{t("settings.geometryHint")}</span>
      </div>
      <div
        className="segmented-control"
        aria-label={t("settings.geometryMode")}
      >
        {(["pixel", "polygon", "spline"] as const).map((value) => (
          <button
            className={settings.mode === value ? "is-active" : ""}
            key={value}
            type="button"
            aria-pressed={settings.mode === value}
            onClick={() => update("mode", value)}
          >
            {t(`settings.geometryOptions.${value}`)}
          </button>
        ))}
      </div>

      <div className="quick-controls">
        <RangeField
          label={t("settings.colorCount")}
          value={settings.maxColors}
          min={2}
          max={32}
          step={1}
          suffix=""
          disabled={settings.clustering === "binary"}
          onChange={(value) => update("maxColors", value)}
        />
        <RangeField
          label={t("settings.speckleFilter")}
          value={settings.filterSpeckle}
          min={0}
          max={16}
          step={1}
          suffix="px"
          onChange={(value) => update("filterSpeckle", value)}
        />
      </div>

      <button
        className={`advanced-toggle${advancedOpen ? " is-open" : ""}`}
        type="button"
        aria-expanded={advancedOpen}
        onClick={() => setAdvancedOpen((open) => !open)}
      >
        <span>{t("settings.advanced")}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>

      {advancedOpen && (
        <div className="advanced-controls">
          <RangeField
            label={t("settings.cornerThreshold")}
            value={settings.cornerThreshold}
            min={0}
            max={120}
            step={1}
            suffix="°"
            onChange={(value) => update("cornerThreshold", value)}
          />
          <RangeField
            label={t("settings.curveSimplify")}
            value={settings.simplify}
            min={0}
            max={3}
            step={0.1}
            suffix="px"
            disabled={settings.mode !== "spline"}
            onChange={(value) => update("simplify", value)}
          />
          <div className="select-grid">
            <label>
              <span>{t("settings.maxDimension")}</span>
              <select
                value={settings.maxDimension}
                onChange={(event) =>
                  update("maxDimension", Number(event.target.value))
                }
              >
                <option value={800}>{t("settings.dimensions.fast")}</option>
                <option value={1200}>
                  {t("settings.dimensions.balanced")}
                </option>
                <option value={1600}>
                  {t("settings.dimensions.detailed")}
                </option>
                <option value={2200}>
                  {t("settings.dimensions.maximum")}
                </option>
              </select>
            </label>
            <label>
              <span>{t("settings.optimization")}</span>
              <select
                value={settings.optimize}
                onChange={(event) =>
                  update(
                    "optimize",
                    Number(event.target.value) as TraceSettings["optimize"],
                  )
                }
              >
                <option value={0}>
                  {t("settings.optimizationOptions.off")}
                </option>
                <option value={1}>
                  {t("settings.optimizationOptions.standard")}
                </option>
                <option value={2}>
                  {t("settings.optimizationOptions.maximum")}
                </option>
              </select>
            </label>
          </div>
          {settings.clustering === "binary" && (
            <label className="switch-row">
              <span>
                <strong>{t("settings.adaptiveThreshold")}</strong>
                <small>{t("settings.adaptiveThresholdHint")}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.binaryAdaptive}
                onChange={(event) =>
                  update("binaryAdaptive", event.target.checked)
                }
              />
            </label>
          )}
        </div>
      )}

      <div className="convert-actions">
        <button
          className="convert-button"
          type="button"
          disabled={!sourceReady || isConverting}
          onClick={onConvert}
        >
          {isConverting ? (
            <>
              <LoaderCircle
                className="spin"
                size={19}
                aria-hidden="true"
              />
              <span>{progressLabel}</span>
              <span className="inline-progress">{progress}%</span>
            </>
          ) : (
            <>
              <WandSparkles size={19} aria-hidden="true" />
              <span>
                {hasResult
                  ? isDirty
                    ? t("settings.applySettings")
                    : t("settings.convertAgain")
                  : t("settings.convert")}
              </span>
            </>
          )}
          {isConverting && (
            <span className="button-progress" aria-hidden="true">
              <span style={{ width: `${progress}%` }} />
            </span>
          )}
        </button>
        {isConverting && (
          <button className="cancel-button" type="button" onClick={onCancel}>
            <X size={15} aria-hidden="true" />
            {t("settings.stop")}
          </button>
        )}
      </div>

      <p className="privacy-note">{t("settings.privacy")}</p>
    </aside>
  );
}

interface RangeFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  disabled = false,
  onChange,
}: RangeFieldProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <label className={`range-field${disabled ? " is-disabled" : ""}`}>
      <span className="range-heading">
        <span>{label}</span>
        <output>
          {value}
          {suffix}
        </output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{ "--range-progress": `${percent}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
