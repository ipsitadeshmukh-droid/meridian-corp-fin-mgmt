import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell.jsx'
import Overview from './pages/Overview.jsx'
import Attention from './pages/Attention.jsx'
import Clients from './pages/Clients.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import Transactions from './pages/Transactions.jsx'
import Reports from './pages/Reports.jsx'
import Planned from './pages/Planned.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/attention" element={<Attention />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Planned />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
