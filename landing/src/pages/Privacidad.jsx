import { useEffect } from 'react'
import LegalPage, { Section, Bullet } from '../components/LegalPage'

const LAST_UPDATED = new Date().toLocaleDateString('es-AR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

export default function Privacidad() {
  useEffect(() => { document.title = 'Política de privacidad — MateBot' }, [])

  return (
    <LegalPage title="Política de privacidad" lastUpdated={LAST_UPDATED}>
      <p className="text-[#a0a0a0] text-sm leading-relaxed">
        En cumplimiento de la Ley 25.326 de Protección de Datos Personales de la República Argentina,
        informamos nuestra política de privacidad.
      </p>

      <Section title="1. Responsable del tratamiento">
        <div className="bg-[#111111] border border-white/6 rounded-xl p-4 space-y-1">
          <p className="text-white font-medium">Estudio Digital — Gonzalo Criado</p>
          <p>Córdoba, Argentina</p>
          <p>Email: <a href="mailto:NuestroEstudioDigital@gmail.com" className="text-[#25D366] hover:underline">NuestroEstudioDigital@gmail.com</a></p>
        </div>
      </Section>

      <Section title="2. Datos que recopilamos">
        <p className="font-medium text-white/80 mb-1">2.1 Datos del negocio cliente (quien contrata MateBot):</p>
        <ul className="space-y-1 mb-4">
          <Bullet>Nombre del negocio</Bullet>
          <Bullet>Email y contraseña (contraseña almacenada con hash bcrypt, nunca en texto plano)</Bullet>
          <Bullet>Número de teléfono del dueño</Bullet>
          <Bullet>Token de acceso a WhatsApp Business (almacenado cifrado con AES-256)</Bullet>
        </ul>
        <p className="font-medium text-white/80 mb-1">2.2 Datos de los clientes finales (quienes escriben por WhatsApp):</p>
        <ul className="space-y-1 mb-4">
          <Bullet>Número de teléfono de WhatsApp</Bullet>
          <Bullet>Nombre de perfil de WhatsApp (si está disponible)</Bullet>
          <Bullet>Historial de mensajes con el negocio</Bullet>
          <Bullet>Fecha y hora de las conversaciones</Bullet>
        </ul>
        <p className="font-medium text-white/80 mb-1">2.3 Datos de uso:</p>
        <ul className="space-y-1">
          <Bullet>Turnos agendados</Bullet>
          <Bullet>Pedidos realizados</Bullet>
          <Bullet>Estadísticas de mensajes</Bullet>
        </ul>
      </Section>

      <Section title="3. Finalidad del tratamiento">
        <p>Los datos se utilizan exclusivamente para:</p>
        <ul className="space-y-1 mt-2">
          <Bullet>Prestar el servicio de automatización de WhatsApp contratado</Bullet>
          <Bullet>Enviar comunicaciones relacionadas con el servicio (facturas, alertas)</Bullet>
          <Bullet>Mejorar la calidad del servicio</Bullet>
          <Bullet>Cumplir obligaciones legales</Bullet>
        </ul>
        <p className="mt-3 font-medium text-white/80">
          No utilizamos los datos para publicidad de terceros ni los vendemos.
        </p>
      </Section>

      <Section title="4. Almacenamiento y seguridad">
        <ul className="space-y-1">
          <Bullet>Los datos se almacenan en servidores seguros (Railway, ubicados en EE.UU.)</Bullet>
          <Bullet>Utilizamos cifrado AES-256-GCM para datos sensibles</Bullet>
          <Bullet>Las contraseñas se almacenan con hash bcrypt (nunca en texto plano)</Bullet>
          <Bullet>Acceso restringido mediante autenticación JWT</Bullet>
          <Bullet>Conexiones cifradas con HTTPS/TLS</Bullet>
        </ul>
      </Section>

      <Section title="5. Retención de datos">
        <ul className="space-y-1">
          <Bullet>Datos de cuenta: mientras la cuenta esté activa + 90 días tras cancelación</Bullet>
          <Bullet>Historial de conversaciones: 12 meses desde cada mensaje</Bullet>
          <Bullet>Datos de facturación: 5 años (obligación legal argentina)</Bullet>
        </ul>
      </Section>

      <Section title="6. Derechos del usuario">
        <p>En cumplimiento de la Ley 25.326, el usuario tiene derecho a:</p>
        <ul className="space-y-1 mt-2">
          <Bullet>Acceder a sus datos personales</Bullet>
          <Bullet>Rectificar datos incorrectos</Bullet>
          <Bullet>Suprimir sus datos ("derecho al olvido")</Bullet>
          <Bullet>Oponerse al tratamiento</Bullet>
        </ul>
        <p className="mt-3">
          Para ejercer estos derechos:{' '}
          <a href="mailto:NuestroEstudioDigital@gmail.com" className="text-[#25D366] hover:underline">
            NuestroEstudioDigital@gmail.com
          </a>
        </p>
      </Section>

      <Section title="7. Datos de terceros (clientes finales del negocio)">
        <p>El negocio que usa MateBot es responsable de:</p>
        <ul className="space-y-1 mt-2">
          <Bullet>Informar a sus clientes que sus mensajes son procesados por un sistema automatizado</Bullet>
          <Bullet>Obtener el consentimiento necesario según la legislación aplicable</Bullet>
          <Bullet>Cumplir con las políticas de uso de WhatsApp Business de Meta</Bullet>
        </ul>
      </Section>

      <Section title="8. Cookies">
        <p>
          La landing page (matebot.app) no utiliza cookies de seguimiento.
          El panel de administración (app.matebot.app) utiliza localStorage para mantener
          la sesión del usuario, sin cookies de terceros.
        </p>
      </Section>

      <Section title="9. Transferencias internacionales">
        <p>Los datos pueden ser procesados por:</p>
        <ul className="space-y-1 mt-2">
          <Bullet>Railway (servidores en EE.UU.) — infraestructura</Bullet>
          <Bullet>Meta/WhatsApp (EE.UU.) — plataforma de mensajería</Bullet>
          <Bullet>OpenAI (EE.UU.) — procesamiento de IA (solo contenido de mensajes cuando la IA está activa)</Bullet>
        </ul>
        <p className="mt-3">
          Todas estas empresas cuentan con políticas de privacidad propias y mecanismos de
          transferencia internacional conformes a la normativa.
        </p>
      </Section>

      <Section title="10. Menores de edad">
        <p>
          MateBot no está dirigido a menores de 18 años. No recopilamos intencionalmente
          datos de menores.
        </p>
      </Section>

      <Section title="11. Cambios en esta política">
        <p>
          Notificaremos cambios significativos por email con 30 días de anticipación.
        </p>
      </Section>

      <Section title="12. Contacto y reclamos">
        <p>Para consultas, ejercicio de derechos o reclamos:</p>
        <div className="mt-2 bg-[#111111] border border-white/6 rounded-xl p-4">
          <p>Email: <a href="mailto:NuestroEstudioDigital@gmail.com" className="text-[#25D366] hover:underline">NuestroEstudioDigital@gmail.com</a></p>
        </div>
        <p className="mt-3">
          También podés contactar a la{' '}
          <a
            href="https://www.argentina.gob.ar/aaip"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] hover:underline"
          >
            Agencia de Acceso a la Información Pública
          </a>
          {' '}como autoridad de control.
        </p>
      </Section>
    </LegalPage>
  )
}