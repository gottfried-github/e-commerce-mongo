import sanitizeHtml from 'sanitize-html'

export const prepareFields = fields => {
  const fieldsPrepared = {}

  if (fields.time) fieldsPrepared.time = new Date(fields.time)
  if (fields.description)
    fieldsPrepared.description = sanitizeHtml(fields.description, {
      allowedTags: ['span', 'strong', 'em', 'ol', 'ul', 'li', 'p', 'a'],
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['style'],
      },
    })

  return { ...fields, ...fieldsPrepared }
}
