# Python — alerting の見本 / Alerting examples（bench では未検証 / not yet validated by the bench）

直し方の見本。架空の苗の注文のサービス。プロジェクトの要件ではない。 / Remedy examples for a fictional plant nursery; not requirements.
`sentry_sdk` はプロジェクトの報告の口（`lenses.alerting.report`）の代わり。プロジェクトの口があればそれを使う。 / `sentry_sdk` stands in for the project's own reporting path.

## ALR-1 握りつぶし
```python
# ❌ 失敗を空の一覧にする（ユーザーには「配達できる日がありません」と出て、報告は出ない）
try:
    slots = repo.delivery_slots(shop_id)
except Exception:
    slots = []
# ✅ 捕まえずに投げる（フレームワークの例外の処理が報告し、ユーザーにはエラーが出る）
slots = repo.delivery_slots(shop_id)
```

## ALR-2 報告の口を通らないエラーの応答
```python
# ❌ 捕まえて 500 の応答を返すだけ（例外として上に出ないので、自動の報告にも届かない）
except Exception:
    logger.exception("order failed")
    return JSONResponse(status_code=500, content={"detail": "注文を受け付けられませんでした"})
# ✅ 応答を返す前に報告の口へ送る
except Exception as e:
    sentry_sdk.capture_exception(e)
    return JSONResponse(status_code=500, content={"detail": "注文を受け付けられませんでした"})
```

## ALR-3 誰も見ていない処理の失敗
```python
# ❌ 再試行を使い切った失敗がログに残るだけ
@shared_task(autoretry_for=(Exception,), max_retries=3)
def send_ready_mails(): ...
@task_failure.connect
def on_failure(sender=None, exception=None, **_): logger.error("task failed: %s", exception)
# ✅ 使い切った失敗をジョブの名前つきで送る（Celery の連携を入れていれば自動で届く）
@task_failure.connect
def on_failure(sender=None, exception=None, **_):
    with sentry_sdk.new_scope() as scope:
        scope.set_tag("job", sender.name)
        sentry_sdk.capture_exception(exception)
```

## ALR-7 運営が同時に知る業務の失敗
```python
# ❌ 返金の失敗をユーザーに伝えるだけ（運営は問い合わせで知る）
except PaymentError:
    return JSONResponse(status_code=502, content={"detail": "返金できませんでした。時間をおいてお試しください"})
# ✅ ユーザーに伝えるのと同時に、誰の・どの操作か・理由をつけて運営の口へ送る
except PaymentError as e:
    with sentry_sdk.new_scope() as scope:
        scope.set_level("warning")
        scope.set_tags({"operation": "refund", "shop_id": shop_id, "customer_id": customer_id, "order_id": order_id})
        scope.set_extra("reason", e.code)
        sentry_sdk.capture_exception(e)
    return JSONResponse(status_code=502, content={"detail": "返金できませんでした。時間をおいてお試しください"})
```
