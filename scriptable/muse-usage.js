// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: moon;
// 🌙 Muse 使用量ウィジェット（ルナ子バージョン）
// データ: lunakotsukimiya/luna-widgets リポジトリの muse-usage.json

const DATA_URL = "https://raw.githubusercontent.com/lunakotsukimiya/luna-widgets/main/muse-usage.json";
const AVATAR_IMG_URL = "https://github.com/lunakotsukimiya.png?size=240";
const AVATAR_B64_URL = "https://raw.githubusercontent.com/lunakotsukimiya/luna-widgets/main/assets/luna-avatar.b64.txt";

const C = {
  textDark: new Color("#4a3a6b"),
  textSub: new Color("#8a7ca8"),
  accent: new Color("#b18cff"),
  track: new Color("#ffffff", 0.55),
};

async function fetchJSON(url) {
  const req = new Request(url);
  req.timeoutInterval = 10;
  return await req.loadJSON();
}

async function fetchAvatar() {
  // まずGitHubプロフィール画像をそのまま読み込む
  try {
    const req = new Request(AVATAR_IMG_URL);
    req.timeoutInterval = 10;
    const img = await req.loadImage();
    if (img) return img;
  } catch (e) {}
  // ダメならbase64テキストから復元する
  try {
    const req = new Request(AVATAR_B64_URL);
    req.timeoutInterval = 10;
    const b64 = await req.loadString();
    const data = Data.fromBase64String(b64.replace(/\s+/g, ""));
    return data ? Image.fromData(data) : null;
  } catch (e) {
    return null;
  }
}

function drawBar(percent, width, height) {
  const ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  const r = height / 2;
  // track
  const trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, width, height), r, r);
  ctx.addPath(trackPath);
  ctx.setFillColor(C.track);
  ctx.fillPath();
  // fill
  const w = Math.max(height, Math.min(width, width * percent / 100));
  const fillPath = new Path();
  fillPath.addRoundedRect(new Rect(0, 0, w, height), r, r);
  ctx.addPath(fillPath);
  ctx.setFillColor(C.accent);
  ctx.fillPath();
  return ctx.getImage();
}

function daysUntil(date) {
  const ms = date.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function hhmm(date) {
  const df = new DateFormatter();
  df.dateFormat = "HH:mm";
  return df.string(date);
}

async function createWidget() {
  const widget = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [new Color("#e9e4ff"), new Color("#ffe9f4")];
  grad.locations = [0, 1];
  widget.backgroundGradient = grad;
  widget.setPadding(12, 14, 12, 14);

  let data = null;
  try {
    data = await fetchJSON(DATA_URL);
  } catch (e) {
    const t = widget.addText("データを取得できませんでした");
    t.font = Font.systemFont(12);
    t.textColor = C.textDark;
    return widget;
  }

  const family = config.widgetFamily || "medium";
  const avatarSize = family === "small" ? 62 : 84;

  const row = widget.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const avatar = await fetchAvatar();
  if (avatar) {
    const img = row.addImage(avatar);
    img.imageSize = new Size(avatarSize, avatarSize);
    img.cornerRadius = avatarSize / 2;
    row.addSpacer(12);
  }

  const col = row.addStack();
  col.layoutVertically();

  const title = col.addText("🌙 Muse");
  title.font = Font.boldSystemFont(13);
  title.textColor = C.textSub;

  const bigRow = col.addStack();
  bigRow.layoutHorizontally();
  bigRow.bottomAlignContent();
  const pct = bigRow.addText(String(data.remainingPercent));
  pct.font = Font.boldSystemFont(34);
  pct.textColor = C.textDark;
  const pctUnit = bigRow.addText(" % left");
  pctUnit.font = Font.boldSystemFont(14);
  pctUnit.textColor = C.textDark;

  col.addSpacer(4);
  const bar = col.addImage(drawBar(data.remainingPercent, family === "small" ? 130 : 170, 10));
  bar.imageSize = new Size(family === "small" ? 130 : 170, 10);

  col.addSpacer(5);
  const reset = new Date(data.resetAt);
  const sub = col.addText("Resets in " + daysUntil(reset) + " days");
  sub.font = Font.systemFont(12);
  sub.textColor = C.textSub;

  const upd = col.addText("Updated " + hhmm(new Date(data.updatedAt)));
  upd.font = Font.systemFont(10);
  upd.textColor = C.textSub;

  widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000);
  return widget;
}

const widget = await createWidget();
if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  await widget.presentMedium();
}
Script.complete();
