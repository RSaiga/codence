<div align="center">

# codence

[![bench-tests](https://github.com/RSaiga/codence/actions/workflows/bench-tests.yml/badge.svg)](https://github.com/RSaiga/codence/actions/workflows/bench-tests.yml)
[![version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2FRSaiga%2Fcodence%2Fmain%2F.claude-plugin%2Fplugin.json&query=%24.version&label=version&color=blue)](.claude-plugin/plugin.json)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Claude Code plugin](https://img.shields.io/badge/Claude%20Code-plugin-d97757)](#入れる)
[![Codex plugin](https://img.shields.io/badge/Codex-plugin-10a37f)](#入れる)

[English](README.md) · **日本語**

[入れる](#入れる) ·
[プロジェクトで使う](#プロジェクトで使う) ·
[計画](PLAN.md) ·
[不具合の報告](https://github.com/RSaiga/codence/issues)

</div>

AI コーディングエージェントに開発の規律を守らせる、Claude Code と Codex のプラグイン。

AI に任せると、実装を先に書いてから通るテストを後で足したり、テストのコマンドや規約を推測で済ませたりしやすい。
codence は、進め方を plan → red → green → refactor に固定し、変更を **観点（lenses）** で読み直させる。観点は決まった見方で変更を読み、見つけた問題に名前を付けて、次の一手を添えて返す。

- **プロジェクトの事実を推測しない。** テストのコマンド・置き場所・規約は、プロジェクトの `.codence/profile.md` から読む。足りなければ、どの項目かを示して止まる。
- **呼んだときだけ動く。** どの入口も自動では起動しない。
- **測ってから採る。** キット自身の変更は、bench で結果が落ちず、費用が下がるか、同じ費用でより単純になるときだけ採る（[`bench/criteria.md`](bench/criteria.md)）。採らなかった変更も、数字ごと記録に残す。

> 名前は code と dance、それに cadence（一定の歩調）を重ねた造語。AI とコードを書くことを、決まった歩調で踊るように刻み続ける。

`review` の指摘は、たとえばこう返る（例）:

```
### [SEC-1 認可] — src/orders/refund.ts:42  (確信度: 高)
- 何が問題か: 返金の処理が、注文を ID だけで読み、呼んだ店のものかを確かめていない。
- 破れる入力: 店 A が店 B の注文の orderId を送る → B の注文が返金される。
- 提案する手当て: ID と呼んだ店の shopId の両方で注文を読み、無ければ「見つからない」を返す。

## LENS FINDINGS 1
```

## できること

呼び出す単位を **入口** と呼ぶ。Claude Code では `/codence:<入口>`、Codex では `$codence:<入口>` で呼ぶ。
TDD は、内側のテストだけで回す **単層** と、受け入れテストを外側に置く **二重ループ** の 2 つ。どちらも `tdd-cycle` で最後まで回せるし、段階ごとの入口で 1 つずつ進めることもできる。

| 入口 | すること |
|---|---|
| `go` | どの依頼もここから。目的・問題・期待する変化の 3 行に言い直し、下の入口を 1 つ選び、その手順を todo に写して実行する |
| `init` | プロジェクトを読んで `.codence/` を下書きし、了承を得てから書く |
| `review` | 作業中の変更、ブランチか範囲、プルリクエストの URL、ファイルかディレクトリを観点で読む。読むだけ |
| `refactor` | TDD の外で構造だけを直す。structure の観点で匂いを挙げ、既存のテストが守っている場所だけを 1 つずつ直す |
| `tdd-plan` | テストのリスト（モード、シナリオ、内側の項目、影響を受ける既存のテスト）を作る。大きな依頼は先にストーリーに分ける。承認のあとで書く |
| `tdd-cycle` | リストが尽きるまで回す。終わりに文書の古い事実を直し、ブランチの変更の全体を新しい文脈ですべての観点で読み直して、指摘を直すか理由を書いて退ける（3 周まで） |
| `tdd-accept` | 二重ループの外側の 1 手。受け入れシナリオを書いて落ちるのを確かめる。または、走らせて緑なら閉じる |
| `tdd-red` `tdd-green` `tdd-refactor` `tdd-commit` | TDD の 1 段階だけを行う |
| `retro` | 意図・結果・止まった箇所を `findings.md` に残す。`track` で対策が効いたかを判定する |

| 観点 | 見るもの |
|---|---|
| structure | code smell。汎用の 6 つを常に疑い、プロジェクトのリファクタリングのカタログがあれば、それを先に疑う |
| security | 認可・テナント分離・入力の境界・内部の漏れ・秘密・注入・外からの呼び出しの検証（SEC-1〜7） |
| concurrency | 確かめてから書き込むまでの競合、冪等性、トランザクション、複数インスタンス、共有の状態（CON-1〜8） |
| isolation | データが混ざらないか。テナントの絞り込み、テナントをまたぐ集計、キャッシュとセッションのキー、非同期の処理への引き継ぎ。テスト同士がデータや資源を取り合わないか（ISO-1〜8） |
| alerting | 提供者が失敗をユーザーからの連絡で初めて知る箇所。握りつぶし、報告を通らないエラーの応答、ログだけで終わるジョブ、黙った劣化など（ALR-1〜7） |
| logging | 障害のときにログから原因までたどれない箇所と、漏れる・偽装できるログ。大事な出来事にログが無ければ、残すか、残さないなら理由を聞く（LOG-1〜5） |
| acceptance | 緑になったシナリオの約束を、実装が本当に守っているか。書いた本人の結論を知らない新しい文脈で読む |

既定で動くのは structure だけ。ほかの観点は `config.yaml` の `lenses` で足す。
security と concurrency の確信度「高」の指摘には、実際に壊れる入力か、壊れる実行の順番を必ず添える。

## 入れる

**Claude Code**
```
claude plugin marketplace add RSaiga/codence
claude plugin install codence@codence
```
最初に呼ぶもの: `/codence:init`

**Codex**
```
codex plugin marketplace add RSaiga/codence
codex plugin add codence@codence
```
最初に呼ぶもの: `$codence:init`（名前空間が要る）

`review` は読むだけの git のコマンド（`git diff`・`git ls-files`・`git hash-object`）を使う。許可しておくと、確認で止まらない。

**更新:** Claude Code は `claude plugin marketplace update codence` → `claude plugin update codence@codence` → セッションで `/reload-plugins`。
`/plugin` の Marketplaces で `codence` を選び、Enable auto-update をオンにすれば自動で更新される。Codex は `codex plugin marketplace upgrade codence`。

## プロジェクトで使う

1. プロジェクトで `init` を呼ぶ。下書きを見て、足りない項目を埋めてから了承する。
2. 個人で使うなら、`.git/info/exclude` に `/.codence/` を足す。チームで共有するならコミットし、`/.codence/lists/` を除外する。
3. `review` や `tdd-cycle` を呼ぶか、`go` に依頼をそのまま渡す。設定が無ければ、入口は `init` を案内して止まる。

```
<project>/.codence/
├── profile.md      # このプロジェクトの事実: 言語、差分の基準、観点のカタログ、テストのスイートと置き場所、既知の失敗
├── config.yaml     # キットの動かし方: runner、使う観点、コミットの方針と言語
├── lists/          # TDD のテストのリスト（ブランチごと）。キットはコミットしない
├── decisions/      # on_doubt: log のとき、tdd-cycle が決めた・保留したことの記録
├── backlog.md      # backlog: file のとき、tdd-plan が分けたストーリー
└── findings.md     # retro の記録
```

項目の意味は雛形（[`templates/profile.md`](templates/profile.md)・[`templates/config.yaml`](templates/config.yaml)）にある。
任意の項目のうち、`on_doubt: log` にすると、`tdd-cycle` は人が見ていなくても迷いで止まらない。戻せない操作や自分のものでないプロセスでだけ止まり、ほかは戻せる方を選ぶか保留して進み、判断を記録する。依頼に「朝まで止まらずに回して」と書けば、その回だけそうなる。

**規律の優先順位:** その場のユーザーの指示 → `config.yaml` → プロジェクトのルール → キットの規律。

### 使う AI

手順を進める AI は、キットを呼んだツールのもの。変えるならツールの側で変える（Claude Code なら `/model`）。
観点を読む AI は、`config.yaml` の `runner` で選ぶ。

| `runner` | 読むもの | 見逃し / 1 回の費用（bench） |
|---|---|---|
| `inline`（既定） | 同じ AI が、同じ文脈で | 0 / $0.35 |
| `subagent` | 同じツールの別の担当が、新しい文脈で（観点ごとに同時に、または `combined` でまとめて） | 0 / $0.51〜0.70 |
| `command` | 外のコマンド（Codex など）。プロンプトは標準入力で渡し、差分はそのサービスに送られる | 27 回で 1 / $0.59 ＋そのサービス |

`inline` は見逃しが無く最も安いので既定にした。`acceptance` だけは `runner` に関わらず、毎回新しい文脈で読む。

### セカンドオピニオン

`review` と `tdd-plan` に `--second` を付けると、別の AI にも読ませる。

```
/codence:review main...HEAD --second
```

```yaml
# config.yaml
second_opinion_commands:
  - ["codex", "exec", "--ephemeral", "--sandbox", "read-only", "-C", "{root}"]
  - ["claude", "-p", "--permission-mode", "plan"]
```

候補を上から見て、いまキットを呼んだツールと同じプログラムを飛ばして選ぶ。同じ設定のまま、Claude Code から呼べば Codex が、Codex から呼べば Claude Code が 2 人目になる。
`review` では 2 人が同時に読み、同じ指摘を組にして印を付ける（どの指摘も消さない）。`tdd-plan` では、2 人目が下書きの抜けを探し、1 人目が 1 件ずつ答える。
差分は 2 人目のサービスに送られる。

## 進み具合を見る

Claude Code では、今のブランチのテストのリストの進み具合が出る。プロンプトの上の帯（`codence ▰▰▰▰▰▰▰▱▱▱ 15/19 79% · ▶ 作業中の項目`）と、
パネル（端末が広ければ自動で開く。`/codence-progress` でも開く）に、シナリオごとのバー、作業中の項目、直近の操作とコミットが出る。
リストを読むだけで、手順は変えない。Claude Code の試験的な仕組み（hooks のモジュール）で作っているので、版によっては出なくなることがあるが、手順には影響しない。Codex では出ない。

## 仕組み

```
skills/       入口。短く、procedures/ の手順を読んで実行するだけ
procedures/   手順の本文（共通の規律、review、TDD の各段階など）
lenses/       観点の本文
agents/       観点を新しい文脈で動かす担当（Claude 用）
examples/     言語パック: 直し方と lint の見本（TypeScript・Rust・Go・Python・Java/Kotlin・PHP・Ruby・C#）
templates/    プロジェクトの設定の雛形
bench/        費用と結果を測る仕組み
mods/         進み具合の帯とパネル（Claude Code の hooks のモジュール）
```

手順と観点の本文には、ツール固有の言葉を書かない。ツールの違いは、入口の 1 行、ツールごとの設定ファイル、`agents/` だけに置く。
手順と観点は日本語で書き、段落ごとに英語の要約を添えている。報告は `profile.md` の言語で書く。

## bench

`bench/run.sh` は、試す先のリポジトリを固定したコミットから毎回複製し直し、比べる版どうしで同じ課題を交互に走らせて、費用・往復の数・結果を記録する。
`bench/grade.sh` は、指摘の名前と場所、呼ばれたときだけ動いたか、TDD の順番（テストが落ちてから実装を変えたか）を採点する。
導入先の課題と結果は `bench/local/` に置き、公開しない。進める順番、決めたこと、測った結果は [`PLAN.md`](PLAN.md) にある。

## 貢献

Issue とプルリクエストを歓迎する。手順は [`CONTRIBUTING.md`](CONTRIBUTING.md) にある。`main` への変更はプルリクエストだけで、`bench/tests` が通る必要がある。

## ライセンス

MIT
