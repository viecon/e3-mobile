# E3 Mobile

NYCU E3 LMS 的 mobile-first Progressive Web App。在 iPhone/iPad 加到主畫面後像原生 app 一樣使用。

## 架構

```
iPhone Safari → PWA (GitHub Pages) → Cloudflare Worker (CORS proxy) → E3 REST API
```

- **PWA**: React 18 + TypeScript + Tailwind CSS，Vite 建置
- **CORS Proxy**: Cloudflare Worker (`e3-proxy`)，轉發 API 並加 CORS headers
- **Auth**: 帳密登入取得 Moodle token，token 存 localStorage

## 功能

- 帳密登入（透過 proxy 呼叫 /login/token.php）
- 首頁 Dashboard（未繳作業 + 最新公告）
- 課程列表
- 未繳作業（倒數計時、顏色標示）
- 通知（顯示課程名稱、按課程篩選）
- PWA 離線快取
- 深色主題
- iOS safe area 支援

## 使用方式

1. 在 iPhone Safari 開啟 `https://viecon.github.io/e3-mobile/`
2. 登入：
   - Proxy URL: `https://e3-proxy.<your-subdomain>.workers.dev`
   - E3 帳號 + 密碼
3. 分享 → 加入主畫面

## 開發

```bash
pnpm install
pnpm dev          # localhost:5173
pnpm build        # dist/
```

## 部署

### GitHub Pages（PWA）
Push 到 master 後 GitHub Actions 自動 build + deploy。
需要在 repo Settings → Pages → Source 選 **GitHub Actions**。

### Cloudflare Worker（CORS proxy）
```bash
cd worker
npx wrangler login   # 第一次需要
npx wrangler deploy  # 部署到 workers.dev
```
需要 Node 22+（用 `fnm use 22`）。
Worker URL: `https://e3-proxy.<your-subdomain>.workers.dev`

## 專案結構

```
src/
  api/moodle.ts       — Moodle REST API client（透過 CF Worker proxy）
  pages/
    Login.tsx          — 帳密登入頁
    Home.tsx           — Dashboard（作業 + 公告）
    Courses.tsx        — 課程列表
    Assignments.tsx    — 未繳作業
    Notifications.tsx  — 通知（含課程篩選）
  components/
    AssignmentCard.tsx — 作業卡片元件
    BottomNav.tsx      — 底部 tab 導航
  lib/
    storage.ts         — localStorage wrapper
    time.ts            — 日期/倒數格式化
worker/
  index.ts             — Cloudflare Worker CORS proxy
  wrangler.toml        — Worker 設定
```

## API 端點

所有 API 通過 Worker proxy 轉發到 `e3p.nycu.edu.tw`：

| 功能 | Moodle API function |
|------|-------------------|
| 登入 | /login/token.php |
| 驗證 | core_webservice_get_site_info |
| 課程 | core_enrol_get_users_courses |
| 作業 | core_calendar_get_action_events_by_timesort |
| 公告 | mod_forum_get_forums_by_courses + mod_forum_get_forum_discussions |
| 通知 | core_message_get_messages |

## 已知限制

- E3 的 2FA 需要放寬為「新裝置才需要」，否則帳密登入會失敗
- Cloudflare Worker 免費額度：10 萬 requests/天
- PWA 在 iOS 上不支援 push notification
- 離線只能看上次快取的資料，不能新操作

## 後續維護

### 加新頁面
1. 在 `src/pages/` 新增 `.tsx`
2. 在 `src/App.tsx` 加 Route
3. 在 `src/components/BottomNav.tsx` 加 tab（如果需要）

### 加新 API
1. 在 `src/api/moodle.ts` 加 export function
2. 用 `call<T>(wsfunction, params)` 呼叫 Moodle API

### Worker 修改
1. 改 `worker/index.ts`
2. `cd worker && npx wrangler deploy`

### 常見問題
- **CORS 錯誤**: Worker 沒部署或 URL 錯誤
- **登入失敗**: 2FA 沒有放寬、帳密錯誤、Worker 無法連到 E3
- **GitHub Pages 沒更新**: 檢查 Actions tab 有沒有跑、Pages source 有沒有設成 GitHub Actions
- **Node 版本**: Worker deploy 需要 Node 22+，用 `fnm use 22`

## 關聯 Repo

- [viecon/e3-assistant](https://github.com/viecon/e3-assistant) — 瀏覽器 Extension + CLI + Obsidian 同步
