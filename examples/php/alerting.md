# PHP — alerting の見本 / Alerting examples（bench では未検証 / not yet validated by the bench）

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
Laravel の `report()` は例外の処理（Sentry など）へ送る。手がかりをつけて送る例は `\Sentry\withScope` を使う。プロジェクトの報告の口（`lenses.alerting.report`）があればそれを使う。 / `report()` and `\Sentry` stand in for the project's own reporting path.

## ALR-1 握りつぶし
```php
// ❌ 失敗を空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
try { $slots = $this->slots->forShop($shopId); } catch (\Throwable) { $slots = collect(); }
// ✅ 捕まえずに投げる（例外の処理が報告し、ユーザーにはエラーが出る）
$slots = $this->slots->forShop($shopId);
```

## ALR-2 報告の口を通らないエラーの応答
```php
// ❌ 捕まえて 500 を返すだけ（捕まえたので、例外の処理の報告にも届かない）
catch (\Throwable $e) { Log::error('order failed', ['e' => $e]); return response()->json(['error' => '注文を受け付けられませんでした'], 500); }
// ✅ 応答を返す前に報告の口へ送る
catch (\Throwable $e) { report($e); return response()->json(['error' => '注文を受け付けられませんでした'], 500); }
```

## ALR-3 誰も見ていない処理の失敗
```php
// ❌ キューのジョブが再試行を使い切ったときに、ログに残すだけ
public function failed(\Throwable $e): void { Log::warning('ready mails failed', ['e' => $e]); }
// ✅ 使い切った失敗をジョブの名前つきで送る
public function failed(\Throwable $e): void { \Sentry\withScope(function (Scope $scope) use ($e) { $scope->setTag('job', 'ready-mails'); \Sentry\captureException($e); }); }
```

## ALR-7 運営が同時に知る業務の失敗
```php
// ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
catch (PaymentException $e) { return response()->json(['error' => '返金できませんでした。時間をおいてお試しください'], 502); }
// ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
catch (PaymentException $e) {
    \Sentry\withScope(function (Scope $scope) use ($e, $shopId, $customerId, $orderId) {
        $scope->setLevel(Severity::warning());
        $scope->setTags(['operation' => 'refund', 'shop_id' => (string) $shopId, 'customer_id' => (string) $customerId, 'order_id' => (string) $orderId]);
        $scope->setExtra('reason', $e->getCode());
        \Sentry\captureException($e);
    });
    return response()->json(['error' => '返金できませんでした。時間をおいてお試しください'], 502);
}
```
