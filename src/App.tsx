import { Link, Outlet } from 'react-router'

export function App() {
  return (
    <>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>
        Skip to content
      </a>
      <header className="topbar">
        <Link to="/" className="wordmark" aria-label="backpy home">
          <img src="/favicon.svg" alt="" width="24" height="24" />
          backpy
        </Link>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  )
}
