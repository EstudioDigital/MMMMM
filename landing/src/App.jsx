import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './sections/Hero'
import SocialProof from './sections/SocialProof'
import HowItWorks from './sections/HowItWorks'
import Modules from './sections/Modules'
import Industries from './sections/Industries'
import Pricing from './sections/Pricing'
import Testimonials from './sections/Testimonials'
import CtaBanner from './sections/CtaBanner'
import Footer from './sections/Footer'
import Terminos from './pages/Terminos'
import Privacidad from './pages/Privacidad'

function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Modules />
      <Industries />
      <Pricing />
      <Testimonials />
      <CtaBanner />
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="/privacidad" element={<Privacidad />} />
      </Routes>
    </BrowserRouter>
  )
}