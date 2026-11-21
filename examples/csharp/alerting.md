# C# — alerting の見本 / Alerting examples（bench では未検証 / not yet validated by the bench）

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
`SentrySdk` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。プロジェクトの口があればそれを使う。 / `SentrySdk` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```csharp
// ❌ 失敗を空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
List<Slot> slots;
try { slots = await slotClient.FetchAsync(shopId); } catch { slots = []; }
// ✅ 捕まえずに投げる（例外の処理のミドルウェアが報告し、ユーザーにはエラーが出る）
var slots = await slotClient.FetchAsync(shopId);
```

## ALR-2 報告の口を通らないエラーの応答
```csharp
// ❌ 捕まえて 500 を返すだけ（捕まえたので、自動の報告にも届かない）
catch (Exception e) { logger.LogError(e, "order failed"); return Results.Problem("注文を受け付けられませんでした"); }
// ✅ 応答を返す前に報告の口へ送る
catch (Exception e) { SentrySdk.CaptureException(e); return Results.Problem("注文を受け付けられませんでした"); }
```

## ALR-3 誰も見ていない処理の失敗
```csharp
// ❌ 常駐の処理の失敗がログに残るだけ
protected override async Task ExecuteAsync(CancellationToken ct) {
    while (!ct.IsCancellationRequested) { try { await SendReadyMailsAsync(ct); } catch (Exception e) { logger.LogWarning(e, "ready mails failed"); } await Task.Delay(TimeSpan.FromHours(24), ct); }
}
// ✅ 失敗をジョブの名前つきで送る
catch (Exception e) { SentrySdk.CaptureException(e, scope => scope.SetTag("job", "ready-mails")); }
```

## ALR-7 運営が同時に知る業務の失敗
```csharp
// ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
catch (PaymentException) { return Results.Problem("返金できませんでした。時間をおいてお試しください", statusCode: 502); }
// ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
catch (PaymentException e) {
    SentrySdk.CaptureException(e, scope => {
        scope.Level = SentryLevel.Warning;
        scope.SetTags(new Dictionary<string, string> { ["operation"] = "refund", ["shop_id"] = shopId, ["customer_id"] = customerId, ["order_id"] = orderId });
        scope.SetExtra("reason", e.Code);
    });
    return Results.Problem("返金できませんでした。時間をおいてお試しください", statusCode: 502);
}
```
