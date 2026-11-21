# TypeScript — alerting の見本 / Alerting examples

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
`Sentry` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。プロジェクトの口があればそれを使う。 / `Sentry` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```ts
// ❌ DB が落ちても空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
const slots = await db.deliverySlot.findMany({ where: { shopId } }).catch(() => [])
// ✅ 捕まえずに投げる（上の例外の処理が報告し、ユーザーにはエラーが出る）
const slots = await db.deliverySlot.findMany({ where: { shopId } })
```

## ALR-2 報告の口を通らないエラーの応答
```ts
// ❌ 捕まえて 500 を返すだけ（捕まえたので、上の自動の報告にも届かない）
catch (e) { log.error('order failed', e); return Response.json({ error: '注文を受け付けられませんでした' }, { status: 500 }) }
// ✅ 応答を返す前に報告の口へ送る
catch (e) { Sentry.captureException(e, { tags: { operation: 'order.create' } }); return Response.json({ error: '注文を受け付けられませんでした' }, { status: 500 }) }
```

## ALR-3 誰も見ていない処理の失敗
```ts
// ❌ 夜のジョブの失敗がログに残るだけ（翌朝、届かない「準備できました」のメールで知る）
cron.schedule('0 3 * * *', () => sendReadyMails().catch((e) => console.error(e)))
// ✅ 失敗をジョブの名前つきで送る
cron.schedule('0 3 * * *', () => sendReadyMails().catch((e) => Sentry.captureException(e, { tags: { job: 'ready-mails' } })))
```

## ALR-5 画面側の失敗
```tsx
// ❌ エラーの境界が画面に出すだけ
<ErrorBoundary fallback={<p>表示できませんでした</p>}><Cart /></ErrorBoundary>
// ✅ 境界で捕まえたものを送る
<Sentry.ErrorBoundary fallback={<p>表示できませんでした</p>}><Cart /></Sentry.ErrorBoundary>
```

## ALR-7 運営が同時に知る業務の失敗
```ts
// ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
catch (e) { return Response.json({ error: '返金できませんでした。時間をおいてお試しください' }, { status: 502 }) }
// ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
catch (e) {
  Sentry.captureException(e, { level: 'warning', tags: { operation: 'refund', shopId, customerId, orderId }, extra: { reason: (e as { code?: string }).code } })
  return Response.json({ error: '返金できませんでした。時間をおいてお試しください' }, { status: 502 })
}
```
