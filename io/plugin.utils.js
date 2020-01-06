export function parseEntry(entry, entryType) {
  let evt, mapTo, pre, body, post, emitEvt, msgLabel
  if (typeof entry === 'string') {
    let subItems = []
    const items = entry.trim().split(/\s*\]\s*/)
    if (items.length > 1) {
      pre = items[0]
      subItems = items[1].split(/\s*\[\s*/)
    } else {
      subItems = items[0].split(/\s*\[\s*/)
    }
    ;[body, post] = subItems
    if (body.includes('-->')) {
      ;[evt, mapTo] = body.split(/\s*-->\s*/)
    } else if (body.includes('<--')) {
      ;[evt, mapTo] = body.split(/\s*<--\s*/)
    } else {
      evt = body
    }

    if (entryType === 'emitter') {
      ;[emitEvt, msgLabel] = evt.split(/\s*\+\s*/)
    } else if (mapTo === undefined) {
      mapTo = evt
    }
  } else if (entryType === 'emitBack') {
    ;[[mapTo, evt]] = Object.entries(entry)
  } else {
    ;[[evt, mapTo]] = Object.entries(entry)
  }
  return { pre, post, evt, mapTo, emitEvt, msgLabel }
}