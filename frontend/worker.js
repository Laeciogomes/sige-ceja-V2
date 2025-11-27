export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // 1) Tenta servir o arquivo estático normalmente
    let response = await env.ASSETS.fetch(request)

    // 2) Se deu 404 e NÃO parece ser arquivo (não tem extensão),
    //    fazemos fallback para o index.html da SPA
    const isFileRequest = url.pathname.includes('.')

    if (response.status === 404 && !isFileRequest) {
      const newUrl = new URL(request.url)
      newUrl.pathname = '/index.html'

      response = await env.ASSETS.fetch(new Request(newUrl, request))
    }

    return response
  },
}
