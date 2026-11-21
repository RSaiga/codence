# Java — alerting の見本 / Alerting examples（bench では未検証 / not yet validated by the bench）

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
Kotlin でも同じ書き方で読める。`Sentry` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。 / The same idioms apply to Kotlin; `Sentry` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```java
// ❌ 失敗を空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
List<Slot> slots;
try { slots = slotClient.fetch(shopId); } catch (Exception e) { slots = List.of(); }
// ✅ 捕まえずに投げる（例外の処理が報告し、ユーザーにはエラーが出る）
List<Slot> slots = slotClient.fetch(shopId);
```

## ALR-2 報告の口を通らないエラーの応答
```java
// ❌ 例外の処理が 500 を返すだけ（捕まえたので、自動の報告にも届かない）
@ExceptionHandler(Exception.class)
ResponseEntity<String> handle(Exception e) { log.error("order failed", e); return ResponseEntity.status(500).body("注文を受け付けられませんでした"); }
// ✅ 応答を返す前に報告の口へ送る
@ExceptionHandler(Exception.class)
ResponseEntity<String> handle(Exception e) { Sentry.captureException(e); return ResponseEntity.status(500).body("注文を受け付けられませんでした"); }
```

## ALR-3 誰も見ていない処理の失敗
```java
// ❌ 定期実行の失敗がログに残るだけ
@Scheduled(cron = "0 0 3 * * *")
void readyMails() { try { mailer.sendReady(); } catch (Exception e) { log.error("ready mails failed", e); } }
// ✅ 失敗をジョブの名前つきで送る
@Scheduled(cron = "0 0 3 * * *")
void readyMails() { try { mailer.sendReady(); } catch (Exception e) { Sentry.captureException(e, scope -> scope.setTag("job", "ready-mails")); } }
```

## ALR-7 運営が同時に知る業務の失敗
```java
// ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
catch (PaymentException e) { return ResponseEntity.status(502).body("返金できませんでした。時間をおいてお試しください"); }
// ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
catch (PaymentException e) {
    Sentry.captureException(e, scope -> {
        scope.setLevel(SentryLevel.WARNING);
        scope.setTag("operation", "refund"); scope.setTag("shop_id", shopId); scope.setTag("customer_id", customerId); scope.setTag("order_id", orderId);
        scope.setExtra("reason", e.getCode());
    });
    return ResponseEntity.status(502).body("返金できませんでした。時間をおいてお試しください");
}
```
