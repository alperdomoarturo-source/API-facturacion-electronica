import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json()

    if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: 'Destinatario inválido.' }, { status: 400 })
    }
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Contenido del recibo vacío.' }, { status: 400 })
    }

    const apiKey = process.env.BREVO_API_KEY
    const senderEmail = process.env.BREVO_SENDER_EMAIL
    const senderName = process.env.BREVO_SENDER_NAME || 'Recibo'

    if (!apiKey || !senderEmail) {
      return NextResponse.json(
        { error: 'El envío por correo no está configurado en el servidor.' },
        { status: 500 }
      )
    }

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject: subject || 'Cuenta de cobro',
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      console.error('Brevo error:', res.status, detail)
      return NextResponse.json(
        { error: 'Brevo rechazó el envío. Revisa la configuración.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('send-receipt error:', error)
    return NextResponse.json({ error: 'No se pudo enviar el correo.' }, { status: 500 })
  }
}
