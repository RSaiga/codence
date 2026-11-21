# Rust — alerting の見本 / Alerting examples

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
`sentry` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。プロジェクトの口があればそれを使う。 / `sentry` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```rust
// ❌ DB の失敗を空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
let slots = repo.delivery_slots(shop_id).await.unwrap_or_default();
// ✅ ? で返す（エラーの型が報告の口を通る）
let slots = repo.delivery_slots(shop_id).await?;
```

## ALR-2 報告の口を通らないエラーの応答
```rust
// ❌ 捕まえて 500 を返すだけ（ログには残るが、誰にも届かない）
Err(e) => { tracing::warn!(error = ?e, "order failed"); HttpResponse::InternalServerError().body("注文を受け付けられませんでした") }
// ✅ 応答を返す前に報告の口へ送る
Err(e) => { sentry::capture_error(&e); HttpResponse::InternalServerError().body("注文を受け付けられませんでした") }
```

## ALR-3 誰も見ていない処理の失敗
```rust
// ❌ 定期実行の失敗を捨てる
tokio::spawn(async move { loop { interval.tick().await; let _ = send_ready_mails(&pool).await; } });
// ✅ 失敗をジョブの名前つきで送る
tokio::spawn(async move { loop { interval.tick().await;
    if let Err(e) = send_ready_mails(&pool).await {
        sentry::with_scope(|s| s.set_tag("job", "ready-mails"), || sentry::capture_error(&e));
    }
} });
```

## ALR-7 運営が同時に知る業務の失敗
```rust
// ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
Err(e) => HttpResponse::BadGateway().body("返金できませんでした。時間をおいてお試しください")
// ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
Err(e) => {
    sentry::with_scope(|s| {
        s.set_level(Some(sentry::Level::Warning));
        s.set_tag("operation", "refund"); s.set_tag("shop_id", shop_id); s.set_tag("customer_id", customer_id); s.set_tag("order_id", order_id);
    }, || sentry::capture_error(&e));
    HttpResponse::BadGateway().body("返金できませんでした。時間をおいてお試しください")
}
```
