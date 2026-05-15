import logo from '../assets/logo.png'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-2xl bg-[#25D366]/20 animate-ping" />
          <img src={logo} alt="MateBot" className="w-14 h-14 object-contain relative z-10" />
        </div>
        <p className="text-[#64748b] text-sm">Cargando MateBot...</p>
      </div>
    </div>
  )
}