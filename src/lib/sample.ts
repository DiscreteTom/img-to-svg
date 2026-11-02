import i18n from "../i18n";

function drawSample(ctx: CanvasRenderingContext2D): void {
  const width = 1200;
  const height = 820;

  ctx.fillStyle = "#f7f1e5";
  ctx.fillRect(0, 0, width, height);

  const wash = ctx.createLinearGradient(100, 80, 1080, 760);
  wash.addColorStop(0, "#f9d567");
  wash.addColorStop(0.52, "#ef7049");
  wash.addColorStop(1, "#d7e5c6");
  ctx.fillStyle = wash;
  ctx.beginPath();
  ctx.arc(350, 375, 255, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#183f38";
  ctx.beginPath();
  ctx.moveTo(550, 720);
  ctx.bezierCurveTo(565, 480, 640, 245, 930, 120);
  ctx.bezierCurveTo(924, 370, 830, 605, 550, 720);
  ctx.fill();

  ctx.fillStyle = "#e9f1db";
  ctx.beginPath();
  ctx.moveTo(614, 664);
  ctx.bezierCurveTo(650, 488, 738, 328, 872, 246);
  ctx.bezierCurveTo(833, 438, 755, 586, 614, 664);
  ctx.fill();

  ctx.fillStyle = "#111815";
  ctx.beginPath();
  ctx.arc(888, 594, 104, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#111815";
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(842, 548);
  ctx.lineTo(934, 642);
  ctx.moveTo(935, 548);
  ctx.lineTo(843, 642);
  ctx.stroke();

  ctx.fillStyle = "#ef7049";
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const size = 22 - row * 4;
      ctx.fillRect(116 + col * 48, 105 + row * 48, size, size);
    }
  }

  ctx.strokeStyle = "#183f38";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(1060, 170, 48, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(1060, 170, 20, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#111815";
  ctx.font = "700 58px Georgia, serif";
  ctx.fillText("FORM / 01", 104, 748);
}

export function createSampleImage(): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 820;
    const context = canvas.getContext("2d");

    if (!context) {
      reject(new Error(i18n.t("errors.sampleCreate")));
      return;
    }

    drawSample(context);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error(i18n.t("errors.sampleGenerate")));
        return;
      }
      resolve(
        new File([blob], "svg-to-png-sample.png", {
          type: "image/png",
        }),
      );
    }, "image/png");
  });
}
