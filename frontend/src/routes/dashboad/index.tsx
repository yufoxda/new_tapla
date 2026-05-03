import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboad/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    Hello "/dashboad/"!
    <p>ダッシュボード</p>
    <p>ログインユーザーのみ</p>
    <p>ユーザー情報</p>
    <p>ディスプレイネーム</p>
    <p>作ったイベント</p>
    <p>投票したイベント</p>
    </div>
}
