const PouchDB = require('pouchdb')
const PouchHyperbeePlugin = require('pouchdb-adapter-hyperbee')({ persist: false })
PouchDB.plugin(PouchHyperbeePlugin)

const MESSAGE_KEY = 'message'

const $doLoad = $('#doLoad')
const $doShare = $('#doShare')
const $enterShare = $('#enterShare')
const $enterLoad = $('#enterLoad')

const $intro = $('#intro')

const $message = $('#message')
const $url = $('#url')

const $status = $('#status')
const $output = $('#output')

$enterShare.onclick = () => {
  show($doShare)
  hide($intro)
  setStatus('Getting Message')
}

$enterLoad.onclick = () => {
  show($doLoad)
  hide($intro)
  setStatus('Getting URL to load')
}

$doLoad.onsubmit = (e) => {
  e.preventDefault()
  doLoad()
}

$doShare.onsubmit = (e) => {
  e.preventDefault()
  doShare()
}

async function doShare () {
  try {
    hide($doShare)

    const message = $message.value

    console.log('Sharing message', message)

    const pouch = await makePouch('hyper://example')

    setStatus('Addding message')

    await pouch.put({ _id: MESSAGE_KEY, message })

    setStatus('Added')

    const url = await pouch.getURL()

    setStatus(`Send this URL to the other side: ${url}`)
  } catch (e) {
    setStatus(e.stack)
    console.error(e)
  }
}

async function doLoad () {
  try {
    hide($doLoad)

    const url = $url.value

    console.log('Loading', url)

    const pouch = await makePouch(url)

    setStatus('Waiting to connect')

    await ensurePeer(pouch)

    setStatus('Connected')

    const { message } = await pouch.get(MESSAGE_KEY)

    setStatus(`Message: ${message}`)
  } catch (e) {
    setStatus(e.stack)
    console.error(e)
  }
}

async function ensurePeer (pouch) {
  const { bee } = pouch
  const { feed } = bee

  // If we're already connected, that's fine
  if (feed.peers.length) return

  await new Promise((resolve, reject) => {
    feed.once('peer-open', resolve)
  })
}

async function makePouch (url) {
  setStatus('Initializing database')

  const pouch = new PouchDB(url, { adapter: 'hyperbee' })

  window.pouch = pouch

  await new Promise((resolve, reject) => {
    pouch.once('open', resolve)
    pouch.once('error', reject)
  })

  setStatus('Initialized database')

  return pouch
}

function setStatus (status) {
  const prev = $status.innerText

  $status.innerText = status
  $output.innerText += '\n' + prev
}

function $ (query) {
  return document.querySelector(query)
}

function show (element) {
  element.classList.remove('hidden')
}

function hide (element) {
  element.classList.add('hidden')
}
