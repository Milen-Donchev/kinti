import { useEffect } from 'react'

type PageMetaOptions = {
  title: string
  description: string
  canonicalUrl?: string
  robots?: 'index, follow' | 'noindex, nofollow'
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)

  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element?.setAttribute(key, value)
  })
}

function upsertCanonical(url?: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]',
  )

  if (!url) {
    existing?.remove()
    return
  }

  const element = existing ?? document.createElement('link')

  element.setAttribute('rel', 'canonical')
  element.setAttribute('href', url)

  if (!existing) {
    document.head.appendChild(element)
  }
}

export function usePageMeta({
  title,
  description,
  canonicalUrl,
  robots = 'index, follow',
}: PageMetaOptions) {
  useEffect(() => {
    document.title = title

    upsertMeta('meta[name="description"]', {
      name: 'description',
      content: description,
    })
    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: robots,
    })
    upsertMeta('meta[property="og:title"]', {
      property: 'og:title',
      content: title,
    })
    upsertMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: description,
    })
    upsertMeta('meta[name="twitter:title"]', {
      name: 'twitter:title',
      content: title,
    })
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: description,
    })
    upsertCanonical(canonicalUrl)
  }, [canonicalUrl, description, robots, title])
}
