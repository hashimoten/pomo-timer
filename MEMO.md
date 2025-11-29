# Pomodoro Timer Project Memo

## 🛠 プロジェクト概要
- **目的**: シンプルかつデザイン性の高い（ニューモーフィズム）ポモドーロタイマーの開発。
- **ターゲット**: エンジニア、学習者、自分自身。
- **デプロイ先**: Vercel (CI/CD連携済み)

## 💻 技術スタック
- **Framework**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS (Neumorphism Design)
- **Animation**: Framer Motion
- **Chart**: react-calendar-heatmap
- **Icon**: lucide-react

---

## ✅ 実装済み機能 (Current Features)
- [x] **基本タイマー**: Work(25m) / Break(5m) の切り替え、Start/Pause/Reset。
- [x] **デザイン**: 徹底されたニューモーフィズム（凹凸によるUI表現）。
- [x] **レスポンシブ**: PC（2カラム: タイマー/履歴）、スマホ（1カラム: 縦積み）の完全対応。
- [x] **履歴管理**: ローカルストレージへの保存、ヒートマップ可視化、リスト表示。
- [x] **設定機能**:
    - 時間設定（Work/Break）
    - 自動開始（Auto-start）
    - テーマ切り替え（Dark/Light）
    - 通知音選択（Web Audio APIによるビープ音生成）

---

## 🚀 開発ロードマップ (TODO List)

### Phase 1: コード基盤の整備（Refactoring）
機能追加により `App.tsx` が肥大化しているため、保守性を高める分割を行う。
- [ ] **コンポーネント分割**:
    - `src/components/TimerDisplay.tsx` (円形タイマー)
    - `src/components/Controls.tsx` (操作ボタン群)
    - `src/components/SettingsModal.tsx` (設定モーダル)
    - `src/components/HistoryPanel.tsx` (ヒートマップ・履歴リスト)
    - `src/components/Layout.tsx` (全体のレイアウト枠)
- [ ] **カスタムフック抽出**:
    - `hooks/useTimer.ts`
    - `hooks/useHistory.ts`
    - `hooks/useSettings.ts` (Sound/Themeロジック含む)
- [ ] **共通化**:
    - `types.ts` (FocusSession型などの定義)
    - `constants.ts` (デフォルト値、カラーコード)

### Phase 2: UX / 使い勝手の向上 (Quick Wins)
- [ ] **ダイナミックタイトル**: ブラウザタブに残り時間を表示（例: `24:59 - Focus`）。
- [ ] **キーボードショートカット**: Space(Start/Stop), R(Reset) などの対応。
- [ ] **音量調整機能**: 通知音のボリュームスライダーを追加。
- [ ] **デスクトップ通知**: Web Notification APIを用いたバックグラウンド通知。

### Phase 3: 本格機能追加 (Major Features)
- [ ] **データのバックアップ**:
    - 履歴データの CSV/JSON エクスポート機能。
    - インポート機能（ブラウザキャッシュクリア対策）。
- [ ] **ロングブレイク**: 4ポモドーロごとに長めの休憩（15分など）を自動提案。
- [ ] **タスク管理**:
    - カテゴリ選択に加え、具体的な「タスク名」を入力・記録できる機能。

### Phase 4: 高度な機能 (Advanced)
- [ ] **PWA化**: `vite-plugin-pwa` を導入し、スマホホーム画面へのインストール対応。
- [ ] **ユニットテスト**: Vitestの導入と主要ロジックのテスト。
- [ ] **テーマカラーカスタマイズ**: Base Colorをユーザーが自由に選べる機能。

---

## 🎨 デザインガイドライン (Neumorphism)
- **Light Mode Base**: `#E0E5EC`
- **Dark Mode Base**: `#2D3748`
- **Shadows**:
    - Light Source: 左上 (White/Lighter color)
    - Shadow: 右下 (Darker color)
- **Shapes**: 基本的に `rounded-3xl` などの大きな角丸を使用。