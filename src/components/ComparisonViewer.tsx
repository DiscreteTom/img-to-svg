import { ImageIcon, SplitSquareHorizontal } from "lucide-react";

export type PreviewMode = "compare" | "source" | "vector";

interface ComparisonViewerProps {
  sourceUrl: string;
  sourceAlt: string;
  svgUrl: string;
  split: number;
  mode: PreviewMode;
  onSplitChange: (value: number) => void;
  onModeChange: (mode: PreviewMode) => void;
}

export function ComparisonViewer({
  sourceUrl,
  sourceAlt,
  svgUrl,
  split,
  mode,
  onSplitChange,
  onModeChange,
}: ComparisonViewerProps) {
  return (
    <div className="comparison-viewer">
      <div className="preview-tabs" aria-label="Preview mode">
        <button
          type="button"
          className={mode === "source" ? "is-active" : ""}
          onClick={() => onModeChange("source")}
        >
          Source
        </button>
        <button
          type="button"
          className={mode === "compare" ? "is-active" : ""}
          onClick={() => onModeChange("compare")}
        >
          <SplitSquareHorizontal size={14} aria-hidden="true" />
          Compare
        </button>
        <button
          type="button"
          className={mode === "vector" ? "is-active" : ""}
          onClick={() => onModeChange("vector")}
        >
          SVG
        </button>
      </div>

      <div className={`image-stage mode-${mode}`}>
        {mode === "source" && (
          <img src={sourceUrl} alt={sourceAlt} draggable={false} />
        )}

        {mode === "vector" && (
          <div className="vector-full">
            <img src={svgUrl} alt="Generated SVG preview" draggable={false} />
          </div>
        )}

        {mode === "compare" && (
          <>
            <img
              className="compare-image compare-source"
              src={sourceUrl}
              alt={sourceAlt}
              draggable={false}
            />
            <div
              className="compare-vector-layer"
              style={{ clipPath: `inset(0 0 0 ${split}%)` }}
            >
              <img
                className="compare-image"
                src={svgUrl}
                alt="Generated SVG"
                draggable={false}
              />
            </div>
            <div
              className="compare-divider"
              style={{ left: `${split}%` }}
              aria-hidden="true"
            >
              <span>
                <ImageIcon size={14} />
              </span>
            </div>
            <span className="compare-label label-source">Source</span>
            <span className="compare-label label-vector">SVG</span>
            <input
              className="compare-range"
              type="range"
              min={0}
              max={100}
              value={split}
              aria-label="Compare the source image and SVG"
              onChange={(event) => onSplitChange(Number(event.target.value))}
            />
          </>
        )}
      </div>
    </div>
  );
}
