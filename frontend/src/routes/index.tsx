import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div>
      <h1>homepage</h1>
      <p>hello world</p>
      <p>使い方など</p>
      <p>randing page</p>
      <p>特徴などをアピール</p>
    </div>
  )
}
