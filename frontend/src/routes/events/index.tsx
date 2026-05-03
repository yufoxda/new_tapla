import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/events/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    Hello "/events/"!
    <p>イベント画面</p>
    <p>イベント情報</p>
    <p>候補のカレンダー表示</p>
    <p>投票状況表示</p>
    <p>投票者一覧</p>
    <p>投票ページ遷移ボタン</p>
    <p>ログインせずに投票の表示</p>
    <p>ログインして投票をうながす。</p>
  </div>

}
