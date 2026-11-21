# init — プロジェクトに設定を置く / Set up a project

書いてよいのは `<根元>/.codence/` の中だけ。Git の設定、`.gitignore`、ほかのファイルは変えない。
Write only inside `<root>/.codence/`. Never change Git config, `.gitignore`, or any other file.

1. **根元を決める**（`discipline.md` の「動く条件」の 1）。
2. **すでにあるか確かめる。** `profile.md` か `config.yaml` があれば、中身を示し、上書きするかをユーザーに聞く。答えがなければ止まる。
   If either file exists, show it and ask before overwriting.
3. **下書きを作る。** 根元の `templates/` の雛形を元に、プロジェクトを読んで値を埋める。
   - `language`: これまでのやりとりの言語。
   - `diff_base`: 既定のブランチ（`git symbolic-ref refs/remotes/origin/HEAD` など）。
   - `code`: リポジトリに実際にある実装の拡張子。
   - `examples`: リポジトリにある言語のうち、キットの `examples/` に言語パックがあるものをすべて、一覧で（例 `[rust, typescript]`。`typescript`・`rust`・`go`・`python`・`java`・`php`・`ruby`・`csharp`。Kotlin は `java`）。1 つも無ければ `none`。
   - `lenses.structure.catalog`: プロジェクトのリファクタリングの規約やカタログ。推測で作らない。
     見つからなければ空のままにし、構造の観点は観点のファイルにある汎用の項目だけで働くことを伝える。
     With no catalog in the project, leave it empty; the structure lens then runs on its generic items.
   - `lenses.structure.catalog_auto_loaded`: その規約が、フォルダを対象にして自動で読み込まれる設定になっているなら `true`。分からなければ `false`。
   - `tdd.suites`: プロジェクトが実際に使っているテストのコマンド（README、タスクランナー、パッケージの scripts など）。全体と 1 本に絞る形を、試さずに書けるものだけ書く。
     `speed` は分からなければ書かず、そのことを伝える（`tdd-cycle` が最初の全体の実行で決める。単独の段では `slow` として扱う）。
   - `tdd.tests`: 既存のテストの置き場所と、倣うお手本にできるテストのファイル。
   - `tdd.checks`・`tdd.known_failures`・`tdd.hooks`・`tdd.rules`: プロジェクトから読み取れたものだけ。無ければ `none`。既知の失敗は推測で書かない。
   - `tdd.acceptance`・`tdd.stack`: 受け入れテスト（外からスタックを動かして確かめるテスト）があれば、`tdd.md`「プロジェクトの情報」の表のキーを
     すべて埋める。無ければ `acceptance: none`。とくに次を、走らせ方のスクリプトや設定を読んで確かめる:
     - `format` に、進行中のシナリオの印（タグなど）と、それが既定の実行から外れる仕組みを書く。
     - `run_one` は、その道具が実際に絞れる単位（名前・タグ・ファイル・行）で書く。名前で絞れなければ、そう書いて代わりの絞り方を書く。
     - `selected` に、選ばれた件数の読み方と、0 件のときの出力（終了コードが 0 のままか）を書く。
     Fill every acceptance and stack key from the project's scripts: the in-progress marker, a `run_one` the tool can actually do, and how zero selected looks.
   - `commit_language`（`config.yaml`）: 既存のコミットの件名の言語。
   - `commit_style`（`config.yaml`）: 既存の件名の多くが `<type>(<scope>): ` の形なら `conventional`、そうでなければ `history`。根拠に件名を 2〜3 件示す。
   - `lenses`（`config.yaml`）: 使える観点を**すべて**下書きに並べ、プロジェクトを読んで、観点ごとに「入れる案／入れない案」と根拠（見つけたファイル）を書く。
     | 観点 | 入れる案にする目安 |
     |---|---|
     | `structure` | 常に |
     | `security` | 外から呼ばれる口がある（HTTP のルート・CLI の入力・Webhook・メッセージの受け口） |
     | `concurrency` | 非同期の処理、DB への書き込み、ジョブ・定期実行、プロセス内のキャッシュがある |
     | `isolation` | テナント（組織・利用者ごとのデータ）がある、またはテストが DB・ファイル・環境変数を共有している |
     | `alerting` | 本番でユーザーが使っていて、エラーの追跡サービス（Sentry など）の初期化か、外から呼ばれる口がある |
     | `acceptance` | `tdd.acceptance` が `none` でない（外側のシナリオを閉じるたびに新しい文脈を 1 つ起動する） |
     `alerting` を入れる案なら、`profile.md` の `lenses.alerting.report` に、報告の口（送る関数、自動で送る包み・例外の処理）と、そこから人に通知が届くか（ログから通知が出るかも）を、見つけたファイルから書く。通知の設定がコードの外にあって確かめられなければ、そう書いてユーザーに聞く。
     観点を足すほど `review` の費用が増えることを、下書きに 1 行で書く。目安に当たらない観点も「入れない案」として理由つきで並べる（黙って落とさない）。
     List every lens in the draft with a proposed on/off and the evidence; note that each lens adds review cost.
   - `lints`（`config.yaml`）: キットの `lints/` にある lint を**すべて**下書きに並べ、「入れる案／入れない案」と根拠を書く。今あるのは `comments`
     （コメントを足さない。新しく足した行だけを見るので、今あるコメントには触らない）。
     - 入れる案の目安: プロジェクトの規約がコメントを控えるよう求めている、またはユーザーが望んでいる。見つからなければ「入れない案」。
     - プロジェクトの lint の道具で同じ規則が書けるなら、そちらに足す案にする（キットの lint は入れない）。
     - 言語: `code` の拡張子のうち、`lints/comments/` に規則があるもの（`typescript`・`tsx`・`javascript`・`rust`・`go`・`python`・`php`）。規則の無い言語には効かないと書く。
     - 走らせる道具: `ast-grep` が入っていればそれ、無くて node があれば `npx -y -p @ast-grep/cli@0.51.3 ast-grep`（入れずに走らせる）。どちらも無ければ、入れ方を書いて「入れない案」にする。
     - 残すコメント: 規則の既定は、説明用のコメント（`/**`・`///`、Go は宣言の直前のコメント）、道具への指示（lint の抑止、カバレッジの除外、型やビルドの指示など）、ライセンス、Given / When / Then。自動生成のファイルは見ない。プロジェクトの規約が違うものを求めていれば、案に書く。
     List every kit lint with a proposed on/off and evidence; prefer the project's own linter when it can express the rule.
   Fill values from the project itself; leave unknowns empty and say so — never invent a catalog, a command, or a known failure.
4. **下書きを見せて、ユーザーの了承を得てから書く。** / Show the draft; write only after the user agrees.
   `lints` を入れるなら、キットの `lints/new-lines.sh` と、使う言語の `lints/comments/<言語>.yml` を `.codence/lints/`（規則は `comments/` の下）に写し、
   `.codence/lints/sgconfig.yml` に `ruleDirs: [comments]` と書き、`tdd.checks` に `AST_GREP="<道具>" bash .codence/lints/new-lines.sh <diff_base>` を足す。
   コミットのフック（`--staged` を付ける）と CI に入れる行は、案として報告に書くだけにする（`.codence/` の外は変えない。個人用にしたなら、フックと CI からは使えないことも書く）。
   Kit lints are copied under `.codence/lints/` and run from `tdd.checks`; hook and CI lines are proposed, not written.
5. **個人用か共有かを聞く。**
   - 個人用: `.git/info/exclude` に `/.codence/` を足す方法を**案内するだけ**（自分では足さない）。
   - チームで共有: コミットしてよいと伝える（コミットはしない）。
   Ask personal or shared; only explain how to exclude or commit — do neither.
6. 書いたファイルと、空のままの項目を報告する。 / Report what was written and what is still empty.
