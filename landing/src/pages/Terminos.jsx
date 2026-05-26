import { useEffect } from 'react'
import LegalPage, { Section, Bullet } from '../components/LegalPage'

const LAST_UPDATED = new Date().toLocaleDateString('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function Terminos() {
  useEffect(() => { document.title = 'Términos y condiciones — MateBot' }, [])

  return (
    <LegalPage title="Términos y condiciones de uso" lastUpdated={LAST_UPDATED}>
      <Section title="1. Aceptación de los términos">
        <p>
          Al registrarse y utilizar MateBot, el usuario acepta estos términos en su totalidad.
          Si no está de acuerdo con alguna de las condiciones aquí establecidas, no debe usar el servicio.
        </p>
      </Section>

      <Section title="2. Descripción del servicio">
        <p>
          MateBot es una plataforma SaaS que permite a negocios automatizar la atención al cliente a través
          de WhatsApp Business. El servicio incluye:
        </p>
        <ul className="space-y-1 mt-2">
          <Bullet>Bot de respuestas automáticas</Bullet>
          <Bullet>Gestión de turnos y pedidos</Bullet>
          <Bullet>Panel de administración web</Bullet>
          <Bullet>Integración con la API oficial de WhatsApp Business de Meta</Bullet>
        </ul>
      </Section>

      <Section title="3. Registro y cuenta">
        <ul className="space-y-1">
          <Bullet>El usuario debe proveer información veraz y actualizada</Bullet>
          <Bullet>Es responsable de mantener la confidencialidad de su contraseña</Bullet>
          <Bullet>Debe notificar inmediatamente cualquier uso no autorizado de su cuenta</Bullet>
          <Bullet>Debe ser mayor de 18 años o tener autorización de un adulto responsable</Bullet>
        </ul>
      </Section>

      <Section title="4. Planes y pagos">
        <ul className="space-y-1">
          <Bullet>Los precios están expresados en dólares estadounidenses (USD)</Bullet>
          <Bullet>El cobro se realiza mensualmente de forma automática a través de MercadoPago</Bullet>
          <Bullet>Los planes pueden modificarse con 30 días de anticipación notificados por email</Bullet>
          <Bullet>No se realizan reembolsos por períodos parciales ya cobrados</Bullet>
          <Bullet>El período de prueba gratuito de 14 días no requiere tarjeta de crédito</Bullet>
        </ul>
      </Section>

      <Section title="5. Cancelación">
        <ul className="space-y-1">
          <Bullet>El usuario puede cancelar su suscripción en cualquier momento desde el panel</Bullet>
          <Bullet>Al cancelar, el servicio se mantiene activo hasta el fin del período ya pagado</Bullet>
          <Bullet>MateBot puede cancelar cuentas que violen estos términos sin previo aviso</Bullet>
        </ul>
      </Section>

      <Section title="6. Uso aceptable">
        <p>El usuario se compromete a NO utilizar MateBot para:</p>
        <ul className="space-y-1 mt-2">
          <Bullet>Enviar spam o mensajes no solicitados masivamente</Bullet>
          <Bullet>Actividades ilegales o que violen las políticas de Meta/WhatsApp</Bullet>
          <Bullet>Distribuir contenido ofensivo, engañoso o fraudulento</Bullet>
          <Bullet>Recopilar datos de terceros sin su consentimiento</Bullet>
        </ul>
      </Section>

      <Section title="7. Responsabilidad">
        <ul className="space-y-1">
          <Bullet>MateBot no se responsabiliza por interrupciones del servicio de WhatsApp/Meta</Bullet>
          <Bullet>No garantizamos disponibilidad del 100% del tiempo (objetivo: 99.5% uptime)</Bullet>
          <Bullet>No somos responsables por el contenido de las conversaciones de los usuarios</Bullet>
          <Bullet>El usuario es responsable del cumplimiento de las políticas de Meta</Bullet>
        </ul>
      </Section>

      <Section title="8. Propiedad intelectual">
        <ul className="space-y-1">
          <Bullet>El software, diseño y marca MateBot son propiedad de Estudio Digital</Bullet>
          <Bullet>El usuario conserva la propiedad de sus datos y conversaciones</Bullet>
          <Bullet>Se concede al usuario una licencia de uso no exclusiva e intransferible</Bullet>
        </ul>
      </Section>

      <Section title="9. Privacidad y datos">
        <p>
          El tratamiento de datos personales se rige por nuestra{' '}
          <a href="/privacidad" className="text-[#25D366] hover:underline">Política de Privacidad</a>,
          en cumplimiento de la Ley 25.326 de Protección de Datos Personales de Argentina.
        </p>
      </Section>

      <Section title="10. Modificaciones">
        <p>
          MateBot se reserva el derecho de modificar estos términos con 30 días de anticipación.
          El uso continuado del servicio implica aceptación de los cambios.
        </p>
      </Section>

      <Section title="11. Ley aplicable">
        <p>
          Estos términos se rigen por las leyes de la República Argentina. Para cualquier disputa,
          las partes se someten a la jurisdicción de los tribunales ordinarios de la ciudad de
          Córdoba, Argentina.
        </p>
      </Section>

      <Section title="12. Contacto">
        <p>Para consultas sobre estos términos:</p>
        <div className="mt-2 bg-[#111111] border border-white/6 rounded-xl p-4 space-y-1">
          <p>Email: <a href="mailto:NuestroEstudioDigital@gmail.com" className="text-[#25D366] hover:underline">NuestroEstudioDigital@gmail.com</a></p>
          <p>Web: <a href="https://www.estudiodigital.org" target="_blank" rel="noopener noreferrer" className="text-[#25D366] hover:underline">www.estudiodigital.org</a></p>
        </div>
      </Section>
    </LegalPage>
  )
}