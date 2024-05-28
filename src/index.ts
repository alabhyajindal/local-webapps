import { Glob } from 'bun'
import { Hono } from 'hono'

const app = new Hono()

app.on('GET', ['/', '/home'], async (c) => {
  const file = Bun.file('./src/home.html')
  const htmlText = await file.text()
  return c.html(htmlText)
})

app.on('POST', '/api/add', async (c) => {
  const body = await c.req.parseBody()
  const url = body['url'] as string
  const title = body['title'] as string

  if (url && title) {
    const urlResponse = await fetch(url)
    const html = await urlResponse.text()
    const fileName = title.toLowerCase() + '.html'
    await Bun.write(`./src/apps/${fileName}`, html)
  }

  return c.redirect('/')
})

app.on('GET', '/api/get', async (c) => {
  const glob = new Glob('./src/apps/*.html')
  const apps = []
  for await (const file of glob.scanSync({ cwd: '.' })) {
    const fileName = file.split('/').pop()!.split('.')[0]
    if (fileName) apps.push(fileName)
  }

  return c.json({ apps })
})

app.get('*', async (c) => {
  const res = await fetch('http://localhost:1111/api/get')
  const { apps } = await res.json()
  const requestedApp = c.req.path.split('/')[1]

  if (apps.includes(requestedApp)) {
    const file = Bun.file(`./src/apps/${requestedApp}.html`)
    const htmlText = await file.text()
    return c.html(htmlText)
  } else {
    return c.text(`no app found with title: ${requestedApp}. go back?`, 404)
  }
})

export default {
  port: 1111,
  fetch: app.fetch,
}

console.log('Listening at http://localhost:1111')
