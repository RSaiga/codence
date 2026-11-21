# Go — alerting の見本 / Alerting examples（bench では未検証 / not yet validated by the bench）

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
`sentry` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。プロジェクトの口があればそれを使う。 / `sentry` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```go
// ❌ err を捨てる（失敗すると空の一覧になり、ユーザーには「配達できる日がありません」と出る）
slots, _ := h.repo.DeliverySlots(ctx, shopID)
// ✅ 呼び出し元へ返す（返された err を報告の口へ送る層まで届き、ユーザーにはエラーが出る）
slots, err := h.repo.DeliverySlots(ctx, shopID)
if err != nil {
	return fmt.Errorf("delivery slots: %w", err)
}
```

## ALR-2 報告の口を通らないエラーの応答
```go
// ❌ 500 を返すだけ（ログには残るが、誰にも届かない）
if err != nil {
	log.Printf("order failed: %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "注文を受け付けられませんでした"})
	return
}
// ✅ 応答を返す前に報告の口へ送る
if err != nil {
	sentry.CaptureException(err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "注文を受け付けられませんでした"})
	return
}
```

## ALR-3 誰も見ていない処理の失敗
```go
// ❌ 定期実行の失敗がログに残るだけ
c.AddFunc("0 3 * * *", func() { if err := sendReadyMails(ctx); err != nil { log.Println(err) } })
// ✅ 失敗をジョブの名前つきで送る
c.AddFunc("0 3 * * *", func() {
	if err := sendReadyMails(ctx); err != nil {
		hub := sentry.CurrentHub().Clone()
		hub.Scope().SetTag("job", "ready-mails")
		hub.CaptureException(err)
	}
})
```

## ALR-7 運営が同時に知る業務の失敗
```go
// ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
if err != nil {
	c.JSON(http.StatusBadGateway, gin.H{"error": "返金できませんでした。時間をおいてお試しください"})
	return
}
// ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
if err != nil {
	hub := sentry.CurrentHub().Clone()
	hub.Scope().SetLevel(sentry.LevelWarning)
	hub.Scope().SetTags(map[string]string{"operation": "refund", "shop_id": shopID, "customer_id": customerID, "order_id": orderID})
	hub.CaptureException(err)
	c.JSON(http.StatusBadGateway, gin.H{"error": "返金できませんでした。時間をおいてお試しください"})
	return
}
```
