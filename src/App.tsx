import { useEffect, useState, type ReactNode } from 'react'
import { TablePage } from './TablePage.tsx'
import { ElementPage } from './ElementPage.tsx'
import { BenchPage } from './BenchPage.tsx'
import { SourcesPage } from './SourcesPage.tsx'
import { BY } from './elements.tsx'
import { BENCH } from './chem/reactions.ts'

const useHash = () => {
  const [h, set] = useState(location.hash)
  useEffect(() => { const f = () => { set(location.hash); scrollTo(0, 0) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  return h
}

export function App() {
  const [, page = '', arg = ''] = useHash().split('/')
  let body: ReactNode, tab = 'table'
  if (page === 'bench') {
    tab = 'bench'
    const jar = [...new Set(arg.split('+'))].filter(s => (BENCH as readonly string[]).includes(s)).slice(0, 2)
    body = <BenchPage key={arg} start={jar} />
  } else if (page === 'element' && BY[arg]) body = <ElementPage key={arg} e={BY[arg]} />
  else if (page === 'sources') { tab = 'sources'; body = <SourcesPage /> }
  else body = <TablePage />
  return (
    <div className="app">
      <header className="top">
        <a className="brand" href="#/">Periodic table</a>
        <nav aria-label="Main">
          {[['table', '#/', 'Table'], ['bench', '#/bench', 'Bench'], ['sources', '#/sources', 'Sources']].map(([k, href, t]) => <a key={k} href={href} aria-current={tab === k ? 'page' : undefined}>{t}</a>)}
        </nav>
      </header>
      {body}
    </div>
  )
}
