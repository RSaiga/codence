# Ruby — alerting の見本 / Alerting examples（bench では未検証 / not yet validated by the bench）

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
`Sentry` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。Rails の `Rails.error.report` を使っていればそれでよい。 / `Sentry` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```ruby
# ❌ 失敗を空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
slots = SlotClient.fetch(shop_id) rescue []
# ✅ 捕まえずに投げる（例外の処理が報告し、ユーザーにはエラーが出る）
slots = SlotClient.fetch(shop_id)
```

## ALR-2 報告の口を通らないエラーの応答
```ruby
# ❌ 捕まえて 500 を返すだけ（捕まえたので、自動の報告にも届かない）
rescue => e
  Rails.logger.error(e)
  render json: { error: "注文を受け付けられませんでした" }, status: :internal_server_error
# ✅ 応答を返す前に報告の口へ送る
rescue => e
  Sentry.capture_exception(e)
  render json: { error: "注文を受け付けられませんでした" }, status: :internal_server_error
```

## ALR-3 誰も見ていない処理の失敗
```ruby
# ❌ 再試行を使い切ったジョブがログに残るだけ
class ReadyMailsJob < ApplicationJob
  retry_on StandardError, attempts: 3 do |job, e| Rails.logger.warn(e) end
end
# ✅ 使い切った失敗をジョブの名前つきで送る
class ReadyMailsJob < ApplicationJob
  retry_on StandardError, attempts: 3 do |job, e| Sentry.capture_exception(e, tags: { job: job.class.name }) end
end
```

## ALR-7 運営が同時に知る業務の失敗
```ruby
# ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
rescue PaymentError
  render json: { error: "返金できませんでした。時間をおいてお試しください" }, status: :bad_gateway
# ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
rescue PaymentError => e
  Sentry.capture_exception(e, level: :warning,
    tags: { operation: "refund", shop_id: shop.id, customer_id: current_user.id, order_id: order.id },
    extra: { reason: e.code })
  render json: { error: "返金できませんでした。時間をおいてお試しください" }, status: :bad_gateway
```
