import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/events/ansewer/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>
    Hello "/events/ansewer/"!
    <p>イベント回答画面</p>
    <p>候補のカレンダー表示</p>
    <p>カレンダーをタップして回答する</p>
    <p>回答の保存</p>
    <p>イベントページに戻る</p>
    
    </div>
}
