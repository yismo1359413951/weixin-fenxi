import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ComplianceModal from './components/ComplianceModal'
import Footer from './components/Footer'
import Home from './pages/Home'
import Result from './pages/Result'
import Archive from './pages/Archive'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-dvh flex-col bg-[#FFFBF5]">
        <ComplianceModal />
        <main className="relative z-0 flex w-full flex-1 flex-col pb-40 md:pb-36">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result/:id" element={<Result />} />
            <Route path="/archive" element={<Archive />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
