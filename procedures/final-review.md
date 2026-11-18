# final-review — 最後に観点で読み直して直す / Read the branch through the lenses and fix, until clean

`cycle.md` の「抜けたら」で、全体の実行が緑になり、文書のずれを直したあとに行う。ループの中では観点のほとんどがかからないので、
ここが最後の砦になる。指摘は確信度に関わらず、すべて直すか、直さない理由を書いて退ける。
After the loop is green and docs are fixed, review the whole branch with every lens and fix every finding, whatever its confidence, or dismiss it with a reason.

## 1. 読む / Read

- **毎周、ブランチの変更の全体を読む**（`review.md` の「指定なし」の対象。コミット済みと作業中を合わせたもの）。直した差分だけを読まない
  （直したことで外に出た問題と、前の周の見落としに気づけない）。
- 観点は `config.yaml` の `lenses` のすべて。`acceptance` は除く（シナリオが緑になるたびにかけ済み）。`router` に関わらず、どの観点も飛ばさない。
- **新しい文脈で読む。** `runner` が `inline` でも、この手順では `subagent` として動かす（書いた文脈で読むと、自分の書いたものを見落とす）。
  新しい文脈を起動できないツールでは `inline` で読み、報告にそう書く。
- `review.md` の 1 と 3 のとおりに実行する（読むだけ、指紋を比べる）。どれかの観点が `STOPPED` なら、止まる。
Each round reads the whole branch change (never just the fix), with every configured lens but acceptance, in a fresh context.

## 2. 分ける / Sort the findings

指摘を 1 件ずつ、上から当てる。前の周で退けた指摘と、同じ場所・同じ中身のものは数えない。

1. **振る舞いが間違っている指摘**（security・concurrency・isolation の指摘、ほかの観点でも「この入力でこう壊れる」と書けるもの）:
   リストの末尾の `## 観点の指摘 / Review findings`（無ければ作る）に 1 件ずつ足す:
   `- [ ] [fix] <どこで>: <あるべき振る舞いを 1 文> — 出典: 観点の読み直し <周> <観点> <見出し>`
   `cycle.md` の内側のループ（red → green → コミット → refactor → コミット）で直す。
   - red で、指摘どおりの理由で落ちるテストが書けなければ、その指摘は誤りと見なす。書いたテストは消し（コミットしない）、
     行を `[x]` にして末尾に ` — 退けた: 再現しない（<試した入力と結果>）` と書く。
2. **振る舞いを変えずに直せる指摘**（構造の匂い、名前、置き場所、重複など）: `refactor.md` の 4〜6 の規律で直し、`refactor` の 1 コミットにする。
   その場所を通るテストが無ければ直さず、`退けた: テストで守られていない（足すテストの案: <1 行>）` として報告に残す。
3. **設計の判断が要る指摘**（直し方が 2 つ以上あり、どれを選ぶかで振る舞いや構造が大きく変わる）:
   `on_doubt` が `stop` なら、ここで止まって聞く。`log` なら `unattended.md` の「決めて進む」のとおり戻せる方を選んで、1 か 2 として直し、判断の記録に書く。
4. **誤りの指摘**（読み違い、変更の外の既存のコード、すでに守られていると示せるもの）: 直さず、`退けた: <根拠のファイルと行>` として報告に残す。
   理由を示せないものを退けない。迷ったら 1 か 2 として直す。
Wrong behaviour → a `[fix]` item through red/green (dismissed if no test fails for the stated reason); behaviour-preserving → refactor discipline;
a design choice → stop, or with `on_doubt: log` decide the reversible way and log it; a mistaken finding → dismiss with the file and line that show it.

この手順が足す `[fix]` の項目は、`tdd.md`「項目を勝手に足さない」の例外。足すのは観点の指摘から 1 件ずつだけ。
The `[fix]` items are the one other exception to "never add items".

## 3. 繰り返す / Repeat

- 2 で何かを直したら、`cycle.md`「抜けたら」の 2・3（触った範囲の全体の実行、二重ループなら空のデータからの受け入れテスト）を走らせてから、1 に戻る。赤なら止まる。
- **直すものが 0 件**（指摘が無い、または退けたものだけ）**になったら終わる。**
- **3 周目のあとも直すものが残っていたら、止まる。** 残った指摘をそのまま報告する。
- 同じ指摘を 2 周続けて直そうとして直らないときも、止まる（直し方が間違っている）。
After a round that fixed something, rerun the full suites (and the acceptance run from empty data) before reading again. Done when a round has nothing to fix;
stop after the third round if something is still left, or when the same finding survives two fixes.

## 4. 報告 / Report

`cycle.md` の報告の最後の塊に、次の行を足す:
```
読み直し: 1 周目 FINDINGS <n>（直した <a>・退けた <b>）/ 2 周目 … / <n> 周目 CLEAN（新しい文脈で読めなかったら、そう書く）
退けた:   <指摘の見出し> — <理由>（無ければ「なし」）
```

**しないこと / Never:** 直した差分だけを読むこと。確信度が中・低だからと直さずに終えること。理由を書かずに退けること。
テストを先に書かずに振る舞いを直すこと。期待値を変えて観点の指摘を消すこと。
