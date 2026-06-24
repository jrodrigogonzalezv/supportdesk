const { onCall } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const { Resend } = require('resend')

const resendApiKey = defineSecret('RESEND_API_KEY')

exports.sendEmail = onCall({ secrets: [resendApiKey], invoker: 'public' }, async (request) => {
  const { to, subject, html, text } = request.data
  if (!to || !subject) throw new Error('Missing required fields: to, subject')

  const resend = new Resend(resendApiKey.value())
  const { error } = await resend.emails.send({
    from: 'SupportDesk <soporte@system.cl>',
    to,
    subject,
    html: html || '',
    text: text || '',
  })

  if (error) throw new Error(error.message)
  return { success: true }
})
