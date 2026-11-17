# C# — lint の見本 / Lint examples

繰り返した直しを、lint の設定だけで止めるときの書き方。`cycle.md`「lint にできる候補」が、候補があるときだけ読む。
How to stop a repeated fix with lint configuration alone; read only when `cycle.md` has a lint candidate.

**道具を決める:** プロジェクトが `Microsoft.CodeAnalysis.BannedApiAnalyzers` を参照していれば、`BannedSymbols.txt`（規則 RS0030）。
参照していなければ、パッケージを足すことになるので、そう書く（設定だけでは済まない）。
BannedApiAnalyzers with `BannedSymbols.txt`; if the package is not referenced, say that adding it is required.

```text
# BannedSymbols.txt（.csproj の <AdditionalFiles Include="BannedSymbols.txt" />）— 時刻は IClock から取る
P:System.DateTime.Now;IClock.Now を使う
P:System.DateTime.UtcNow;IClock.UtcNow を使う
T:System.Net.WebClient;HttpClient を使う
M:System.Console.WriteLine(System.String);ILogger を使う
```

- 先頭の文字は種類（`T:` 型、`M:` メソッド、`P:` プロパティ、`F:` フィールド）。 / The prefix names the symbol kind.
- 置き換え先そのものは `#pragma warning disable RS0030` か、`.editorconfig` でそのパスの重大度を下げて除く。 / Exempt the replacement with a pragma or `.editorconfig`.
